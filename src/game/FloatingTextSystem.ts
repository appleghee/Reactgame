import { Vector2 } from './Vector2';

export interface FloatingText {
  pos: Vector2;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vel: Vector2;
  size: number;
}

export class FloatingTextSystem {
  texts: FloatingText[] = [];

  add(x: number, y: number, text: string, color: string, size: number = 16, life: number = 1.0) {
    this.texts.push({
      pos: new Vector2(x + (Math.random() * 20 - 10), y + (Math.random() * 20 - 10)),
      text: text,
      color: color,
      life: life,
      maxLife: life,
      vel: new Vector2(0, -30), // move up
      size: size
    });
  }

  update(dtSec: number) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dtSec;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
      } else {
        t.pos.x += t.vel.x * dtSec;
        t.pos.y += t.vel.y * dtSec;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (const t of this.texts) {
      ctx.save();
      const alpha = Math.max(0, t.life / t.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = t.color;
      ctx.font = `bold ${t.size}px "Cinzel", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // text shadow for better visibility
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      ctx.fillText(t.text, t.pos.x, t.pos.y);
      ctx.restore();
    }
  }
}
