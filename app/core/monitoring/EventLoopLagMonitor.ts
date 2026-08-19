import { LagSample } from '../domain/models';

export type LagCallback = (sample: LagSample) => void;

/**
 * EventLoopLagMonitor
 * 
 * Principio de Responsabilidad Única (SRP):
 * Esta clase es responsable exclusivamente de monitorear en tiempo real la salud
 * del Event Loop del navegador, calculando el FPS actual y la latencia/drift del hilo principal.
 * 
 * Detecta específicamente el rango de peligro de 100 a 150 ms solicitado,
 * donde una tarea larga (Long Task) degrada notablemente la experiencia de usuario.
 */
export class EventLoopLagMonitor {
  private isRunning: boolean = false;
  private animFrameId: number | null = null;
  private intervalId: NodeJS.Timeout | number | null = null;
  
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private currentFps: number = 60;
  private currentLagMs: number = 0;
  
  private listeners: LagCallback[] = [];
  private expectedIntervalMs: number = 50; // Heartbeat cada 50ms
  private lastHeartbeatTime: number = performance.now();

  /**
   * Suscribe un callback a las métricas del Event Loop
   */
  public subscribe(callback: LagCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Inicia el monitoreo continuo de FPS y Drift del hilo principal
   */
  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.lastHeartbeatTime = performance.now();

    // 1. Monitoreo de FPS mediante requestAnimationFrame
    const measureFps = (now: number) => {
      if (!this.isRunning) return;

      this.frameCount++;
      const delta = now - this.lastFrameTime;

      if (delta >= 500) { // Muestra de FPS cada 500ms
        this.currentFps = Math.min(60, Math.round((this.frameCount * 1000) / delta));
        this.frameCount = 0;
        this.lastFrameTime = now;
      }

      this.animFrameId = requestAnimationFrame(measureFps);
    };

    if (typeof window !== 'undefined') {
      this.animFrameId = requestAnimationFrame(measureFps);
    }

    // 2. Monitoreo de Lag del Event Loop mediante Heartbeat Drift
    // Si el hilo principal se bloquea, este setInterval se retrasará. La diferencia es el Lag.
    this.intervalId = setInterval(() => {
      const now = performance.now();
      const actualDelta = now - this.lastHeartbeatTime;
      // El lag es el retraso adicional por encima del intervalo esperado
      const lag = Math.max(0, actualDelta - this.expectedIntervalMs);
      this.currentLagMs = Math.round(lag);
      this.lastHeartbeatTime = now;

      // Determinamos si estamos en la zona de peligro (100 - 150 ms o superior)
      const isDangerZone = this.currentLagMs >= 100;
      
      let taskType: LagSample['taskType'] = 'idle';
      if (this.currentLagMs > 80) {
        taskType = 'blocked';
      } else if (this.currentFps < 30) {
        taskType = 'macrotask';
      }

      const sample: LagSample = {
        timestamp: now,
        fps: this.currentFps,
        lagMs: this.currentLagMs,
        isDangerZone,
        taskType
      };

      this.notifyListeners(sample);
    }, this.expectedIntervalMs);
  }

  /**
   * Detiene el monitor y limpia los temporizadores
   */
  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null && typeof window !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId as number);
      this.intervalId = null;
    }
  }

  public getCurrentFps(): number {
    return this.currentFps;
  }

  public getCurrentLagMs(): number {
    return this.currentLagMs;
  }

  private notifyListeners(sample: LagSample): void {
    for (const callback of this.listeners) {
      callback(sample);
    }
  }
}
