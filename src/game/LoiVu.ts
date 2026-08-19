import { Champion } from './Champion';
import { DamageType, StatusType } from './Types';
import { Vector2 } from './Vector2';

export class LoiVu extends Champion {
  loiAnStacks: number = 0;

  passive1CDTimer: number = 0;
  
  passive2Timer: number = 0;
  orbs: any[] = []; // { angle, radius, timer, state: 'orbit' | 'fly', pos: Vector2, target: Champion }

  passive3CDTimer: number = 0;
  isDashing: boolean = false;
  dashTimer: number = 0;
  dashTarget: Vector2 | null = null;

  ultState: number = 0; // 0: ready, 1: marked, 2: charging bird, 3: firing
  ultTimer: number = 0;
  ultTarget: Champion | null = null;
  ultBirdPos: Vector2 | null = null;
  ultTimerCD: number = 0;

  constructor(x: number, y: number, isPlayer: boolean) {
    super(x, y, 25, '#8b5cf6', 'Lôi Vũ', 48000, 9000);
    this.isPlayer = isPlayer;
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    const cdDt = dtSec * this.getCooldownMultiplier();
    const enemy = enemies[0];

    // Passive 1
    if (this.passive1CDTimer > 0) this.passive1CDTimer -= cdDt;
    if (this.passive1CDTimer <= 0 && enemy && !enemy.isDead) {
      this.passive1CDTimer = 1.0;
      
      const numBolts = Math.floor(Math.random() * 4) + 1; // 1 to 4
      for (let i = 0; i < numBolts; i++) {
        const angle = Math.atan2(enemy.pos.y - this.pos.y, enemy.pos.x - this.pos.x) + (Math.random() - 0.5) * 0.5;
        const dmg = 3279 + Math.random() * (4749 - 3279);
        spawnProjectile({
          pos: new Vector2(this.pos.x, this.pos.y),
          dir: new Vector2(Math.cos(angle), Math.sin(angle)),
          speed: 600,
          radius: 6,
          color: '#a855f7',
          damageBase: dmg,
          lifetime: 1.5,
          source: this,
          onHit: (target: Champion) => {
            target.takeDamage(dmg, DamageType.MAGIC, this);
          }
        });
      }
      this.loiAnStacks++;
    }

    // Passive 2
    let p2Interval = Math.max(0.3, 1.0 - this.loiAnStacks * 0.1);
    this.passive2Timer -= dtSec;
    if (this.passive2Timer <= 0) {
      this.passive2Timer = p2Interval;
      if (this.loiAnStacks > 0 && enemy && !enemy.isDead) {
        this.loiAnStacks--;
        this.orbs.push({
          angle: Math.random() * Math.PI * 2,
          radius: 40,
          timer: 0.5,
          state: 'orbit',
          pos: new Vector2(this.pos.x, this.pos.y),
          target: enemy
        });
      }
    }

    // Update Orbs
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      let orb = this.orbs[i];
      if (orb.state === 'orbit') {
        orb.timer -= dtSec;
        orb.angle += Math.PI * 4 * dtSec; // Rotate fast
        orb.pos.x = this.pos.x + Math.cos(orb.angle) * orb.radius;
        orb.pos.y = this.pos.y + Math.sin(orb.angle) * orb.radius;
        if (orb.timer <= 0) {
          orb.state = 'fly';
          orb.timer = 0.5;
        }
      } else if (orb.state === 'fly') {
        orb.timer -= dtSec;
        if (!orb.target.isDead) {
          const dir = new Vector2(orb.target.pos.x - orb.pos.x, orb.target.pos.y - orb.pos.y).normalize();
          const speed = 800; // Fast homing
          orb.pos.add(dir.mult(speed * dtSec));
          
          // Check collision
          if (new Vector2(orb.pos.x - orb.target.pos.x, orb.pos.y - orb.target.pos.y).mag() < this.radius + orb.target.radius) {
            const dmg = (1748 + Math.random() * (2478 - 1748)) + 0.04 * this.maxHp;
            orb.target.takeDamage(dmg, DamageType.MAGIC, this);
            this.orbs.splice(i, 1);
            continue;
          }
        }
        if (orb.timer <= 0) {
          this.orbs.splice(i, 1);
        }
      }
    }

    // Passive 3
    if (this.passive3CDTimer > 0) this.passive3CDTimer -= cdDt;
    if (this.isDashing) {
      this.dashTimer -= dtSec;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else if (this.passive3CDTimer <= 0 && enemy && !enemy.isDead) {
      this.passive3CDTimer = 3.0;
      this.isDashing = true;
      this.dashTimer = 0.2;
      const dir = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).normalize();
      this.vel = dir.mult(600); // Dash speed
      
      // Consume up to 3 stacks
      const consumed = Math.min(3, this.loiAnStacks);
      this.loiAnStacks -= consumed;
      for (let i = 0; i < consumed; i++) {
        this.heal(500 + 0.045 * this.hp);
      }
    }

    // Ultimate
    if (this.ultTimer > 0) {
      if (this.ultState === 0) {
        this.ultTimer -= cdDt;
      } else {
        this.ultTimer -= dtSec;
      }
    }

    if (this.ultState === 0 && this.ultTimer <= 0 && enemy && !enemy.isDead) {
      // Start Ult
      this.ultState = 1;
      this.ultTimer = 1.5;
      this.ultTarget = enemy;
      
      // Set CD based on loiAnStacks
      if (this.loiAnStacks > 0) {
        this.ultTimerCD = 7.5;
      } else {
        this.ultTimerCD = 15.0;
      }
    }

    if (this.ultState === 1 && this.ultTimer <= 0) {
      this.ultState = 2;
      this.ultTimer = 1.5;
      this.ultBirdPos = new Vector2(this.pos.x, this.pos.y - 100); // Bird appears above
    }

    if (this.ultState === 2 && this.ultTimer <= 0) {
      this.ultState = 3;
      // Fire bird
      if (this.ultTarget && !this.ultTarget.isDead && this.ultBirdPos) {
        const dmg = (3748 + Math.random() * (4784 - 3748)) + 0.16 * this.ultTarget.hp;
        
        spawnProjectile({
          pos: new Vector2(this.ultBirdPos.x, this.ultBirdPos.y),
          speed: 1000,
          radius: 20,
          color: '#d946ef', // Fuchsia
          target: this.ultTarget,
          lifetime: 2,
          source: this,
          onHit: (target: Champion) => {
            target.takeDamage(dmg, DamageType.MAGIC, this);
            target.takeDamage(dmg, DamageType.TRUE, this);
          }
        });
      }
      this.ultState = 0;
      this.ultTimer = this.ultTimerCD; // Start CD
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx);

    // Draw Loi An Stacks
    if (this.loiAnStacks > 0) {
      ctx.fillStyle = '#a855f7';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`⚡${this.loiAnStacks}`, this.pos.x, this.pos.y - this.radius - 10);
    }

    // Draw Orbs
    for (const orb of this.orbs) {
      ctx.beginPath();
      ctx.arc(orb.pos.x, orb.pos.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#c084fc';
      ctx.fill();
      ctx.closePath();
    }

    // Draw Ult states
    if (this.ultState === 1 && this.ultTarget && !this.ultTarget.isDead) {
      // Mark on enemy
      ctx.fillStyle = '#d946ef';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', this.ultTarget.pos.x, this.ultTarget.pos.y - this.ultTarget.radius - 20);
    } else if (this.ultState === 2 && this.ultBirdPos) {
      // Charging bird
      ctx.beginPath();
      ctx.arc(this.ultBirdPos.x, this.ultBirdPos.y, 15 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fillStyle = '#d946ef';
      ctx.fill();
      ctx.closePath();
    }
  }
}
