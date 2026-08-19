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

/**
 * Modelos para la Métrica INP (Interaction to Next Paint - Core Web Vital)
 */
export type INPRating = 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR';

export interface INPInteractionEntry {
  id: string;
  interactionType: 'pointerdown' | 'click' | 'input' | 'keydown';
  targetElement: string;
  timestamp: number;
  totalDurationMs: number;
  inputDelayMs: number; // Fase 1: Tiempo en cola del Event Loop antes de ejecutar el handler
  processingDurationMs: number; // Fase 2: Tiempo de ejecución síncrona del callback JS
  presentationDelayMs: number; // Fase 3: Tiempo hasta que el navegador pinta en pantalla (Next Paint)
  rating: INPRating;
}

export interface INPSummary {
  worstInpMs: number; // Percentil 98 / Peor interacción registrada
  averageInpMs: number;
  rating: INPRating;
  totalInteractions: number;
  recentInteractions: INPInteractionEntry[];
}
