/**
 * Modelos de Dominio y Tipos para el Panel de Procesamiento de Tráfico Urbano
 * Principio de Responsabilidad Única: Definir contratos y estructuras de datos puras.
 */

export interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  roadName: string;
  speedLimitKmh: number;
}

export interface VehicleTelemetry {
  id: string;
  type: 'car' | 'bus' | 'emergency' | 'truck' | 'bike';
  origin: GeoPoint;
  destination: GeoPoint;
  currentSpeedKmh: number;
  estimatedCongestionScore: number;
  rawPings: number[];
}

export interface ProcessingMetrics {
  totalRecords: number;
  processedRecords: number;
  progressPercent: number;
  elapsedTimeMs: number;
  recordsPerSecond: number;
  calculatedCongestionIndex: number;
  averageSpeedKmh: number;
  activeBottlenecks: number;
  strategyName: string;
  isCompleted: boolean;
  isCancelled: boolean;
}

export interface LagSample {
  timestamp: number;
  fps: number;
  lagMs: number; // Retraso acumulado en el hilo principal
  isDangerZone: boolean; // Retraso dentro o por encima del rango 100 - 150 ms
  taskType: 'idle' | 'microtask' | 'macrotask' | 'render' | 'blocked';
}

export type ProcessingMode = 'IDLE' | 'BLOCKING' | 'EVENT_LOOP';

export interface ExecutionConfig {
  recordCount: number; // Ej. 100,000 a 2,000,000 registros
  targetBlockDurationMs: number; // Configurable: rango 100 - 150 ms por ciclo síncrono
  chunkTimeBudgetMs: number; // Tiempo por chunk en modo Event Loop (ej. 8 - 16 ms)
  useMicrotasksForAggregation: boolean;
}

export interface ProgressCallbackData {
  processed: number;
  total: number;
  metrics: Partial<ProcessingMetrics>;
}

export type ProgressCallback = (data: ProgressCallbackData) => void;
