'use client';

import React from 'react';
import {
  Play,
  Zap,
  Square,
  Activity,
  Gauge,
  Database,
  Timer,
  AlertOctagon,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import { ProcessingMetrics, ProcessingMode } from '../core/domain/models';

interface MetricsDashboardProps {
  metrics: ProcessingMetrics;
  mode: ProcessingMode;
  fps: number;
  lagMs: number;
  selectedRecords: number;
  onSelectRecords: (count: number) => void;
  onStartBlocking: () => void;
  onStartEventLoop: () => void;
  onAbort: () => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  metrics,
  mode,
  fps,
  lagMs,
  selectedRecords,
  onSelectRecords,
  onStartBlocking,
  onStartEventLoop,
  onAbort
}) => {
  const isProcessing = mode !== 'IDLE';
  const isDangerLag = lagMs >= 100; // Alerta explícita en rango 100 - 150 ms

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col gap-5">
      {/* Control Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
        {/* Dataset Volume Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-cyan-400" />
            Lote de Datos:
          </span>
          <div className="flex gap-1.5">
            {[100000, 250000, 500000, 1000000].map((count) => (
              <button
                key={count}
                disabled={isProcessing}
                onClick={() => onSelectRecords(count)}
                className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-all cursor-pointer ${
                  selectedRecords === count
                    ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50'
                }`}
              >
                {(count / 1000).toLocaleString()}k
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Button 1: Synchronous Blocking (Thread Saturation) */}
          <button
            onClick={onStartBlocking}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-rose-950/50 active:scale-95 transition-all cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4 text-rose-200" />
            <span>🚨 Sobrecargar Hilo Principal (Bloqueo Síncrono)</span>
          </button>

          {/* Button 2: Non-Blocking Event Loop (Yielding & Time-Slicing) */}
          <button
            onClick={onStartEventLoop}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-emerald-950/50 active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-200" />
            <span>⚡ Procesar con Event Loop (No Bloqueante)</span>
          </button>

          {/* Button 3: Abort / Stop */}
          {isProcessing && (
            <button
              onClick={onAbort}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 text-rose-400" />
              <span>Detener</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
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
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
          <div
            className={`h-full transition-all duration-150 rounded-full ${
              mode === 'BLOCKING'
                ? 'bg-gradient-to-r from-rose-500 to-red-600'
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
          isDangerLag
            ? 'bg-rose-950/70 border-rose-500 text-rose-200 animate-pulse'
            : 'bg-slate-950/60 border-slate-800 text-slate-300'
        }`}>
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between">
            <span>MAIN THREAD LAG</span>
            {isDangerLag && <span className="text-[9px] font-bold text-rose-400">100-150ms+</span>}
          </div>
          <div className="text-xl font-bold font-mono text-white my-1">
            {lagMs} <span className="text-xs font-normal text-slate-400">ms</span>
          </div>
          <div className={`text-[10px] font-mono ${isDangerLag ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
            {isDangerLag ? '⚠️ Zona de Bloqueo' : '✓ Fluido (<16ms)'}
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
          <div className="text-[10px] font-mono text-slate-400">TIEMPO TRANSCURRIDO</div>
          <div className="text-xl font-bold font-mono text-amber-300 my-1">
            {(metrics.elapsedTimeMs / 1000).toFixed(2)} <span className="text-xs font-normal text-slate-400">s</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">Duración total</div>
        </div>

        {/* KPI 5: Congestion Index */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400">ÍNDICE CONGESTIÓN</div>
          <div className="text-xl font-bold font-mono text-rose-300 my-1">
            {(metrics.calculatedCongestionIndex || 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">%</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">Densidad vial urbana</div>
        </div>

        {/* KPI 6: Speed Avg */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-mono text-slate-400">VELOCIDAD PROMEDIO</div>
          <div className="text-xl font-bold font-mono text-emerald-300 my-1">
            {(metrics.averageSpeedKmh || 0).toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">Telemetría de flota</div>
        </div>
      </div>
    </div>
  );
};
