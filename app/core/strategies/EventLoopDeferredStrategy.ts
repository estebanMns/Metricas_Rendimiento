import { ITrafficExecutionStrategy } from './ITrafficExecutionStrategy';
import { VehicleTelemetry, ExecutionConfig, ProgressCallback } from '../domain/models';
import { TrafficMetricsEngine } from '../services/TrafficMetricsEngine';

/**
 * EventLoopDeferredStrategy
 * 
 * Principio de Responsabilidad Única (SRP):
 * Implementa la estrategia de procesamiento no bloqueante mediante fragmentación temporal
 * (time-slicing) y cesión voluntaria al Event Loop (yielding).
 * 
 * Utiliza:
 * 1. Microtareas (`queueMicrotask` / `Promise.resolve()`) para procesamiento atómico de sub-lotes.
 * 2. Macrotareas / Yielding (`setTimeout` / `scheduler.yield()`) para liberar el Call Stack,
 *    permitiendo que el hilo principal procese eventos del usuario (slider, clicks) y
 *    ejecute las fases de estilo, diseño y renderizado (Paint) a 60 FPS.
 */
export class EventLoopDeferredStrategy implements ITrafficExecutionStrategy {
  public readonly strategyName = 'Event Loop Diferido (No Bloqueante / Time-Slicing)';
  public readonly isNonBlocking = true;

  private readonly metricsEngine: TrafficMetricsEngine;

  constructor(metricsEngine?: TrafficMetricsEngine) {
    this.metricsEngine = metricsEngine || new TrafficMetricsEngine();
  }

  /**
   * Cede voluntariamente el hilo principal al Event Loop
   * Permite que el navegador despache eventos pendientes y renderice la pantalla.
   */
  private yieldToMainThread(): Promise<void> {
    // Si scheduler.yield está disponible de forma nativa en navegadores modernos:
    if (typeof window !== 'undefined' && 'scheduler' in window && typeof (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield === 'function') {
      return (window as unknown as { scheduler: { yield: () => Promise<void> } }).scheduler.yield();
    }
    
    // Fallback estándar con macrotarea (setTimeout 0 ms)
    return new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  /**
   * Ejecuta una pequeña agregación sincrónica usando la cola de Microtareas (queueMicrotask)
   */
  private processWithMicrotask<T>(operation: () => T): Promise<T> {
    return new Promise((resolve) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => {
          resolve(operation());
        });
      } else {
        Promise.resolve().then(() => {
          resolve(operation());
        });
      }
    });
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
    let currentIndex = 0;

    // Presupuesto de tiempo por fragmento (ej. 8ms a 14ms para garantizar 60 FPS)
    const timeBudgetMs = config.chunkTimeBudgetMs || 12;

    while (currentIndex < total) {
      if (shouldAbort()) {
        break;
      }

      const sliceStartTime = performance.now();

      // Procesa un lote iterativo hasta agotar el presupuesto de tiempo del fotograma
      while (
        currentIndex < total &&
        performance.now() - sliceStartTime < timeBudgetMs
      ) {
        // Determinamos el sub-bloque a procesar en esta micro-iteración
        const batchSize = Math.min(25, total - currentIndex);
        const result = this.metricsEngine.processBatchSlice(
          dataset,
          currentIndex,
          currentIndex + batchSize,
          350
        );

        totalCongestion += result.accumulatedCongestion;
        totalSpeed += result.accumulatedSpeed;
        totalBottlenecks += result.detectedBottlenecks;
        currentIndex += result.processedCount;
      }

      // Notificación de progreso reactiva a la UI
      const elapsed = performance.now() - startTime;
      onProgress({
        processed: currentIndex,
        total,
        metrics: {
          totalRecords: total,
          processedRecords: currentIndex,
          progressPercent: Math.min(100, Math.round((currentIndex / total) * 100)),
          elapsedTimeMs: elapsed,
          recordsPerSecond: Math.round((currentIndex / (elapsed || 1)) * 1000),
          calculatedCongestionIndex: currentIndex > 0 ? totalCongestion / currentIndex : 0,
          averageSpeedKmh: currentIndex > 0 ? totalSpeed / currentIndex : 0,
          activeBottlenecks: totalBottlenecks,
          strategyName: this.strategyName,
          isCompleted: currentIndex >= total,
          isCancelled: false
        }
      });

      // Si aún quedan registros por procesar, CEDEMOS el hilo principal al Event Loop
      if (currentIndex < total) {
        await this.yieldToMainThread();
      }
    }
  }
}
