import { INPInteractionEntry, INPRating, INPSummary } from '../domain/models';

export type INPListener = (summary: INPSummary) => void;

/**
 * INPMonitor (Calculador de Interaction to Next Paint - Core Web Vital)
 * 
 * Principio de Responsabilidad Única (SRP):
 * Esta clase es responsable exclusivamente de capturar, medir y desglosar la métrica
 * oficial de rendimiento INP (Interaction to Next Paint) en sus 3 fases:
 * 
 *   INP = Input Delay + Processing Time + Presentation Delay (Next Paint)
 * 
 * ¿Cómo valida el uso del Event Loop?
 * - Si el hilo principal está saturado (bloqueo síncrono de 100-150ms):
 *   El Input Delay se dispara porque el evento queda atrapado en la cola del Event Loop
 *   y el Presentation Delay no puede pintar, degradando el INP a 'POOR' (>500ms).
 * - Si se usa el Event Loop con microtareas y yielding:
 *   El Input Delay y el Presentation Delay se mantienen mínimos (<50ms), logrando 'GOOD'.
 */
export class INPMonitor {
  private interactions: INPInteractionEntry[] = [];
  private listeners: INPListener[] = [];
  private observer: PerformanceObserver | null = null;
  private isObserving: boolean = false;

  public subscribe(listener: INPListener): () => void {
    this.listeners.push(listener);
    // Notificar estado actual inmediatamente
    listener(this.getSummary());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const summary = this.getSummary();
    for (const listener of this.listeners) {
      listener(summary);
    }
  }

  /**
   * Clasifica el valor de INP según los umbrales de Google Core Web Vitals
   */
  public static calculateRating(durationMs: number): INPRating {
    if (durationMs <= 200) return 'GOOD'; // Verde (Óptimo: <= 200 ms)
    if (durationMs <= 500) return 'NEEDS_IMPROVEMENT'; // Ámbar (200 - 500 ms)
    return 'POOR'; // Rojo (> 500 ms)
  }

  /**
   * Inicia la observación automática usando la API nativa de PerformanceObserver (si está soportada)
   */
  public startObserving(): void {
    if (this.isObserving || typeof window === 'undefined') return;

    try {
      if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('event')) {
        this.observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries() as unknown as Array<{
            name: string;
            duration: number;
            startTime: number;
            processingStart: number;
            processingEnd: number;
            target?: { tagName?: string; id?: string; className?: string };
          }>;

          for (const entry of entries) {
            // Desglose oficial de las 3 fases del INP
            const inputDelay = Math.max(0, entry.processingStart - entry.startTime);
            const processingDuration = Math.max(0, entry.processingEnd - entry.processingStart);
            const presentationDelay = Math.max(0, (entry.startTime + entry.duration) - entry.processingEnd);

            const record: INPInteractionEntry = {
              id: `inp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              interactionType: (entry.name as INPInteractionEntry['interactionType']) || 'click',
              targetElement: entry.target?.id || entry.target?.tagName || 'UI-Control',
              timestamp: Date.now(),
              totalDurationMs: Math.round(entry.duration),
              inputDelayMs: Math.round(inputDelay),
              processingDurationMs: Math.round(processingDuration),
              presentationDelayMs: Math.round(presentationDelay),
              rating: INPMonitor.calculateRating(entry.duration)
            };

            this.addInteraction(record);
          }
        });

        this.observer.observe({ type: 'event', buffered: true, durationThreshold: 16 } as unknown as PerformanceObserverInit);
        this.isObserving = true;
      }
    } catch {
      // Fallback a medición manual si el navegador restringe observer de eventos
    }
  }

  /**
   * Registra manualmente una interacción con medición de alta resolución (Next Paint via doble rAF)
   */
  public recordManualInteraction(
    type: INPInteractionEntry['interactionType'],
    targetName: string,
    eventStartTime: number,
    processingStartTime: number,
    processingEndTime: number
  ): void {
    // Medimos el Presentation Delay esperando al siguiente fotograma de pintura real (Next Paint)
    const measurePresentationDelay = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const paintTime = performance.now();
          const inputDelay = Math.max(0, processingStartTime - eventStartTime);
          const processing = Math.max(0, processingEndTime - processingStartTime);
          const presentationDelay = Math.max(0, paintTime - processingEndTime);
          const totalDuration = inputDelay + processing + presentationDelay;

          const record: INPInteractionEntry = {
            id: `inp-man-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            interactionType: type,
            targetElement: targetName,
            timestamp: Date.now(),
            totalDurationMs: Math.round(totalDuration),
            inputDelayMs: Math.round(inputDelay),
            processingDurationMs: Math.round(processing),
            presentationDelayMs: Math.round(presentationDelay),
            rating: INPMonitor.calculateRating(totalDuration)
          };

          this.addInteraction(record);
        });
      });
    };

    measurePresentationDelay();
  }

  private addInteraction(entry: INPInteractionEntry): void {
    // Mantenemos las últimas 25 interacciones
    this.interactions.unshift(entry);
    if (this.interactions.length > 25) {
      this.interactions.pop();
    }
    this.notify();
  }

  public getSummary(): INPSummary {
    if (this.interactions.length === 0) {
      return {
        worstInpMs: 0,
        averageInpMs: 0,
        rating: 'GOOD',
        totalInteractions: 0,
        recentInteractions: []
      };
    }

    // El INP oficial se define como la peor interacción (o percentil 98)
    const sorted = [...this.interactions].sort((a, b) => b.totalDurationMs - a.totalDurationMs);
    const worst = sorted[0].totalDurationMs;
    const avg = Math.round(
      this.interactions.reduce((acc, curr) => acc + curr.totalDurationMs, 0) / this.interactions.length
    );

    return {
      worstInpMs: worst,
      averageInpMs: avg,
      rating: INPMonitor.calculateRating(worst),
      totalInteractions: this.interactions.length,
      recentInteractions: [...this.interactions]
    };
  }

  public reset(): void {
    this.interactions = [];
    this.notify();
  }

  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      this.isObserving = false;
    }
  }
}
