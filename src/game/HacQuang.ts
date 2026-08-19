import { Champion } from './Champion';
import { DamageType, StatusType, FloatingTextType } from './Types';
import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';
import { Projectile } from './Projectile';

export class HacQuang extends Champion {
  // Passive 1: Black Hole
  autoAttackCount: number = 0;

  // Passive 2: Big Bang (Void Zones)
  passive2CDTimer: number = 0;
  voidZones: { x: number, y: number, timer: number, id: number }[] = [];
  zoneIdCounter: number = 0;

  // Passive 3: Space Distortion
  passive3CDTimer: number = 0;
  passive3ActiveTimer: number = 0;
  passive3Stacks: number = 0;

  // Passive 4: Reverse Gravity
  passive4CDTimer: number = 0;

  // Passive 5: Void Absorption
  passive5CDTimer: number = 0;

  // Passive 6: Spatial Leap
  passive6CDTimer: number = 0;
  passive6EmpoweredAA: boolean = false;
  usedZonesForReset: Set<number> = new Set();

  // Ultimate: Total Eclipse
  ultCDTimer: number = 0;
  ultActiveTimer: number = 0;

  autoAttackTimer: number = 0;

  constructor(x: number, y: number, radius: number) {
    super(x, y, radius, '#0f172a', 'Hắc Quang', 90000, 16000); // slate-900
    this.baseAttackSpeed = 0.1;
  }

  updateLogic(dtSec: number, dtFrames: number, enemies: Champion[], spawnProjectile: (p: any) => void) {
    this.updateChampion(dtSec, dtFrames);
    if (this.isDead) return;

    let cdMultiplier = this.getCooldownMultiplier();
    if (this.ultActiveTimer > 0) cdMultiplier *= 0.3; // 70% CDR during Ult

    const cdDt = dtSec * cdMultiplier;
    if (this.passive2CDTimer > 0) this.passive2CDTimer -= cdDt;
    if (this.passive3CDTimer > 0) this.passive3CDTimer -= cdDt;
    if (this.passive4CDTimer > 0) this.passive4CDTimer -= cdDt;
    if (this.passive5CDTimer > 0) this.passive5CDTimer -= cdDt;
    if (this.passive6CDTimer > 0) this.passive6CDTimer -= cdDt;
    if (this.ultCDTimer > 0) this.ultCDTimer -= cdDt;

    const enemy = enemies[0];

    // Update Void Zones
    let inVoidZone = false;
    for (let i = this.voidZones.length - 1; i >= 0; i--) {
      const vz = this.voidZones[i];
      vz.timer -= dtSec;
      
      // Check if Hac Quang is in zone
      if (new Vector2(this.pos.x - vz.x, this.pos.y - vz.y).mag() <= 180) {
        inVoidZone = true;
      }

      // Damage and slow enemies in zone
      for (const e of enemies) {
        if (!e.isDead && new Vector2(e.pos.x - vz.x, e.pos.y - vz.y).mag() <= 180) {
          e.takeDamage(4500 * dtSec, DamageType.MAGIC, this);
          e.addStatus({ type: StatusType.SLOW, duration: 0.5, value: 0.6 });
        }
      }

      if (vz.timer <= 0) {
        this.voidZones.splice(i, 1);
      }
    }

    // Passive 2: Big Bang
    if (this.passive2CDTimer <= 0 && enemy && !enemy.isDead) {
      this.passive2CDTimer = 3;
      SoundManager.playShoot();
      const dir = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).normalize();
      
      spawnProjectile({
        pos: new Vector2(this.pos.x, this.pos.y),
        target: enemy,
        dir: dir,
        speed: 25,
        radius: 15,
        color: '#3b0764', // purple-950
        lifetime: 1.5,
        source: this,
        onHit: (hitEnemy: Champion) => {
          hitEnemy.takeDamage(6500, DamageType.MAGIC, this); // Nerfed from 8500
        },
        onExpire: (p: Projectile) => {
          this.voidZones.push({ x: p.pos.x, y: p.pos.y, timer: 6, id: this.zoneIdCounter++ });
          SoundManager.playFireExplosion();
        }
      });
    }

    // Passive 3: Space Distortion
    if (this.passive3ActiveTimer > 0) {
      this.passive3ActiveTimer -= dtSec;
      if (this.passive3ActiveTimer <= 0) {
        // Fire homing missiles
        if (this.passive3Stacks > 0 && enemy && !enemy.isDead) {
          SoundManager.playShoot();
          for (let i = 0; i < this.passive3Stacks; i++) {
            setTimeout(() => {
              if (this.isDead || !enemy || enemy.isDead) return;
              const angle = Math.random() * Math.PI * 2;
              const offset = new Vector2(Math.cos(angle) * 30, Math.sin(angle) * 30);
              spawnProjectile({
                pos: new Vector2(this.pos.x + offset.x, this.pos.y + offset.y),
                target: enemy,
                dir: new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).normalize(),
                speed: 20,
                radius: 6,
                color: '#c026d3', // fuchsia-600
                lifetime: 3,
                source: this,
                updateCallback: (p: Projectile, dt: number) => {
                  if (p.target && !p.target.isDead) {
                    const desiredDir = new Vector2(p.target.pos.x - p.pos.x, p.target.pos.y - p.pos.y).normalize();
                    p.dir = new Vector2(
                      p.dir.x + (desiredDir.x - p.dir.x) * 5 * dt,
                      p.dir.y + (desiredDir.y - p.dir.y) * 5 * dt
                    ).normalize();
                  }
                },
                onHit: (hitEnemy: Champion) => {
                  hitEnemy.takeDamage(5000, DamageType.PHYSICAL, this);
                  hitEnemy.takeDamage(5000, DamageType.MAGIC, this);
                }
              });
            }, i * 100);
          }
        }
        this.passive3Stacks = 0;
      }
    } else if (this.passive3CDTimer <= 0 && enemy && !enemy.isDead) {
      this.passive3CDTimer = 5;
      this.passive3ActiveTimer = 3;
      this.passive3Stacks = 0;
      SoundManager.playWindShield();
    }

    // Passive 4: Reverse Gravity
    if (this.passive4CDTimer <= 0 && enemy && !enemy.isDead && new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag() <= 300) {
      this.passive4CDTimer = 6;
      SoundManager.playWindUlt();
      for (const e of enemies) {
        if (!e.isDead && new Vector2(e.pos.x - this.pos.x, e.pos.y - this.pos.y).mag() <= 300) {
          e.addStatus({ type: StatusType.SUPPRESS, duration: 1.5 });
          e.takeDamage(8000, DamageType.PHYSICAL, this); // Nerfed from 12000
          
          // Check if enemy is in any void zone
          let inVZ = false;
          for (const vz of this.voidZones) {
            if (new Vector2(e.pos.x - vz.x, e.pos.y - vz.y).mag() <= 180) {
              inVZ = true;
              break;
            }
          }
          if (inVZ) {
            e.addStatus({ type: StatusType.STUN, duration: 2.5 });
            e.takeDamage(8000, DamageType.TRUE, this);
          }
        }
      }
    }

    // Passive 5: Void Absorption (Active part)
    if (this.passive5CDTimer <= 0 && this.hp / this.maxHp < 0.7 && this.voidZones.length > 0) {
      this.passive5CDTimer = 8;
      let zonesConsumed = 0;
      for (let i = this.voidZones.length - 1; i >= 0; i--) {
        const vz = this.voidZones[i];
        if (new Vector2(this.pos.x - vz.x, this.pos.y - vz.y).mag() <= 400) {
          zonesConsumed++;
          this.voidZones.splice(i, 1);
        }
      }
      
      if (zonesConsumed > 0) {
        SoundManager.playHeal();
        this.heal(this.maxHp * 0.15 * zonesConsumed);
        this.addStatus({ type: StatusType.IMMUNE, duration: 1.5 }); // 1.5s invulnerability
      }
    }

    // Passive 6: Spatial Leap
    if (this.passive6CDTimer <= 0 && enemy && !enemy.isDead) {
      const distToEnemy = new Vector2(enemy.pos.x - this.pos.x, enemy.pos.y - this.pos.y).mag();
      if (distToEnemy > 100 && distToEnemy < 600) {
        this.passive6CDTimer = 4;
        
        // Find best position (behind enemy)
        let targetPos = new Vector2(enemy.pos.x, enemy.pos.y);
        
        // Teleport
        this.pos = targetPos;
        SoundManager.playWindDash();
        
        // Check if landed in void zone for reset
        let reset = false;
        for (const vz of this.voidZones) {
          if (new Vector2(this.pos.x - vz.x, this.pos.y - vz.y).mag() <= 180) {
            if (!this.usedZonesForReset.has(vz.id)) {
              this.usedZonesForReset.add(vz.id);
              reset = true;
              break;
            }
          }
        }
        
        if (reset) {
          this.passive6CDTimer = 0;
          this.addFloatingText('RESET', FloatingTextType.MAGIC);
        }
        
        this.passive6EmpoweredAA = true;
      }
    }

    // Ultimate: Total Eclipse
    if (this.ultActiveTimer > 0) {
      this.ultActiveTimer -= dtSec;
      this.addStatus({ type: StatusType.CC_IMMUNE, duration: 0.1 });
      
      // Pull enemies slightly
      for (const e of enemies) {
        if (!e.isDead) {
          const pullDir = new Vector2(this.pos.x - e.pos.x, this.pos.y - e.pos.y).normalize();
          e.pos = e.pos.add(pullDir.mult(30 * dtSec));
        }
      }

      if (this.ultActiveTimer <= 0) {
        SoundManager.playFireExplosion();
        for (const e of enemies) {
          if (!e.isDead) {
            const missingHp = e.maxHp - e.hp;
            const dmg = 18000 + 0.20 * missingHp; // Nerfed from 25000 + 0.25
            e.takeDamage(dmg, DamageType.TRUE, this);
          }
        }
      }
    } else if (this.ultCDTimer <= 0 && enemy && !enemy.isDead && this.hp / this.maxHp < 0.8) {
      this.ultCDTimer = 20;
      this.ultActiveTimer = 10;
      SoundManager.playJackpot();
      this.addFloatingText('NHẬT THỰC', FloatingTextType.MAGIC_BURST);
    }

    // Auto Attack
    const currentAttackSpeed = this.getAttackSpeed();
    const attacksPerSecond = (currentAttackSpeed / 0.10) * 2;
    if (attacksPerSecond > 0 && enemy && !enemy.isDead) {
      this.autoAttackTimer += dtSec;
      if (this.autoAttackTimer >= 1 / attacksPerSecond || this.passive6EmpoweredAA) {
        this.autoAttackTimer = 0;
        this.fireAutoAttack(enemy, spawnProjectile);
      }
    }
  }

  takeDamage(amount: number, type: DamageType, source?: Champion, isStatusDamage: boolean = false, isNormalAttack: boolean = false) {
    if (this.passive3ActiveTimer > 0 && source && !isStatusDamage) {
      // Evade attacks
      if (this.passive3Stacks < 10) {
        this.passive3Stacks++;
      }
      this.addFloatingText('DODGE', FloatingTextType.TRUE);
      return;
    }

    let finalAmount = amount;
    if (this.ultActiveTimer > 0) {
      finalAmount *= 0.3; // 70% DR
    }

    super.takeDamage(finalAmount, type, source, isStatusDamage, isNormalAttack);
  }

  getAttackSpeed(): number {
    // Fixed attack speed, not affected by items
    return this.baseAttackSpeed;
  }

  getSpeedMultiplier(): number {
    let mult = super.getSpeedMultiplier();
    
    // Check if in void zone
    let inVoidZone = false;
    for (const vz of this.voidZones) {
      if (new Vector2(this.pos.x - vz.x, this.pos.y - vz.y).mag() <= 180) {
        inVoidZone = true;
        break;
      }
    }
    
    if (inVoidZone) mult += 0.50;
    if (this.ultActiveTimer > 0) mult += 0.30;
    
    return mult;
  }

  fireAutoAttack(target: Champion, spawnProjectile: (p: any) => void) {
    SoundManager.playShoot();
    
    if (this.passive6EmpoweredAA) {
      this.passive6EmpoweredAA = false;
      // Teleport to target
      this.pos = new Vector2(target.pos.x, target.pos.y);
      SoundManager.playSlash();
      target.takeDamage(7000, DamageType.PHYSICAL, this, false, true); // Nerfed from 10000
      target.takeDamage(7000, DamageType.MAGIC, this, false, true);
      this.triggerAutoAttackEffects(target);
      return;
    }

    let dir = new Vector2(target.pos.x - this.pos.x, target.pos.y - this.pos.y).normalize();

    spawnProjectile({
      pos: new Vector2(this.pos.x, this.pos.y),
      target: target,
      dir: dir,
      speed: 18,
      radius: 5,
      color: '#0ea5e9', // sky-500
      lifetime: 2,
      source: this,
      isNormalAttack: true,
      onHit: (hitEnemy: Champion) => {
        let dmg = 1500 + Math.random() * 1000;
        hitEnemy.takeDamage(dmg, DamageType.PHYSICAL, this, false, true);
        this.triggerAutoAttackEffects(hitEnemy);
        
        this.autoAttackCount++;
        if (this.autoAttackCount >= 2) {
          this.autoAttackCount = 0;
          // Black Hole pulse
          SoundManager.playWindShield();
          const trueDmg = hitEnemy.maxHp * 0.08;
          hitEnemy.takeDamage(trueDmg, DamageType.TRUE, this);
          const pullDir = new Vector2(this.pos.x - hitEnemy.pos.x, this.pos.y - hitEnemy.pos.y).normalize();
          hitEnemy.vel = hitEnemy.vel.add(pullDir.mult(400));
        }
      }
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.isDead) return;

    // Draw Void Zones
    for (const vz of this.voidZones) {
      ctx.beginPath();
      ctx.arc(vz.x, vz.y, 180, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(59, 7, 100, ${0.2 + Math.sin(vz.timer * 5) * 0.1})`; // purple-950 pulsing
      ctx.fill();
      ctx.strokeStyle = '#9333ea'; // purple-600
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Ult Eclipse
    if (this.ultActiveTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, 300, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#c026d3'; // fuchsia-600
      ctx.lineWidth = 3;
      ctx.setLineDash([15, 10]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Passive 3 Dodge Shield
    if (this.passive3ActiveTimer > 0) {
      ctx.beginPath();
      ctx.arc(this.pos.x, this.pos.y, this.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    super.draw(ctx);

    // Draw Singularity (Passive 1)
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.strokeStyle = '#a855f7'; // purple-500
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
