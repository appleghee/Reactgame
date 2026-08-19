import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';
import { Projectile } from './Projectile';

export class PhongKich extends Champion {
  autoAttackTimer = 0;

  // Passive 1 & 2
  phongAnStacks: Map<Champion, { stacks: number, timer: number }> = new Map();
  passive2SpeedTimer = 0;

  // Passive 3
  passive3CDTimer = 0;
  movingTimer = 0;
  timeSinceLastHit = 0;
  passive3Ready = false;

  // Passive 4
  passive4CDTimer = 0;
  passive4ShieldActive = false;
  passive4ShieldAmount = 0;
  passive4DrTimer = 0;
  passive4SpeedTimer = 0;
  passive4UsedSinceUlt = false;

  // Ultimate
  ultCDTimer = 0;
  ultActiveTimer = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#10b981', 'Phong Kích', 65000, 5000); // emerald-500
    this.baseAttackSpeed = 0.05; // Base attack speed 5%
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdDt = dtSec * this.getCooldownMultiplier();
    if (this.passive3CDTimer > 0) this.passive3CDTimer -= cdDt;
    if (this.passive4CDTimer > 0) this.passive4CDTimer -= cdDt;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;

    this.timeSinceLastHit += dtSec;

    // Passive 1 & 2: Update Phong An stacks
    for (const [enemy, data] of this.phongAnStacks.entries()) {
      data.timer -= dtSec;
      if (data.timer <= 0 || enemy.isDead) {
        this.phongAnStacks.delete(enemy);
      }
    }

    if (this.passive2SpeedTimer > 0) this.passive2SpeedTimer -= dtSec;
    if (this.passive4DrTimer > 0) this.passive4DrTimer -= dtSec;
    if (this.passive4SpeedTimer > 0) this.passive4SpeedTimer -= dtSec;

    // Passive 3: Moving tracking
    if (this.vel.mag() > 0 && this.timeSinceLastHit >= 1.5) {
      this.movingTimer += dtSec;
      if (this.movingTimer >= 1.5 && this.passive3CDTimer <= 0) {
        this.passive3Ready = true;
      }
    } else {
      this.movingTimer = 0;
    }

    // Passive 4: Shield
    if (this.hp / this.maxHp < 0.3 && this.passive4CDTimer <= 0 && !this.passive4UsedSinceUlt) {
      this.passive4UsedSinceUlt = true;
      this.passive4CDTimer = 8;
      this.passive4ShieldActive = true;
      this.passive4ShieldAmount = 9500;
      this.passive4DrTimer = 3;
      this.passive4SpeedTimer = 5;
      SoundManager.playWindShield();
      this.addFloatingText('KHIÊN GIÓ', FloatingTextType.HEAL);
    }

    if (this.passive4ShieldActive && this.passive4ShieldAmount <= 0) {
      this.passive4ShieldActive = false;
    }

    // Ultimate
    if (this.ultActiveTimer > 0) {
      this.ultActiveTimer -= dtSec;
      if (this.ultActiveTimer <= 0) {
        // Explode
        SoundManager.playWindDash();
        for (const enemy of enemies) {
          if (!enemy.isDead) {
            const dist = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag();
            if (dist <= 200) { // AoE radius
              enemy.takeDamage(3500, DamageType.PHYSICAL, this); // Nerfed from 7500
            }
          }
        }
      }
    } else if (this.ultCDTimer <= 0) {
      this.ultCDTimer = 18;
      this.ultActiveTimer = 3;
      this.passive4UsedSinceUlt = false; // Reset passive 4 usage
      SoundManager.playWindUlt();
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
  }

  takeDamage(amount: number, type: DamageType, source?: Champion, isStatusDamage: boolean = false, isNormalAttack: boolean = false) {
    this.timeSinceLastHit = 0;
    this.movingTimer = 0;

    if (this.ultActiveTimer > 0) {
      this.addFloatingText('MIỄN NHIỄM', FloatingTextType.TRUE);
      return;
    }

    let finalAmount = amount;

    if (this.passive4ShieldActive && this.passive4ShieldAmount > 0) {
      if (this.passive4DrTimer > 0) {
        finalAmount *= 0.3; // 70% damage reduction
      }
      
      if (finalAmount <= this.passive4ShieldAmount) {
        this.passive4ShieldAmount -= finalAmount;
        return; // Damage fully absorbed
      } else {
        finalAmount -= this.passive4ShieldAmount;
        this.passive4ShieldAmount = 0;
        this.passive4ShieldActive = false;
      }
    }

    super.takeDamage(finalAmount, type, source, isStatusDamage, isNormalAttack);
  }

  getSpeedMultiplier(): number {
    let mult = super.getSpeedMultiplier();
    if (this.passive2SpeedTimer > 0) mult += 0.20;
    if (this.passive4SpeedTimer > 0) mult += 0.30;
    if (this.ultActiveTimer > 0) mult += 0.50;
    return mult;
  }

  getAttackSpeed(): number {
    let as = super.getAttackSpeed();
    if (this.ultActiveTimer > 0) as += 0.20; // 20% from ultimate
    return as;
  }

  fireAutoAttack(target: Champion, spawnProjectile: (p: any) => void) {
    SoundManager.playWindArrow();

    let dir = new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize();

    const isPassive3 = this.passive3Ready;
    if (isPassive3) {
      this.passive3Ready = false;
      this.passive3CDTimer = 4;
    }

    // Check Passive 2
    let isPassive2 = false;
    const pAnData = this.phongAnStacks.get(target);
    if (pAnData && pAnData.stacks >= 3) {
      isPassive2 = true;
      this.phongAnStacks.delete(target);
      this.passive2SpeedTimer = 2;
      SoundManager.playWindDash();
    }

    // Main projectile
    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      dir: dir,
      speed: 20,
      radius: isPassive3 ? 8 : 5,
      color: isPassive3 ? '#34d399' : '#10b981', // emerald-400 / emerald-500
      lifetime: isPassive3 ? 2.75 : 2, // Increased range
      source: this,
      isNormalAttack: true,
      onHit: (hitEnemy: Champion) => {
        let baseDamage = 200 + Math.random() * 200;
        
        if (isPassive3) {
          // 100% armor pen -> true damage equivalent for physical
          hitEnemy.takeDamage(baseDamage, DamageType.TRUE, this, false, true);
          this.heal(baseDamage * 1.5);
        } else {
          hitEnemy.takeDamage(baseDamage, DamageType.PHYSICAL, this, false, true);
        }
        
        this.triggerAutoAttackEffects(hitEnemy);

        if (isPassive2) {
          const extraDmg = 500 + 0.03 * hitEnemy.maxHp; // Nerfed heavily
          hitEnemy.takeDamage(extraDmg, DamageType.PHYSICAL, this);
          hitEnemy.addStatus({ type: StatusType.SLOW, duration: 1, value: 0.2 });
        }

        // Ult effect
        if (this.ultActiveTimer > 0) {
          const enemyData = this.phongAnStacks.get(hitEnemy);
          if (enemyData && enemyData.stacks > 0) {
            this.passive3CDTimer = Math.max(0, this.passive3CDTimer - 1);
            this.passive4CDTimer = Math.max(0, this.passive4CDTimer - 1);
          }
        }
      }
    });

    // Passive 1 arrows
    const numExtraArrows = this.ultActiveTimer > 0 ? 3 : 1; // 1 base + 2 ult = 3
    const spreadAngle = 0.5; // radians
    
    // Track hits for Passive 1
    const hitTracker = { hits: 0 };

    for (let i = 0; i < numExtraArrows; i++) {
      const angleOffset = numExtraArrows > 1 ? -spreadAngle / 2 + (spreadAngle / (numExtraArrows - 1)) * i : 0;
      const angle = Math.atan2(dir.y, dir.x) + angleOffset;
      const arrowDir = new Vector2(Math.cos(angle), Math.sin(angle));

      spawnProjectile({
        pos: new Vector2(this.pos.x, this.pos.y),
        target: target,
        dir: arrowDir,
        speed: 18,
        radius: 3,
        color: '#6ee7b7', // emerald-300
        lifetime: 1.5,
        source: this,
        onHit: (hitEnemy: Champion) => {
          const dmg = 800 + Math.random() * (1200 - 800); // Nerfed heavily
          hitEnemy.takeDamage(dmg, DamageType.PHYSICAL, this);
          
          if (hitEnemy === target) {
            hitTracker.hits++;
            if (hitTracker.hits % 3 === 0) { // Apply stack for every 3 hits
              let data = this.phongAnStacks.get(hitEnemy);
              if (!data) {
                data = { stacks: 0, timer: 5 };
                this.phongAnStacks.set(hitEnemy, data);
              }
              data.stacks++;
              data.timer = 5;
              this.addFloatingText('PHONG ẤN', FloatingTextType.MAGIC);
            }
          }
        }
      });
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    // Draw Ult Aura
    if (this.ultActiveTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)'; // emerald-500
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Shield
    if (this.passive4ShieldActive) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#6ee7b7'; // emerald-300
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    super.draw(ctx);

    // Draw Passive 3 Ready
    if (this.passive3Ready) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#fcd34d'; // amber-300
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
