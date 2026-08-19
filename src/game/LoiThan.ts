import { Champion } from './Champion';
import { DamageType, StatusType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';
import { Projectile } from './Projectile';

export class LoiThan extends Champion {
  passive1CDTimer = 0;
  
  passive2TickTimer = 0;

  ultCDTimer = 0;
  ultActive = false;
  ultTimer = 0;
  ultTickTimer = 0;
  ultStrikes: {x: number, y: number, timer: number}[] = [];

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#eab308', 'Lôi Thần', 100000, 15000); // yellow-500
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdDt = dtSec * this.getCooldownMultiplier();
    if (this.passive1CDTimer > 0) this.passive1CDTimer -= cdDt;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;

    const enemy = enemies[0];

    // Passive 1: Lightning Bolt
    if (this.passive1CDTimer <= 0 && enemy && !enemy.isDead) {
      this.passive1CDTimer = 3;
      SoundManager.playShoot();
      
      const dir = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).normalize();
      
      spawnProjectile({
        pos: new Vector2(this.pos.x, this.pos.y),
        target: enemy,
        dir: dir,
        speed: 25, // Very fast
        radius: 6,
        color: '#fef08a', // yellow-200
        lifetime: 2,
        source: this,
        isNormalAttack: true,
        onHit: (hitEnemy: Champion) => {
          hitEnemy.takeDamage(3500, DamageType.PHYSICAL, this, false, true);
          hitEnemy.takeDamage(3500, DamageType.MAGIC, this, false, true);
          this.triggerAutoAttackEffects(hitEnemy);
          hitEnemy.addStatus({ type: StatusType.STUN, duration: 0.5 });
        }
      });
    }

    // Passive 2: Static Field
    this.passive2TickTimer -= dtSec;
    if (this.passive2TickTimer <= 0) {
      this.passive2TickTimer = 0.5;
      for (const e of enemies) {
        if (!e.isDead) {
          const dist = new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag();
          if (dist <= 250 + e.radius) {
            e.takeDamage(1500, DamageType.MAGIC, this);
            e.addStatus({ type: StatusType.WEAKEN, duration: 0.6, value: 0.2 }); // Reduce armor/damage
            
            // Slight pull
            const pullDir = new Vector2(this.pos.x - e.pos.x, this.pos.y - e.pos.y).normalize();
            e.pos.x += pullDir.x * 2;
            e.pos.y += pullDir.y * 2;
          }
        }
      }
    }

    // Ultimate: Thunderstorm
    if (this.ultActive) {
      this.ultTimer -= dtSec;
      this.ultTickTimer -= dtSec;
      
      if (this.ultTickTimer <= 0) {
        this.ultTickTimer = 0.3; // Strike every 0.3s
        SoundManager.playShoot();
        
        // Strike 2 random enemies (or same if only 1)
        for (let i = 0; i < 2; i++) {
          const validEnemies = enemies.filter(e => !e.isDead);
          if (validEnemies.length > 0) {
            const target = validEnemies[Math.floor(Math.random() * validEnemies.length)];
            
            this.ultStrikes.push({
              x: target.pos.x,
              y: target.pos.y,
              timer: 0.2 // Visual duration
            });
            
            target.takeDamage(4000, DamageType.PHYSICAL, this);
            target.takeDamage(4000, DamageType.MAGIC, this);
            target.takeDamage(1000, DamageType.TRUE, this);
          }
        }
      }
      
      if (this.ultTimer <= 0) {
        this.ultActive = false;
      }
    } else if (this.ultCDTimer <= 0 && enemy && !enemy.isDead) {
      this.ultCDTimer = 25;
      this.ultActive = true;
      this.ultTimer = 6;
      this.ultTickTimer = 0;
      SoundManager.playBuff();
    }

    // Update strikes visual
    for (let i = this.ultStrikes.length - 1; i >= 0; i--) {
      this.ultStrikes[i].timer -= dtSec;
      if (this.ultStrikes[i].timer <= 0) {
        this.ultStrikes.splice(i, 1);
      }
    }

    // Normal Movement
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
      let speedMult = this.getSpeedMultiplier();
      const targetSpeed = 3.8 * speedMult;
      
      if (this.vel.mag() > 0.01) {
        this.vel.normalize().mult(targetSpeed);
      } else if (targetSpeed > 0) {
        this.vel = new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize().mult(targetSpeed);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    
    // Draw Static Field
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 250, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(234, 179, 8, 0.1)'; // yellow-500 with opacity
    ctx.fill();
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw Ultimate Strikes
    for (const strike of this.ultStrikes) {
      ctx.beginPath();
      ctx.moveTo(strike.x, strike.y - 500); // Lightning from above
      ctx.lineTo(strike.x + (Math.random() * 20 - 10), strike.y - 250);
      ctx.lineTo(strike.x, strike.y);
      ctx.strokeStyle = '#fef08a'; // yellow-200
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Strike impact
      ctx.beginPath();
      ctx.arc(strike.x, strike.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.5)';
      ctx.fill();
    }
    
    super.draw(ctx);
  }
}
