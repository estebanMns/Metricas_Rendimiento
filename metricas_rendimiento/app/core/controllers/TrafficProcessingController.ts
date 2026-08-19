import {
  VehicleTelemetry,
  ExecutionConfig,
  ProcessingMetrics,
  ProcessingMode,
  ProgressCallbackData
} from '../domain/models';
import { TrafficDataGenerator } from '../services/TrafficDataGenerator';
import { TrafficMetricsEngine } from '../services/TrafficMetricsEngine';
import { ITrafficExecutionStrategy } from '../strategies/ITrafficExecutionStrategy';
import { SynchronousBlockingStrategy } from '../strategies/SynchronousBlockingStrategy';
import { EventLoopDeferredStrategy } from '../strategies/EventLoopDeferredStrategy';
import { EventLoopLagMonitor } from '../monitoring/EventLoopLagMonitor';

export type MetricsListener = (metrics: ProcessingMetrics) => void;
export type ModeListener = (mode: ProcessingMode) => void;

/**
 * TrafficProcessingController (Fachada / Controlador)
 * 
 * Principio de Responsabilidad Única (SRP):
 * Esta clase orquesta la generación de datos, la selección e inyección de la estrategia
 * de ejecución (Strategy Pattern), el control de cancelación y la notificación
 * de estado hacia la capa de presentación (React).
 */
export class TrafficProcessingController {
  private readonly dataGenerator: TrafficDataGenerator;
  private readonly metricsEngine: TrafficMetricsEngine;
  private readonly syncStrategy: SynchronousBlockingStrategy;
  private readonly eventLoopStrategy: EventLoopDeferredStrategy;
  private readonly lagMonitor: EventLoopLagMonitor;

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
  }

  public getLagMonitor(): EventLoopLagMonitor {
    return this.lagMonitor;
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

  /**
   * Prepara el dataset sintético según el volumen configurado
   */
  public prepareDataset(count: number): void {
    const nodes = this.dataGenerator.generateRoadNodes(25);
    this.currentDataset = this.dataGenerator.generateVehicleBatch(count, nodes);
  }

  /**
   * Ejecuta el procesamiento usando Bloqueo Síncrono (Sobrecarga directa del Hilo Principal)
   */
  public async executeBlocking(config: ExecutionConfig): Promise<void> {
    if (this.isProcessing) return;
    
    this.setMode('BLOCKING');
    this.isProcessing = true;
    this.abortRequested = false;

    // Aseguramos dataset preparado
    if (this.currentDataset.length !== config.recordCount) {
      this.prepareDataset(config.recordCount);
    }

    try {
      await this.syncStrategy.execute(
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

  /**
   * Ejecuta el procesamiento usando el Event Loop (Diferido / No Bloqueante con microtareas y time-slicing)
   */
  public async executeEventLoopDeferred(config: ExecutionConfig): Promise<void> {
    if (this.isProcessing) return;

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

  /**
   * Cancela la ejecución activa
   */
  public abort(): void {
    this.abortRequested = true;
    this.isProcessing = false;
    this.setMode('IDLE');
  }

  public getIsProcessing(): boolean {
    return this.isProcessing;
  }
}
