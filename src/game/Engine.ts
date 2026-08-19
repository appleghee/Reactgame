import { Vector2 } from './Vector2';
import { VanCa } from './VanCa';
import { LyTin } from './LyTin';
import { HaoPhong } from './HaoPhong';
import { NhanKiet } from './NhanKiet';
import { TanVu } from './TanVu';
import { LucQuang } from './LucQuang';
import { LoiThan } from './LoiThan';
import { TuMaY } from './TuMaY';
import { PhongKich } from './PhongKich';
import { HacQuang } from './HacQuang';
import { VuDieuTinhQuang } from './VuDieuTinhQuang';
import { NguyetQuangLo } from './NguyetQuangLo';
import { HuyetMa } from './HuyetMa';
import { TuTu } from './TuTu';
import { LyCuu } from './LyCuu';
import { NganNgoc } from './NganNgoc';
import { VoCat } from './VoCat';
import { BachTieuNga } from './BachTieuNga';
import { Projectile } from './Projectile';
import { Champion } from './Champion';
import { StatusType, DamageType } from './Types';
import { SoundManager } from './SoundManager';
import { ParticleSystem } from './ParticleSystem';
import { FloatingTextSystem } from './FloatingTextSystem';

export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  champions: Champion[] = [];
  projectiles: Projectile[] = [];
  particles: ParticleSystem;
  floatingTexts: FloatingTextSystem;
  gravity: Vector2;
  animationFrameId: number = 0;
  lastTime: number = 0;
  arena = { x: 0, y: 0, width: 0, height: 0 };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.gravity = new Vector2(0, 0); // No gravity for infinite bouncing in all directions
    this.particles = new ParticleSystem();
    this.floatingTexts = new FloatingTextSystem();
  }

  init(champ1Name: string, champ2Name: string, p1Items: string[] = [], p2Items: string[] = []) {
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    
    const radius = 24;
    
    const createChamp = (name: string, x: number, y: number, isPlayer: boolean) => {
      let champ: Champion;
      switch (name) {
        case 'LyTin': champ = new LyTin(x, y, radius); break;
        case 'HaoPhong': champ = new HaoPhong(x, y, radius); break;
        case 'NhanKiet': champ = new NhanKiet(x, y, radius); break;
        case 'TanVu': champ = new TanVu(x, y, radius); break;
        case 'LucQuang': champ = new LucQuang(x, y, radius); break;
        case 'LoiThan': champ = new LoiThan(x, y, radius); break;
        case 'TuMaY': champ = new TuMaY(x, y, radius); break;
        case 'PhongKich': champ = new PhongKich(x, y, radius); break;
        case 'HacQuang': champ = new HacQuang(x, y, radius); break;
        case 'VuDieuTinhQuang': champ = new VuDieuTinhQuang(x, y, radius); break;
        case 'NguyetQuangLo': champ = new NguyetQuangLo(x, y, radius); break;
        case 'HuyetMa': champ = new HuyetMa(x, y, radius); break;
        case 'TuTu': champ = new TuTu(x, y, radius); break;
        case 'LyCuu': champ = new LyCuu(x, y, radius); break;
        case 'NganNgoc': champ = new NganNgoc(x, y, radius); break;
        case 'VoCat': champ = new VoCat(x, y, radius); break;
        case 'BachTieuNga': champ = new BachTieuNga(x, y, radius); break;
        case 'VanCa': champ = new VanCa(x, y, radius); break;
        default: champ = new LyTin(x, y, radius); break;
      }
      champ.isPlayer = isPlayer;
      return champ;
    };

    const c1 = createChamp(champ1Name, this.arena.x + this.arena.width / 3, this.arena.y + this.arena.height / 2, true);
    c1.vel = new Vector2(5, 5);
    c1.items = p1Items as any[];
    c1.armor = c1.getMaxArmor();
    
    const c2 = createChamp(champ2Name, this.arena.x + (this.arena.width / 3) * 2, this.arena.y + this.arena.height / 2, false);
    c2.vel = new Vector2(-5, -5);
    c2.items = p2Items as any[];
    c2.armor = c2.getMaxArmor();

    this.champions.push(c1, c2);

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
      
      // Define arena boundaries (map limit)
      const marginX = 20;
      const marginY = 100;
      this.arena = {
        x: marginX,
        y: marginY,
        width: this.canvas.width - marginX * 2,
        height: this.canvas.height - marginY * 2
      };
    }
  }

  loop(currentTime: number) {
    let dtSec = (currentTime - this.lastTime) / 1000;
    if (dtSec < 0) dtSec = 0;
    if (dtSec > 0.1) dtSec = 0.1; // Cap at 100ms to prevent huge jumps when tab is inactive
    
    const dtFrames = dtSec * 60;
    this.lastTime = currentTime;

    this.update(dtSec, dtFrames);
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
  }

  update(dtSec: number, dtFrames: number) {
    // Ambient particles
    if (Math.random() < 0.2) {
      const x = this.arena.x + Math.random() * this.arena.width;
      const y = this.arena.y + Math.random() * this.arena.height;
      this.particles.emit(x, y, 'rgba(255, 255, 255, 0.2)', 1, 0.5, 2, 2.0);
    }

    for (const champ of this.champions) {
      if (champ.isDead) {
        if (!(champ as any).deathEffectPlayed) {
          (champ as any).deathEffectPlayed = true;
          this.particles.emit(champ.pos.x, champ.pos.y, champ.color, 50, 5, 4, 1.5);
          this.particles.emit(champ.pos.x, champ.pos.y, '#ffffff', 20, 8, 2, 1.0);
          SoundManager.playDeath();
        }
        continue;
      }

      // Trail effect
      if (champ.vel.mag() > 1 && Math.random() > 0.5) {
        this.particles.emitTrail(champ.pos.x, champ.pos.y, champ.color, champ.radius * 0.8);
      }

      if (champ instanceof LyTin) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ));
      } else if (champ instanceof HaoPhong) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof NhanKiet) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof TanVu) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)), this.arena);
      } else if (champ instanceof LucQuang) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof LoiThan) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof TuMaY) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof PhongKich) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof HacQuang) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof VuDieuTinhQuang) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof NguyetQuangLo) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof HuyetMa) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), this);
      } else if (champ instanceof TuTu) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof LyCuu) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof NganNgoc) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof VoCat) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof BachTieuNga) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      } else if (champ instanceof VanCa) {
        champ.updateLogic(dtSec, dtFrames, this.champions.filter(c => c !== champ), (p) => this.projectiles.push(new Projectile(p)));
      }
      
      champ.update(dtFrames);
      champ.checkEdges(this.arena);
    }
    
    for (let i = 0; i < this.champions.length; i++) {
      for (let j = i + 1; j < this.champions.length; j++) {
        const c1 = this.champions[i];
        const c2 = this.champions[j];
        
        if (c1.isDead || c2.isDead) continue;
        if (c1.hasStatus(StatusType.IMMUNE) || c2.hasStatus(StatusType.IMMUNE) || c1.hasStatus(StatusType.UNTARGETABLE) || c2.hasStatus(StatusType.UNTARGETABLE)) continue;
        
        let dx = c2.pos.x - c1.pos.x;
        let dy = c2.pos.y - c1.pos.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = c1.radius + c2.radius;
        
        if (dist < minDist) {
          if (dist === 0) {
            dist = 0.1;
            dx = 0.1;
            dy = 0;
          }
          
          if (!c2.isGhost) {
            c1.onTouchEnemy(c2);
          }
          if (!c1.isGhost) {
            c2.onTouchEnemy(c1);
          }

          if (!c1.isGhost && !c2.isGhost) {
            SoundManager.playHit();

            const overlap = minDist - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            
            c1.pos.x -= nx * overlap * 0.5;
            c1.pos.y -= ny * overlap * 0.5;
            c2.pos.x += nx * overlap * 0.5;
            c2.pos.y += ny * overlap * 0.5;
            
            const kx = (c1.vel.x - c2.vel.x);
            const ky = (c1.vel.y - c2.vel.y);
            
            const p = 2.0 * (nx * kx + ny * ky) / (c1.mass + c2.mass);
            
            c1.vel.x -= p * c2.mass * nx;
            c1.vel.y -= p * c2.mass * ny;
            c2.vel.x += p * c1.mass * nx;
            c2.vel.y += p * c1.mass * ny;
          }
        }
      }
    }

    for (const proj of this.projectiles) {
      const enemies = this.champions.filter(c => c !== proj.source);
      proj.update(dtSec, dtFrames, enemies);
      
      // Projectile trail
      if (Math.random() > 0.3) {
        this.particles.emitTrail(proj.pos.x, proj.pos.y, proj.color, proj.radius * 0.8);
      }
    }
    this.projectiles = this.projectiles.filter(p => p.active);

    this.particles.update(dtSec);
    this.floatingTexts.update(dtSec);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw Dark Fantasy Arena Background
    const bgGradient = this.ctx.createRadialGradient(
      this.arena.x + this.arena.width / 2, this.arena.y + this.arena.height / 2, 0,
      this.arena.x + this.arena.width / 2, this.arena.y + this.arena.height / 2, this.arena.width
    );
    bgGradient.addColorStop(0, '#1e1b4b'); // indigo-950
    bgGradient.addColorStop(1, '#020617'); // slate-950
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(this.arena.x, this.arena.y, this.arena.width, this.arena.height);

    // Draw Arena Grid Texture (Subtle)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;
    const gridSize = 60;
    this.ctx.beginPath();
    for (let x = this.arena.x; x <= this.arena.x + this.arena.width; x += gridSize) {
      this.ctx.moveTo(x, this.arena.y);
      this.ctx.lineTo(x, this.arena.y + this.arena.height);
    }
    for (let y = this.arena.y; y <= this.arena.y + this.arena.height; y += gridSize) {
      this.ctx.moveTo(this.arena.x, y);
      this.ctx.lineTo(this.arena.x + this.arena.width, y);
    }
    this.ctx.stroke();

    // Draw Ambient Particles behind everything else
    this.particles.draw(this.ctx);

    // Draw Arena Border (Glowing)
    this.ctx.strokeStyle = '#4f46e5'; // indigo-600
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = '#4f46e5';
    this.ctx.shadowBlur = 15;
    this.ctx.strokeRect(this.arena.x, this.arena.y, this.arena.width, this.arena.height);
    this.ctx.shadowBlur = 0; // reset
    
    for (const proj of this.projectiles) {
      proj.draw(this.ctx);
    }
    
    for (const champ of this.champions) {
      champ.draw(this.ctx);
    }

    this.floatingTexts.draw(this.ctx);
  }

  destroy() {
    window.removeEventListener('resize', this.resize.bind(this));
    cancelAnimationFrame(this.animationFrameId);
  }
}
