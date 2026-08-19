import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class NguyetQuangLo extends Champion {
  p1Cooldown = 0;
  p2Cooldown = 0;
  ultCooldown = 0;
  ultActiveTimer = 0;

  marks: Map<Champion, number> = new Map();
  crystalQueue: { target: Champion, delay: number }[] = [];
  lightPaths: { pos: Vector2, timer: number, hitEnemies: Set<Champion> }[] = [];
  
  isDashing = false;
  dashTarget: Vector2 | null = null;
  dashSpeed = 800;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#fef08a', 'Nguyệt Quang Lộ', 72000, 8000); // yellow-200
    this.baseAttackSpeed = 0.05;
  }

  getSpeedMultiplier(): number {
    if (this.ultActiveTimer > 0) return 0.6; // 40% slow during ult
    return super.getSpeedMultiplier();
  }

  getDamageReduction(type: DamageType): number {
    let dr = super.getDamageReduction(type);
    if (this.ultActiveTimer > 0) dr += 0.15;
    return Math.min(1, dr);
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    // Clean up dead enemies from marks
    for (const [enemy, _] of this.marks) {
      if (enemy.isDead) this.marks.delete(enemy);
    }

    // Timers
    const cdrMult = this.getCooldownMultiplier();
    this.p1Cooldown -= dtSec * cdrMult;
    this.p2Cooldown -= dtSec * cdrMult;
    this.ultCooldown -= dtSec * cdrMult;
    if (this.ultActiveTimer > 0) this.ultActiveTimer -= dtSec;

    // Movement AI
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
      if (this.isDashing && this.dashTarget) {
        const dir = new Vector2(this.dashTarget.x - this.pos.x, this.dashTarget.y - this.pos.y);
        const dist = dir.mag();
        const moveDist = this.dashSpeed * dtSec;
        if (dist <= moveDist) {
          this.pos.x = this.dashTarget.x;
          this.pos.y = this.dashTarget.y;
          this.isDashing = false;
          this.dashTarget = null;
        } else {
          dir.normalize().mult(moveDist);
          this.pos.add(dir);
        }
      } else {
        // Normal movement - chase nearest enemy if too far
        let nearest = this.getNearestEnemy(enemies);
        const targetSpeed = 5.0 * this.getSpeedMultiplier();
        
        if (nearest && new Vector2(nearest.pos.x - this.pos.x, nearest.pos.y - this.pos.y).mag() > 500) {
          const dir = new Vector2(nearest.pos.x - this.pos.x, nearest.pos.y - this.pos.y).normalize();
          this.vel.x = dir.x * targetSpeed;
          this.vel.y = dir.y * targetSpeed;
        } else {
          if (this.vel.mag() < targetSpeed * 0.5) {
            this.vel = new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize().mult(targetSpeed);
          } else {
            this.vel.normalize().mult(targetSpeed);
          }
        }
      }
    }

    // Process Crystal Queue
    for (let i = this.crystalQueue.length - 1; i >= 0; i--) {
      const item = this.crystalQueue[i];
      item.delay -= dtSec;
      if (item.delay <= 0) {
        if (!item.target.isDead) {
          this.fireCrystal(item.target, spawnProjectile);
        }
        this.crystalQueue.splice(i, 1);
      }
    }

    // Process Light Paths
    for (let i = this.lightPaths.length - 1; i >= 0; i--) {
      const path = this.lightPaths[i];
      path.timer -= dtSec;
      if (path.timer <= 0) {
        this.lightPaths.splice(i, 1);
        continue;
      }
      
      for (const e of enemies) {
        if (!e.isDead && !e.hasStatus(StatusType.UNTARGETABLE) && !path.hitEnemies.has(e)) {
          if (new Vector2(e.pos.x - path.pos.x, e.pos.y - path.pos.y).mag() <= 45 + e.radius) {
            path.hitEnemies.add(e);
            e.takeDamage(2500 + Math.random() * 1500, DamageType.MAGIC, this);
            e.addStatus({ type: StatusType.SLOW, duration: 0.5, value: 0.5 });
          }
        }
      }
    }

    // Ultimate Logic
    if (this.ultCooldown <= 0 && this.hp / this.maxHp < 0.6) {
      this.ultCooldown = 24;
      this.ultActiveTimer = 8;
      this.addFloatingText('LÃNH ĐỊA ÁNH SÁNG', FloatingTextType.HEAL);
      SoundManager.playWindUlt();
    }

    // Skill 1 Logic
    if (this.p1Cooldown <= 0) {
      const target = this.getNearestEnemy(enemies);
      if (target && new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).mag() <= 1000) {
        // Apply CDR from Ult: 70% CDR means cooldown is 30% of original
        this.p1Cooldown = this.ultActiveTimer > 0 ? 2.8 * 0.3 : 2.8;
        this.fireLightArrow(target, spawnProjectile);
      }
    }

    // Skill 2 Logic
    if (this.p2Cooldown <= 0 && !this.isDashing) {
      let markedEnemy: Champion | null = null;
      for (const e of enemies) {
        if (!e.isDead && (this.marks.get(e) || 0) > 0 && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 800) {
          markedEnemy = e;
          break;
        }
      }

      if (markedEnemy) {
        // Apply CDR from Ult: 50% CDR means cooldown is 50% of original
        this.p2Cooldown = this.ultActiveTimer > 0 ? 4.0 * 0.5 : 4.0;
        this.executeDashAndFire(markedEnemy, enemies);
      }
    }
  }

  getNearestEnemy(enemies: Champion[]): Champion | null {
    let nearest: Champion | null = null;
    let minDist = Infinity;
    for (const e of enemies) {
      if (!e.isDead) {
        const d = new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag();
        if (d < minDist) {
          minDist = d;
          nearest = e;
        }
      }
    }
    return nearest;
  }

  fireLightArrow(target: Champion, spawnProjectile: (p: any) => void) {
    const dir = new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize();
    let lastPos = new Vector2(this.pos.x, this.pos.y);
    const hitEnemies = new Set<Champion>();

    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      dir: dir,
      source: this,
      speed: 20, // 1200 pixels per second -> 20 pixels per frame
      radius: 30,
      color: '#fef08a',
      lifetime: 1.2,
      piercing: true,
      updateCallback: (p: any, dt: number) => {
        const distMoved = new Vector2(p.pos.x - lastPos.x, p.pos.y - lastPos.y).mag();
        if (distMoved >= 40) {
          this.lightPaths.push({
            pos: new Vector2(p.pos.x, p.pos.y),
            timer: 1.5,
            hitEnemies: new Set() // Each path node can hit independently
          });
          lastPos = new Vector2(p.pos.x, p.pos.y);
        }
      },
      onHit: (hitEnemy: Champion) => {
        if (!hitEnemies.has(hitEnemy)) {
          hitEnemies.add(hitEnemy);
          const dmg = 4500 + Math.random() * 1500 + 0.03 * this.maxHp;
          hitEnemy.takeDamage(dmg, DamageType.MAGIC, this);
          this.marks.set(hitEnemy, (this.marks.get(hitEnemy) || 0) + 1);
        }
      }
    });
    SoundManager.playWindArrow();
  }

  executeDashAndFire(target: Champion, enemies: Champion[]) {
    const angle = Math.random() * Math.PI * 2;
    const dashDist = 5;
    this.dashTarget = new Vector2(this.pos.x + Math.cos(angle) * dashDist, this.pos.y + Math.sin(angle) * dashDist);
    this.isDashing = true;
    
    this.addStatus({ type: StatusType.UNTARGETABLE, duration: dashDist / this.dashSpeed });
    SoundManager.playWindDash();

    // Queue crystals for all marked enemies in range
    for (const e of enemies) {
      if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 800) {
        const marks = this.marks.get(e) || 0;
        if (marks > 0) {
          const numCrystals = Math.min(16, Math.max(4, marks * 3));
          this.marks.set(e, 0); // Consume marks
          
          for (let i = 0; i < numCrystals; i++) {
            this.crystalQueue.push({
              target: e,
              delay: i * 0.1
            });
          }
        }
      }
    }
  }

  fireCrystal(target: Champion, spawnProjectile: (p: any) => void) {
    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      source: this,
      speed: 8, // 500 pixels per second -> 8 pixels per frame
      radius: 12,
      color: '#fde047',
      lifetime: 5,
      onHit: (hitEnemy: Champion) => {
        const dmg = 150 + 0.04 * (hitEnemy.maxHp + this.maxHp) - 0.04 * (hitEnemy.hp + this.hp);
        hitEnemy.takeDamage(Math.max(0, dmg), DamageType.MAGIC, this);
        
        if (this.ultActiveTimer > 0) {
          const healAmount = 600 + 0.08 * (this.hp + hitEnemy.hp);
          this.heal(healAmount);
        }
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Draw ultimate domain
    if (this.ultActiveTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, 400, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(253, 224, 71, 0.15)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(253, 224, 71, 0.9)';
      ctx.font = 'bold 14px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.fillText('LÃNH ĐỊA ÁNH SÁNG', this.pos.x, this.pos.y - this.radius - 45);
    }

    // Draw light paths
    for (const path of this.lightPaths) {
      ctx.beginPath();
      ctx.arc(path.pos.x, path.pos.y, 45, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(254, 240, 138, ${path.timer / 1.5 * 0.4})`;
      ctx.fill();
    }

    // Draw marks on enemies
    for (const [enemy, count] of this.marks) {
      if (!enemy.isDead && count > 0) {
        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 8;
        ctx.fillText('✦'.repeat(Math.min(5, count)), enemy.pos.x, enemy.pos.y - enemy.radius - 25);
        ctx.shadowBlur = 0;
      }
    }

    super.draw(ctx);
  }
}

