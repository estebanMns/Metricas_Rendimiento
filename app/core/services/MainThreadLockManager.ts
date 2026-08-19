import { TrafficMetricsEngine } from './TrafficMetricsEngine';
import { TrafficDataGenerator } from './TrafficDataGenerator';
import { VehicleTelemetry } from '../domain/models';

export type LockStateListener = (isLocked: boolean, currentCycleLagMs: number) => void;

/**
 * MainThreadLockManager
 * 
 * Principio de Responsabilidad Única (SRP):
 * Esta clase es responsable exclusivamente de gestionar los ciclos de bloqueo
 * sostenido y desbloqueo controlado del hilo principal (Main Thread).
 * 
 * Mecánica del Event Loop:
 * - Al activar "Bloquear": ejecuta un bucle síncrono intensivo en el rango calibrado de
 *   100 a 150 ms por ciclo, ocupando el Call Stack al 100%.
 * - Al finalizar cada ciclo de 100-150ms, cede una ventana breve (16ms) al Event Loop,
 *   lo que permite observar el salto de frames (Jank), registrar el retraso en INP y
 *   capturar con fiabilidad la acción de "Desbloquear" del usuario.
 * - Al activar "Desbloquear": cancela inmediatamente el temporizador y libera el hilo,
 *   restaurando la animación fluida a 60 FPS.
 */
export class MainThreadLockManager {
  private isLocked: boolean = false;
  private targetBlockDurationMs: number = 125; // Rango predeterminado: 100 - 150 ms
  private readonly metricsEngine: TrafficMetricsEngine;
  private readonly sampleData: VehicleTelemetry[];
  private listeners: LockStateListener[] = [];
  private currentTimeoutId: NodeJS.Timeout | number | null = null;

  constructor(metricsEngine?: TrafficMetricsEngine) {
    this.metricsEngine = metricsEngine || new TrafficMetricsEngine();
    const generator = new TrafficDataGenerator();
    const nodes = generator.generateRoadNodes(15);
    this.sampleData = generator.generateVehicleBatch(500, nodes);
  }

  public subscribe(listener: LockStateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(isLocked: boolean, lagMs: number): void {
    for (const listener of this.listeners) {
      listener(isLocked, lagMs);
    }
  }

  public setTargetBlockDuration(durationMs: number): void {
    this.targetBlockDurationMs = Math.max(50, Math.min(500, durationMs));
  }

  public getTargetBlockDuration(): number {
    return this.targetBlockDurationMs;
  }

  public isCurrentlyLocked(): boolean {
    return this.isLocked;
  }

  /**
   * BOTÓN 1: BLOQUEAR EL HILO PRINCIPAL
   */
  public lockMainThread(): void {
    if (this.isLocked) return;
    this.isLocked = true;
    this.notify(true, this.targetBlockDurationMs);

    const executeBlockingCycle = () => {
      if (!this.isLocked) return;

      const cycleStart = performance.now();
      let index = 0;

      // BUCLE SÍNCRONO INTENSIVO: Ocupa el Call Stack durante 100 - 150 ms continuos
      while (performance.now() - cycleStart < this.targetBlockDurationMs) {
        const vehicle = this.sampleData[index % this.sampleData.length];
        this.metricsEngine.processRecordCalculations(vehicle, 350);
        index++;
      }

      const actualLag = performance.now() - cycleStart;
      this.notify(true, Math.round(actualLag));

      // Si el usuario no ha desbloqueado, programa el siguiente ciclo
      if (this.isLocked) {
        this.currentTimeoutId = setTimeout(executeBlockingCycle, 16);
      }
    };

    executeBlockingCycle();
  }

  /**
   * BOTÓN 2: DESBLOQUEAR EL HILO PRINCIPAL
   */
  public unlockMainThread(): void {
    this.isLocked = false;
    if (this.currentTimeoutId !== null) {
      clearTimeout(this.currentTimeoutId as number);
      this.currentTimeoutId = null;
    }
    this.notify(false, 0);
  }

  /**
   * Ejecuta una única ráfaga síncrona de 100 - 150 ms (Bloqueo instantáneo)
   */
  public executeSingleBurst(durationMs: number = 150): number {
    const start = performance.now();
    let index = 0;
    while (performance.now() - start < durationMs) {
      const vehicle = this.sampleData[index % this.sampleData.length];
      this.metricsEngine.processRecordCalculations(vehicle, 350);
      index++;
    }
    return Math.round(performance.now() - start);
  }
}
