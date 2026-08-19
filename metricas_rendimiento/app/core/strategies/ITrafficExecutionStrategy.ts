import { VehicleTelemetry, ExecutionConfig, ProgressCallback } from '../domain/models';

/**
 * Contrato de Estrategia de Ejecución de Tareas de Tráfico (Strategy Pattern)
 * Principio Open/Closed y Single Responsibility:
 * Permite intercambiar algoritmos de ejecución (Bloqueante síncrono vs Diferido Event Loop)
 * sin modificar el cliente o la lógica de negocio.
 */
export interface ITrafficExecutionStrategy {
  readonly strategyName: string;
  readonly isNonBlocking: boolean;

  /**
   * Ejecuta el procesamiento del dataset de telemetría
   * @param dataset Datos de vehículos a procesar
   * @param config Configuración de ejecución (tamaño de lote, latencia objetivo 100-150ms, etc.)
   * @param onProgress Callback invocado periódicamente con métricas intermedias
   * @param shouldAbort Función que indica si la ejecución fue cancelada por el usuario
   */
  execute(
    dataset: VehicleTelemetry[],
    config: ExecutionConfig,
    onProgress: ProgressCallback,
    shouldAbort: () => boolean
  ): Promise<void>;
}
