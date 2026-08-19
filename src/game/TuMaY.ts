import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType, ItemId } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';
import { Projectile } from './Projectile';

export class TuMaY extends Champion {
  passive1CDTimer = 0;
  passive1ArrowsToFire = 0;
  passive1FireTimer = 0;
  
  marks = 0;
  invulnerableTimer = 0;

  passive3CDTimer = 0;

  passive4CDTimer = 0;
  passive4ActiveTimer = 0;
  passive4TickTimer = 0;

  passive5CDTimer = 0;
  zones: { x: number, y: number, timer: number, radius: number }[] = [];

  passive6Stacks = 0;
  passive6Timer = 0;

  ultCDTimer = 0;
  ultBuffActive = false;
  ultArmorThreshold = 0;

  autoAttackTimer = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#6b21a8', 'Tư Mã Ý', 72000, 10000); // purple-800
    this.baseAttackSpeed = 0.5; // 50% base attack speed
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdDt = dtSec * this.getCooldownMultiplier();
    if (this.passive1CDTimer > 0) this.passive1CDTimer -= cdDt;
    if (this.passive3CDTimer > 0) this.passive3CDTimer -= cdDt;
    if (this.passive4CDTimer > 0) this.passive4CDTimer -= cdDt;
    if (this.passive5CDTimer > 0) this.passive5CDTimer -= cdDt;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dtSec;
    }

    if (this.passive6Timer > 0) {
      this.passive6Timer -= dtSec;
      if (this.passive6Timer <= 0) {
        this.passive6Stacks = 0;
      }
    }

    if (this.ultBuffActive && this.armor <= this.ultArmorThreshold) {
      this.ultBuffActive = false;
    }

    const enemy = enemies[0];

    // Auto Attack
    const currentAttackSpeed = this.getAttackSpeed();
    const attacksPerSecond = (currentAttackSpeed / 0.10) * 2;
    if (attacksPerSecond > 0 && enemy && !enemy.isDead) {
      this.autoAttackTimer += dtSec;
      if (this.autoAttackTimer >= 1 / attacksPerSecond) {
        this.autoAttackTimer -= 1 / attacksPerSecond;
        this.fireAutoAttack(enemy, spawnProjectile);
      }
    }

    // Passive 1
    if (this.passive1CDTimer <= 0 && enemy && !enemy.isDead && this.passive1ArrowsToFire === 0) {
      this.passive1CDTimer = 6;
      this.passive1ArrowsToFire = 9;
      this.passive1FireTimer = 0;
    }

    if (this.passive1ArrowsToFire > 0) {
      this.passive1FireTimer -= dtSec;
      if (this.passive1FireTimer <= 0) {
        this.passive1FireTimer = 0.15;
        this.passive1ArrowsToFire--;
        
        SoundManager.playShoot();
        let dir = new Vector2(1, 0);
        if (enemy && !enemy.isDead) {
          dir = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).normalize();
        }

        spawnProjectile({
          pos: new Vector2(this.pos.x, this.pos.y),
          target: enemy,
          dir: dir,
          speed: 15,
          radius: 6,
          color: '#d8b4fe', // purple-300
          lifetime: 3,
          source: this,
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
            const dmg = 150 + Math.random() * (300 - 150); // Giảm sát thương
            hitEnemy.takeDamage(dmg, DamageType.PHYSICAL, this);
            
            this.marks++;
            if (this.marks >= 9) {
              this.marks -= 9;
              this.invulnerableTimer = 1.0;
              SoundManager.playBuff();
            }
          }
        });
      }
    }

    // Passive 3 (n2)
    if (this.passive3CDTimer <= 0 && enemy && !enemy.isDead) {
      this.passive3CDTimer = 4.0; // Nerfed CD from 2.5 to 4.0
      SoundManager.playShoot();
      
      for (let i = -1; i <= 1; i++) {
        let dir = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).normalize();
        const angle = Math.atan2(dir.y, dir.x) + i * 0.3;
        dir = new Vector2(Math.cos(angle), Math.sin(angle));

        spawnProjectile({
          pos: new Vector2(this.pos.x, this.pos.y),
          target: enemy,
          dir: dir,
          speed: 12,
          radius: 10,
          color: '#3b82f6', // blue-500
          lifetime: 2,
          source: this,
          onHit: (hitEnemy: Champion) => {
            // Knockback
            const kbDir = new Vector2(hitEnemy.pos.x - this.pos.x, hitEnemy.pos.y - this.pos.y).normalize();
            hitEnemy.vel = hitEnemy.vel.add(kbDir.mult(200)); // Nerfed push back from 300 to 200
            
            // Explode
            const dmg = 300 + Math.random() * (500 - 300); // Nerfed damage from 800-1200 to 500-800
            hitEnemy.takeDamage(dmg, DamageType.MAGIC, this);
          }
        });
      }
    }

    // Passive 4 (n3)
    if (this.passive4CDTimer <= 0 && enemy && !enemy.isDead && this.passive4ActiveTimer <= 0) {
      this.passive4CDTimer = 12; // Nerfed CD from 10 to 12
      this.passive4ActiveTimer = 4;
      this.passive4TickTimer = 0;
      SoundManager.playBuff();
    }

    if (this.passive4ActiveTimer > 0) {
      this.passive4ActiveTimer -= dtSec;
      this.passive4TickTimer -= dtSec;
      if (this.passive4TickTimer <= 0) {
        this.passive4TickTimer = 0.4; // Nerfed tick rate from 0.3 to 0.4
        SoundManager.playShoot();
        
        // Left and right
        const baseDir = enemy ? new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).normalize() : new Vector2(1, 0);
        const leftPos = new Vector2(this.pos.x - baseDir.y * 40, this.pos.y + baseDir.x * 40);
        const rightPos = new Vector2(this.pos.x + baseDir.y * 40, this.pos.y - baseDir.x * 40);

        const fireP4 = (startPos: Vector2) => {
          spawnProjectile({
            pos: startPos,
            target: enemy,
            dir: baseDir,
            speed: 14,
            radius: 8,
            color: '#f43f5e', // rose-500
            lifetime: 3,
            source: this,
            updateCallback: (p: Projectile, dt: number) => {
              if (p.target && !p.target.isDead) {
                const desiredDir = new Vector2(p.target.pos.x - p.pos.x, p.target.pos.y - p.pos.y).normalize();
                p.dir = new Vector2(
                  p.dir.x + (desiredDir.x - p.dir.x) * 3 * dt,
                  p.dir.y + (desiredDir.y - p.dir.y) * 3 * dt
                ).normalize();
              }
            },
            onHit: (hitEnemy: Champion) => {
              const physDmg = 10 + Math.random() * (100 - 10); // Nerfed damage
              const magDmg = 10 + Math.random() * (150 - 10); // Nerfed damage
              const trueDmg = 10 + Math.random() * (50 - 10); // Nerfed damage
              
              hitEnemy.takeDamage(physDmg, DamageType.PHYSICAL, this);
              hitEnemy.takeDamage(magDmg, DamageType.MAGIC, this);
              hitEnemy.takeDamage(trueDmg, DamageType.TRUE, this);
              
              hitEnemy.addStatus({ type: StatusType.SLOW, duration: 2, value: 0.3 }); // Nerfed slow from 3s 40% to 2s 30%
            }
          });
        };

        fireP4(leftPos);
        fireP4(rightPos);
      }
    }

    // Passive 5
    if (this.passive5CDTimer <= 0 && enemy && !enemy.isDead) {
      this.passive5CDTimer = 3.5;
      this.zones.push({
        x: enemy.pos.x,
        y: enemy.pos.y,
        timer: 1.5,
        radius: 80
      });
    }

    // Update Zones
    for (let i = this.zones.length - 1; i >= 0; i--) {
      const z = this.zones[i];
      z.timer -= dtSec;
      if (z.timer <= 0) {
        // Explode
        if (enemy && !enemy.isDead) {
          const dist = new Vector2(enemy.pos.x - z.x, enemy.pos.y - z.y).mag();
          if (dist <= z.radius + enemy.radius) {
            const dmg = 800 + Math.random() * (1200 - 800); // Giảm sát thương
            enemy.takeDamage(dmg, DamageType.MAGIC, this);
            enemy.addStatus({ type: StatusType.STUN, duration: 2.5 });
          }
        }
        this.zones.splice(i, 1);
      }
    }

    // Ultimate
    if (this.ultCDTimer <= 0 && this.hp / this.maxHp < 0.5) {
      this.ultCDTimer = 25;
      this.heal(this.maxHp * 0.3); // Nerfed heal from 0.9 to 0.5
      
      this.ultArmorThreshold = this.armor; // Save current armor
      this.addArmor(this.getMaxArmor() * 0.4);
      
      this.ultBuffActive = true;
      SoundManager.playBuff();
    }
  }

  takeDamage(amount: number, type: DamageType, source?: Champion, isStatusDamage: boolean = false, isNormalAttack: boolean = false) {
    if (this.invulnerableTimer > 0) {
      this.addFloatingText('BLOCKED', FloatingTextType.TRUE);
      return;
    }
    
    let customDr = this.damageReduction;
    if (this.passive6Timer > 0) {
      customDr += this.passive6Stacks * 0.01;
    }
    if (this.ultBuffActive) {
      customDr += 0.30; // Nerfed DR from 0.85 to 0.50
    }
    customDr = Math.min(0.70, customDr); // Nerfed max DR from 0.98 to 0.85
    
    const oldDr = this.damageReduction;
    this.damageReduction = customDr;
    
    super.takeDamage(amount, type, source, isStatusDamage, isNormalAttack);
    
    this.damageReduction = oldDr;
  }

  getAttackSpeed(): number {
    let as = super.getAttackSpeed();
    if (this.ultBuffActive) {
      as += 0.45;
    }
    return as;
  }

  fireAutoAttack(target: Champion, spawnProjectile: (p: any) => void) {
    const baseDamage = 200 + Math.random() * 200; // Standard auto attack damage
    SoundManager.playShoot();

    let dir = new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize();

    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      dir: dir,
      speed: 18,
      radius: 5,
      color: '#a855f7', // purple-500
      lifetime: 2,
      source: this,
      isNormalAttack: true,
      // No updateCallback -> no homing
      onHit: (hitEnemy: Champion) => {
        hitEnemy.takeDamage(baseDamage, DamageType.PHYSICAL, this, false, true);
        this.triggerAutoAttackEffects(hitEnemy);
        
        // Passive 6
        this.heal(this.maxHp * 0.0015); // Nerfed lifesteal from 0.003 to 0.0015
        this.passive6Stacks = Math.min(15, this.passive6Stacks + 1);
        this.passive6Timer = 1.0;
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    // Draw Zones
    for (const z of this.zones) {
      ctx.beginPath();
      ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(168, 85, 247, ${0.1 + (1.5 - z.timer) * 0.2})`; // Fade in
      ctx.fill();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Invulnerable Shield
    if (this.invulnerableTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw Ult Buff Aura
    if (this.ultBuffActive) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#fcd34d'; // amber-300
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    super.draw(ctx);

    // Draw Marks
    if (this.marks > 0) {
      ctx.fillStyle = '#d8b4fe';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.marks}/9`, this.pos.x, this.pos.y - this.radius - 30);
    }
  }
}
