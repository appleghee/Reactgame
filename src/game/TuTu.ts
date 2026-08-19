import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { Projectile } from './Projectile';
import { SoundManager } from './SoundManager';

export class TuTu extends Champion {
  // Passive 1
  passive1Timer = 0;
  orbs: { angle: number, distance: number, active: boolean }[] = [];
  orbDurationTimer = 0;
  
  // Passive 2
  passive2Timer = 0;
  physImmuneTimer = 0;

  // Passive 3
  passive3Timer = 0;
  magicImmuneTimer = 0;
  healBoostTimer = 0;

  // Ultimate
  ultTimer = 0;
  ultState = 0; // 0: ready, 1: phase 2 unlocked, 2: phase 2 delay
  ultPhaseTimer = 0;
  ultTargetDir: Vector2 = new Vector2(1, 0);
  passiveBuffTimer = 0;
  aiUltDelay = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#eab308', 'Tử Tư', 45000, 4000); // yellow-500
    this.baseAttackSpeed = 0.5; // Default some attack speed
  }

  createOrbs(count: number) {
    this.orbDurationTimer = 3.0;
    this.orbs = [];
    for (let i = 0; i < count; i++) {
      this.orbs.push({
        angle: (Math.PI * 2 / count) * i,
        distance: 60, // Orbit distance
        active: true
      });
    }
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdr = this.getCooldownMultiplier();
    let passiveCdr = cdr;
    if (this.passiveBuffTimer > 0) {
      this.passiveBuffTimer -= dtSec;
      passiveCdr *= 0.6; // 40% reduction
    }

    // Timers
    if (this.passive1Timer > 0) this.passive1Timer -= dtSec * passiveCdr;
    if (this.passive2Timer > 0) this.passive2Timer -= dtSec * passiveCdr;
    if (this.passive3Timer > 0) this.passive3Timer -= dtSec * cdr;
    if (this.ultTimer > 0 && this.ultState === 0) this.ultTimer -= dtSec * cdr;
    if (this.aiUltDelay > 0) this.aiUltDelay -= dtSec;
    
    if (this.physImmuneTimer > 0) this.physImmuneTimer -= dtSec;
    if (this.magicImmuneTimer > 0) this.magicImmuneTimer -= dtSec;
    if (this.healBoostTimer > 0) this.healBoostTimer -= dtSec;

    // Orbs logic
    if (this.orbDurationTimer > 0) {
      this.orbDurationTimer -= dtSec;
      
      // Rotate orbs
      const rotationSpeed = Math.PI; // 180 degrees per second
      for (const orb of this.orbs) {
        if (orb.active) {
          orb.angle += rotationSpeed * dtSec;
          
          // Check collision with enemies
          const orbPos = new Vector2(
            this.pos.x + Math.cos(orb.angle) * orb.distance,
            this.pos.y + Math.sin(orb.angle) * orb.distance
          );
          
          for (const enemy of enemies) {
            if (enemy.isDead || enemy.hasStatus(StatusType.UNTARGETABLE)) continue;
            
            const dist = new Vector2(enemy.pos.x - orbPos.x, enemy.pos.y - orbPos.y).mag();
            if (dist < enemy.radius + 15) { // 15 is orb radius
              orb.active = false;
              
              // Deal damage: 4380->5690 (+4%->6% current HP of self)
              const baseDmg = 4380 + Math.random() * (5690 - 4380);
              const hpScale = 0.04 + Math.random() * (0.06 - 0.04);
              const dmg = baseDmg + hpScale * this.hp;
              
              enemy.takeDamage(dmg, DamageType.MAGIC, this);
              
              // Heal: 670->1475 (+5.5%->7.2% current HP of self and enemy)
              const baseHeal = 670 + Math.random() * (1475 - 670);
              const healScale = 0.055 + Math.random() * (0.072 - 0.055);
              const healAmount = baseHeal + healScale * (this.hp + enemy.hp);
              
              this.heal(healAmount);
              
              break; // One orb hits one enemy
            }
          }
        }
      }
    } else {
      this.orbs = [];
    }

    // Passive 1
    if (this.passive1Timer <= 0 && this.ultState === 0) {
      this.passive1Timer = 6.0;
      this.createOrbs(3);
      SoundManager.playBuff();
    }

    // Passive 2
    if (this.passive2Timer <= 0 && this.ultState === 0) {
      this.passive2Timer = 12.0;
      this.physImmuneTimer = 2.0 + Math.random() * (3.0 - 2.0);
      this.createOrbs(6);
      SoundManager.playBuff();
    }

    // Passive 3
    if (this.passive3Timer <= 0 && this.ultState === 0) {
      this.passive3Timer = 14.0;
      this.magicImmuneTimer = 2.5 + Math.random() * (3.5 - 2.5);
      this.healBoostTimer = 5.0 + Math.random() * (8.0 - 5.0);
      this.createOrbs(12);
      SoundManager.playBuff();
    }

    // Ultimate
    let target = this.findTarget(enemies.filter(c => !c.isDead && !c.hasStatus(StatusType.UNTARGETABLE)));
    
    if (this.ultTimer <= 0 && this.ultState === 0 && target) {
      if (this.aiUltDelay <= 0) {
        this.aiUltDelay = 0.5 + Math.random() * 1.5; // Random delay for AI
      }
      
      if (this.aiUltDelay <= 0.1) { // Trigger when delay is almost over
        this.ultTimer = 18.0; // Increased cooldown
        this.ultTargetDir = new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize();
        this.addFloatingText('GIAI ĐOẠN 1!', FloatingTextType.HEAL);
        
        // Fire Phase 1: Triangle
        const initialSpeed = 10;
        const proj = new Projectile({
          pos: new Vector2(this.pos.x, this.pos.y),
          dir: this.ultTargetDir,
          speed: initialSpeed,
          radius: 25,
          color: '#fef08a',
          damageBase: 0,
          source: this,
          piercing: true, // Can hit multiple enemies while staying in place
          lifetime: 1.4 + 2.5,
          updateCallback: (p: Projectile, dt: number) => {
            const elapsed = (1.4 + 2.5) - p.lifetime;
            if (elapsed < 1.4) {
              // Decelerate to 0 over 1.4s
              p.speed = initialSpeed * (1 - elapsed / 1.4);
            } else {
              p.speed = 0;
            }
          },
          onHit: (hitEnemy: Champion) => {
            const dmg = 7800 + Math.random() * (9900 - 7800) + 0.16 * (this.hp + hitEnemy.hp);
            hitEnemy.takeDamage(dmg, DamageType.MAGIC, this);
            this.heal(dmg * 0.3);
            
            this.passiveBuffTimer = 3.0;
            this.ultState = 2; // Move to delay state
            this.ultPhaseTimer = 0.8; // 0.8s delay before Phase 2
            this.addFloatingText('MỞ KHÓA GĐ 2!', FloatingTextType.HEAL);
          },
          drawCallback: (ctx: CanvasRenderingContext2D, p: Projectile) => {
            ctx.save();
            ctx.translate(p.pos.x, p.pos.y);
            if (p.dir) ctx.rotate(Math.atan2(p.dir.y, p.dir.x));
            ctx.beginPath();
            ctx.moveTo(25, 0);
            ctx.lineTo(-20, 20);
            ctx.lineTo(-20, -20);
            ctx.closePath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.lifetime < 0.5 ? p.lifetime * 2 : 1;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
          }
        });
        spawnProjectile(proj);
        SoundManager.playShoot();
        this.aiUltDelay = 0;
      }
    }

    // Phase 2 delay
    if (this.ultState === 2) {
      this.ultPhaseTimer -= dtSec;
      if (this.ultPhaseTimer <= 0) {
        this.ultState = 1; // Ready to fire Phase 2
      }
    }

    // Phase 2 activation (manual or automatic? usually manual but here we auto-fire if unlocked and target exists)
    if (this.ultState === 1 && target) {
      this.ultState = 0; // Reset state after firing
      this.addFloatingText('GIAI ĐOẠN 2!', FloatingTextType.HEAL);
      
      const baseAngle = Math.atan2(target.pos.y - this.pos.y, target.pos.x - this.pos.x);
      for (let i = 0; i < 3; i++) {
        const angle = baseAngle + (i - 1) * 0.3;
        const dir = new Vector2(Math.cos(angle), Math.sin(angle));
        
        const proj = new Projectile({
          pos: new Vector2(this.pos.x, this.pos.y),
          dir: dir,
          speed: 8,
          radius: 15,
          color: '#fbbf24',
          source: this,
          piercing: false,
          lifetime: 4,
          onHit: (hitEnemy: Champion) => {
            // Reduce healing and armor recovery by 50% for 3s
            // Reduce armor effectiveness by 80% for 3s
            hitEnemy.addStatus({ type: StatusType.WEAKEN, duration: 3, value: 0.8 }); // Using WEAKEN for armor reduction
            // We don't have a specific "heal reduction" status in the base types usually, 
            // but we can simulate it or just add a generic debuff text.
            hitEnemy.addFloatingText('-50% HỒI PHỤC', FloatingTextType.ARMOR_BREAK);
            
            this.ultTimer -= 2.5; // Reduced reduction
            if (this.ultTimer < 0) this.ultTimer = 0;
          },
          drawCallback: (ctx: CanvasRenderingContext2D, p: Projectile) => {
            ctx.save();
            ctx.translate(p.pos.x, p.pos.y);
            if (p.dir) ctx.rotate(Math.atan2(p.dir.y, p.dir.x));
            ctx.beginPath();
            ctx.rect(-12, -12, 24, 24);
            ctx.fillStyle = p.color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
          }
        });
        spawnProjectile(proj);
      }
      SoundManager.playShoot();
    }
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

  takeDamage(amount: number, type: DamageType, source?: Champion, isStatusDamage: boolean = false, isNormalAttack: boolean = false) {
    if (this.physImmuneTimer > 0 && type === DamageType.PHYSICAL) {
      this.addFloatingText('MIỄN STVL', FloatingTextType.HEAL);
      return; // Immune
    }
    if (this.magicImmuneTimer > 0 && type === DamageType.MAGIC) {
      this.addFloatingText('MIỄN STP', FloatingTextType.HEAL);
      return; // Immune
    }
    super.takeDamage(amount, type, source, isStatusDamage, isNormalAttack);
  }

  heal(amount: number) {
    let finalHeal = amount;
    if (this.healBoostTimer > 0) {
      finalHeal *= 2; // 100% increase
    }
    super.heal(finalHeal);
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);
    
    if (this.isDead) return;

    // Draw Orbs
    if (this.orbDurationTimer > 0) {
      for (const orb of this.orbs) {
        if (orb.active) {
          const orbPos = new Vector2(
            this.pos.x + Math.cos(orb.angle) * orb.distance,
            this.pos.y + Math.sin(orb.angle) * orb.distance
          );
          ctx.beginPath();
          ctx.arc(orbPos.x, orbPos.y, 10, 0, Math.PI * 2);
          ctx.fillStyle = '#facc15'; // yellow-400
          ctx.fill();
          ctx.strokeStyle = '#ca8a04'; // yellow-600
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    }

    // Draw Ult Charge
    if (this.ultState === 1) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 15, 0, Math.PI * 2);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Draw immunities
    if (this.physImmuneTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 5, 0, Math.PI * 2);
      ctx.strokeStyle = '#ef4444'; // red for physical immune
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    if (this.magicImmuneTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#3b82f6'; // blue for magic immune
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
