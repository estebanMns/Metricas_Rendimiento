'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { TrafficProcessingController } from './core/controllers/TrafficProcessingController';
import { ProcessingMetrics, ProcessingMode, ExecutionConfig, LagSample } from './core/domain/models';
import { TrafficHeader } from './components/TrafficHeader';
import { TrafficMapCanvas } from './components/TrafficMapCanvas';
import { MetricsDashboard } from './components/MetricsDashboard';
import { InteractiveStressTester } from './components/InteractiveStressTester';
import { EventLoopVisualizer } from './components/EventLoopVisualizer';
import { ArchitectureModal } from './components/ArchitectureModal';

export default function Home() {
  // Instancia única del controlador (Controlador / Fachada POO)
  const controllerRef = useRef<TrafficProcessingController | null>(null);

  // Estados reactivos de la interfaz
  const [mode, setMode] = useState<ProcessingMode>('IDLE');
  const [fps, setFps] = useState<number>(60);
  const [lagMs, setLagMs] = useState<number>(0);
  const [selectedRecords, setSelectedRecords] = useState<number>(250000);
  const [blockRangeMs, setBlockRangeMs] = useState<number>(125); // Rango predeterminado 100 - 150 ms
  const [isArchitectureOpen, setIsArchitectureOpen] = useState<boolean>(false);

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

    // Iniciar y suscribir el monitor del Event Loop y Lag
    const lagMonitor = controller.getLagMonitor();
    lagMonitor.start();

    const unsubscribeLag = lagMonitor.subscribe((sample: LagSample) => {
      setFps(sample.fps);
      setLagMs(sample.lagMs);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeMode();
      unsubscribeLag();
      lagMonitor.stop();
    };
  }, []);

  // Manejo de cambio de registros
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

  // Acción 1: Ejecutar Bloqueo Síncrono (Sobrecarga del Hilo Principal)
  const handleStartBlocking = useCallback(async () => {
    if (!controllerRef.current) return;

    const config: ExecutionConfig = {
      recordCount: selectedRecords,
      targetBlockDurationMs: blockRangeMs,
      chunkTimeBudgetMs: 12,
      useMicrotasksForAggregation: false
    };

    await controllerRef.current.executeBlocking(config);
  }, [selectedRecords, blockRangeMs]);

  // Acción 2: Ejecutar Event Loop Diferido (No Bloqueante con microtareas y time-slicing)
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

  // Acción 3: Abortar
  const handleAbort = useCallback(() => {
    controllerRef.current?.abort();
  }, []);

  const isBlocked = mode === 'BLOCKING' || lagMs >= 100;

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
              isBlocked={isBlocked}
              mode={mode}
            />
          </div>

          {/* Right Column: Interactive Stress Tester (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <InteractiveStressTester
              isBlocked={isBlocked}
              blockRangeMs={blockRangeMs}
              onBlockRangeChange={setBlockRangeMs}
            />
          </div>
        </div>

        {/* Middle Section: Metrics Dashboard & Control Actions */}
        <MetricsDashboard
          metrics={metrics}
          mode={mode}
          fps={fps}
          lagMs={lagMs}
          selectedRecords={selectedRecords}
          onSelectRecords={handleSelectRecords}
          onStartBlocking={handleStartBlocking}
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
          <span>Caso de Estudio: Event Loop de JavaScript & Monohilo</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Objetivo de latencia calibrado en <span className="text-amber-400">100 - 150 ms</span> • Arquitectura POO & Principio de Responsabilidad Única (SRP)
        </div>
      </footer>

      {/* 4. Modal de Arquitectura y POO / SOLID */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
