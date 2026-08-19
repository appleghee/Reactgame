import { Vector2 } from './Vector2';

export interface Particle {
  pos: Vector2;
  vel: Vector2;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export class ParticleSystem {
  particles: Particle[] = [];

  emit(x: number, y: number, color: string, count: number, speed: number = 2, size: number = 3, life: number = 0.5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const vel = new Vector2(Math.cos(angle), Math.sin(angle)).mult(Math.random() * speed);
      this.particles.push({
        pos: new Vector2(x, y),
        vel: vel,
        color: color,
        size: Math.random() * size + 1,
        life: life,
        maxLife: life,
        alpha: 1
      });
    }
  }

  emitTrail(x: number, y: number, color: string, size: number = 2) {
    this.particles.push({
      pos: new Vector2(x, y),
      vel: new Vector2(0, 0),
      color: color,
      size: size,
      life: 0.3,
      maxLife: 0.3,
      alpha: 0.5
    });
  }

  update(dtSec: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dtSec;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      } else {
        p.pos.x += p.vel.x * dtSec * 60;
        p.pos.y += p.vel.y * dtSec * 60;
        p.alpha = p.life / p.maxLife;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
