import { VehicleTelemetry } from '../domain/models';

export interface BatchProcessingResult {
  processedCount: number;
  accumulatedCongestion: number;
  accumulatedSpeed: number;
  detectedBottlenecks: number;
  syntheticHash: number;
}

/**
 * TrafficMetricsEngine
 * 
 * Principio de Responsabilidad Única (SRP):
 * Esta clase es responsable exclusivamente de ejecutar algoritmos matemáticos
 * intensivos en CPU sobre lotes de datos de tráfico urbano (distancias geoespaciales,
 * coeficientes de fricción vial, matrices de congestión y detección de cuellos de botella).
 */
export class TrafficMetricsEngine {
  /**
   * Ejecuta un cálculo intensivo de CPU para un registro individual o sub-lote.
   * Diseñado para generar carga de procesamiento real sobre el procesador.
   */
  public processRecordCalculations(vehicle: VehicleTelemetry, intensityIterations: number = 350): number {
    let result = 0;
    const lat1 = vehicle.origin.lat;
    const lng1 = vehicle.origin.lng;
    const lat2 = vehicle.destination.lat;
    const lng2 = vehicle.destination.lng;

    // Cálculo intensivo de trigonometría y matrices (distancia Haversine + turbulencia de tráfico)
    for (let j = 0; j < intensityIterations; j++) {
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLng = (lng2 - lng1) * (Math.PI / 180);
      
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
          
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceKm = 6371 * c;

      // Operaciones matemáticas complejas para simular modelado de flujo de tráfico no lineal
      const friction = Math.exp(-vehicle.currentSpeedKmh / 50) * Math.sin(j + distanceKm);
      result += (friction + Math.sqrt(Math.abs(vehicle.rawPings[j % 4] * distanceKm))) % 1000;
    }

    return result;
  }

  /**
   * Procesa un rango (slice) de registros y retorna estadísticas agregadas
   */
  public processBatchSlice(
    batch: VehicleTelemetry[],
    startIndex: number,
    endIndex: number,
    intensityPerRecord: number = 350
  ): BatchProcessingResult {
    let accumulatedCongestion = 0;
    let accumulatedSpeed = 0;
    let detectedBottlenecks = 0;
    let syntheticHash = 0;

    const limit = Math.min(endIndex, batch.length);

    for (let i = startIndex; i < limit; i++) {
      const vehicle = batch[i];
      const calcVal = this.processRecordCalculations(vehicle, intensityPerRecord);
      
      syntheticHash = (syntheticHash + calcVal) % 1000000;
      accumulatedSpeed += vehicle.currentSpeedKmh;
      
      const congestionIndex = (1 - (vehicle.currentSpeedKmh / vehicle.origin.speedLimitKmh)) * 100;
      accumulatedCongestion += Math.max(0, congestionIndex);

      if (vehicle.currentSpeedKmh < 15 || congestionIndex > 70) {
        detectedBottlenecks++;
      }
    }

    return {
      processedCount: limit - startIndex,
      accumulatedCongestion,
      accumulatedSpeed,
      detectedBottlenecks,
      syntheticHash
    };
  }
}
