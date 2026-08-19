import { GeoPoint, VehicleTelemetry } from '../domain/models';

/**
 * TrafficDataGenerator
 * 
 * Principio de Responsabilidad Única (SRP):
 * Esta clase es responsable exclusivamente de la generación de datos simulados
 * de tráfico urbano, nodos viales y telemetría geoespacial.
 */
export class TrafficDataGenerator {
  private static readonly ROAD_NAMES = [
    'Av. Paseo de la Reforma',
    'Autopista Central 101',
    'Anillo Periférico Norte',
    'Av. Insurgentes Sur',
    'Viaducto Piedad',
    'Circuito Interior',
    'Av. Corrientes',
    'Diagonal Santander',
    'Gran Vía Urbana',
    'Boulevard Costero'
  ];

  private static readonly VEHICLE_TYPES: VehicleTelemetry['type'][] = [
    'car', 'car', 'car', 'bus', 'truck', 'emergency', 'bike'
  ];

  /**
   * Genera una red básica de nodos viales
   */
  public generateRoadNodes(count: number = 20): GeoPoint[] {
    const nodes: GeoPoint[] = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `node-${i}`,
        lat: 19.4326 + (Math.random() - 0.5) * 0.08,
        lng: -99.1332 + (Math.random() - 0.5) * 0.08,
        roadName: TrafficDataGenerator.ROAD_NAMES[i % TrafficDataGenerator.ROAD_NAMES.length],
        speedLimitKmh: 40 + Math.floor(Math.random() * 5) * 10
      });
    }
    return nodes;
  }

  /**
   * Genera un lote masivo de registros de telemetría de vehículos
   */
  public generateVehicleBatch(count: number, nodes: GeoPoint[]): VehicleTelemetry[] {
    const batch: VehicleTelemetry[] = new Array(count);
    const nodeCount = nodes.length;

    for (let i = 0; i < count; i++) {
      const originIdx = i % nodeCount;
      const destIdx = (i + 1 + Math.floor(Math.random() * (nodeCount - 1))) % nodeCount;
      const vehicleType = TrafficDataGenerator.VEHICLE_TYPES[i % TrafficDataGenerator.VEHICLE_TYPES.length];

      // Simulamos lecturas de GPS / pings para cálculos pesados
      const pings = [
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100
      ];

      batch[i] = {
        id: `veh-${i}`,
        type: vehicleType,
        origin: nodes[originIdx],
        destination: nodes[destIdx],
        currentSpeedKmh: 10 + Math.random() * 70,
        estimatedCongestionScore: Math.random(),
        rawPings: pings
      };
    }

    return batch;
  }
}
