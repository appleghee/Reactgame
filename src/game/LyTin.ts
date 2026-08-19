import { Champion } from './Champion';
import { DamageType, StatusType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class LyTin extends Champion {
  passive1CDTimer = 0;
  passive2CDTimer = 0;
  ultCDTimer = 0;
  
  passive4CDTimer = 0;
  crystals = 0;
  crystalAngle = 0;
  
  marks = 0;
  
  ultActive = false;
  ultTimer = 0;
  jackpotRolling = false;
  jackpotRollTimer = 0;
  jackpotTimer = 0;
  jackpotSlots = [0, 0, 0];
  jackpotResultType = 0; // 0: none, 1: 777, 2: 3 of a kind, 3: 2 of a kind, 4: nothing
  jackpotBuffTimer = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius + 5, '#ef4444', 'Lý Tín', 100000, 12000); // Tăng kích thước thêm 5 để dễ chạm hơn
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[]) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdDt = dtSec * this.getCooldownMultiplier();
    if (this.passive1CDTimer > 0) this.passive1CDTimer -= cdDt;
    if (this.passive2CDTimer > 0) this.passive2CDTimer -= cdDt;
    if (this.passive4CDTimer > 0) this.passive4CDTimer -= cdDt;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;

    // Passive 4 Logic
    if (this.passive4CDTimer <= 0 && this.armor >= 4000) {
      const maxCrystalsToCreate = Math.floor((50000 - this.crystals * 4000) / 4000);
      if (maxCrystalsToCreate > 0) {
        let armorToConsume = Math.min(this.armor, maxCrystalsToCreate * 4000);
        let crystalsToCreate = Math.floor(armorToConsume / 4000);
        if (crystalsToCreate > 0) {
          this.armor -= crystalsToCreate * 4000;
          this.crystals += crystalsToCreate;
          this.passive4CDTimer = 5;
          SoundManager.playCrystal();
        }
      }
    }
    this.crystalAngle += dtSec * 1.5; // Rotate crystals

    if (this.ultActive) {
      this.ultTimer -= dtSec;
      if (this.ultTimer <= 0) {
        this.ultActive = false;
        this.jackpotResultType = 0;
      }

      if (this.jackpotRolling) {
        this.jackpotRollTimer -= dtSec;
        this.jackpotTimer += dtSec;
        
        // Spin effect
        if (this.jackpotTimer >= 0.1) {
          this.jackpotTimer = 0;
          this.jackpotSlots = [
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10),
            Math.floor(Math.random() * 10)
          ];
        }

        // Lock in result
        if (this.jackpotRollTimer <= 0) {
          this.jackpotRolling = false;
          const roll = Math.random();
          
          if (roll < 0.10) {
            // 10%: Đại Thưởng (7 7 7)
            this.jackpotSlots = [7, 7, 7];
            this.jackpotResultType = 1;
            this.heal(this.maxHp * 0.7);
            this.addArmor(this.maxHp * 1.5);
            this.addStatus({ type: StatusType.CC_IMMUNE, duration: 10 });
            this.crystals += 5;
            SoundManager.playJackpot();
          } else if (roll < 0.30) {
            // 20%: Trúng Lớn (3 of a kind)
            const num = Math.floor(Math.random() * 9); // 0-8 (not 7 if possible, but fine)
            this.jackpotSlots = [num, num, num];
            this.jackpotResultType = 2;
            this.heal(this.maxHp * 0.3);
            this.addArmor(this.maxHp * 0.8);
            this.crystals += 3;
            SoundManager.playBuff();
          } else if (roll < 0.70) {
            // 40%: Trúng Nhỏ (2 of a kind)
            const num1 = Math.floor(Math.random() * 10);
            let num2 = Math.floor(Math.random() * 10);
            while (num2 === num1) num2 = Math.floor(Math.random() * 10);
            this.jackpotSlots = [num1, num1, num2];
            this.jackpotResultType = 3;
            this.heal(this.maxHp * 0.1);
            this.addArmor(this.maxHp * 0.3);
            this.crystals += 1;
          } else {
            // 30%: Phá Sản (Nothing)
            this.jackpotSlots = [1, 2, 3];
            this.jackpotResultType = 4;
            this.takeDamage(this.hp * 0.3, DamageType.TRUE, this); // Mất 30% máu hiện tại
            this.addArmor(this.maxHp * 0.5); // Bù lại chút giáp để không chết sốc
          }
        }
      }
    } else {
      // Auto cast ult when ready and HP is below 50%
      if (this.ultCDTimer <= 0 && this.hp / this.maxHp < 0.5) {
        this.ultCDTimer = 25;
        this.ultActive = true;
        this.ultTimer = 12;
        this.jackpotRolling = true;
        this.jackpotRollTimer = 2.0;
        this.jackpotResultType = 0;
      }
    }

    // Random Bouncing Movement
    if (!this.hasStatus(StatusType.STUN) && !this.hasStatus(StatusType.SUPPRESS)) {
      const speedMult = this.getSpeedMultiplier();
      // Tốc độ cơ bản cao hơn (5.0) và tăng dần theo số tinh thể huyết
      const targetSpeed = (5.0 + this.crystals * 0.25) * speedMult;
      
      if (this.vel.mag() > 0.01) {
        this.vel.normalize().mult(targetSpeed);
      } else if (targetSpeed > 0) {
        this.vel = new Vector2(Math.random() - 0.5, Math.random() - 0.5).normalize().mult(targetSpeed);
      }
    }
  }

  onTouchEnemy(enemy: Champion) {
    if (this.isDead || enemy.isDead) return;

    this.triggerAutoAttackEffects(enemy);

    // Passive 1
    if (this.passive1CDTimer <= 0) {
      this.marks++;
      if (this.marks >= 2) { // Giảm số lần chạm cần thiết từ 3 xuống 2
        this.marks = 0;
        this.passive1CDTimer = 2.0; // Giảm hồi chiêu từ 2.5 xuống 2.0
        const damage = 10000 + (this.crystals * 500) + (0.10 + this.crystals * 0.02) * (enemy.maxHp - enemy.hp); // Buff sát thương
        enemy.takeDamage(damage, DamageType.PHYSICAL, this, false, true);
        this.heal((this.maxHp - this.hp) * (0.65 + this.crystals * 0.015));
      }
    }

    // Passive 2
    if (this.passive2CDTimer <= 0) {
      this.passive2CDTimer = 0.3;
      const burnDamage = 3000 + (this.crystals * 200) + 0.03 * enemy.maxHp; // Buff sát thương đốt
      
      // Prevent infinite stacking when standing still
      const existingBurn = enemy.statuses.find(s => s.type === StatusType.BURN && s.source === this);
      if (existingBurn) {
        existingBurn.duration = 2;
        existingBurn.value = burnDamage;
      } else {
        enemy.addStatus({
          type: StatusType.BURN,
          duration: 2,
          value: burnDamage,
          source: this
        });
      }
      
      const existingSlow = enemy.statuses.find(s => s.type === StatusType.SLOW && s.value === 0.4);
      if (existingSlow) {
        existingSlow.duration = 2.5;
      } else {
        enemy.addStatus({
          type: StatusType.SLOW,
          duration: 2.5,
          value: 0.4 // Làm chậm mạnh hơn (40%)
        });
      }
    }
  }

  takeDamage(amount: number, type: DamageType, source?: Champion, isStatusDamage: boolean = false, isNormalAttack: boolean = false) {
    let finalAmount = amount;
    if (source) {
      finalAmount *= 0.5; // Hidden passive: reduce touch damage by 50%
    }
    super.takeDamage(finalAmount, type, source, isStatusDamage, isNormalAttack);
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    if (this.ultActive) {
      let color = '#fbbf24'; // default yellow
      let text = `[${this.jackpotSlots.join('|')}]`;
      
      if (!this.jackpotRolling) {
        if (this.jackpotResultType === 1) {
          color = '#f59e0b'; // amber
          text = 'JACKPOT! 777';
        } else if (this.jackpotResultType === 2) {
          color = '#34d399'; // emerald
          text = 'TRÚNG LỚN!';
        } else if (this.jackpotResultType === 3) {
          color = '#60a5fa'; // blue
          text = 'TRÚNG NHỎ';
        } else if (this.jackpotResultType === 4) {
          color = '#ef4444'; // red
          text = 'PHÁ SẢN';
        }
      }

      ctx.fillStyle = color;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, this.pos.x, this.pos.y - this.radius - 30);
    }

    // Draw Blood Crystals
    if (this.crystals > 0) {
      const orbitRadius = this.radius + 20;
      for (let i = 0; i < this.crystals; i++) {
        const angle = this.crystalAngle + (i * Math.PI * 2) / this.crystals;
        const cx = this.pos.x + Math.cos(angle) * orbitRadius;
        const cy = this.pos.y + Math.sin(angle) * orbitRadius;
        
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#dc2626'; // Blood red
        ctx.fill();
        ctx.strokeStyle = '#fca5a5';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    
    super.draw(ctx);
  }
}
