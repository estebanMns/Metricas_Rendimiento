import { ITrafficExecutionStrategy } from './ITrafficExecutionStrategy';
import { VehicleTelemetry, ExecutionConfig, ProgressCallback } from '../domain/models';
import { TrafficMetricsEngine } from '../services/TrafficMetricsEngine';

/**
 * SynchronousBlockingStrategy
 * 
 * Principio de Responsabilidad Única (SRP):
 * Implementa la estrategia de procesamiento síncrono intensivo.
 * Ejecuta todo el cálculo en un único bloque de ejecución continuo en el Call Stack,
 * acaparando el hilo principal (Main Thread) e impidiendo que el Event Loop procese
 * eventos de entrada (mouse, teclado, sliders) y tareas de renderizado (rAF, Paint).
 * 
 * Genera la sobrecarga y bloqueo real en el navegador.
 */
export class SynchronousBlockingStrategy implements ITrafficExecutionStrategy {
  public readonly strategyName = 'Bloqueo Síncrono (Hilo Principal Saturado)';
  public readonly isNonBlocking = false;

  private readonly metricsEngine: TrafficMetricsEngine;

  constructor(metricsEngine?: TrafficMetricsEngine) {
    this.metricsEngine = metricsEngine || new TrafficMetricsEngine();
  }

  public async execute(
    dataset: VehicleTelemetry[],
    config: ExecutionConfig,
    onProgress: ProgressCallback,
    shouldAbort: () => boolean
  ): Promise<void> {
    const total = dataset.length;
    const startTime = performance.now();

    let totalCongestion = 0;
    let totalSpeed = 0;
    let totalBottlenecks = 0;

    // Ejecución 100% Síncrona: El hilo principal queda completamente atrapado en este bucle
    // No hay await, no hay setTimeout, no hay yield. El Call Stack está lleno.
    for (let i = 0; i < total; i++) {
      if (shouldAbort()) {
        break;
      }

      // Procesa el cálculo pesado
      const result = this.metricsEngine.processBatchSlice(dataset, i, i + 1, 350);
      totalCongestion += result.accumulatedCongestion;
      totalSpeed += result.accumulatedSpeed;
      totalBottlenecks += result.detectedBottlenecks;

      // Nota docente sobre el Event Loop: Aunque se invoque onProgress periódicamente,
      // React NO podrá actualizar el DOM ni la pantalla porque el hilo principal está ocupado.
      // Las microtareas o estados se acumulan hasta que el bucle síncrono termine.
      if (i % 1000 === 0 || i === total - 1) {
        const elapsed = performance.now() - startTime;
        onProgress({
          processed: i + 1,
          total,
          metrics: {
            totalRecords: total,
            processedRecords: i + 1,
            progressPercent: Math.round(((i + 1) / total) * 100),
            elapsedTimeMs: elapsed,
            recordsPerSecond: Math.round(((i + 1) / (elapsed || 1)) * 1000),
            calculatedCongestionIndex: totalCongestion / (i + 1),
            averageSpeedKmh: totalSpeed / (i + 1),
            activeBottlenecks: totalBottlenecks,
            strategyName: this.strategyName,
            isCompleted: i === total - 1,
            isCancelled: false
          }
        });
      }
    }
  }
}
