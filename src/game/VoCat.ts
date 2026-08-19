import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class VoCat extends Champion {
  // Passive - Ma Quân
  maQuanStacks: Map<Champion, number> = new Map();

  // Skill 1
  skill1CDTimer: number = 0;
  
  // Skill 2
  skill2CDTimer: number = 0;
  skill2MarkedTarget: Champion | null = null;
  skill2MarkTimer: number = 0;
  skill2ReactivateTimer: number = 0;

  // Skill 3
  skill3CDTimer: number = 0;
  isKnightState: boolean = false;
  knightStateTimer: number = 0;
  
  // Visual Effects
  skill1EffectTimer: number = 0;
  skill2EffectTimer: number = 0;
  skill2EffectPos: Vector2 | null = null;
  skill3AuraTimer: number = 0;
  
  // Chúa Tể Hắc Ám
  isDarkLordState: boolean = false;
  darkLordTimer: number = 0;

  autoAttackTimer: number = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#1e1b4b', 'Vô Cát', 62000, 12000); // dark indigo
    this.baseAttackSpeed = 0.05; // Fixed 5%
  }

  getAttackSpeed(): number {
    return 0.05; // Fixed
  }

  getDamageReduction(type: DamageType, isNormalAttack: boolean): number {
    let dr = super.getDamageReduction(type, isNormalAttack);
    if (this.isKnightState) {
      dr = 1 - (1 - dr) * (1 - 0.68);
    }
    return dr;
  }

  // Override takeDamage to handle "Chúa Tể Hắc Ám" state
  takeDamage(amount: number, type: DamageType, source?: Champion, isPeriodic: boolean = false, isAutoAttack: boolean = false): void {
    if (this.isDarkLordState) return;
    
    super.takeDamage(amount, type, source, isPeriodic, isAutoAttack);
    
    if (this.hp <= 0 && this.isKnightState && !this.isDarkLordState) {
      this.hp = 1; // Prevent death
      this.enterDarkLordState();
    }
  }

  enterDarkLordState() {
    this.isDarkLordState = true;
    this.isKnightState = false;
    this.darkLordTimer = 3.0;
    this.skill2CDTimer *= 0.7; // Reduce Skill 2 CD by 30%
    this.addStatus({ type: StatusType.INVINCIBLE, duration: this.darkLordTimer, source: this });
    this.addFloatingText('CHÚA TỂ HẮC ÁM!', FloatingTextType.PHYSICAL_BURST);
    SoundManager.playBuff();
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    
    if (this.isDead) return;

    const cdMultiplier = this.getCooldownMultiplier();
    const cdDt = dtSec * cdMultiplier;

    if (this.skill1CDTimer > 0) this.skill1CDTimer -= cdDt;
    if (this.skill2CDTimer > 0) this.skill2CDTimer -= cdDt;
    if (this.skill3CDTimer > 0) this.skill3CDTimer -= cdDt;

    // Update visual effect timers
    if (this.skill1EffectTimer > 0) this.skill1EffectTimer -= dtSec;
    if (this.skill2EffectTimer > 0) this.skill2EffectTimer -= dtSec;
    this.skill3AuraTimer += dtSec;

    if (this.isKnightState) {
      this.knightStateTimer -= dtSec;
      this.addBuffText('BẤT TỬ MA THÂN', this.knightStateTimer);
      if (this.knightStateTimer <= 0) {
        this.isKnightState = false;
      }
    }

    if (this.isDarkLordState) {
      this.darkLordTimer -= dtSec;
      this.addBuffText('CHÚA TỂ HẮC ÁM', this.darkLordTimer);
      if (this.darkLordTimer <= 0) {
        this.isDarkLordState = false;
        this.hp = 0; // Finally die
        this.isDead = true;
      }
    }

    if (this.skill2MarkTimer > 0) {
      this.skill2MarkTimer -= dtSec;
      if (this.skill2MarkTimer <= 0) {
        this.skill2MarkedTarget = null;
      }
    }
    if (this.skill2ReactivateTimer > 0) {
      this.skill2ReactivateTimer -= dtSec;
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
    if (this.skill3CDTimer <= 0 && nearestEnemy && minDist <= 400 && !this.isDarkLordState) {
      this.skill3CDTimer = 25;
      this.isKnightState = true;
      this.knightStateTimer = 9.0; 
      
      // Cleanse CC: triệu hồi sức mạnh hỗn mang giúp thoát khỏi các trạng thái khống chế đang gánh chịu
      this.statuses = this.statuses.filter(s => s.type !== StatusType.STUN && s.type !== StatusType.SUPPRESS && s.type !== StatusType.SLOW);
      
      this.addFloatingText('BẤT TỬ MA THÂN!', FloatingTextType.PHYSICAL_BURST);
      SoundManager.playBuff();
      SoundManager.playWindUlt(); // Chaotic power sound
    }

    // Skill 2 Trigger - Cannot use during Knight State
    if (this.skill2CDTimer <= 0 && nearestEnemy && !this.isKnightState && !this.isDarkLordState) {
      if (this.skill2MarkedTarget && this.skill2ReactivateTimer <= 0) {
        // Reactivate: Blink to target
        this.pos = new Vector2(this.skill2MarkedTarget.pos.x, this.skill2MarkedTarget.pos.y);
        const dmg = 9739 + Math.random() * (9974 - 9739) + 0.09 * (this.skill2MarkedTarget.maxHp - this.skill2MarkedTarget.hp);
        this.skill2MarkedTarget.takeDamage(dmg, DamageType.PHYSICAL, this);
        
        this.skill2EffectTimer = 0.3;
        this.skill2EffectPos = new Vector2(this.pos.x, this.pos.y);
        
        this.skill2MarkedTarget = null;
        this.skill2MarkTimer = 0;
        this.skill2CDTimer = 7.8;
        SoundManager.playWindDash();
        SoundManager.playFireExplosion();
      } else if (!this.skill2MarkedTarget && minDist <= 450) {
        // Initial cast: Bá Vương Trảo
        this.skill2CDTimer = 1.0; // Small delay before reactivation
        this.skill2ReactivateTimer = 1.0;
        this.skill2MarkedTarget = nearestEnemy;
        this.skill2MarkTimer = 2.5;
        
        const dmg = 9294 + Math.random() * (9948 - 9294);
        nearestEnemy.takeDamage(dmg, DamageType.PHYSICAL, this);
        nearestEnemy.addStatus({ type: StatusType.SLOW, duration: 1.0, value: 0.4, source: this });
        nearestEnemy.addStatus({ type: StatusType.HEAL_REDUCTION, duration: 2.5, value: 0.5, source: this });
        
        this.skill2EffectTimer = 0.3;
        this.skill2EffectPos = new Vector2(nearestEnemy.pos.x, nearestEnemy.pos.y);
        
        this.addMaQuanStack(nearestEnemy);
        SoundManager.playShoot();
        SoundManager.playHit();
      }
    }

    // Skill 1 Trigger
    if (this.skill1CDTimer <= 0 && nearestEnemy && minDist <= 250) {
      this.skill1CDTimer = 5.4;
      
      const baseDmg = 6849 + Math.random() * (7138 - 6849) + 0.10 * nearestEnemy.hp;
      nearestEnemy.takeDamage(baseDmg, DamageType.PHYSICAL, this);
      
      const stacks = this.maQuanStacks.get(nearestEnemy) || 0;
      if (stacks > 0) {
        const extraDmg = 4238 + Math.random() * (5848 - 4238) + 0.08 * nearestEnemy.hp;
        nearestEnemy.takeDamage(extraDmg, DamageType.PHYSICAL, this);
        nearestEnemy.addStatus({ type: StatusType.STUN, duration: 0.85, source: this });
      }
      
      this.skill1EffectTimer = 0.4;
      
      this.addMaQuanStack(nearestEnemy);
      SoundManager.playFireExplosion();
      SoundManager.playHit();
    }

    // Auto Attack
    if (nearestEnemy) {
      this.autoAttackTimer += dtSec;
      if (this.autoAttackTimer >= 1 / this.getAttackSpeed()) {
        this.autoAttackTimer = 0;
        this.fireAutoAttack(nearestEnemy, enemies);
      }
    }

    // Movement
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
      const speed = 3.2 * this.getSpeedMultiplier();
      if (nearestEnemy && minDist > 100) {
        const dir = new Vector2(nearestEnemy.pos.x - this.pos.x, nearestEnemy.pos.y - this.pos.y).normalize();
        this.vel = dir.mult(speed);
      } else {
        this.vel.mult(0.9);
      }
    }
  }

  addMaQuanStack(target: Champion) {
    let stacks = (this.maQuanStacks.get(target) || 0) + 1;
    if (stacks >= 4) {
      // Explode
      const dmg = 6389 + Math.random() * (7374 - 6389) + 0.12 * target.maxHp;
      target.takeDamage(dmg, DamageType.PHYSICAL, this);
      
      this.armor = Math.min(this.getMaxArmor(), this.armor + 8000);
      this.heal(this.maxHp * 0.12);
      
      stacks = 0;
      this.addFloatingText('MA QUÂN BÙNG NỔ!', FloatingTextType.PHYSICAL_BURST);
    }
    this.maQuanStacks.set(target, stacks);
  }

  fireAutoAttack(target: Champion, enemies: Champion[]) {
    SoundManager.playShoot();
    
    let dmg = 1500 + Math.random() * 1000; // Base AA damage
    
    if (this.isKnightState) {
      // Bonus damage in Knight state: 9378 -> 10838
      const bonusDmg = 9378 + Math.random() * (10838 - 9378);
      dmg += bonusDmg;
      
      // AOE in Knight state - slightly wider range (200 instead of 150)
      for (const e of enemies) {
        if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 200) {
          e.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
          this.addMaQuanStack(e);
        }
      }
      SoundManager.playFireExplosion();
    } else {
      target.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
      this.addMaQuanStack(target);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Skill 3 AOE Circle (faint)
    if (this.isKnightState) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, 200, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(30, 27, 75, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(30, 27, 75, 0.2)';
      ctx.setLineDash([10, 5]);
      ctx.stroke();
      ctx.restore();
    }

    // Horse/Knight visuals
    if (this.isKnightState) {
      ctx.save();
      // Draw a "horse" aura
      const auraScale = 1.5 + Math.sin(this.skill3AuraTimer * 5) * 0.1;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius * auraScale, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(79, 70, 229, 0.6)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw horse silhouette (simple)
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = 'rgba(30, 27, 75, 0.8)';
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius * 1.2, this.radius * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Skill 1 Animation (Slash)
    if (this.skill1EffectTimer > 0) {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.rotation + Math.PI / 4);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 8 * (this.skill1EffectTimer / 0.4);
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 2, -Math.PI / 4, Math.PI / 4);
      ctx.stroke();
      ctx.restore();
    }

    // Skill 2 Animation (Claw/Dash)
    if (this.skill2EffectTimer > 0 && this.skill2EffectPos) {
      ctx.save();
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineTo(this.skill2EffectPos.x, this.skill2EffectPos.y);
      ctx.stroke();
      
      // Claw marks at target
      ctx.translate(this.skill2EffectPos.x, this.skill2EffectPos.y);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-15, -15 + i * 15);
        ctx.lineTo(15, 15 + i * 15);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (this.isDarkLordState) {
      ctx.save();
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ef4444';
      // Dark Lord Aura
      const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
      const grad = ctx.createRadialGradient(this.pos.x, this.pos.y, this.radius, this.pos.x, this.pos.y, this.radius * 2 * pulse);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
      grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius * 2 * pulse, 0, Math.PI * 2);
      ctx.fill();
      
      super.draw(ctx);
      ctx.restore();
    } else {
      super.draw(ctx);
    }
  }
}
