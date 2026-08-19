import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';
import { Projectile } from './Projectile';

export class NganNgoc extends Champion {
  autoAttackTimer: number = 0;

  // Skill 1
  skill1CDTimer: number = 0;
  skill1CastTimer: number = 0;
  skill1Target: Champion | null = null;
  markedTarget: Champion | null = null;

  // Skill 2
  skill2CDTimer: number = 0;
  skill2BuffTimer: number = 0;
  virtualHealthTimer: number = 0;
  currentDash: {
    targetPos: Vector2;
    speed: number;
  } | null = null;

  // Skill 3
  skill3CDTimer: number = 0;
  skill3CastTimer: number = 0;
  skill3ActiveTimer: number = 0;
  skill3Radius: number = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#3b82f6', 'Ngân Ngọc', 37000, 3000); // blue-500
    this.baseAttackSpeed = 0.25;
  }

  getAttackSpeed(): number {
    return super.getAttackSpeed();
  }

  getDamageReduction(type: DamageType, isNormalAttack: boolean): number {
    let dr = super.getDamageReduction(type, isNormalAttack);
    if (this.skill2BuffTimer > 0 && type === DamageType.PHYSICAL) {
      dr = 1 - (1 - dr) * (1 - 0.22);
    }
    if (this.skill3ActiveTimer > 0 && type === DamageType.PHYSICAL) {
      dr = 1 - (1 - dr) * (1 - 0.35);
    }
    return dr;
  }

  getMagDamageMult(): number {
    let mult = super.getMagDamageMult();
    if (this.skill2BuffTimer > 0) {
      mult += 0.55;
    }
    return mult;
  }

  getMagLifesteal(): number {
    let ls = super.getMagLifesteal();
    if (this.skill3ActiveTimer > 0) {
      ls += 1.20;
    }
    return ls;
  }

  hasStatus(type: StatusType): boolean {
    if (type === StatusType.CC_IMMUNE && this.skill3ActiveTimer > 0) {
      return true;
    }
    return super.hasStatus(type);
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdMultiplier = this.getCooldownMultiplier();
    const cdDt = dtSec * cdMultiplier;

    if (this.skill1CDTimer > 0) this.skill1CDTimer -= cdDt;
    if (this.skill2CDTimer > 0) this.skill2CDTimer -= cdDt;
    if (this.skill3CDTimer > 0) this.skill3CDTimer -= cdDt;

    if (this.skill2BuffTimer > 0) {
      this.skill2BuffTimer -= dtSec;
      this.addBuffText('THIÊN MỆNH DỊCH CHUYỂN', this.skill2BuffTimer);
    }

    if (this.virtualHealthTimer > 0) {
      this.virtualHealthTimer -= dtSec;
      if (this.virtualHealthTimer <= 0) {
        this.virtualHealth = 0;
      }
    }

    if (this.skill3ActiveTimer > 0) {
      this.skill3ActiveTimer -= dtSec;
      this.addBuffText('THIÊN MỆNH THỜI KHÔNG', this.skill3ActiveTimer);
      
      // Continuous CC immunity is handled in hasStatus
    }

    // Dash logic for Skill 2
    if (this.currentDash) {
      const dir = new Vector2(this.currentDash.targetPos.x - this.pos.x, this.currentDash.targetPos.y - this.pos.y);
      const dist = dir.mag();
      const moveDist = this.currentDash.speed * dtSec;
      
      if (dist <= moveDist) {
        this.pos = new Vector2(this.currentDash.targetPos.x, this.currentDash.targetPos.y);
        this.currentDash = null;
        
        // End of dash effect
        let nearbyEnemies = 0;
        for (const e of enemies) {
          if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 200) {
            nearbyEnemies++;
          }
        }
        
        let healBoost = Math.min(0.70, nearbyEnemies * 0.35);
        let baseHeal = 4250;
        let totalHeal = baseHeal * (1 + healBoost);
        
        this.heal(totalHeal);
        this.virtualHealth = totalHeal;
        this.virtualHealthTimer = 1.0;
        
      } else {
        const move = dir.normalize();
        this.pos.x += move.x * moveDist;
        this.pos.y += move.y * moveDist;
      }
      return; // Skip other actions while dashing
    }

    // Skill 3 Cast Logic
    if (this.skill3CastTimer > 0) {
      this.skill3CastTimer -= dtSec;
      this.skill3Radius += (400 / 2.5) * dtSec; // Expand to 400 radius over 2.5s
      
      // Stand still
      this.vel.x = 0;
      this.vel.y = 0;
      
      if (this.skill3CastTimer <= 0) {
        // Stop time for enemies in radius
        for (const e of enemies) {
          if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= this.skill3Radius) {
            e.addStatus({ type: StatusType.STUN, duration: 4.5, source: this });
            e.addFloatingText('TIME STOP', FloatingTextType.MAGIC_BURST);
          }
        }
        this.skill3Radius = 0;
      }
      return;
    }

    // Skill 1 Cast Logic
    if (this.skill1CastTimer > 0) {
      this.skill1CastTimer -= dtSec;
      this.vel.x = 0;
      this.vel.y = 0;
      
      if (this.skill1CastTimer <= 0 && this.skill1Target && !this.skill1Target.isDead) {
        this.fireSkill1(this.skill1Target, spawnProjectile);
      }
      return;
    }

    // Find nearest enemy
    let nearestEnemy: Champion | null = null;
    let minDist = Infinity;
    for (const e of enemies) {
      if (!e.isDead && !e.hasStatus(StatusType.UNTARGETABLE)) {
        const d = new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag();
        if (d < minDist) {
          minDist = d;
          nearestEnemy = e;
        }
      }
    }

    // Skill 3 Trigger
    if (this.skill3CDTimer <= 0 && nearestEnemy && minDist <= 300) {
      this.skill3CDTimer = 20;
      this.skill3CastTimer = 2.5;
      this.skill3ActiveTimer = 7.0;
      this.skill3Radius = 0;
      SoundManager.playBuff();
      this.addFloatingText('THỜI KHÔNG!', FloatingTextType.MAGIC_BURST);
      
      // Reduce S1 and S2 CD to 1.25s
      this.skill1CDTimer = Math.min(this.skill1CDTimer, 1.25);
      this.skill2CDTimer = Math.min(this.skill2CDTimer, 1.25);
      return;
    }

    // Skill 2 Trigger
    if (this.skill2CDTimer <= 0 && nearestEnemy) {
      this.skill2CDTimer = this.skill3ActiveTimer > 0 ? 1.25 : 3.3;
      this.skill2BuffTimer = 1.5;
      
      // Dash away if too close, or towards if far
      let dashDir = new Vector2(this.pos.x - nearestEnemy.pos.x, this.pos.y - nearestEnemy.pos.y).normalize();
      if (minDist > 250) {
        dashDir = dashDir.mult(-1); // Dash towards
      }
      
      this.currentDash = {
        targetPos: new Vector2(this.pos.x + dashDir.x * 150, this.pos.y + dashDir.y * 150),
        speed: 800
      };
      
      SoundManager.playWindDash();
      return;
    }

    // Skill 1 Trigger
    if (this.skill1CDTimer <= 0 && nearestEnemy && minDist <= 400) {
      this.skill1CDTimer = this.skill3ActiveTimer > 0 ? 1.25 : 3.8;
      this.skill1CastTimer = 0.3;
      this.skill1Target = nearestEnemy;
      return;
    }

    // Auto Attack
    if (nearestEnemy) {
      const currentAttackSpeed = this.getAttackSpeed();
      const attacksPerSecond = (currentAttackSpeed / 0.10) * 2;
      if (attacksPerSecond > 0) {
        this.autoAttackTimer += dtSec;
        if (this.autoAttackTimer >= 1 / attacksPerSecond) {
          this.autoAttackTimer = 0;
          this.fireAutoAttack(nearestEnemy, spawnProjectile);
        }
      }
    }

    // Normal Movement
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
      const targetSpeed = 3.5 * this.getSpeedMultiplier();
      if (nearestEnemy && minDist > 100) {
        const dir = new Vector2(nearestEnemy.pos.x - this.pos.x, nearestEnemy.pos.y - this.pos.y).normalize();
        this.vel = dir.mult(targetSpeed);
      } else {
        this.vel.mult(0.9);
      }
    }
  }

  fireSkill1(target: Champion, spawnProjectile: (p: any) => void) {
    SoundManager.playShoot();
    
    const dir = new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize();
    
    const createSpear = (targetChamp: Champion, isSecondary: boolean) => {
      let hitCount = 0;
      spawnProjectile({
        pos: new Vector2(this.pos.x, this.pos.y),
        target: null, // Skillshot
        dir: dir,
        speed: 25,
        radius: isSecondary ? 12 : 18,
        color: '#60a5fa',
        lifetime: 2,
        piercing: true,
        source: this,
        onHit: (hitEnemy: Champion) => {
          let dmg = 4500 + Math.random() * (6500 - 4500) + hitEnemy.maxHp * 0.05;
          if (isSecondary) {
            dmg *= 0.75;
          }
          
          if (hitCount > 0) {
            dmg *= 0.70;
          }
          
          hitCount++;
          hitEnemy.takeDamage(dmg, DamageType.MAGIC, this);
          
          if (!isSecondary) {
            this.markedTarget = hitEnemy;
          }
        },
        drawCallback: (ctx: CanvasRenderingContext2D, p: any) => {
          ctx.save();
          ctx.translate(p.pos.x, p.pos.y);
          ctx.rotate(Math.atan2(p.dir.y, p.dir.x));
          
          // Outer glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#60a5fa';
          
          // Spear body
          const grad = ctx.createLinearGradient(-p.radius * 2, 0, p.radius * 2, 0);
          grad.addColorStop(0, 'rgba(96, 165, 250, 0)');
          grad.addColorStop(0.5, '#60a5fa');
          grad.addColorStop(1, '#ffffff');
          
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(-p.radius * 3, -p.radius / 3);
          ctx.lineTo(p.radius * 2, -p.radius / 2);
          ctx.lineTo(p.radius * 3, 0);
          ctx.lineTo(p.radius * 2, p.radius / 2);
          ctx.lineTo(-p.radius * 3, p.radius / 3);
          ctx.closePath();
          ctx.fill();
          
          // Inner core
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.ellipse(p.radius, 0, p.radius, p.radius / 4, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      });
    };

    createSpear(target, false);

    if (this.markedTarget && !this.markedTarget.isDead) {
      // Check if marked target is in front (roughly same direction)
      const dirToMarked = new Vector2(this.markedTarget.pos.x - this.pos.x, this.markedTarget.pos.y - this.pos.y).normalize();
      const dot = dir.x * dirToMarked.x + dir.y * dirToMarked.y;
      if (dot > 0.5) { // Roughly in front
        createSpear(this.markedTarget, true);
      }
    }
  }

  fireAutoAttack(target: Champion, spawnProjectile: (p: any) => void) {
    SoundManager.playShoot();
    const dir = new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize();

    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      dir: dir,
      speed: 20,
      radius: 8,
      color: '#93c5fd', // blue-300
      lifetime: 2,
      source: this,
      isNormalAttack: true,
      onHit: (hitEnemy: Champion) => {
        const dmg = 600 + Math.random() * (900 - 600);
        hitEnemy.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
        this.triggerAutoAttackEffects(hitEnemy);
      },
      drawCallback: (ctx: CanvasRenderingContext2D, p: any) => {
        ctx.save();
        ctx.translate(p.pos.x, p.pos.y);
        ctx.rotate(Math.atan2(p.dir.y, p.dir.x));
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#93c5fd';
        
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath();
        ctx.moveTo(-10, -4);
        ctx.lineTo(10, 0);
        ctx.lineTo(-10, 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw Skill 3 Area
    if (this.skill3CastTimer > 0) {
      const pulse = Math.sin(Date.now() / 200) * 0.1 + 0.9;
      const alpha = (1 - this.skill3CastTimer / 2.5) * 0.4;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.skill3Radius * pulse, 0, Math.PI * 2);
      
      const grad = ctx.createRadialGradient(this.pos.x, this.pos.y, 0, this.pos.x, this.pos.y, this.skill3Radius);
      grad.addColorStop(0, `rgba(59, 130, 246, ${alpha})`);
      grad.addColorStop(1, `rgba(59, 130, 246, 0)`);
      
      ctx.fillStyle = grad;
      ctx.fill();
      
      ctx.strokeStyle = `rgba(96, 165, 250, ${alpha * 2})`;
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Clock pattern
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(Date.now() / 1000);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2;
      for (let i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(this.skill3Radius * 0.8, 0);
        ctx.lineTo(this.skill3Radius * 0.9, 0);
        ctx.stroke();
      }
      
      ctx.restore();
    }

    super.draw(ctx);
    
    // Draw Skill 2 Buff
    if (this.skill2BuffTimer > 0) {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(Date.now() / 500);
      
      for (let i = 0; i < 3; i++) {
        ctx.rotate((Math.PI * 2) / 3);
        ctx.beginPath();
        ctx.arc(this.radius + 12, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#60a5fa';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#60a5fa';
        ctx.fill();
      }
      
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.restore();
    }
  }
}
