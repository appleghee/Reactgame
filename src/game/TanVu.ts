import { Champion } from './Champion';
import { DamageType, StatusType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class TanVu extends Champion {
  passive1CDTimer = 0;
  flowers: {x: number, y: number, radius: number, life: number}[] = [];
  
  isLunging = false;
  lungeTargetPos: Vector2 | null = null;
  lungeTimer = 0;
  passive2HitEnemies: Set<Champion> = new Set();
  
  isDashingToFlower = false;
  flowerTarget: {x: number, y: number} | null = null;
  
  ultCDTimer = 0;
  ultActive = false;
  ultTimer = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#ec4899', 'Tần Vũ', 72000, 7000); // Pink color
  }

  startDashToFlower() {
    if (this.flowers.length > 0) {
      let closest = this.flowers[0];
      let minDist = new Vector2(this.pos.x - closest.x, this.pos.y - closest.y).mag();
      for (let i = 1; i < this.flowers.length; i++) {
        const d = new Vector2(this.pos.x - this.flowers[i].x, this.pos.y - this.flowers[i].y).mag();
        if (d < minDist) {
          minDist = d;
          closest = this.flowers[i];
        }
      }
      this.isDashingToFlower = true;
      this.flowerTarget = { x: closest.x, y: closest.y };
    }
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void, arena?: {x: number, y: number, width: number, height: number}) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdDt = dtSec * this.getCooldownMultiplier();
    if (this.passive1CDTimer > 0) this.passive1CDTimer -= cdDt;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;

    const enemy = enemies[0];

    // Ultimate
    if (this.ultActive) {
      this.ultTimer -= dtSec;
      this.damageReduction = 0.40;
      this.addStatus({ type: StatusType.CC_IMMUNE, duration: 0.1 });
      if (this.ultTimer <= 0) {
        this.ultActive = false;
        this.damageReduction = 0;
      }
    } else {
      this.damageReduction = 0;
      if (this.ultCDTimer <= 0 && this.hp / this.maxHp < 0.7 && enemy && !enemy.isDead) {
        this.ultCDTimer = 24;
        this.ultActive = true;
        this.ultTimer = 9;
        SoundManager.playBuff();
      }
    }

    // Update flowers and check pickup
    for (let i = this.flowers.length - 1; i >= 0; i--) {
      const f = this.flowers[i];
      f.life -= dtSec;
      if (f.life <= 0) {
        this.flowers.splice(i, 1);
        continue;
      }
      
      // Check pickup
      const dist = new Vector2(this.pos.x - f.x, this.pos.y - f.y).mag();
      if (dist < this.radius + f.radius) {
        this.flowers.splice(i, 1);
        
        // Picked up a flower! Start lunge through enemy
        this.isDashingToFlower = false;
        
        if (enemy && !enemy.isDead) {
          this.isLunging = true;
          this.passive2HitEnemies.clear();
          
          let dir = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y);
          if (dir.mag() === 0) dir = new Vector2(1, 0);
          dir.normalize();
          
          // Lunge target is 80 pixels behind the enemy
          this.lungeTargetPos = new Vector2(enemy.pos.x + dir.x * 80, enemy.pos.y + dir.y * 80);
          
          if (arena) {
            this.lungeTargetPos.x = Math.max(arena.x + this.radius, Math.min(arena.x + arena.width - this.radius, this.lungeTargetPos.x));
            this.lungeTargetPos.y = Math.max(arena.y + this.radius, Math.min(arena.y + arena.height - this.radius, this.lungeTargetPos.y));
          }
          
          this.lungeTimer = 0.6; // Max duration to prevent getting stuck
          
          this.vel = dir.mult(12); // Reduced Lunge speed from 16 to 12
          
          this.passive1CDTimer = Math.max(0, this.passive1CDTimer - 0.7);
          SoundManager.playSlash();
        }
        
        SoundManager.playHeal();
      }
    }

    // State Machine: Lunging -> Dashing to Flower -> Normal
    if (this.isLunging && this.lungeTargetPos) {
      this.isGhost = true;
      this.lungeTimer -= dtSec;
      
      const distToTarget = new Vector2(this.lungeTargetPos.x - this.pos.x, this.lungeTargetPos.y - this.pos.y).mag();
      
      if (distToTarget < 15 || this.lungeTimer <= 0) {
        // Finished lunging
        this.isLunging = false;
        this.isGhost = false;
        this.startDashToFlower(); // Immediately go to next flower
      } else {
        // Keep lunging
        const dir = new Vector2(this.lungeTargetPos.x - this.pos.x, this.lungeTargetPos.y - this.pos.y).normalize();
        this.vel = dir.mult(12); // Reduced from 16 to 12
      }
    } 
    else if (this.isDashingToFlower && this.flowerTarget) {
      this.isGhost = true; // Ghost while dashing to flower to avoid getting stuck on enemy
      const dir = new Vector2(this.flowerTarget.x - this.pos.x, this.flowerTarget.y - this.pos.y);
      if (dir.mag() < 10 || this.flowers.length === 0) {
        this.isDashingToFlower = false;
        this.isGhost = false;
      } else {
        this.vel = dir.normalize().mult(6); // Reduced Speed to flower from 14 to 10
      }
    }
    else {
      this.isGhost = false;
      
      // If we have flowers but aren't doing anything, start dashing to one
      if (this.flowers.length > 0) {
        this.startDashToFlower();
      }
      
      // Passive 1
      if (this.passive1CDTimer <= 0 && enemy && !enemy.isDead) {
        this.passive1CDTimer = 1.5;
        
        let targetPos = new Vector2(enemy.pos.x, enemy.pos.y);
        if (this.ultActive) {
          targetPos.x += enemy.vel.x * 15;
          targetPos.y += enemy.vel.y * 15;
        }
        
        let dir = new Vector2(targetPos.x - this.pos.x, targetPos.y - this.pos.y);
        if (dir.mag() === 0) dir = new Vector2(1, 0);
        dir.normalize();
        
        SoundManager.playShoot();
        
        spawnProjectile({
          pos: new Vector2(this.pos.x, this.pos.y),
          target: null,
          dir: dir,
          source: this,
          speed: this.ultActive ? 14 : 10,
          radius: 12,
          color: '#f472b6',
          lifetime: 4,
          onHit: (hitEnemy: Champion) => {
            hitEnemy.takeDamage(4580, DamageType.PHYSICAL, this);
            hitEnemy.addStatus({ type: StatusType.STUN, duration: 0.25 });
            
            // Spawn 3 flowers in a triangle around the enemy
            // Make the triangle slightly wider so she has to dash a bit
            const baseAngle = Math.random() * Math.PI * 2;
            for (let i = 0; i < 3; i++) {
              const angle = baseAngle + (i * Math.PI * 2) / 3;
              const dist = 80 + Math.random() * 20; // 80-100 pixels away
              
              let fx = hitEnemy.pos.x + Math.cos(angle) * dist;
              let fy = hitEnemy.pos.y + Math.sin(angle) * dist;
              
              if (arena) {
                fx = Math.max(arena.x + 15, Math.min(arena.x + arena.width - 15, fx));
                fy = Math.max(arena.y + 15, Math.min(arena.y + arena.height - 15, fy));
              }

              this.flowers.push({
                x: fx,
                y: fy,
                radius: 15,
                life: 10
              });
            }
          }
        });
      }

      // Normal Movement
      if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
        let speedMult = this.getSpeedMultiplier();
        if (this.ultActive) speedMult *= 1.5;
        
        const targetSpeed = 4.0 * speedMult;
        
        if (this.vel.mag() > 0.01) {
          this.vel.normalize().mult(targetSpeed);
        } else if (targetSpeed > 0) {
          this.vel = new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize().mult(targetSpeed);
        }
      }
    }
  }

  onTouchEnemy(enemy: Champion) {
    super.onTouchEnemy(enemy);
    if (this.isDead || enemy.isDead) return;
    
    if (this.isLunging && !this.passive2HitEnemies.has(enemy)) {
      this.passive2HitEnemies.add(enemy);
      
      const physDmg = 2800 + Math.random() * (1900 - 2800);
      const magDmg = 1200 + Math.random() * (1300 - 2200);
      
      enemy.takeDamage(physDmg, DamageType.PHYSICAL, this, false, true);
      enemy.takeDamage(magDmg, DamageType.MAGIC, this, false, true);
      this.triggerAutoAttackEffects(enemy);
      enemy.addStatus({ type: StatusType.SLOW, duration: 1, value: 0.8 });
      
      const missingHp = this.maxHp - this.hp;
      let healAmount = 2100 + 0.042 * missingHp;
      if (this.ultActive) healAmount *= 2;
      this.heal(healAmount);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    
    // Draw flowers
    for (const f of this.flowers) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        const px = f.x + Math.cos(angle) * f.radius;
        const py = f.y + Math.sin(angle) * f.radius;
        ctx.arc(px, py, f.radius * 0.6, 0, Math.PI * 2);
      }
      ctx.fillStyle = `rgba(244, 114, 182, ${Math.min(1, f.life / 2)})`;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
    }
    
    if (this.ultActive) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    
    if (this.isLunging || this.isDashingToFlower) {
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineTo(this.pos.x - this.vel.x * 2, this.pos.y - this.vel.y * 2);
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = this.radius * 1.5;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }
    
    super.draw(ctx);
  }
}
