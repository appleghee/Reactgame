import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class LyCuu extends Champion {
  attackTimer: number = 0;

  // Passive 1
  passive1Timer = 0;
  attackCount = 0;
  passive1BuffTimer = 0;
  passive1DRTimer = 0;

  // Passive 2
  passive2Timer = 0;
  passive2SpeedTimer = 0;
  longNoStacks: { timer: number }[] = [];
  longNoAttackCount = 0;

  // Passive 3
  passive3Timer = 0;
  passive3CastTimer = 0;
  passive3BuffTimer = 0;
  passive3BuffMultiplier = 1;

  // Passive 4
  passive4Timer = 0;
  passive4BuffTimer = 0;

  // Ultimate
  ultTimer = 0;
  ultBuffTimer = 0;

  lastAttackAngle = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#b91c1c', 'Lý Cửu', 70000, 30000);
    this.baseAttackSpeed = 0.15;
  }

  hasStatus(type: StatusType): boolean {
    if (type === StatusType.CC_IMMUNE && this.passive4BuffTimer > 0) {
      return true;
    }
    return super.hasStatus(type);
  }

  getAttackSpeed(): number {
    let as = 0.15; // Fixed base, ignores items
    if (this.passive3BuffTimer > 0) {
      as += 0.1 * this.passive3BuffMultiplier;
    }
    if (this.longNoStacks.length > 0) {
      as += 0.005 * this.longNoStacks.length;
    }
    return as;
  }

  getAttackRange(): number {
    let range = this.radius * 2;
    if (this.passive1BuffTimer > 0) {
      range *= 1.40;
    }
    if (this.longNoStacks.length > 0) {
      range *= (1 + 0.10 * this.longNoStacks.length);
    }
    return range;
  }

  getDamageReduction(type: DamageType, isNormalAttack: boolean): number {
    let dr = super.getDamageReduction(type, isNormalAttack);
    
    if (this.passive4BuffTimer > 0 && (type === DamageType.PHYSICAL || type === DamageType.TRUE)) {
      dr = 1.0; // Immune to Physical and True damage
    }
    
    if (this.passive1DRTimer > 0) {
      dr = 1 - (1 - dr) * (1 - 0.20);
    }
    
    if (this.longNoStacks.length > 0) {
      dr = 1 - (1 - dr) * (1 - 0.01 * this.longNoStacks.length);
    }
    
    return dr;
  }

  getPhysLifesteal(): number {
    let ls = super.getPhysLifesteal();
    if (this.passive3BuffTimer > 0) {
      ls += 0.8 * this.passive3BuffMultiplier;
    }
    if (this.longNoStacks.length > 0) {
      ls += 0.01 * this.longNoStacks.length;
    }
    return ls;
  }

  getSpeedMultiplier(): number {
    let mult = super.getSpeedMultiplier();
    if (this.passive2SpeedTimer > 0) {
      mult *= 1.3;
    }
    if (this.passive4BuffTimer > 0) {
      mult *= 1.4;
    }
    return mult;
  }

  dealDamage(target: Champion, baseAmount: number, type: DamageType, isAutoAttack: boolean = false) {
    let finalAmount = baseAmount;
    
    if (this.passive1BuffTimer > 0) {
      finalAmount += 1500 + Math.random() * 1500;
    }

    if (this.longNoStacks.length > 0) {
      const bonusPerStack = 800 + Math.random() * 1000;
      finalAmount += bonusPerStack * this.longNoStacks.length;
    }

    if (this.ultBuffTimer > 0) {
      const trueDmg = finalAmount * 0.3;
      const remainingDmg = finalAmount * 0.7;
      
      target.takeDamage(remainingDmg, type, this, false, isAutoAttack);
      target.takeDamage(trueDmg, DamageType.TRUE, this, false, isAutoAttack);
      
      this.heal(trueDmg * 0.25);
      this.addArmor(trueDmg * 0.25);
    } else {
      target.takeDamage(finalAmount, type, this, false, isAutoAttack);
    }
  }

  distanceTo(target: Champion): number {
    const dx = this.pos.x - target.pos.x;
    const dy = this.pos.y - target.pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  findTarget(enemies: Champion[]): Champion | null {
    let closest: Champion | null = null;
    let minDist = Infinity;
    for (const e of enemies) {
      const d = this.distanceTo(e);
      if (d < minDist) {
        minDist = d;
        closest = e;
      }
    }
    return closest;
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;
    
    let cdr = 1 - this.getPassiveCooldownReduction();
    let ultCdr = cdr;
    if (this.longNoStacks.length > 0) {
      ultCdr *= (1 + 0.02 * this.longNoStacks.length);
    }

    if (this.passive1Timer > 0) this.passive1Timer -= dtSec * cdr;
    if (this.passive2Timer > 0) this.passive2Timer -= dtSec * cdr;
    if (this.passive3Timer > 0) this.passive3Timer -= dtSec * cdr;
    if (this.passive4Timer > 0) this.passive4Timer -= dtSec * cdr;
    if (this.ultTimer > 0) this.ultTimer -= dtSec * ultCdr;
    
    if (this.passive1BuffTimer > 0) this.passive1BuffTimer -= dtSec;
    if (this.passive1DRTimer > 0) this.passive1DRTimer -= dtSec;
    if (this.passive2SpeedTimer > 0) this.passive2SpeedTimer -= dtSec;
    if (this.passive3BuffTimer > 0) this.passive3BuffTimer -= dtSec;
    if (this.passive4BuffTimer > 0) this.passive4BuffTimer -= dtSec;
    if (this.ultBuffTimer > 0) this.ultBuffTimer -= dtSec;

    // Update Long Nộ stacks
    for (let i = this.longNoStacks.length - 1; i >= 0; i--) {
      this.longNoStacks[i].timer -= dtSec;
      if (this.longNoStacks[i].timer <= 0) {
        this.longNoStacks.splice(i, 1);
      }
    }

    // Passive 2: Speed, Shield, Cleanse
    if (this.passive2Timer <= 0) {
      this.passive2Timer = 1.0;
      this.passive2SpeedTimer = 0.2;
      this.addArmor(2000);
      
      // Cleanse CC
      const ccTypes = [StatusType.STUN, StatusType.SLOW, StatusType.SUPPRESS];
      this.statuses = this.statuses.filter(s => !ccTypes.includes(s.type));
    }

    // Passive 3: Spin spear
    if (this.passive3Timer <= 0 && this.passive3CastTimer <= 0) {
      let target = this.findTarget(enemies.filter(c => !c.isDead && !c.hasStatus(StatusType.UNTARGETABLE)));
      if (target && this.distanceTo(target) <= 150) {
        this.passive3CastTimer = 0.85;
        this.passive3Timer = 6.8;
      }
    }

    if (this.passive3CastTimer > 0) {
      this.passive3CastTimer -= dtSec;
      // Stand still
      this.vel.x = 0;
      this.vel.y = 0;
      
      if (this.passive3CastTimer <= 0) {
        // Execute spin
        let hitAny = false;
        for (const enemy of enemies) {
          if (!enemy.isDead && !enemy.hasStatus(StatusType.UNTARGETABLE) && this.distanceTo(enemy) <= 200) {
            hitAny = true;
            const dmg = 2500 + 0.02 * enemy.maxHp;
            this.dealDamage(enemy, dmg, DamageType.PHYSICAL, false);
            enemy.addStatus({ type: StatusType.STUN, duration: 1.0, source: this });
          }
        }
        
        this.passive3BuffTimer = 3.0;
        this.passive3BuffMultiplier = hitAny ? 1.0 : 0.5;
        this.addFloatingText('XOAY THƯƠNG!', FloatingTextType.PHYSICAL);
        SoundManager.playShoot();
      }
      return; // Skip auto attack and movement while casting
    }

    // Passive 4: Speed, Immune to Phys/True, Immune to CC
    if (this.passive4Timer <= 0) {
      this.passive4Timer = 10.0;
      this.passive4BuffTimer = 1.5;
      this.addFloatingText('MIỄN NHIỄM!', FloatingTextType.HEAL);
    }
    
    if (this.passive4BuffTimer > 0) {
      const ccTypes = [StatusType.STUN, StatusType.SLOW, StatusType.SUPPRESS];
      this.statuses = this.statuses.filter(s => !ccTypes.includes(s.type));
    }

    // Ultimate
    if (this.ultTimer <= 0 && this.longNoStacks.length >= 3) {
      let target = this.findTarget(enemies.filter(c => !c.isDead && !c.hasStatus(StatusType.UNTARGETABLE)));
      if (target && this.distanceTo(target) <= 200) {
        this.ultTimer = 18.0;
        
        target.addStatus({ type: StatusType.STUN, duration: 1.5, source: this });
        const baseDmg = 2000 + Math.random() * 1000;
        const dmg = baseDmg + 0.08 * (target.maxHp - target.hp);
        this.dealDamage(target, dmg, DamageType.PHYSICAL, false);
        
        this.ultBuffTimer = 5.0;
        this.addFloatingText('NỆN THƯƠNG!', FloatingTextType.PHYSICAL_BURST);
        SoundManager.playShoot();
      }
    }

    // Auto Attack
    let target = this.findTarget(enemies.filter(c => !c.isDead && !c.hasStatus(StatusType.UNTARGETABLE)));
    
    if (target) {
      this.attackTimer += dtSec;
      const currentAttackSpeed = this.getAttackSpeed();
      const attacksPerSecond = (currentAttackSpeed / 0.10) * 2;
      if (attacksPerSecond > 0) {
        const attackInterval = 1 / attacksPerSecond;
        if (this.attackTimer >= attackInterval) {
          this.attackTimer -= attackInterval;
          this.attack(target, spawnProjectile);
          SoundManager.playShoot();
        }
      }
    }

    // Normal Movement
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
      const targetSpeed = 4.0 * this.getSpeedMultiplier();
      if (this.vel.mag() > 0.01) {
        this.vel.normalize().mult(targetSpeed);
      } else if (targetSpeed > 0) {
        this.vel = new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize().mult(targetSpeed);
      }
    }
  }

  attack(target: Champion, spawnProjectile: (p: any) => void) {
    this.attackCount++;
    this.longNoAttackCount++;
    
    const dx = target.pos.x - this.pos.x;
    const dy = target.pos.y - this.pos.y;
    this.lastAttackAngle = Math.atan2(dy, dx);
    
    if (this.longNoAttackCount >= 3) {
      this.longNoAttackCount = 0;
      if (this.longNoStacks.length < 6) {
        this.longNoStacks.push({ timer: 3.0 });
      } else {
        // Refresh oldest
        let minTimer = 3.0;
        let minIdx = -1;
        for (let j = 0; j < this.longNoStacks.length; j++) {
          if (this.longNoStacks[j].timer < minTimer) {
            minTimer = this.longNoStacks[j].timer;
            minIdx = j;
          }
        }
        if (minIdx !== -1) {
          this.longNoStacks[minIdx].timer = 3.0;
        }
      }
      this.addFloatingText(`LONG NỘ x${this.longNoStacks.length}`, FloatingTextType.HEAL);
    }
    
    let isEmpowered = false;
    if (this.attackCount >= 10 && this.passive1Timer <= 0) {
      this.attackCount = 0;
      this.passive1Timer = 4.0;
      isEmpowered = true;
    }

    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      source: this,
      speed: 18,
      radius: 8,
      color: isEmpowered ? '#ef4444' : '#fca5a5',
      lifetime: 2,
      isNormalAttack: true,
      onHit: (enemy: Champion) => {
        if (isEmpowered) {
          const isTrueDamage = Math.random() < 0.5;
          const baseDmg = 4000 + Math.random() * 2000;
          
          this.dealDamage(enemy, baseDmg, isTrueDamage ? DamageType.TRUE : DamageType.PHYSICAL, true);
          
          const healAmount = 800 + 0.03 * (this.maxHp - this.hp);
          this.heal(healAmount);
          
          this.passive1DRTimer = 0.95;
          this.passive1BuffTimer = 3.0;
          
          this.addFloatingText('CƯỜNG HÓA!', isTrueDamage ? FloatingTextType.TRUE : FloatingTextType.PHYSICAL_BURST);
        } else {
          let baseDmg = 738 + Math.random() * (974 - 738);
          this.dealDamage(enemy, baseDmg, DamageType.PHYSICAL, true);
        }
        
        this.triggerAutoAttackEffects(enemy);
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    
    // Draw spear
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);
    
    // Face the target if attacking, otherwise face movement direction
    let angle = 0;
    if (this.attackTimer > 0) {
      angle = this.lastAttackAngle;
    } else if (this.vel.mag() > 0) {
      angle = Math.atan2(this.vel.y, this.vel.x);
    }
    ctx.rotate(angle);
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.radius + 20, 0);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw Long Nộ stacks
    if (this.longNoStacks.length > 0) {
      ctx.fillStyle = '#fef08a';
      for (let i = 0; i < this.longNoStacks.length; i++) {
        ctx.beginPath();
        ctx.arc(-this.radius - 10, -20 + i * 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw Passive 3 Cast
    if (this.passive3CastTimer > 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 150, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(252, 165, 165, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();
  }
}
