import { Champion } from './Champion';
import { DamageType, StatusType } from './Types';
import { Vector2 } from './Vector2';

export class Projectile {
  pos: Vector2;
  target: Champion | null;
  dir: Vector2 | null;
  source: Champion;
  speed: number;
  damageBase: number;
  damageMissingHpPct: number;
  active: boolean = true;
  isDead: boolean = false;
  isPlayer: boolean = false;
  radius: number;
  color: string;
  onHit?: (enemy: Champion, p: Projectile) => void;
  updateCallback?: (p: Projectile, dtSec: number) => void;
  drawCallback?: (ctx: CanvasRenderingContext2D, p: Projectile) => void;
  lifetime: number;
  piercing: boolean;
  hitEnemies: Set<Champion> = new Set();
  isNormalAttack: boolean;

  constructor(data: any) {
    this.pos = data.pos;
    this.target = data.target || null;
    this.dir = data.dir || null;
    this.source = data.source;
    this.isPlayer = data.source?.isPlayer || false;
    this.speed = data.speed;
    this.damageBase = data.damageBase || 0;
    this.damageMissingHpPct = data.damageMissingHpPct || 0;
    this.radius = data.radius || 5;
    this.color = data.color || '#93c5fd';
    this.onHit = data.onHit;
    this.updateCallback = data.updateCallback;
    this.drawCallback = data.drawCallback;
    this.lifetime = data.lifetime || 5;
    this.piercing = data.piercing || false;
    this.isNormalAttack = data.isNormalAttack || false;
  }

  update(dtSec: number, dtFrames: number, enemies: Champion[]) {
    if (!this.active || this.isDead) {
      this.active = false;
      this.isDead = true;
      return;
    }
    
    this.lifetime -= dtSec;
    if (this.lifetime <= 0) {
      this.active = false;
      this.isDead = true;
      return;
    }

    if (this.updateCallback) {
      this.updateCallback(this, dtSec);
    }

    // Boundary check
    const margin = 200;
    if (this.pos.x < -margin || this.pos.x > window.innerWidth + margin ||
        this.pos.y < -margin || this.pos.y > window.innerHeight + margin) {
      this.active = false;
      this.isDead = true;
      return;
    }

    if (this.target) {
      if (this.target.isDead || this.target.hasStatus(StatusType.UNTARGETABLE)) {
        this.active = false;
        return;
      }
      const dir = new Vector2(this.target.pos.x - this.pos.x, this.target.pos.y - this.pos.y);
      const dist = dir.mag();

      if (dist < this.target.radius + this.radius) {
        if (!this.hitEnemies.has(this.target)) {
          this.hit(this.target);
        }
      } else {
        dir.normalize().mult(this.speed * dtFrames);
        this.pos.add(dir);
      }
    } else if (this.dir) {
      const move = new Vector2(this.dir.x, this.dir.y).normalize().mult(this.speed * dtFrames);
      this.pos.add(move);

      for (const enemy of enemies) {
        if (enemy.isDead || enemy.hasStatus(StatusType.UNTARGETABLE)) continue;
        const dist = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag();
        if (dist < enemy.radius + this.radius) {
          if (!this.hitEnemies.has(enemy)) {
            this.hit(enemy);
            if (!this.piercing) break;
          }
        }
      }
    }
  }

  hit(enemy: Champion) {
    this.hitEnemies.add(enemy);
    if (this.onHit) {
      this.onHit(enemy, this);
    } else {
      const dmg = this.damageBase + this.damageMissingHpPct * (enemy.maxHp - enemy.hp);
      enemy.takeDamage(dmg, DamageType.PHYSICAL, this.source, false, this.isNormalAttack);
    }
    if (!this.piercing) {
      this.active = false;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return;
    
    if (this.drawCallback) {
      this.drawCallback(ctx, this);
      return;
    }

    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}
