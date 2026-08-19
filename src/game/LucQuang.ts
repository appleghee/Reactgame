import { Champion } from './Champion';
import { DamageType, StatusType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';
import { Projectile } from './Projectile';

export class LucQuang extends Champion {
  passive1CDTimer = 0;
  passive1Firing = false;
  passive1OrbsFired = 0;
  passive1FireTimer = 0;
  passive1Burns: Map<Champion, { stacks: number, duration: number, tickTimer: number }> = new Map();

  passive2CDTimer = 0;
  passive2ActiveTimer = 0;
  passive2TickTimer = 0;

  ultCDTimer = 0;
  ultState = 0; // 0: off, 1: rotating, 2: gathering, 3: shooting
  ultTimer = 0;
  ultAngle = 0;
  ultHitCooldowns: Map<string, number> = new Map();
  ultBurns: Map<Champion, { stacks: number, duration: number, tickTimer: number }> = new Map();
  ultTargetDir: Vector2 = new Vector2(1, 0);

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#ea580c', 'Lục Quang', 80000, 8000); // orange-600
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdDt = dtSec * this.getCooldownMultiplier();
    if (this.passive1CDTimer > 0) this.passive1CDTimer -= cdDt;
    if (this.passive2CDTimer > 0) this.passive2CDTimer -= cdDt;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;

    const enemy = enemies[0];

    // Passive 1: Fire Orbs
    if (this.passive1CDTimer <= 0 && enemy && !enemy.isDead && !this.passive1Firing) {
      this.passive1CDTimer = 6;
      this.passive1Firing = true;
      this.passive1OrbsFired = 0;
      this.passive1FireTimer = 0;
    }

    if (this.passive1Firing) {
      this.passive1FireTimer -= dtSec;
      if (this.passive1FireTimer <= 0) {
        this.passive1FireTimer = 0.15; // Fire every 0.15s
        this.passive1OrbsFired++;
        
        SoundManager.playShoot();
        
        let dir = new Vector2(1, 0);
        if (enemy && !enemy.isDead) {
          dir = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).normalize();
        }

        spawnProjectile({
          pos: new Vector2(this.pos.x, this.pos.y),
          target: enemy,
          dir: dir,
          speed: 12,
          radius: 8,
          color: '#f97316', // orange-500
          lifetime: 3,
          source: this,
          isNormalAttack: true,
          updateCallback: (p: Projectile, dt: number) => {
            if (p.target && !p.target.isDead) {
              const desiredDir = new Vector2(p.target.pos.x - p.pos.x, p.target.pos.y - p.pos.y).normalize();
              p.dir = new Vector2(
                p.dir.x + (desiredDir.x - p.dir.x) * 5 * dt,
                p.dir.y + (desiredDir.y - p.dir.y) * 5 * dt
              ).normalize();
            }
          },
          onHit: (hitEnemy: Champion) => {
            const dmg = 3000 + Math.random() * (4000 - 3000); // Buff sát thương chiêu 1
            hitEnemy.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
            this.triggerAutoAttackEffects(hitEnemy);
            
            let burn = this.passive1Burns.get(hitEnemy);
            if (!burn) {
              burn = { stacks: 0, duration: 0.5, tickTimer: 0.5 };
              this.passive1Burns.set(hitEnemy, burn);
            }
            burn.stacks++;
            burn.duration = 0.5;
          }
        });

        if (this.passive1OrbsFired >= 7) {
          this.passive1Firing = false;
        }
      }
    }

    // Update Passive 1 Burns
    for (const [e, burn] of this.passive1Burns.entries()) {
      burn.duration -= dtSec;
      burn.tickTimer -= dtSec;
      if (burn.tickTimer <= 0) {
        burn.tickTimer = 0.5;
        e.takeDamage(3000 * burn.stacks, DamageType.MAGIC, this);
      }
      if (burn.duration <= 0 || e.isDead) {
        this.passive1Burns.delete(e);
      }
    }

    // Passive 2: Fire Aura
    if (this.passive2ActiveTimer > 0) {
      this.passive2ActiveTimer -= dtSec;
      this.passive2TickTimer -= dtSec;
      
      for (const e of enemies) {
        if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 150 + e.radius) {
          e.addStatus({ type: StatusType.HEAL_REDUCTION, duration: 0.1, value: 0.8 });
        }
      }

      if (this.passive2TickTimer <= 0) {
        this.passive2TickTimer = 0.5;
        for (const e of enemies) {
          if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 150 + e.radius) {
            e.takeDamage(8000, DamageType.PHYSICAL, this); // Buff sát thương chiêu 2
          }
        }
      }
    } else if (this.passive2CDTimer <= 0 && enemy && !enemy.isDead && new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag() <= 150) {
      this.passive2CDTimer = 9;
      this.passive2ActiveTimer = 4;
      this.passive2TickTimer = 0;
      SoundManager.playBuff();
    }

    // Passive 3: Ultimate
    if (this.ultCDTimer <= 0 && enemy && !enemy.isDead) {
      this.ultCDTimer = 41;
      this.ultState = 1;
      this.ultTimer = 2.5;
      this.ultAngle = 0;
      this.damageReduction = 0.4; // Buff 40% damage reduction during ultimate
      this.ultHitCooldowns.clear();
      SoundManager.playBuff();
    }

    if (this.ultState === 1) {
      this.ultTimer -= dtSec;
      this.ultAngle += Math.PI * 2 * dtSec; // 1 rev per sec
      
      const radius = 80;
      for (let i = 0; i < 3; i++) {
        const angle = this.ultAngle + (i * Math.PI * 2) / 3;
        const fx = this.pos.x + Math.cos(angle) * radius;
        const fy = this.pos.y + Math.sin(angle) * radius;
        
        for (const e of enemies) {
          if (!e.isDead && new Vector2(e.pos.x - fx, e.pos.y - fy).mag() < e.radius + 15) {
            const hitKey = `${e.name}_${i}`;
            const lastHit = this.ultHitCooldowns.get(hitKey) || 0;
            if (lastHit <= 0) {
              this.ultHitCooldowns.set(hitKey, 0.5);
              e.takeDamage(2500, DamageType.PHYSICAL, this);
              
              let burn = this.ultBurns.get(e);
              if (!burn) {
                burn = { stacks: 0, duration: 0.5, tickTimer: 0.25 };
                this.ultBurns.set(e, burn);
              }
              burn.stacks++;
              burn.duration = 0.5;
            }
          }
        }
      }
      
      if (this.ultTimer <= 0) {
        this.ultState = 2;
        this.ultTimer = 5;
      }
    } else if (this.ultState === 2) {
      this.ultTimer -= dtSec;
      if (enemy && !enemy.isDead) {
        this.ultTargetDir = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).normalize();
      }
      
      if (this.ultTimer <= 0) {
        this.ultState = 3;
        this.ultTimer = 2;
        
        SoundManager.playShoot();
        
        spawnProjectile({
          pos: new Vector2(this.pos.x + this.ultTargetDir.x * 50, this.pos.y + this.ultTargetDir.y * 50),
          target: null,
          dir: this.ultTargetDir,
          speed: 15,
          radius: 45, // 15 * 3x
          color: '#ef4444', // red-500
          lifetime: 2,
          source: this,
          onHit: (hitEnemy: Champion) => {
            const physDmg = 12000 + (0.08 * hitEnemy.maxHp) + (0.08 * this.maxHp);
            const magDmg = 10000 + (0.03 * hitEnemy.maxHp);
            const trueDmg = 4000 + (0.05 * this.maxHp);
            
            hitEnemy.takeDamage(physDmg, DamageType.PHYSICAL, this);
            hitEnemy.takeDamage(magDmg, DamageType.MAGIC, this);
            hitEnemy.takeDamage(trueDmg, DamageType.TRUE, this);
          }
        });
      }
    } else if (this.ultState === 3) {
      this.ultTimer -= dtSec;
      if (this.ultTimer <= 0) {
        this.ultState = 0;
        this.damageReduction = 0; // Reset damage reduction
      }
    }

    // Update ultHitCooldowns
    for (const [key, cd] of this.ultHitCooldowns.entries()) {
      if (cd > 0) {
        this.ultHitCooldowns.set(key, cd - dtSec);
      }
    }

    // Update ultBurns
    for (const [e, burn] of this.ultBurns.entries()) {
      burn.duration -= dtSec;
      burn.tickTimer -= dtSec;
      if (burn.tickTimer <= 0) {
        burn.tickTimer = 0.25;
        e.takeDamage(300 * burn.stacks, DamageType.PHYSICAL, this); // 1200 over 1s -> 300 per 0.25s
      }
      if (burn.duration <= 0 || e.isDead) {
        this.ultBurns.delete(e);
      }
    }

    // Normal Movement
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
      let speedMult = this.getSpeedMultiplier();
      const targetSpeed = 3.5 * speedMult;
      
      if (this.vel.mag() > 0.01) {
        this.vel.normalize().mult(targetSpeed);
      } else if (targetSpeed > 0) {
        this.vel = new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize().mult(targetSpeed);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    
    // Draw Passive 2 Aura
    if (this.passive2ActiveTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, 150, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // red-500 with opacity
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Draw Ultimate Fireballs
    if (this.ultState === 1) {
      const radius = 80;
      for (let i = 0; i < 3; i++) {
        const angle = this.ultAngle + (i * Math.PI * 2) / 3;
        const fx = this.pos.x + Math.cos(angle) * radius;
        const fy = this.pos.y + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.arc(fx, fy, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#f97316'; // orange-500
        ctx.fill();
      }
    } else if (this.ultState === 2) {
      // Gathering and growing
      const progress = 1 - (this.ultTimer / 5); // 0 to 1
      const scale = 1.2 + (progress * (3 - 1.2)); // 1.2x to 3x
      const baseRadius = 15;
      const currentRadius = baseRadius * scale;
      
      const fx = this.pos.x + this.ultTargetDir.x * 50;
      const fy = this.pos.y + this.ultTargetDir.y * 50;
      
      ctx.beginPath();
      ctx.arc(fx, fy, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#f97316';
      ctx.fill();
      
      // Draw 3 inner fireballs merging
      const mergeDist = 30 * (1 - progress);
      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3 + progress * Math.PI * 4; // spin while merging
        const ix = fx + Math.cos(angle) * mergeDist;
        const iy = fy + Math.sin(angle) * mergeDist;
        
        ctx.beginPath();
        ctx.arc(ix, iy, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
      }
    }
    
    super.draw(ctx);
  }
}
