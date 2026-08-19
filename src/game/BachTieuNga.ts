import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class BachTieuNga extends Champion {
  // Passive
  troiPhatStacks: Map<Champion, number> = new Map();

  // Skill 1
  skill1CDTimer: number = 0;
  skill1EffectTimer: number = 0;
  skill1Pos: Vector2 | null = null;
  skill1Dir: Vector2 | null = null;
  skill1ExplosionTimer: number = 0;
  skill1Exploded: boolean = false;

  // Skill 2
  skill2CDTimer: number = 0;
  isDashing: boolean = false;
  dashTimer: number = 0;
  dashTarget: Vector2 | null = null;
  dashStartPos: Vector2 | null = null;
  skill2EffectTimer: number = 0;
  skill2Orbs: { start: Vector2, end: Vector2 }[] = [];

  // Skill 3
  skill3CDTimer: number = 0;
  skill3ActiveTimer: number = 0;
  skill3Pos: Vector2 | null = null;
  skill3Radius: number = 350;

  autoAttackTimer: number = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#fef08a', 'Bạch Tiểu Ngã', 50000, 5000); // Light yellow
    this.baseAttackSpeed = 1.0;
  }

  getCooldownMultiplier(): number {
    let mult = super.getCooldownMultiplier();
    if (this.skill3ActiveTimer > 0 && this.skill3Pos) {
      const dist = new Vector2(this.pos.x - this.skill3Pos.x, this.pos.y - this.skill3Pos.y).mag();
      if (dist <= this.skill3Radius) {
        mult *= 0.5; // Cooldowns recover twice as fast
      }
    }
    return mult;
  }

  addTroiPhatStack(target: Champion, enemies: Champion[]) {
    let stacks = (this.troiPhatStacks.get(target) || 0) + 1;
    if (stacks >= 4) {
      // Explode
      const healAmount = 8300 + 0.12 * (this.maxHp - this.hp);
      this.heal(healAmount);

      const trueDmg = 4500 + 0.12 * this.hp;
      
      // AOE damage around target
      for (const e of enemies) {
        if (!e.isDead && new Vector2(e.pos.x - target.pos.x, e.pos.y - target.pos.y).mag() <= 200) {
          e.takeDamage(trueDmg, DamageType.TRUE, this);
          e.addStatus({ type: StatusType.SLOW, duration: 2.0, value: 0.7, source: this });
        }
      }
      
      stacks = 0;
      this.addFloatingText('TRỜI PHẠT!', FloatingTextType.TRUE);
      SoundManager.playCrystal();
    }
    this.troiPhatStacks.set(target, stacks);
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    
    if (this.isDead) return;

    const cdMultiplier = this.getCooldownMultiplier();
    const cdDt = dtSec * cdMultiplier;

    if (this.skill1CDTimer > 0) this.skill1CDTimer -= cdDt;
    if (this.skill2CDTimer > 0) this.skill2CDTimer -= cdDt;
    if (this.skill3CDTimer > 0) this.skill3CDTimer -= cdDt;

    if (this.skill1EffectTimer > 0) this.skill1EffectTimer -= dtSec;
    if (this.skill2EffectTimer > 0) this.skill2EffectTimer -= dtSec;

    // Skill 3 Expiration
    if (this.skill3ActiveTimer > 0) {
      this.skill3ActiveTimer -= dtSec;
      if (this.skill3ActiveTimer <= 0 && this.skill3Pos) {
        // Deal damage on disappear
        for (const e of enemies) {
          if (!e.isDead && new Vector2(e.pos.x - this.skill3Pos.x, e.pos.y - this.skill3Pos.y).mag() <= this.skill3Radius) {
            e.takeDamage(10000, DamageType.MAGIC, this);
            this.addTroiPhatStack(e, enemies);
          }
        }
        SoundManager.playFireHit();
        this.skill3Pos = null;
      }
    }

    // Skill 1 Explosion
    if (this.skill1ExplosionTimer > 0) {
      this.skill1ExplosionTimer -= dtSec;
      if (this.skill1ExplosionTimer <= 0 && !this.skill1Exploded && this.skill1Pos && this.skill1Dir) {
        this.skill1Exploded = true;
        this.skill1EffectTimer = 0.3; // Show explosion effect
        
        // Deal double damage
        for (const e of enemies) {
          if (!e.isDead) {
            const toEnemy = new Vector2(e.pos.x - this.skill1Pos.x, e.pos.y - this.skill1Pos.y);
            const proj = toEnemy.x * this.skill1Dir.x + toEnemy.y * this.skill1Dir.y;
            const distToLine = Math.abs(toEnemy.x * this.skill1Dir.y - toEnemy.y * this.skill1Dir.x);
            
            if (proj > 0 && proj < 400 && distToLine < 80) {
              const dmg = (6898 + Math.random() * (7388 - 6898)) * 2;
              e.takeDamage(dmg, DamageType.MAGIC, this);
              this.addTroiPhatStack(e, enemies);
            }
          }
        }
        SoundManager.playLightning();
      }
    }

    // Skill 2 Dash
    if (this.isDashing) {
      this.dashTimer -= dtSec;
      if (this.dashTarget && this.dashStartPos) {
        const progress = 1 - (this.dashTimer / 0.8);
        this.pos.x = this.dashStartPos.x + (this.dashTarget.x - this.dashStartPos.x) * progress;
        this.pos.y = this.dashStartPos.y + (this.dashTarget.y - this.dashStartPos.y) * progress;
      }
      
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.statuses = this.statuses.filter(s => s.type !== StatusType.UNTARGETABLE);
        
        // Fire 3 orbs
        let targets: Champion[] = [];
        for (const e of enemies) {
          if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 400) {
            targets.push(e);
          }
        }
        targets.sort((a, b) => new Vector2(a.pos.x - this.pos.x, a.pos.y - this.pos.y).mag() - new Vector2(b.pos.x - this.pos.x, b.pos.y - this.pos.y).mag());
        
        this.skill2Orbs = [];
        let hitCount = 0;
        for (let i = 0; i < 3; i++) {
          const target = targets[i % targets.length];
          if (target) {
            const dmg = 6849 + Math.random() * (7388 - 6849);
            target.takeDamage(dmg, DamageType.MAGIC, this);
            this.addTroiPhatStack(target, enemies);
            this.skill2Orbs.push({ start: new Vector2(this.pos.x, this.pos.y), end: new Vector2(target.pos.x, target.pos.y) });
            hitCount++;
          }
        }
        
        if (hitCount > 0) {
          this.skill2CDTimer -= hitCount * 1.0; // Reduce CD by 1s per hit
          if (this.skill2CDTimer < 0) this.skill2CDTimer = 0;
        }
        
        this.skill2EffectTimer = 0.3;
        SoundManager.playCrystal();
      }
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
    if (this.skill3CDTimer <= 0 && nearestEnemy && minDist <= 400) {
      this.skill3CDTimer = 24;
      this.skill3ActiveTimer = 12.0;
      this.skill3Pos = new Vector2(this.pos.x, this.pos.y);
      
      // Initial damage
      for (const e of enemies) {
        if (!e.isDead && new Vector2(e.pos.x - this.skill3Pos.x, e.pos.y - this.skill3Pos.y).mag() <= this.skill3Radius) {
          e.takeDamage(10000, DamageType.MAGIC, this);
          this.addTroiPhatStack(e, enemies);
        }
      }
      
      this.addFloatingText('ĐẠI PHÁN XÉT!', FloatingTextType.MAGIC_BURST);
      SoundManager.playGameStart();
    }

    // Skill 1 Trigger
    if (this.skill1CDTimer <= 0 && nearestEnemy && minDist <= 400 && !this.isDashing) {
      this.skill1CDTimer = 4.0;
      this.skill1Pos = new Vector2(this.pos.x, this.pos.y);
      this.skill1Dir = new Vector2(nearestEnemy.pos.x - this.pos.x, nearestEnemy.pos.y - this.pos.y).normalize();
      this.skill1ExplosionTimer = 0.6; // Explodes after 0.6s
      this.skill1Exploded = false;
      this.skill1EffectTimer = 0.6; // Show initial path
      
      // Initial damage
      for (const e of enemies) {
        if (!e.isDead) {
          const toEnemy = new Vector2(e.pos.x - this.skill1Pos.x, e.pos.y - this.skill1Pos.y);
          const proj = toEnemy.x * this.skill1Dir.x + toEnemy.y * this.skill1Dir.y;
          const distToLine = Math.abs(toEnemy.x * this.skill1Dir.y - toEnemy.y * this.skill1Dir.x);
          
          if (proj > 0 && proj < 400 && distToLine < 80) {
            const dmg = 6898 + Math.random() * (7388 - 6898);
            e.takeDamage(dmg, DamageType.MAGIC, this);
            this.addTroiPhatStack(e, enemies);
          }
        }
      }
      SoundManager.playWindArrow();
    }

    // Skill 2 Trigger
    if (this.skill2CDTimer <= 0 && nearestEnemy && minDist <= 500 && !this.isDashing) {
      this.skill2CDTimer = 4.5;
      this.isDashing = true;
      this.dashTimer = 0.8;
      this.addStatus({ type: StatusType.UNTARGETABLE, duration: 0.8, source: this });
      this.dashStartPos = new Vector2(this.pos.x, this.pos.y);
      
      // Dash towards enemy but stop slightly before or dash to a safe distance
      const dir = new Vector2(nearestEnemy.pos.x - this.pos.x, nearestEnemy.pos.y - this.pos.y).normalize();
      this.dashTarget = new Vector2(this.pos.x + dir.x * 250, this.pos.y + dir.y * 250);
      
      SoundManager.playWindDash();
    }

    // Auto Attack
    if (nearestEnemy && !this.isDashing) {
      this.autoAttackTimer += dtSec;
      if (this.autoAttackTimer >= 1 / this.getAttackSpeed()) {
        this.autoAttackTimer = 0;
        this.fireAutoAttack(nearestEnemy, enemies);
      }
    }

    // Movement
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS) && !this.isDashing) {
      const speed = 3.0 * this.getSpeedMultiplier();
      if (nearestEnemy && minDist > 200) {
        const dir = new Vector2(nearestEnemy.pos.x - this.pos.x, nearestEnemy.pos.y - this.pos.y).normalize();
        this.vel = dir.mult(speed);
      } else {
        this.vel.mult(0.9);
      }
    }
  }

  fireAutoAttack(target: Champion, enemies: Champion[]) {
    SoundManager.playShoot();
    const dmg = 1200 + Math.random() * 800; // Base AA damage
    target.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
    // Auto attack does not add passive stack based on description "Các chiêu thức trúng đích" (Abilities hitting)
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Skill 3 Circle
    if (this.skill3ActiveTimer > 0 && this.skill3Pos) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.skill3Pos.x, this.skill3Pos.y, this.skill3Radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.1)'; // Light yellow transparent
      ctx.fill();
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 10]);
      
      // Rotate the circle slowly
      ctx.translate(this.skill3Pos.x, this.skill3Pos.y);
      ctx.rotate(Date.now() * 0.001);
      ctx.stroke();
      
      // Inner star/magic circle
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const x = Math.cos(angle) * this.skill3Radius * 0.8;
        const y = Math.sin(angle) * this.skill3Radius * 0.8;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      
      ctx.restore();
    }

    // Skill 1 Path
    if (this.skill1Pos && this.skill1Dir && (this.skill1EffectTimer > 0 || this.skill1ExplosionTimer > 0)) {
      ctx.save();
      const endPos = new Vector2(this.skill1Pos.x + this.skill1Dir.x * 400, this.skill1Pos.y + this.skill1Dir.y * 400);
      
      ctx.beginPath();
      ctx.moveTo(this.skill1Pos.x, this.skill1Pos.y);
      ctx.lineTo(endPos.x, endPos.y);
      
      if (this.skill1Exploded) {
        // Explosion effect
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)'; // Bright yellow
        ctx.lineWidth = 80;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 40;
        ctx.stroke();
      } else {
        // Initial path
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.4)';
        ctx.lineWidth = 80;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.8)';
        ctx.lineWidth = 10;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Skill 2 Orbs
    if (this.skill2EffectTimer > 0) {
      ctx.save();
      for (const orb of this.skill2Orbs) {
        ctx.beginPath();
        ctx.moveTo(orb.start.x, orb.start.y);
        ctx.lineTo(orb.end.x, orb.end.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 6;
        ctx.stroke();
        
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)';
        ctx.lineWidth = 12;
        ctx.stroke();
        
        // Impact glow
        ctx.beginPath();
        ctx.arc(orb.end.x, orb.end.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.8)';
        ctx.fill();
      }
      ctx.restore();
    }

    // Champion Glow
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#facc15';
    super.draw(ctx);
    
    // Draw wings if dashing
    if (this.isDashing) {
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      
      // Left wing
      ctx.beginPath();
      ctx.ellipse(-this.radius, 0, this.radius * 1.5, this.radius * 0.5, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Right wing
      ctx.beginPath();
      ctx.ellipse(this.radius, 0, this.radius * 1.5, this.radius * 0.5, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    
    // Draw Passive Stacks
    for (const [target, stacks] of this.troiPhatStacks.entries()) {
      if (!target.isDead && stacks > 0) {
        ctx.save();
        ctx.translate(target.pos.x, target.pos.y - target.radius - 20);
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.arc(-15 + i * 10, 0, 4, 0, Math.PI * 2);
          ctx.fillStyle = i < stacks ? '#facc15' : 'rgba(0,0,0,0.5)';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  }
}
