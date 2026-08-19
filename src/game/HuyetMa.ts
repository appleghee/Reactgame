import { Champion } from "./Champion";
import { Vector2 } from "./Vector2";
import { Projectile } from "./Projectile";
import { DamageType, StatusType, FloatingTextType } from "./Types";
import { SoundManager } from "./SoundManager";
import { Engine } from "./Engine";

export class HuyetMa extends Champion {
  passive1Attacks = 0;
  passive2Attacks = 0;
  
  passive1Timer = 0;
  passive2Timer = 0;
  passive3Timer = 0;
  
  passive3ActiveTimer = 0;
  isPassive3Active = false;
  
  passive2BuffTimer = 0;
  isPassive2BuffActive = false;

  engine: Engine | null = null;
  attackTimer: number = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#8B0000', 'Huyết Ma', 100000, 15000);
    this.baseAttackSpeed = 0.25;
  }

  getAttackSpeed(): number {
    let bonus = super.getAttackSpeed();
    if (this.isPassive3Active) bonus += 0.20;
    return bonus;
  }

  getPhysLifesteal(): number {
    let ls = super.getPhysLifesteal();
    if (this.isPassive2BuffActive) ls += 0.30;
    return Math.min(1.0, ls);
  }

  getMagLifesteal(): number {
    let ls = super.getMagLifesteal();
    if (this.isPassive2BuffActive) ls += 0.30;
    return Math.min(1.0, ls);
  }

  takeDamage(amount: number, type: DamageType, source?: Champion, isStatusDamage: boolean = false, isNormalAttack: boolean = false) {
    let finalAmount = amount;
    if (this.isPassive3Active) {
      if (isNormalAttack) {
        finalAmount *= 0.80; // 20% damage reduction from auto-attacks
      }
    }
    
    // Apply armor reduction first (manually or by calling super and then capping?)
    // Actually, super.takeDamage handles armor. To cap the FINAL damage, we need to override the logic.
    
    if (this.isDead) return;

    let damageAfterArmor = finalAmount;
    if (type === DamageType.PHYSICAL) {
      damageAfterArmor = finalAmount * (100 / (100 + this.armor));
    } else if (type === DamageType.MAGIC) {
      damageAfterArmor = finalAmount * (100 / (100 + this.armor * 0.5));
    }

    if (this.isPassive3Active && damageAfterArmor > 4500) {
      damageAfterArmor = 4500;
    }

    // Now we call super.takeDamage but with the already reduced amount and type TRUE to bypass its internal armor calc
    // Or just implement the rest of super.takeDamage here.
    // Let's just implement it here for precision.
    
    if (this.damageReduction > 0) {
      damageAfterArmor *= (1 - this.damageReduction);
    }

    this.hp -= damageAfterArmor;
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
    }

    this.addFloatingText(Math.round(damageAfterArmor).toString(), type === DamageType.PHYSICAL ? FloatingTextType.PHYSICAL : (type === DamageType.MAGIC ? FloatingTextType.MAGIC : FloatingTextType.TRUE));
  }

  findTarget(enemies: Champion[]): Champion | null {
    if (enemies.length === 0) return null;
    let nearest: Champion | null = null;
    let minDist = Infinity;
    for (const enemy of enemies) {
      const dist = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag();
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }
    return nearest;
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], engine: Engine) {
    this.engine = engine;
    this.updateChampion(dtSec, dtFrames);

    if (this.isDead) return;

    const cdr = this.getCooldownMultiplier();
    if (this.passive1Timer > 0) this.passive1Timer -= dtSec * cdr;
    if (this.passive2Timer > 0) this.passive2Timer -= dtSec * cdr;
    if (this.passive3Timer > 0) this.passive3Timer -= dtSec * cdr;

    if (this.passive3ActiveTimer > 0) {
      this.passive3ActiveTimer -= dtSec;
      this.isPassive3Active = true;
    } else {
      this.isPassive3Active = false;
    }

    if (this.passive2BuffTimer > 0) {
      this.passive2BuffTimer -= dtSec;
      this.isPassive2BuffActive = true;
    } else {
      this.isPassive2BuffActive = false;
    }

    let target = this.findTarget(enemies.filter(c => !c.isDead && !c.hasStatus(StatusType.UNTARGETABLE)));

    // Auto Attack
    if (target) {
      this.attackTimer += dtSec;
      const currentAttackSpeed = this.getAttackSpeed();
      const attacksPerSecond = (currentAttackSpeed / 0.10) * 2;
      if (attacksPerSecond > 0) {
        const attackInterval = 1 / attacksPerSecond;
        if (this.attackTimer >= attackInterval) {
          this.attackTimer -= attackInterval;
          this.attack(target);
        }
      }
    }

    // Passive 3
    if (this.passive3Timer <= 0) {
      this.passive3Timer = 24.0;
      this.passive3ActiveTimer = 8.0;
      SoundManager.playBuff();
      this.addFloatingText('HUYẾT MA BIẾN', FloatingTextType.MAGIC_BURST);
    }

    // Random Bouncing Movement
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
      const speedMult = this.getSpeedMultiplier();
      const targetSpeed = 3.5 * speedMult;
      
      if (this.vel.mag() > 0.01) {
        this.vel.normalize().mult(targetSpeed);
      } else if (targetSpeed > 0) {
        this.vel = new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize().mult(targetSpeed);
      }
    }
  }

  attack(target: Champion) {
    this.passive1Attacks++;
    this.passive2Attacks++;
    
    // Passive 1
    if (this.passive1Attacks >= 5 && this.passive1Timer <= 0) {
      this.passive1Attacks = 0;
      this.passive1Timer = 0.1;
      this.shootPassive1(target);
    }

    // Passive 2
    if (this.passive2Attacks >= 10 && this.passive2Timer <= 0) {
      this.passive2Attacks = 0;
      // No cooldown for P2 as per request "Hồi 0s"
      this.passive2BuffTimer = 3.0;
      const missingHp = this.maxHp - this.hp;
      const armorHeal = 3200 + 0.08 * missingHp;
      this.addArmor(armorHeal);
      this.addFloatingText(`+${Math.round(armorHeal)} GIÁP`, FloatingTextType.HEAL);
      SoundManager.playHeal();
    }

    // Normal attack projectile
    const dmg = 45 + Math.random() * (80 - 45);
    
    const proj = new Projectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      dir: new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize(),
      speed: 20,
      radius: 8,
      color: this.isPassive3Active ? "#FF00FF" : "#AA0000",
      damageBase: dmg,
      source: this,
      piercing: false,
      lifetime: 2,
      isNormalAttack: true,
      onHit: (hitEnemy: Champion) => {
        if (this.isPassive3Active) {
          // Passive 3 effects
          hitEnemy.addStatus({ type: StatusType.STUN, duration: 0.02 });
          
          // Deal all 3 types
          hitEnemy.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
          hitEnemy.takeDamage(dmg, DamageType.MAGIC, this, false, true);
          hitEnemy.takeDamage(dmg * 0.3, DamageType.TRUE, this, false, true); // 30% STC
          
          // Additional 150 STVL and 150 STP
          hitEnemy.takeDamage(150, DamageType.PHYSICAL, this, false, true);
          hitEnemy.takeDamage(150, DamageType.MAGIC, this, false, true);
          
          // Heal 100 (+1% missing HP) Armor
          const missingHp = this.maxHp - this.hp;
          this.addArmor(100 + 0.01 * missingHp);
          
          this.triggerAutoAttackEffects(hitEnemy);
        } else {
          hitEnemy.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
          this.triggerAutoAttackEffects(hitEnemy);
        }
      }
    });
    this.engine?.projectiles.push(proj);

    SoundManager.playShoot();
  }

  shootPassive1(target: Champion) {
    const dmgTypes = [DamageType.PHYSICAL, DamageType.MAGIC, DamageType.TRUE];
    const randomType = dmgTypes[Math.floor(Math.random() * dmgTypes.length)];
    const dmg = 980 + Math.random() * (1180 - 980);

    const proj = new Projectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      dir: new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize(),
      speed: 15,
      radius: 18, // Large crystal
      color: "#FF0000",
      damageBase: 0,
      source: this,
      piercing: false,
      lifetime: 3,
      isNormalAttack: false,
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
        hitEnemy.takeDamage(dmg, randomType, this, false, false);
      }
    });
    this.engine?.projectiles.push(proj);
    SoundManager.playShoot();
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    super.draw(ctx);

    if (this.isPassive3Active) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 0, 255, 0.5)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    
    if (this.isPassive2BuffActive) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
}
