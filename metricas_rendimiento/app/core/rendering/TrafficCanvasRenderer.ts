export interface RenderableVehicle {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  size: number;
  angle: number;
  type: string;
}

/**
 * TrafficCanvasRenderer
 * 
 * Principio de Responsabilidad Única (SRP):
 * Esta clase es responsable exclusivamente de renderizar en un elemento <canvas> 2D
 * el mapa urbano interactivo, la flota de vehículos en movimiento continuo,
 * las ondas de radar y los nodos de congestión.
 * 
 * Permite observar visualmente cómo el renderizado se congela durante el bloqueo síncrono
 * y permanece fluido a 60 FPS durante la ejecución diferida con el Event Loop.
 */
export class TrafficCanvasRenderer {
  private vehicles: RenderableVehicle[] = [];
  private radarAngle: number = 0;
  private animId: number | null = null;
  private isBlocked: boolean = false;

  public initializeFleet(count: number = 60, width: number, height: number): void {
    this.vehicles = [];
    const colors = ['#38bdf8', '#818cf8', '#34d399', '#f43f5e', '#fbbf24'];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const targetX = Math.random() * width;
      const targetY = Math.random() * height;
      const angle = Math.atan2(targetY - y, targetX - x);

      this.vehicles.push({
        id: `render-veh-${i}`,
        x,
        y,
        targetX,
        targetY,
        speed: 1.2 + Math.random() * 2.5,
        color: colors[i % colors.length],
        size: 3 + Math.random() * 3,
        angle,
        type: i % 10 === 0 ? 'emergency' : i % 5 === 0 ? 'bus' : 'car'
      });
    }
  }

  public setBlockedState(blocked: boolean): void {
    this.isBlocked = blocked;
  }

  /**
   * Dibuja un fotograma completo en el Canvas
   */
  public renderFrame(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // 1. Limpieza con fondo de telemetría oscuro
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // 2. Dibujar cuadrícula urbana
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
    ctx.lineWidth = 1;
    const gridSize = 40;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Dibujar avenidas principales iluminadas
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.4);
    ctx.lineTo(width, height * 0.4);
    ctx.moveTo(0, height * 0.7);
    ctx.lineTo(width, height * 0.7);
    ctx.moveTo(width * 0.3, 0);
    ctx.lineTo(width * 0.3, height);
    ctx.moveTo(width * 0.7, 0);
    ctx.lineTo(width * 0.7, height);
    ctx.stroke();

    // 4. Radar de telemetría giratorio
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) * 0.45;

    this.radarAngle = (this.radarAngle + 0.03) % (Math.PI * 2);

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.strokeStyle = this.isBlocked ? 'rgba(239, 68, 68, 0.3)' : 'rgba(14, 165, 233, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Barrido de radar
    const sweepGradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
    sweepGradient.addColorStop(0, this.isBlocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)');
    sweepGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sweepGradient;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, maxRadius, this.radarAngle - 0.4, this.radarAngle);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5. Actualizar y dibujar vehículos de la flota
    for (const v of this.vehicles) {
      // Mover vehículo hacia su destino
      const dx = v.targetX - v.x;
      const dy = v.targetY - v.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // Asignar nuevo destino aleatorio
        v.targetX = Math.random() * width;
        v.targetY = Math.random() * height;
        v.angle = Math.atan2(v.targetY - v.y, v.targetX - v.x);
      } else {
        v.x += (dx / dist) * v.speed;
        v.y += (dy / dist) * v.speed;
      }

      // Dibujar vehículo con resplandor
      ctx.save();
      ctx.translate(v.x, v.y);
      ctx.rotate(v.angle);

      ctx.fillStyle = this.isBlocked ? '#ef4444' : v.color;
      ctx.shadowColor = this.isBlocked ? '#ef4444' : v.color;
      ctx.shadowBlur = this.isBlocked ? 8 : 6;

      // Forma estilizada del vehículo (flecha / cápsula)
      ctx.beginPath();
      ctx.moveTo(v.size * 2, 0);
      ctx.lineTo(-v.size, -v.size);
      ctx.lineTo(-v.size * 0.5, 0);
      ctx.lineTo(-v.size, v.size);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // 6. Indicador de estado de render en pantalla
    ctx.fillStyle = this.isBlocked ? '#ef4444' : '#22c55e';
    ctx.font = '11px monospace';
    ctx.fillText(
      this.isBlocked ? '⚠️ RENDER CONGELADO (MAIN THREAD SATURADO)' : '● MOTOR DE RENDER ACTIVO (60 FPS)',
      15,
      25
    );
  }
}
