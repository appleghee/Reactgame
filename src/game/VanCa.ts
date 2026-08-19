import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class VanCa extends Champion {
  // Passive - Long Ấn
  longAnStacks = 0;
  passiveInternalCD = 0;
  passiveMSTimer = 0;
  baseCritChance = 0.15;
  critDamageMult = 1.8;

  // Skill 1 - Long Huyết Bôn Tập
  skill1CD = 0;
  skill1ActiveTimer = 0;
  skill1Empowered = false;

  // Skill 2 - Long Hống Chấn Thiên
  skill2CD = 0;
  skill2ActiveTimer = 0;
  skill2ReductionPool = 0; // Max 1.5s reduction per cast

  // Skill 3 - Long Kích Phá Trận
  skill3CD = 0;
  skill3ActiveTimer = 0;
  skill3RegenTimer = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#fbbf24', 'Vân Ca', 58000, 11200);
    this.baseAttackSpeed = 0.10;
  }

  getAttackSpeed(): number {
    let as = super.getAttackSpeed();
    if (this.skill2ActiveTimer > 0) {
      as += 0.20;
    }
    return as;
  }

  getSpeedMultiplier(): number {
    let mult = super.getSpeedMultiplier();
    if (this.skill1ActiveTimer > 0) {
      mult *= 1.70;
    }
    if (this.passiveMSTimer > 0) {
      mult *= 1.40;
    }
    return mult;
  }

  getDamageReduction(type: DamageType, isNormalAttack: boolean): number {
    let dr = super.getDamageReduction(type, isNormalAttack);
    if (this.skill3ActiveTimer > 0) {
      dr = 1 - (1 - dr) * (1 - 0.25);
    }
    return dr;
  }

  getPhysLifesteal(): number {
    let ls = super.getPhysLifesteal();
    if (this.skill2ActiveTimer > 0) {
      ls += 0.45;
    }
    return ls;
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdr = 1 - this.getPassiveCooldownReduction();
    
    // Update Timers
    if (this.passiveInternalCD > 0) this.passiveInternalCD -= dtSec;
    if (this.passiveMSTimer > 0) this.passiveMSTimer -= dtSec;
    
    if (this.skill1CD > 0) this.skill1CD -= dtSec * cdr;
    if (this.skill1ActiveTimer > 0) {
      this.skill1ActiveTimer -= dtSec;
      if (this.skill1ActiveTimer <= 0) this.skill1Empowered = false;
    }

    if (this.skill2CD > 0) this.skill2CD -= dtSec * cdr;
    if (this.skill2ActiveTimer > 0) this.skill2ActiveTimer -= dtSec;

    if (this.skill3CD > 0) this.skill3CD -= dtSec * cdr;
    if (this.skill3ActiveTimer > 0) {
      this.skill3ActiveTimer -= dtSec;
      this.skill3RegenTimer += dtSec;
      if (this.skill3RegenTimer >= 1.0) {
        this.skill3RegenTimer -= 1.0;
        this.heal(350);
      }
    }

    // AI Logic
    const target = this.findTarget(enemies.filter(e => !e.isDead && !e.hasStatus(StatusType.UNTARGETABLE)));
    if (target) {
      const dist = this.distanceTo(target);

      // Skill 3 - Long Kích Phá Trận
      if (this.skill3CD <= 0 && dist < 300) {
        this.castSkill3();
      }

      // Skill 1 - Long Huyết Bôn Tập
      if (this.skill1CD <= 0 && dist > 150 && dist < 500) {
        this.castSkill1();
      }

      // Skill 2 - Long Hống Chấn Thiên
      if (this.skill2CD <= 0 && dist < 180) {
        this.castSkill2(enemies);
      }

      // Movement
      if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
        const speed = 4.5 * this.getSpeedMultiplier();
        const dir = new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize();
        this.vel = dir.mult(speed);
      }
    }

    // Auto Attack
    if (target && this.distanceTo(target) < 120) {
      this.handleAutoAttack(target);
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

  castSkill1() {
    this.skill1CD = 5.8;
    this.skill1ActiveTimer = 2.5;
    this.skill1Empowered = true;
    
    // Cleanse CC
    const ccTypes = [StatusType.STUN, StatusType.SLOW, StatusType.SUPPRESS];
    this.statuses = this.statuses.filter(s => !ccTypes.includes(s.type));
    
    this.addFloatingText('LONG HUYẾT!', FloatingTextType.HEAL);
    SoundManager.playBuff();
  }

  castSkill2(enemies: Champion[]) {
    this.skill2CD = 6.5;
    this.skill2ActiveTimer = 3.5;
    this.skill2ReductionPool = 1.5;

    const dmg = 5840 + Math.random() * (6920 - 5840);
    for (const enemy of enemies) {
      if (!enemy.isDead && this.distanceTo(enemy) < 200) {
        enemy.takeDamage(dmg, DamageType.PHYSICAL, this);
      }
    }

    this.addFloatingText('LONG HỐNG!', FloatingTextType.PHYSICAL_BURST);
    SoundManager.playShoot();
  }

  castSkill3() {
    this.skill3CD = 22;
    this.skill3ActiveTimer = 4.5;
    this.skill3RegenTimer = 0;
    
    this.addFloatingText('LONG KÍCH!', FloatingTextType.MAGIC_BURST);
    SoundManager.playBuff();
  }

  handleAutoAttack(target: Champion) {
    if ((this as any).attackTimer === undefined) (this as any).attackTimer = 0;
    const attackInterval = 1 / (this.getAttackSpeed() * 10); // Adjusting scale
    
    (this as any).attackTimer += 0.016; // Assuming 60fps update
    if ((this as any).attackTimer >= attackInterval) {
      (this as any).attackTimer = 0;
      this.performAttack(target);
    }
  }

  performAttack(target: Champion) {
    let damage = 800 + Math.random() * 400; // Base AA damage
    let isCrit = Math.random() < this.baseCritChance;
    
    if (isCrit) {
      damage *= this.critDamageMult;
      this.handleCrit();
    }

    let finalDamage = damage;
    let type = DamageType.PHYSICAL;

    // Skill 1 Empowerment
    if (this.skill1Empowered) {
      const bonus = 680 + 0.15 * (this.maxHp - this.hp);
      finalDamage += bonus;
      this.skill1Empowered = false;
      this.skill1ActiveTimer = 0;
      
      target.addStatus({ type: StatusType.SLOW, duration: 2.0, value: 0.5 });
      target.armorReductionTimer = 3.0;
      target.armorReductionValue = 0.3;
      
      if (isCrit) {
        this.skill1CD = 0;
        this.addFloatingText('HỒI CHIÊU!', FloatingTextType.HEAL);
      }
    }

    // Skill 2 CD Reduction
    if (this.skill2ActiveTimer > 0 && this.skill2ReductionPool > 0) {
      const reduction = 0.3;
      this.skill2CD = Math.max(0, this.skill2CD - reduction);
      this.skill2ReductionPool -= reduction;
    }

    // Skill 3 Bonus
    if (this.skill3ActiveTimer > 0) {
      const bonus = 3200 + Math.random() * (4100 - 3200);
      finalDamage += bonus;
      
      const trueDmg = finalDamage * 0.3;
      const physDmg = finalDamage * 0.7;
      
      target.takeDamage(physDmg, DamageType.PHYSICAL, this, false, true);
      target.takeDamage(trueDmg, DamageType.TRUE, this, false, true);
    } else {
      target.takeDamage(finalDamage, type, this, false, true);
    }

    SoundManager.playShoot();
    if (isCrit) {
      this.addFloatingText('CHÍ MẠNG!', FloatingTextType.PHYSICAL_BURST);
    }
  }

  handleCrit() {
    if (this.passiveInternalCD <= 0) {
      this.longAnStacks++;
      if (this.longAnStacks >= 5) {
        this.longAnStacks = 0;
        this.passiveInternalCD = 8.0;
        this.passiveMSTimer = 1.5;
        
        this.skill1CD *= 0.4; // 60% reduction
        this.skill2CD *= 0.4;
        
        this.addFloatingText('LONG ẨN!', FloatingTextType.HEAL);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    
    // Draw stacks
    if (this.longAnStacks > 0) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`🐉 ${this.longAnStacks}`, this.pos.x, this.pos.y - this.radius - 15);
    }

    // Skill 3 Aura
    if (this.skill3ActiveTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }
}
