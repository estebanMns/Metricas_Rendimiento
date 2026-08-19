import {
  VehicleTelemetry,
  ExecutionConfig,
  ProcessingMetrics,
  ProcessingMode,
  ProgressCallbackData
} from '../domain/models';
import { TrafficDataGenerator } from '../services/TrafficDataGenerator';
import { TrafficMetricsEngine } from '../services/TrafficMetricsEngine';
import { SynchronousBlockingStrategy } from '../strategies/SynchronousBlockingStrategy';
import { EventLoopDeferredStrategy } from '../strategies/EventLoopDeferredStrategy';
import { EventLoopLagMonitor } from '../monitoring/EventLoopLagMonitor';
import { MainThreadLockManager } from '../services/MainThreadLockManager';
import { INPMonitor } from '../monitoring/INPMonitor';

export type MetricsListener = (metrics: ProcessingMetrics) => void;
export type ModeListener = (mode: ProcessingMode) => void;

/**
 * TrafficProcessingController (Fachada / Orquestador)
 * 
 * Principio de Responsabilidad Única (SRP):
 * Orquesta la generación de datos, la selección de estrategias,
 * el bloqueo/desbloqueo del hilo principal, el monitor de lag y el monitor de INP.
 */
export class TrafficProcessingController {
  private readonly dataGenerator: TrafficDataGenerator;
  private readonly metricsEngine: TrafficMetricsEngine;
  private readonly syncStrategy: SynchronousBlockingStrategy;
  private readonly eventLoopStrategy: EventLoopDeferredStrategy;
  private readonly lagMonitor: EventLoopLagMonitor;
  private readonly lockManager: MainThreadLockManager;
  private readonly inpMonitor: INPMonitor;

  private currentDataset: VehicleTelemetry[] = [];
  private currentMode: ProcessingMode = 'IDLE';
  private abortRequested: boolean = false;
  private isProcessing: boolean = false;

  private metricsListeners: MetricsListener[] = [];
  private modeListeners: ModeListener[] = [];

  constructor() {
    this.dataGenerator = new TrafficDataGenerator();
    this.metricsEngine = new TrafficMetricsEngine();
    this.syncStrategy = new SynchronousBlockingStrategy(this.metricsEngine);
    this.eventLoopStrategy = new EventLoopDeferredStrategy(this.metricsEngine);
    this.lagMonitor = new EventLoopLagMonitor();
    this.lockManager = new MainThreadLockManager(this.metricsEngine);
    this.inpMonitor = new INPMonitor();

    // Escuchar cambios en el LockManager para actualizar el modo
    this.lockManager.subscribe((isLocked) => {
      if (isLocked) {
        this.setMode('BLOCKING');
      } else if (!this.isProcessing) {
        this.setMode('IDLE');
      }
    });
  }

  public getLagMonitor(): EventLoopLagMonitor {
    return this.lagMonitor;
  }

  public getLockManager(): MainThreadLockManager {
    return this.lockManager;
  }

  public getINPMonitor(): INPMonitor {
    return this.inpMonitor;
  }

  public onMetricsUpdate(listener: MetricsListener): () => void {
    this.metricsListeners.push(listener);
    return () => {
      this.metricsListeners = this.metricsListeners.filter(l => l !== listener);
    };
  }

  public onModeChange(listener: ModeListener): () => void {
    this.modeListeners.push(listener);
    return () => {
      this.modeListeners = this.modeListeners.filter(l => l !== listener);
    };
  }

  private setMode(mode: ProcessingMode): void {
    this.currentMode = mode;
    for (const listener of this.modeListeners) {
      listener(mode);
    }
  }

  private notifyMetrics(metrics: ProcessingMetrics): void {
    for (const listener of this.metricsListeners) {
      listener(metrics);
    }
  }

  public prepareDataset(count: number): void {
    const nodes = this.dataGenerator.generateRoadNodes(25);
    this.currentDataset = this.dataGenerator.generateVehicleBatch(count, nodes);
  }

  /**
   * ACCIÓN: BLOQUEAR EL HILO PRINCIPAL
   */
  public lockMainThread(durationMs: number = 125): void {
    this.lockManager.setTargetBlockDuration(durationMs);
    this.lockManager.lockMainThread();
  }

  /**
   * ACCIÓN: DESBLOQUEAR EL HILO PRINCIPAL
   */
  public unlockMainThread(): void {
    this.lockManager.unlockMainThread();
    if (this.isProcessing) {
      this.abort();
    }
  }

  /**
   * ACCIÓN: Ejecutar procesamiento masivo con Event Loop (No Bloqueante / 60 FPS)
   */
  public async executeEventLoopDeferred(config: ExecutionConfig): Promise<void> {
    if (this.isProcessing) return;

    this.lockManager.unlockMainThread();

    this.setMode('EVENT_LOOP');
    this.isProcessing = true;
    this.abortRequested = false;

    if (this.currentDataset.length !== config.recordCount) {
      this.prepareDataset(config.recordCount);
    }

    try {
      await this.eventLoopStrategy.execute(
        this.currentDataset,
        config,
        (progressData: ProgressCallbackData) => {
          if (progressData.metrics) {
            this.notifyMetrics(progressData.metrics as ProcessingMetrics);
          }
        },
        () => this.abortRequested
      );
    } finally {
      this.isProcessing = false;
      this.setMode('IDLE');
    }
  }

  public abort(): void {
    this.abortRequested = true;
    this.isProcessing = false;
    this.lockManager.unlockMainThread();
    this.setMode('IDLE');
  }

  public getIsProcessing(): boolean {
    return this.isProcessing || this.lockManager.isCurrentlyLocked();
  }
}
