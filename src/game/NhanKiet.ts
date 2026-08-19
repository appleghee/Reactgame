import { Champion } from './Champion';
import { DamageType, StatusType, ItemId } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class NhanKiet extends Champion {
  passive1CDTimer = 0;
  passive1Active = false;
  passive1Timer = 0;
  passive1TickTimer = 0;
  passive1ShurikensFired = 0;

  shurikenHitCount = 0;

  ultCDTimer = 0;
  ultActive = false;
  ultTimer = 0;
  ultTickTimer = 0;

  passive4CDTimer = 0;
  passive4Uses = 0;

  autoAttackTimer = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#10b981', 'Nhân Kiệt', 65000, 13000); // Emerald color
    this.baseAttackSpeed = 0.2; // Mặc định tốc đánh 20%
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdDt = dtSec * this.getCooldownMultiplier();
    if (this.passive1CDTimer > 0) this.passive1CDTimer -= cdDt;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;
    if (this.passive4CDTimer > 0) this.passive4CDTimer -= cdDt;

    // Passive 4
    if (this.hp < 5500 && this.passive4Uses < 2 && this.passive4CDTimer <= 0) {
      this.passive4Uses++;
      this.passive4CDTimer = 50; // Tăng hồi chiêu từ 40s lên 50s
      this.addStatus({ type: StatusType.UNDYING, duration: 2.0 });
      this.heal(this.maxHp * 0.05); // Giảm hồi máu từ 10% xuống 5%
      this.addArmor(this.getMaxArmor() * 0.2); // Giảm hồi giáp từ 30% xuống 20%
      this.passive1CDTimer = 0;
      this.ultCDTimer = 0;
    }

    // Auto Attack
    const currentAttackSpeed = this.getAttackSpeed();
    const shurikensPerSecond = (currentAttackSpeed / 0.10) * 2;
    if (shurikensPerSecond > 0 && enemies[0] && !enemies[0].isDead) {
      this.autoAttackTimer += dtSec;
      if (this.autoAttackTimer >= 1 / shurikensPerSecond) {
        this.autoAttackTimer -= 1 / shurikensPerSecond;
        this.fireAutoAttack(enemies[0], spawnProjectile);
      }
    }

    // Ultimate
    if (this.ultActive) {
      this.damageReduction = 0.25; // Giảm miễn thương từ 40% xuống 25%
      this.ultTimer -= dtSec;
      this.ultTickTimer += dtSec;

      if (this.ultTickTimer >= 0.2) { // Bắn chậm lại (0.2s thay vì 0.1s)
        this.ultTickTimer -= 0.2;
        
        const enemy = enemies[0];
        if (enemy && !enemy.isDead) {
          const dist = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag();
          if (dist <= 250) { // Giảm bán kính từ 300 xuống 250
            SoundManager.playShoot();
            // 100% trúng nếu trong phạm vi
            const baseDamage = 600 + Math.random() * 300; // Buff sát thương chiêu cuối
            enemy.takeDamage(baseDamage, DamageType.PHYSICAL, this);
            this.handleShurikenHit(enemy);
            
            // Spawn visual projectile that hits instantly
            spawnProjectile({
              pos: new Vector2(this.pos.x, this.pos.y),
              target: enemy,
              source: this,
              speed: 40, // Rất nhanh
              radius: 8,
              color: '#34d399',
              lifetime: 0.5,
              onHit: () => {} // Damage already dealt
            });
          }
        }
      }

      if (this.ultTimer <= 0) {
        this.ultActive = false;
        this.damageReduction = 0;
      }
    } else {
      this.damageReduction = 0;
      if (this.ultCDTimer <= 0 && enemies[0] && !enemies[0].isDead) {
        this.ultCDTimer = 21;
        this.ultActive = true;
        this.ultTimer = 5;
        this.ultTickTimer = 0;
      }
    }

    // Passive 1
    if (this.passive1Active) {
      this.passive1Timer -= dtSec;
      this.passive1TickTimer += dtSec;
      
      // 10 shurikens over 2s -> 1 every 2/10 = 0.2s
      if (this.passive1TickTimer >= 2 / 10 && this.passive1ShurikensFired < 10) {
        this.passive1TickTimer -= (2 / 10);
        this.passive1ShurikensFired++;
        SoundManager.playShoot();
        
        if (enemies[0] && !enemies[0].isDead) {
          // Bắn thẳng vào kẻ địch (Homing)
          this.fireShuriken(null, spawnProjectile, enemies[0]);
        }
      }

      if (this.passive1Timer <= 0 || this.passive1ShurikensFired >= 10) {
        this.passive1Active = false;
      }
    } else if (this.passive1CDTimer <= 0 && !this.ultActive && enemies[0] && !enemies[0].isDead) {
      this.passive1CDTimer = 12; // Tăng hồi chiêu từ 8s lên 12s
      this.passive1Active = true;
      this.passive1Timer = 2;
      this.passive1TickTimer = 0;
      this.passive1ShurikensFired = 0;
    }

    // Normal Movement
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
      const speedMult = this.getSpeedMultiplier();
      const targetSpeed = 4.0 * speedMult;
      
      if (this.vel.mag() > 0.01) {
        this.vel.normalize().mult(targetSpeed);
      } else if (targetSpeed > 0) {
        this.vel = new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize().mult(targetSpeed);
      }
    }
  }

  fireAutoAttack(target: Champion, spawnProjectile: (p: any) => void) {
    const baseDamage = 800 + Math.random() * (1100 - 800); // Buff sát thương đánh thường
    SoundManager.playShoot();

    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      source: this,
      speed: 15,
      radius: 8,
      color: '#a7f3d0',
      lifetime: 2,
      isNormalAttack: true,
      onHit: (enemy: Champion) => {
        enemy.takeDamage(baseDamage, DamageType.PHYSICAL, this, false, true);
        this.handleShurikenHit(enemy);
        this.triggerAutoAttackEffects(enemy);
      }
    });
  }

  fireShuriken(dir: Vector2 | null, spawnProjectile: (p: any) => void, target: Champion) {
    const baseDamage = 800 + Math.random() * (1200 - 800); // Buff sát thương chiêu 1
    
    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: dir ? null : target, // Directional or Homing
      dir: dir,
      source: this,
      speed: 15, // Tăng tốc độ bay
      radius: 12,
      color: '#34d399',
      lifetime: 3,
      onHit: (enemy: Champion) => {
        enemy.takeDamage(baseDamage, DamageType.PHYSICAL, this);
        this.handleShurikenHit(enemy);
      }
    });
  }

  handleShurikenHit(enemy: Champion) {
    this.shurikenHitCount++;
    if (this.shurikenHitCount >= 5) { // Tăng số đòn đánh yêu cầu từ 3 lên 5
      this.shurikenHitCount = 0;
      const trueDamage = 2000 + Math.random() * 1500 + 0.02 * enemy.maxHp; // Giảm sát thương chuẩn
      enemy.takeDamage(trueDamage, DamageType.TRUE, this);
      enemy.addStatus({ type: StatusType.SLOW, duration: 1.5, value: 0.25 }); // Giảm làm chậm
      this.heal(trueDamage * 0.15); // Giảm hút máu từ 30% xuống 15%
    }
  }

  onTouchEnemy(enemy: Champion) {
    if (this.isDead || enemy.isDead) return;
    this.handleShurikenHit(enemy);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    if (this.ultActive) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, 250, 0, Math.PI * 2); // Giảm bán kính hiển thị
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    super.draw(ctx);
  }
}
