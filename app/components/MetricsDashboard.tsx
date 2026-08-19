'use client';

import React from 'react';
import {
  Lock,
  Unlock,
  Zap,
  Square,
  Activity,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ProcessingMetrics, ProcessingMode } from '../core/domain/models';

interface MetricsDashboardProps {
  metrics: ProcessingMetrics;
  mode: ProcessingMode;
  fps: number;
  lagMs: number;
  isLocked: boolean;
  selectedRecords: number;
  blockRangeMs: number;
  onSelectRecords: (count: number) => void;
  onLockMainThread: () => void;
  onUnlockMainThread: () => void;
  onStartEventLoop: () => void;
  onAbort: () => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  mode,
  fps,
  lagMs,
  isLocked,
  selectedRecords,
  blockRangeMs,
  onSelectRecords,
  onLockMainThread,
  onUnlockMainThread,
  onStartEventLoop,
  onAbort
}) => {
  const isProcessing = mode !== 'IDLE';
  const isDangerLag = lagMs >= 100;

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col gap-5">
      {/* Master Actions Bar: Dedicated Lock & Unlock Buttons */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Left: Primary Thread Controls (Lock & Unlock) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* BOTÓN 1: BLOQUEAR HILO PRINCIPAL */}
          <button
            onClick={onLockMainThread}
            disabled={isLocked}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-all cursor-pointer ${
              isLocked
                ? 'bg-rose-950/70 border border-rose-600 text-rose-300 opacity-80 cursor-not-allowed animate-pulse'
                : 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white shadow-rose-950/60 active:scale-95'
            }`}
          >
            <Lock className="w-4 h-4 text-rose-200 shrink-0" />
            <div className="text-left">
              <div>🔒 BLOQUEAR HILO PRINCIPAL</div>
              <div className="text-[10px] font-normal text-rose-200/80 font-mono">
                Saturar Call Stack ({blockRangeMs} ms)
              </div>
            </div>
          </button>

          {/* BOTÓN 2: DESBLOQUEAR HILO PRINCIPAL */}
          <button
            onClick={onUnlockMainThread}
            disabled={!isLocked && mode === 'IDLE'}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-xl transition-all cursor-pointer ${
              !isLocked && mode === 'IDLE'
                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold shadow-emerald-950/50 active:scale-95 animate-bounce'
            }`}
          >
            <Unlock className="w-4 h-4 text-slate-950 shrink-0" />
            <div className="text-left">
              <div>🔓 DESBLOQUEAR HILO PRINCIPAL</div>
              <div className="text-[10px] font-medium text-emerald-950/80 font-mono">
                Restaurar Event Loop (60 FPS)
              </div>
            </div>
          </button>
        </div>

        {/* Right: Event Loop Batch Processing & Dataset Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dataset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] text-slate-400 font-mono">Lote:</span>
            {[100000, 250000, 500000].map((count) => (
              <button
                key={count}
                disabled={isProcessing}
                onClick={() => onSelectRecords(count)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded transition-all cursor-pointer ${
                  selectedRecords === count
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {(count / 1000)}k
              </button>
            ))}
          </div>

          {/* Non-Blocking Processing Button */}
          <button
            onClick={onStartEventLoop}
            disabled={isProcessing || isLocked}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs border border-indigo-500/50 shadow-md transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-300" />
            <span>⚡ Procesar Rutas (No Bloqueante)</span>
          </button>

          {isProcessing && mode === 'EVENT_LOOP' && (
            <button
              onClick={onAbort}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              <Square className="w-3 h-3 text-rose-400" />
              <span>Detener</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar (Only during processing) */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            Progreso de Procesamiento Geoespacial:
          </span>
          <span className="font-mono font-bold text-slate-200">
            {metrics.processedRecords.toLocaleString()} / {metrics.totalRecords.toLocaleString()} registros ({metrics.progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
          <div
            className={`h-full transition-all duration-150 rounded-full ${
              isLocked
                ? 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                : 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-teal-500'
            }`}
            style={{ width: `${metrics.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Real-time KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Main Thread Lag (100 - 150 ms Focus) */}
        <div className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
          isDangerLag || isLocked
            ? 'bg-rose-950/70 border-rose-500 text-rose-200 animate-pulse'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>MAIN THREAD LAG</span>
            {(isDangerLag || isLocked) && <span className="text-[9px] font-bold text-rose-400">100-150ms</span>}
          </div>
          <div className="text-xl font-bold font-mono text-white my-1">
            {lagMs} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className={`text-[10px] font-mono ${(isDangerLag || isLocked) ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
            {(isDangerLag || isLocked) ? '⚠️ Hilo Saturado' : '✓ Fluido (<16ms)'}
          </div>
        </div>

        {/* KPI 2: FPS */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400">RENDER RATE</div>
          <div className="text-xl font-bold font-mono text-cyan-300 my-1">
            {fps} <span className="text-xs font-normal text-slate-400">FPS</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {fps >= 55 ? '60 FPS Óptimo' : fps < 20 ? 'Congelamiento' : 'Jank Detectado'}
          </div>
        </div>

        {/* KPI 3: Throughput */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400">RENDIMIENTO</div>
          <div className="text-xl font-bold font-mono text-indigo-300 my-1">
            {(metrics.recordsPerSecond || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">reg/s</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">Tasa de cómputo</div>
        </div>

        {/* KPI 4: Elapsed Time */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400">TIEMPO ACTIVO</div>
          <div className="text-xl font-bold font-mono text-amber-300 my-1">
            {(metrics.elapsedTimeMs / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">s</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">Duración</div>
        </div>

        {/* KPI 5: Congestion Index */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400">ÍNDICE CONGESTIÓN</div>
          <div className="text-xl font-bold font-mono text-rose-300 my-1">
            {(metrics.calculatedCongestionIndex || 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">Densidad vial</div>
        </div>

        {/* KPI 6: Speed Avg */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400">VELOCIDAD MEDIA</div>
          <div className="text-xl font-bold font-mono text-emerald-300 my-1">
            {(metrics.averageSpeedKmh || 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">Flota urbana</div>
        </div>
      </div>
    </div>
  );
};
