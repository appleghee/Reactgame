import { Champion } from './Champion';
import { DamageType, StatusType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class HaoPhong extends Champion {
  passive1CDTimer = 0;
  passive1Active = false;
  passive1Timer = 0;
  passive1TickTimer = 0;
  passive1Target: Champion | null = null;
  
  passive2CDTimer = 0;
  passive2Active = false;
  passive2Timer = 0;
  passive2Angle = 0;

  passive4CDTimer = 0;
  passive4Active = false;
  passive4Timer = 0;
  passive4TickTimer = 0;
  pentagons: {x: number, y: number, r: number}[] = [];
  activeStrikes: {x: number, y: number, timer: number}[] = [];

  ultCDTimer = 0;
  ultActive = false;
  ultTimer = 0;
  ultFlyTimer = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#3b82f6', 'Hạo Phong', 80000, 10000);
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdDt = dtSec * this.getCooldownMultiplier();
    if (this.passive1CDTimer > 0) this.passive1CDTimer -= cdDt;
    if (this.passive2CDTimer > 0) this.passive2CDTimer -= cdDt;
    if (this.passive4CDTimer > 0) this.passive4CDTimer -= cdDt;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;

    // Passive 4 Logic
    if (this.passive4Active) {
      this.passive4Timer -= dtSec;
      this.passive4TickTimer += dtSec;
      
      // 12 strikes per pentagon over 3 seconds = 1 strike every 3/12 = 0.25s
      if (this.passive4TickTimer >= 0.25) {
        this.passive4TickTimer -= 0.25;
        
        SoundManager.playLightning();
        
        for (const pentagon of this.pentagons) {
          // Random point inside pentagon (approximate with circle)
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * pentagon.r;
          const sx = pentagon.x + Math.cos(angle) * r;
          const sy = pentagon.y + Math.sin(angle) * r;
          
          this.activeStrikes.push({ x: sx, y: sy, timer: 0.2 });
          
          // Check collision with enemies
          for (const e of enemies) {
            if (e.isDead) continue;
            const dist = new Vector2(e.pos.x - sx, e.pos.y - sy).mag();
            if (dist < e.radius + 40) { // Giảm bán kính sét đánh
              const damage = 1500 + 0.01 * (e.maxHp - e.hp); // Giảm sát thương phép
              e.takeDamage(damage, DamageType.MAGIC, this);
              this.heal(0.01 * (e.maxHp - e.hp)); // Giảm hồi máu từ 5% xuống 1%
            }
          }
        }
      }
      
      if (this.passive4Timer <= 0) {
        this.passive4Active = false;
        this.statuses = this.statuses.filter(s => s.type !== StatusType.IMMUNE);
      }
    } else if (this.passive4CDTimer <= 0) {
      this.passive4Active = true;
      this.passive4Timer = 3;
      this.passive4CDTimer = 15;
      this.passive4TickTimer = 0;
      this.addStatus({ type: StatusType.IMMUNE, duration: 3 });
      
      // Initialize 3 pentagons
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.pentagons = [
        { x: w * 0.25, y: h * 0.5, r: 100 },
        { x: w * 0.5, y: h * 0.5, r: 100 },
        { x: w * 0.75, y: h * 0.5, r: 100 }
      ];
    }
    
    // Update active strikes
    for (let i = this.activeStrikes.length - 1; i >= 0; i--) {
      this.activeStrikes[i].timer -= dtSec;
      if (this.activeStrikes[i].timer <= 0) {
        this.activeStrikes.splice(i, 1);
      }
    }

    const enemy = enemies[0];

    // Ultimate
    if (this.ultActive) {
      this.ultTimer -= dtSec;
      if (this.ultFlyTimer > 0) {
        this.ultFlyTimer -= dtSec;
        if (this.ultFlyTimer <= 0) {
          // Landed
          this.statuses = this.statuses.filter(s => s.type !== StatusType.IMMUNE);
          this.passive1CDTimer *= 0.5; // Giảm nhiều hồi chiêu hơn
          this.passive2CDTimer *= 0.5;
          this.addArmor(4000); // Giảm giáp cộng thêm
          this.heal(this.maxHp * 0.25); // Giảm hồi máu
          this.damageReduction = 0.15; // Giảm miễn thương
        }
      }
      if (this.ultTimer <= 0) {
        this.ultActive = false;
        this.damageReduction = 0;
      }
    } else {
      if (this.ultCDTimer <= 0 && this.hp / this.maxHp < 0.5) { // Kích hoạt sớm hơn (50% thay vì 40%)
        this.ultCDTimer = 30;
        this.ultActive = true;
        this.ultTimer = 8;
        this.ultFlyTimer = 1.5;
        this.addStatus({ type: StatusType.IMMUNE, duration: 1.5 });
        SoundManager.playFly();
      }
    }

    // Passive 1
    if (this.passive1Active) {
      this.passive1Timer -= dtSec;
      if (this.passive1Timer <= 0 || !this.passive1Target || this.passive1Target.isDead) {
        this.passive1Active = false;
        this.passive1Target = null;
      } else {
        const dir = new Vector2(this.passive1Target.pos.x - this.pos.x, this.passive1Target.pos.y - this.pos.y);
        const dist = dir.mag();
        // Đẩy Lý Tín ra xa thay vì kéo lại gần để tránh bị chạm
        if (dist < 300) { // Giảm tầm đẩy
          dir.normalize().mult(3.5 * dtFrames); // Lực đẩy yếu hơn
          this.vel.sub(dir); // Hạo Phong lùi lại
          this.passive1Target.vel.add(dir); // Kẻ địch bị đẩy ra
        }

        this.passive1TickTimer += dtSec;
        if (this.passive1TickTimer >= 0.33) {
          this.passive1TickTimer -= 0.33;
          const burnDmg = 2500 + 0.02 * this.maxHp; // Giảm sát thương đốt
          this.passive1Target.takeDamage(burnDmg, DamageType.PHYSICAL, this);
          
          SoundManager.playShoot();
          
          spawnProjectile({
            pos: new Vector2(this.pos.x, this.pos.y),
            target: this.passive1Target,
            source: this,
            speed: 10, // Đạn bay nhanh hơn
            isNormalAttack: true,
            onHit: (hitEnemy: Champion) => {
              const dmg = 2000 + 0.02 * (hitEnemy.maxHp - hitEnemy.hp);
              hitEnemy.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
              this.triggerAutoAttackEffects(hitEnemy);
            }
          });
        }
      }
    } else if (this.passive1CDTimer <= 0 && enemy && !enemy.isDead) {
      const dist = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag();
      if (dist < 300) { // Tăng tầm kích hoạt
        this.passive1Active = true;
        this.passive1Timer = 3;
        this.passive1CDTimer = 12;
        this.passive1Target = enemy;
        this.passive1TickTimer = 0;
      }
    }

    // Passive 2
    if (this.passive2Active) {
      this.passive2Timer -= dtSec;
      if (this.passive2Timer <= 0) {
        this.passive2Active = false;
      }
    } else if (this.passive2CDTimer <= 0 && enemy && !enemy.isDead) {
      const dist = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag();
      if (dist < 250) { // Tăng tầm vung quạt
        this.passive2Active = true;
        this.passive2Timer = 0.5; // Animation duration
        this.passive2CDTimer = 8;
        this.passive2Angle = Math.atan2(enemy.pos.y - this.pos.y, enemy.pos.x - this.pos.x);
        
        SoundManager.playSlash();
        
        // Apply AoE damage and stun
        for (const e of enemies) {
          if (e.isDead) continue;
          const eDist = new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag();
          if (eDist < 250) { // Tầm đánh AoE
            const eAngle = Math.atan2(e.pos.y - this.pos.y, e.pos.x - this.pos.x);
            let angleDiff = eAngle - this.passive2Angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            if (Math.abs(angleDiff) < Math.PI / 2.5) { // Góc quét rộng hơn một chút
              e.takeDamage(6000, DamageType.PHYSICAL, this); // Giảm sát thương
              e.addStatus({ type: StatusType.SLOW, duration: 1.5, value: 0.3 }); // Làm chậm
              e.addStatus({ type: StatusType.STUN, duration: 0.5 }); // Choáng
              e.breakArmor(1500); // Phá giáp
            }
          }
        }
      }
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

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;
    
    if (this.ultFlyTimer > 0 || this.passive4Active) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fill();
    }

    if (this.passive1Active && this.passive1Target && !this.passive1Target.isDead) {
      ctx.beginPath();
      ctx.moveTo(this.pos.x, this.pos.y);
      ctx.lineTo(this.passive1Target.pos.x, this.passive1Target.pos.y);
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    if (this.passive2Active) {
      ctx.save();
      ctx.translate(this.pos.x, this.pos.y);
      ctx.rotate(this.passive2Angle);
      
      // Draw cone area
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 250, -Math.PI / 2.5, Math.PI / 2.5);
      ctx.closePath();
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fill();
      
      // Draw slashing blade animation
      const progress = 1 - (this.passive2Timer / 0.5);
      const currentAngle = -Math.PI / 2.5 + progress * (2 * Math.PI / 2.5);
      
      // The blade line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(currentAngle) * 250, Math.sin(currentAngle) * 250);
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // The blade trail arc
      ctx.beginPath();
      ctx.arc(0, 0, 230, -Math.PI / 2.5, currentAngle);
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.8)';
      ctx.lineWidth = 12;
      ctx.stroke();

      ctx.restore();
    }

    // Draw Passive 4 Pentagons and Strikes
    if (this.passive4Active) {
      for (const p of this.pentagons) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const px = p.x + Math.cos(angle) * p.r;
          const py = p.y + Math.sin(angle) * p.r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.5)'; // Yellow
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = 'rgba(250, 204, 21, 0.1)';
        ctx.fill();
      }
    }
    
    for (const strike of this.activeStrikes) {
      ctx.beginPath();
      ctx.arc(strike.x, strike.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(250, 204, 21, ${strike.timer / 0.2})`;
      ctx.fill();
      
      // Draw lightning bolt
      ctx.beginPath();
      ctx.moveTo(strike.x, strike.y - 40);
      ctx.lineTo(strike.x - 10, strike.y);
      ctx.lineTo(strike.x + 5, strike.y);
      ctx.lineTo(strike.x - 5, strike.y + 30);
      ctx.strokeStyle = `rgba(255, 255, 255, ${strike.timer / 0.2})`;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    
    super.draw(ctx);
  }
}
