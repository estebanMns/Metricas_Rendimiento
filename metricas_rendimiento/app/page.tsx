'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { TrafficProcessingController } from './core/controllers/TrafficProcessingController';
import { ProcessingMetrics, ProcessingMode, ExecutionConfig, LagSample, INPSummary } from './core/domain/models';
import { TrafficHeader } from './components/TrafficHeader';
import { TrafficMapCanvas } from './components/TrafficMapCanvas';
import { MetricsDashboard } from './components/MetricsDashboard';
import { InteractiveStressTester } from './components/InteractiveStressTester';
import { EventLoopVisualizer } from './components/EventLoopVisualizer';
import { INPScoreCard } from './components/INPScoreCard';
import { ArchitectureModal } from './components/ArchitectureModal';

export default function Home() {
  // Instancia única del controlador (Fachada / Orquestador POO)
  const controllerRef = useRef<TrafficProcessingController | null>(null);

  // Estados reactivos de la interfaz
  const [mode, setMode] = useState<ProcessingMode>('IDLE');
  const [fps, setFps] = useState<number>(60);
  const [lagMs, setLagMs] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [selectedRecords, setSelectedRecords] = useState<number>(250000);
  const [blockRangeMs, setBlockRangeMs] = useState<number>(125); // Rango predeterminado 100 - 150 ms
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);

  // Estado del Core Web Vital INP
  const [inpSummary, setInpSummary] = useState<INPSummary>({
    worstInpMs: 0,
    averageInpMs: 0,
    rating: 'GOOD',
    totalInteractions: 0,
    recentInteractions: []
  });

  const [metrics, setMetrics] = useState<ProcessingMetrics>({
    totalRecords: 250000,
    processedRecords: 0,
    progressPercent: 0,
    elapsedTimeMs: 0,
    recordsPerSecond: 0,
    calculatedCongestionIndex: 0,
    averageSpeedKmh: 0,
    activeBottlenecks: 0,
    strategyName: 'En Reposo',
    isCompleted: false,
    isCancelled: false
  });

  // Inicialización de la arquitectura y suscripciones reactivas
  useEffect(() => {
    const controller = new TrafficProcessingController();
    controllerRef.current = controller;

    // Preparar dataset inicial
    controller.prepareDataset(250000);

    // Suscripción a métricas de procesamiento
    const unsubscribeMetrics = controller.onMetricsUpdate((updatedMetrics) => {
      setMetrics(updatedMetrics);
    });

    // Suscripción a cambios de modo
    const unsubscribeMode = controller.onModeChange((newMode) => {
      setMode(newMode);
    });

    // Suscripción al LockManager
    const unsubscribeLock = controller.getLockManager().subscribe((locked, currentLag) => {
      setIsLocked(locked);
      if (locked) {
        setLagMs(currentLag);
      }
    });

    // Iniciar y suscribir el monitor del Event Loop y Lag
    const lagMonitor = controller.getLagMonitor();
    lagMonitor.start();

    const unsubscribeLag = lagMonitor.subscribe((sample: LagSample) => {
      setFps(sample.fps);
      if (!controller.getLockManager().isCurrentlyLocked()) {
        setLagMs(sample.lagMs);
      }
    });

    // Iniciar y suscribir el monitor de INP
    const inpMonitor = controller.getINPMonitor();
    inpMonitor.startObserving();

    const unsubscribeINP = inpMonitor.subscribe((summary) => {
      setInpSummary(summary);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeMode();
      unsubscribeLock();
      unsubscribeLag();
      unsubscribeINP();
      lagMonitor.stop();
      inpMonitor.stop();
    };
  }, []);

  // Manejo de cambio de volumen de registros
  const handleSelectRecords = useCallback((count: number) => {
    setSelectedRecords(count);
    setMetrics((prev) => ({
      ...prev,
      totalRecords: count,
      processedRecords: 0,
      progressPercent: 0,
      elapsedTimeMs: 0,
      recordsPerSecond: 0
    }));
    controllerRef.current?.prepareDataset(count);
  }, []);

  // BOTÓN 1: BLOQUEAR HILO PRINCIPAL
  const handleLockMainThread = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.lockMainThread(blockRangeMs);
  }, [blockRangeMs]);

  // BOTÓN 2: DESBLOQUEAR HILO PRINCIPAL
  const handleUnlockMainThread = useCallback(() => {
    if (!controllerRef.current) return;
    controllerRef.current.unlockMainThread();
  }, []);

  // ACCIÓN 3: Procesar con Event Loop (No bloqueante / 60 FPS)
  const handleStartEventLoop = useCallback(async () => {
    if (!controllerRef.current) return;

    const config: ExecutionConfig = {
      recordCount: selectedRecords,
      targetBlockDurationMs: blockRangeMs,
      chunkTimeBudgetMs: 12,
      useMicrotasksForAggregation: true
    };

    await controllerRef.current.executeEventLoopDeferred(config);
  }, [selectedRecords, blockRangeMs]);

  // ACCIÓN 4: Abortar
  const handleAbort = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  // Reiniciar métricas INP
  const handleResetINP = useCallback(() => {
    controllerRef.current?.getINPMonitor().reset();
  }, []);

  const isThreadBlocked = isLocked || mode === 'BLOCKING' || lagMs >= 100;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* 1. Header con estado en tiempo real */}
      <TrafficHeader
        mode={mode}
        fps={fps}
        lagMs={lagMs}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* 2. Main Content Dashboard */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 flex flex-col gap-5">
        {/* Top Grid: Canvas Animation & Interactive Stress Tester */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Live Traffic Map Canvas (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <TrafficMapCanvas
              isBlocked={isThreadBlocked}
              mode={mode}
            />
          </div>

          {/* Right Column: Interactive Stress Tester with INP Profiling (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <InteractiveStressTester
              isBlocked={isThreadBlocked}
              blockRangeMs={blockRangeMs}
              inpMonitor={controllerRef.current?.getINPMonitor()}
              onBlockRangeChange={(val) => {
                setBlockRangeMs(val);
                if (controllerRef.current) {
                  controllerRef.current.getLockManager().setTargetBlockDuration(val);
                }
              }}
            />
          </div>
        </div>

        {/* INP Core Web Vital Breakdown Card */}
        <INPScoreCard
          inpSummary={inpSummary}
          onResetINP={handleResetINP}
          onOpenInfo={() => setIsArchitectureOpen(true)}
        />

        {/* Middle Section: Metrics Dashboard with Lock & Unlock Buttons */}
        <MetricsDashboard
          metrics={metrics}
          mode={mode}
          fps={fps}
          lagMs={lagMs}
          isLocked={isLocked}
          selectedRecords={selectedRecords}
          blockRangeMs={blockRangeMs}
          onSelectRecords={handleSelectRecords}
          onLockMainThread={handleLockMainThread}
          onUnlockMainThread={handleUnlockMainThread}
          onStartEventLoop={handleStartEventLoop}
          onAbort={handleAbort}
        />

        {/* Bottom Section: Event Loop Runtime Visualizer */}
        <EventLoopVisualizer
          mode={mode}
          fps={fps}
          lagMs={lagMs}
        />
      </main>

      {/* 3. Footer */}
      <footer className="w-full border-t border-slate-800 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Caso de Estudio: Event Loop de JavaScript, Métrica INP & POO (SRP)</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Umbral calibrado en <span className="text-amber-400">100 - 150 ms</span> • Medición W3C Core Web Vitals
        </div>
      </footer>

      {/* 4. Modal de Arquitectura y Explicación INP */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
