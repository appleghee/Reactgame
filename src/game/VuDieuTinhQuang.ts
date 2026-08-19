import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class VuDieuTinhQuang extends Champion {
  // Passive 1: Vu Dieu
  vuDieuStacks: number = 0;
  moveTimer: number = 0;
  lightTrails: { x: number, y: number, timer: number }[] = [];
  lastPos: Vector2;

  // Passive 2: Shield
  passive2CDTimer: number = 0;
  shields: { hp: number, timer: number }[] = [];
  distanceMoved: number = 0;

  // Passive 3: Empowered
  passive3CDTimer: number = 0;
  passive3ActiveTimer: number = 0;
  skillHistory: number[] = []; // Timestamps of skill casts

  // Ultimate: Tinh Quang Toi Thuong
  ultCDTimer: number = 0;
  ultActiveTimer: number = 0;
  ultShield: number = 0;
  ultShieldTimer: number = 0;
  ultDamageDealt: number = 0;
  ultDamageTaken: number = 0;
  ultDashCount: number = 0;
  ultDashTimer: number = 0;
  
  currentDash: {
    targetPos: Vector2;
    targetEnemy: Champion;
    speed: number;
    dmg: number;
  } | null = null;

  autoAttackTimer: number = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#f0abfc', 'Vũ Điệu Tinh Quang', 90000, 5000); // fuchsia-400
    this.baseAttackSpeed = 0.03;
    this.lastPos = new Vector2(x, y);
  }

  getAttackSpeed(): number {
    if (this.ultActiveTimer > 0) {
      return 0.25; // Fixed at 25% during Ult
    }
    // Base attack speed + 2% per stack
    return this.baseAttackSpeed + (this.vuDieuStacks * 0.02);
  }

  getSpeedMultiplier(): number {
    let mult = super.getSpeedMultiplier();
    if (this.ultActiveTimer > 0) {
      mult += 0.5; // +50% MS
    }
    mult += this.vuDieuStacks * 0.06; // +6% MS per stack
    return mult;
  }

  recordSkillCast() {
    this.skillHistory.push(Date.now());
    this.addVuDieuStack();
  }

  addVuDieuStack() {
    if (this.vuDieuStacks < 5) {
      this.vuDieuStacks++;
    }
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdMultiplier = this.getCooldownMultiplier();
    const cdDt = dtSec * cdMultiplier;

    if (this.passive2CDTimer > 0) {
      if (this.passive3ActiveTimer > 0) {
        this.passive2CDTimer -= cdDt * 2; // 50% CD reduction
      } else {
        this.passive2CDTimer -= cdDt;
      }
    }
    if (this.passive3CDTimer > 0) this.passive3CDTimer -= cdDt;
    if (this.passive3ActiveTimer > 0) this.passive3ActiveTimer -= dtSec;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;
    if (this.ultActiveTimer > 0) {
      this.ultActiveTimer -= dtSec;
      if (this.ultActiveTimer <= 0) {
        // Ult ends
        SoundManager.playFireExplosion();
        for (const e of enemies) {
          if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 300) {
            e.takeDamage(8000, DamageType.PHYSICAL, this);
          }
        }
        const missingHp = this.maxHp - this.hp;
        this.heal(missingHp * 0.4);
        
        // Check damage dealt condition
        let totalEnemyMaxHp = 0;
        let validEnemies = 0;
        for (const e of enemies) {
          totalEnemyMaxHp += e.maxHp;
          validEnemies++;
        }
        
        const targetDamage = validEnemies > 0 ? (totalEnemyMaxHp / validEnemies) * 0.55 : 0;
        
        if (targetDamage > 0 && this.ultDamageDealt < targetDamage) {
          // Penalty
          this.takeDamage(this.ultDamageTaken * 0.5, DamageType.TRUE, undefined, true);
          this.addFloatingText('PHẢN HỆ', FloatingTextType.TRUE);
        }
        
        this.ultShield = 0;
      }
    }
    if (this.ultShieldTimer > 0) this.ultShieldTimer -= dtSec;
    if (this.ultShieldTimer <= 0) this.ultShield = 0;

    // Passive 1: Movement tracking
    const currentPos = new Vector2(this.pos.x, this.pos.y);
    const distMoved = currentPos.sub(this.lastPos).mag();
    
    if (distMoved > 0.1) {
      this.moveTimer += dtSec;
      if (this.moveTimer >= 2) {
        this.moveTimer = 0;
        this.addVuDieuStack();
      }
    } else {
      this.moveTimer = 0;
    }

    // Passive 1: Consume stacks for trail
    if (this.vuDieuStacks >= 5 && distMoved > 0.1) {
      this.vuDieuStacks = 0;
      this.lightTrails.push({ x: this.pos.x, y: this.pos.y, timer: 3 });
      this.heal(this.maxHp * 0.05);
      SoundManager.playWindDash();
      this.recordSkillCast();
    }

    // Update light trails
    for (let i = this.lightTrails.length - 1; i >= 0; i--) {
      const trail = this.lightTrails[i];
      trail.timer -= dtSec;
      
      for (const e of enemies) {
        if (!e.isDead && new Vector2(e.pos.x - trail.x, e.pos.y - trail.y).mag() <= 60) {
          e.addStatus({ type: StatusType.SLOW, duration: 1, value: 0.99 });
        }
      }

      if (trail.timer <= 0) {
        this.lightTrails.splice(i, 1);
      }
    }

    // Passive 2: Distance tracking for shield
    this.distanceMoved += distMoved;
    if (this.distanceMoved >= 50 && this.passive2CDTimer <= 0) { // Assuming 5 units = 50 pixels
      this.distanceMoved = 0;
      this.passive2CDTimer = 4;
      if (this.shields.length < 3) {
        this.shields.push({ hp: 8000, timer: 4 });
        SoundManager.playWindShield();
        this.recordSkillCast();
      }
    }

    // Update shields
    let brokenCount = 0;
    for (let i = this.shields.length - 1; i >= 0; i--) {
      this.shields[i].timer -= dtSec;
      if (this.shields[i].timer <= 0 || this.shields[i].hp <= 0) {
        this.shields.splice(i, 1);
        brokenCount++;
      }
    }
    
    if (brokenCount > 0) {
      for (let i = 0; i < brokenCount; i++) {
        SoundManager.playFireExplosion();
        this.recordSkillCast();
        for (const e of enemies) {
          if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 300) { // radius 3 units = 300 pixels
            e.takeDamage(3000, DamageType.MAGIC, this);
          }
        }
      }
    }

    // Passive 3: Skill history check
    const now = Date.now();
    this.skillHistory = this.skillHistory.filter(t => now - t <= 4000);
    if (this.skillHistory.length >= 3 && this.passive3CDTimer <= 0) {
      this.passive3CDTimer = 6;
      this.passive3ActiveTimer = 5;
      this.skillHistory = [];
      SoundManager.playHeal();
      this.addFloatingText('CƯỜNG HÓA', FloatingTextType.MAGIC_BURST);
    }

    if (this.currentDash) {
      const dir = new Vector2(this.currentDash.targetPos.x - this.pos.x, this.currentDash.targetPos.y - this.pos.y);
      const dist = dir.mag();
      const moveDist = this.currentDash.speed * dtSec;
      
      if (dist <= moveDist) {
        this.pos = new Vector2(this.currentDash.targetPos.x, this.currentDash.targetPos.y);
        this.currentDash.targetEnemy.takeDamage(this.currentDash.dmg, DamageType.TRUE, this);
        this.ultDamageDealt += this.currentDash.dmg;
        this.currentDash = null;
      } else {
        const move = dir.normalize();
        this.pos.x += move.x * moveDist;
        this.pos.y += move.y * moveDist;
      }
    }

    // Ultimate logic
    if (this.ultCDTimer <= 0 && this.hp / this.maxHp < 0.6) { // Auto trigger condition
      this.ultCDTimer = 40;
      this.ultActiveTimer = 5;
      this.ultShield = 15000;
      this.ultShieldTimer = 4;
      this.ultDamageDealt = 0;
      this.ultDamageTaken = 0;
      this.ultDashCount = 0;
      SoundManager.playJackpot();
      this.addFloatingText('TỐI THƯỢNG', FloatingTextType.MAGIC_BURST);
      this.recordSkillCast();
    }

    if (this.ultActiveTimer > 0) {
      this.addStatus({ type: StatusType.IMMUNE, duration: 0.1 }); // CC immune and invincible
      
      // Dash logic (simple implementation: dash towards nearest enemy periodically)
      let nearestEnemy: Champion | null = null;
      let minDist = Infinity;
      for (const e of enemies) {
        if (!e.isDead) {
          const d = new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag();
          if (d < minDist) {
            minDist = d;
            nearestEnemy = e;
          }
        }
      }

      this.ultDashTimer -= dtSec;
      if (nearestEnemy && minDist < 400 && this.ultDashCount < 3 && !this.currentDash) {
        if (this.ultDashTimer <= 0) {
          this.ultDashTimer = 2; // Dash every 2s
          
          // Dash through
          const dashDir = new Vector2(nearestEnemy.pos.x - this.pos.x, nearestEnemy.pos.y - this.pos.y).normalize();
          const targetPos = new Vector2(nearestEnemy.pos.x + dashDir.x * 50, nearestEnemy.pos.y + dashDir.y * 50);
          SoundManager.playWindDash();
          
          const dmg = 1000 + 0.015 * ((this.maxHp - this.hp) + (nearestEnemy.maxHp - nearestEnemy.hp));
          
          this.currentDash = {
            targetPos,
            targetEnemy: nearestEnemy,
            speed: 1500, // 1500 pixels per second
            dmg
          };
          
          this.ultDashCount++;
          this.ultShieldTimer += 1;
        }
      }
    }

    // Auto Attack
    const currentAttackSpeed = this.getAttackSpeed();
    const attacksPerSecond = (currentAttackSpeed / 0.10) * 2;
    if (attacksPerSecond > 0) {
      this.autoAttackTimer += dtSec;
      if (this.autoAttackTimer >= 1 / attacksPerSecond) {
        this.autoAttackTimer = 0;
        this.autoAttack(enemies, spawnProjectile);
      }
    }

    this.lastPos = new Vector2(this.pos.x, this.pos.y);
  }

  takeDamage(amount: number, type: DamageType, source?: Champion, isStatusDamage: boolean = false, isNormalAttack: boolean = false) {
    let finalAmount = amount;

    // Passive 1: True Damage Reduction
    if (type === DamageType.TRUE) {
      finalAmount *= (1 - (this.vuDieuStacks * 0.08));
    }

    // Passive 2: Shield DR
    if (this.shields.length > 0) {
      finalAmount *= 0.7;
    }

    // Ultimate DR
    if (this.ultActiveTimer > 0 && this.ultShield > 0) {
      finalAmount *= 0.6; // 40% DR
    }

    // Accumulate damage taken during ultimate before shields absorb it
    if (this.ultActiveTimer > 0) {
      this.ultDamageTaken += finalAmount;
    }

    // Apply to shields first
    if (this.ultShield > 0) {
      if (finalAmount <= this.ultShield) {
        this.ultShield -= finalAmount;
        finalAmount = 0;
      } else {
        finalAmount -= this.ultShield;
        this.ultShield = 0;
      }
    }

    if (this.shields.length > 0 && finalAmount > 0) {
      let remainingDmg = finalAmount;
      for (let i = this.shields.length - 1; i >= 0; i--) {
        if (remainingDmg <= this.shields[i].hp) {
          this.shields[i].hp -= remainingDmg;
          remainingDmg = 0;
          break;
        } else {
          remainingDmg -= this.shields[i].hp;
          this.shields[i].hp = 0; // Will be removed in updateLogic
        }
      }
      finalAmount = remainingDmg;
    }

    // Ultimate Invincibility
    if (this.ultActiveTimer > 0) {
      if (finalAmount > 0) {
        this.addFloatingText('VÔ ĐỊCH', FloatingTextType.TRUE);
      }
      return; // Take no actual HP damage
    }

    if (finalAmount > 0) {
      super.takeDamage(finalAmount, type, source, isStatusDamage, isNormalAttack);
    }
  }

  autoAttack(enemies: Champion[], spawnProjectile: (p: any) => void) {
    if (this.isDead) return;

    let target: Champion | null = null;
    let minDist = Infinity;
    for (const e of enemies) {
      if (!e.isDead) {
        const d = new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag();
        if (d < minDist) {
          minDist = d;
          target = e;
        }
      }
    }

    if (!target) return;

    SoundManager.playShoot();
    
    // Normal Auto Attack
    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      dir: new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize(),
      speed: 20,
      radius: 8,
      color: '#f0abfc',
      lifetime: 2,
      source: this,
      isNormalAttack: true,
      onHit: (hitEnemy: Champion) => {
        let dmg = 1000 + Math.random() * 500;
        
        if (this.ultActiveTimer > 0) {
          const trueDmg = 800 + Math.random() * 700;
          hitEnemy.takeDamage(trueDmg, DamageType.TRUE, this, false, true);
          this.ultDamageDealt += trueDmg;
        } else {
          hitEnemy.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
        }
        
        this.triggerAutoAttackEffects(hitEnemy);
      }
    });

    // Passive 3 Empowered Beams
    if (this.passive3ActiveTimer > 0) {
      for (let i = 0; i < 2; i++) {
        setTimeout(() => {
          if (this.isDead || !target || target.isDead) return;
          SoundManager.playShoot();
          spawnProjectile({
            pos: new Vector2(this.pos.x, this.pos.y),
            target: target,
            dir: new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize(),
            speed: 25,
            radius: 6,
            color: '#d946ef', // fuchsia-500
            lifetime: 2,
            source: this,
            onHit: (hitEnemy: Champion) => {
              const dmg = 1500 + 0.015 * (hitEnemy.hp + this.hp);
              hitEnemy.takeDamage(dmg, DamageType.MAGIC, this);
              this.heal(this.maxHp * 0.04);
              if (this.ultActiveTimer > 0) this.ultDamageDealt += dmg;
            }
          });
        }, i * 150 + 100);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw light trails
    for (const trail of this.lightTrails) {
      ctx.beginPath();
      ctx.arc(trail.x, trail.y, 60, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240, 171, 252, ${trail.timer / 3 * 0.5})`; // fuchsia-400
      ctx.fill();
    }

    super.draw(ctx);

    // Draw shields
    if (this.shields.length > 0 || this.ultShield > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = this.ultShield > 0 ? '#d946ef' : '#fdf4ff'; // fuchsia-500 or fuchsia-50
      ctx.lineWidth = 3 + this.shields.length;
      ctx.stroke();
    }

    // Draw Vu Dieu Stacks
    for (let i = 0; i < this.vuDieuStacks; i++) {
      const angle = (i / 5) * Math.PI * 2 + Date.now() / 500;
      const sx = this.pos.x + Math.cos(angle) * (this.radius + 20);
      const sy = this.pos.y + Math.sin(angle) * (this.radius + 20);
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f0abfc';
      ctx.fill();
    }
  }
}
