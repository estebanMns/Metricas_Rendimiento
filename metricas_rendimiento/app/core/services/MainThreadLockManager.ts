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
 * - Al activar "Bloquear", ejecuta un bucle síncrono intensivo calibrado exactamente en el rango
 *   de 100 a 150 ms por ciclo, ocupando el Call Stack al 100% y degradando el render y la interactividad.
 * - Al final de cada ráfaga de 100-150 ms, cede un breve instante al Event Loop (macrotarea 0ms),
 *   permitiendo que el navegador reciba la acción de "Desbloquear" del usuario.
 * - Al activar "Desbloquear", cancela inmediatamente los ciclos de bloqueo y libera el hilo principal,
 *   restaurando la fluidez a 60 FPS.
 */
export class MainThreadLockManager {
  private isLocked: boolean = false;
  private targetBlockDurationMs: number = 125; // Predeterminado: rango 100 - 150 ms
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
   * Inicia el ciclo sostenido de sobrecarga síncrona en el rango de 100 - 150 ms
   */
  public lockMainThread(): void {
    if (this.isLocked) return;
    this.isLocked = true;
    this.notify(true, this.targetBlockDurationMs);

    const executeBlockingCycle = () => {
      if (!this.isLocked) return;

      const cycleStart = performance.now();
      let index = 0;

      // BUCLE SÍNCRONO INTENSIVO: Ocupa el Call Stack durante el tiempo configurado (100 - 150 ms)
      // Mientras este while corre, el hilo principal está COMPLETAMENTE BLOQUEADO:
      // - El canvas de autos se congela.
      // - Los sliders quedan inmovilizados.
      // - Los clics no se procesan y se acumulan en la cola.
      while (performance.now() - cycleStart < this.targetBlockDurationMs) {
        const vehicle = this.sampleData[index % this.sampleData.length];
        this.metricsEngine.processRecordCalculations(vehicle, 400);
        index++;
      }

      const actualLag = performance.now() - cycleStart;
      this.notify(true, Math.round(actualLag));

      // Si sigue bloqueado, programamos el siguiente ciclo síncrono
      if (this.isLocked) {
        this.currentTimeoutId = setTimeout(executeBlockingCycle, 0);
      }
    };

    executeBlockingCycle();
  }

  /**
   * BOTÓN 2: DESBLOQUEAR EL HILO PRINCIPAL
   * Detiene los ciclos de sobrecarga y libera el Event Loop inmediatamente
   */
  public unlockMainThread(): void {
    this.isLocked = false;
    if (this.currentTimeoutId !== null) {
      clearTimeout(this.currentTimeoutId as number);
      this.currentTimeoutId = null;
    }
    this.notify(false, 0);
  }
}
