import { Vector2 } from './Vector2';
import { SoundManager } from './SoundManager';

export class Ball {
  pos: Vector2;
  vel: Vector2;
  acc: Vector2;
  radius: number;
  color: string;
  mass: number;
  restitution: number;
  rotation: number = 0;
  pulseTimer: number = 0;

  constructor(x: number, y: number, radius: number, color: string) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(Math.random() * 10 - 5, Math.random() * -10);
    this.acc = new Vector2(0, 0);
    this.radius = radius;
    this.color = color;
    this.mass = radius;
    this.restitution = 1; // 1 means perfect bounce (no energy loss)
  }

  applyForce(force: Vector2) {
    const f = new Vector2(force.x, force.y);
    f.mult(1 / this.mass);
    this.acc.add(f);
  }

  update(dtFrames: number) {
    this.vel.add(this.acc);
    this.pos.x += this.vel.x * dtFrames;
    this.pos.y += this.vel.y * dtFrames;
    this.acc.mult(0);
    
    // Update rotation based on velocity
    const speed = this.vel.mag();
    this.rotation += speed * 0.005 * dtFrames;
    
    // Update pulse
    this.pulseTimer += dtFrames * 0.05;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Outer Glow
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    
    // 3D Sphere Texture (Radial Gradient)
    const gradient = ctx.createRadialGradient(
      this.pos.x - this.radius * 0.3,
      this.pos.y - this.radius * 0.3,
      this.radius * 0.1,
      this.pos.x,
      this.pos.y,
      this.radius
    );
    gradient.addColorStop(0, '#ffffff'); // Highlight
    gradient.addColorStop(0.3, this.color); // Base color
    gradient.addColorStop(0.8, '#0f172a'); // Dark edge (slate-900)
    gradient.addColorStop(1, '#000000'); // Shadow
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Reset shadow for inner details
    ctx.shadowBlur = 0;
    
    // Translate and rotate for runes
    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.rotation);
    
    // Dark Fantasy Runes/Patterns
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    
    // Outer rune ring
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.75, 0, Math.PI * 2);
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Inner star/cross pattern
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.5, 0);
    ctx.lineTo(this.radius * 0.5, 0);
    ctx.moveTo(0, -this.radius * 0.5);
    ctx.lineTo(0, this.radius * 0.5);
    
    // Add some diagonal runes
    ctx.moveTo(-this.radius * 0.3, -this.radius * 0.3);
    ctx.lineTo(this.radius * 0.3, this.radius * 0.3);
    ctx.moveTo(-this.radius * 0.3, this.radius * 0.3);
    ctx.lineTo(this.radius * 0.3, -this.radius * 0.3);
    ctx.stroke();

    // Center glowing core with pulse
    const pulseScale = 1 + Math.sin(this.pulseTimer) * 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.25 * pulseScale, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 15 * pulseScale;
    ctx.fill();
    
    ctx.restore();
  }

  checkEdges(arena: {x: number, y: number, width: number, height: number}) {
    let bounced = false;
    if (this.pos.y > arena.y + arena.height - this.radius) {
      this.pos.y = arena.y + arena.height - this.radius;
      this.vel.y *= -this.restitution;
      bounced = true;
    } else if (this.pos.y < arena.y + this.radius) {
      this.pos.y = arena.y + this.radius;
      this.vel.y *= -this.restitution;
      bounced = true;
    }

    if (this.pos.x > arena.x + arena.width - this.radius) {
      this.pos.x = arena.x + arena.width - this.radius;
      this.vel.x *= -this.restitution;
      bounced = true;
    } else if (this.pos.x < arena.x + this.radius) {
      this.pos.x = arena.x + this.radius;
      this.vel.x *= -this.restitution;
      bounced = true;
    }
    
    if (bounced) {
      SoundManager.playBounce();
    }
  }
}
