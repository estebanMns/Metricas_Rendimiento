'use client';

import React from 'react';
import { Layers, ArrowRight, RefreshCw, Cpu, CheckCircle2, Clock, Palette } from 'lucide-react';
import { ProcessingMode } from '../core/domain/models';

interface EventLoopVisualizerProps {
  mode: ProcessingMode;
  fps: number;
  lagMs: number;
}

export const EventLoopVisualizer: React.FC<EventLoopVisualizerProps> = ({ mode, fps, lagMs }) => {
  const isSyncBlocked = mode === 'BLOCKING' || lagMs >= 100;
  const isEventLoopActive = mode === 'EVENT_LOOP';

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col gap-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isEventLoopActive ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Arquitectura del Event Loop y Fases del Runtime JS
            </h2>
            <p className="text-xs text-slate-400">
              Visualiza el flujo de tareas, microtareas y el pipeline de renderizado del navegador en tiempo real.
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Estado: <strong className={isSyncBlocked ? 'text-rose-400' : isEventLoopActive ? 'text-emerald-400' : 'text-slate-400'}>
            {isSyncBlocked ? 'CALL STACK TRABADO' : isEventLoopActive ? 'TIME-SLICING ACTIVO' : 'EN REPOSO'}
          </strong>
        </div>
      </div>

      {/* 4 Phases Flowchart */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {/* Phase 1: Call Stack */}
        <div className={`rounded-xl p-3.5 border transition-all duration-300 flex flex-col justify-between ${
          isSyncBlocked
            ? 'bg-rose-950/80 border-rose-500 shadow-lg shadow-rose-950/50'
            : isEventLoopActive
            ? 'bg-emerald-950/40 border-emerald-500/60'
            : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              1. Call Stack (Pila)
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isSyncBlocked ? 'bg-rose-500/20 text-rose-300 font-bold' : 'bg-slate-800 text-slate-400'
            }`}>
              {isSyncBlocked ? 'SATURADO' : 'LIBRE/CEDIDO'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            {isSyncBlocked
              ? '🚨 Bucle síncrono acapara el hilo. El Call Stack no se vacía, impidiendo cualquier otra tarea.'
              : '⚡ Ejecuta cálculos en pequeñas porciones y se vacía rápidamente al ceder control.'}
          </p>
          <div className="text-[10px] font-mono text-slate-500">
            {isSyncBlocked ? 'Frame budget: > 150ms (Jank)' : 'Frame budget: ~12ms (Fluido)'}
          </div>
        </div>

        {/* Phase 2: Microtask Queue */}
        <div className={`rounded-xl p-3.5 border transition-all duration-300 flex flex-col justify-between ${
          isEventLoopActive
            ? 'bg-cyan-950/50 border-cyan-500/70 shadow-lg shadow-cyan-950/40'
            : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              2. Microtask Queue
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              queueMicrotask
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Prioridad alta. Se procesa completamente después de cada llamada sincrónica antes del render o macrotareas.
          </p>
          <div className="text-[10px] font-mono text-cyan-400/80">
            Promise.then / queueMicrotask
          </div>
        </div>

        {/* Phase 3: Macrotask / Task Queue */}
        <div className={`rounded-xl p-3.5 border transition-all duration-300 flex flex-col justify-between ${
          isSyncBlocked
            ? 'bg-amber-950/40 border-amber-600/60'
            : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              3. Macrotask Queue
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              Eventos / I/O
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            {isSyncBlocked
              ? '⚠️ Clics del usuario y temporizadores quedan represados en cola hasta que termine el bloqueo.'
              : 'Despacha eventos de entrada, clicks, timeouts y yields ordenadamente.'}
          </p>
          <div className="text-[10px] font-mono text-amber-400/80">
            setTimeout / Clics / scheduler.yield
          </div>
        </div>

        {/* Phase 4: Render Pipeline */}
        <div className={`rounded-xl p-3.5 border transition-all duration-300 flex flex-col justify-between ${
          isSyncBlocked
            ? 'bg-rose-950/40 border-rose-700/60'
            : isEventLoopActive || fps >= 50
            ? 'bg-emerald-950/50 border-emerald-500/70 shadow-lg shadow-emerald-950/40'
            : 'bg-slate-950/70 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-400" />
              4. Render Pipeline
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              fps < 30 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300 font-bold'
            }`}>
              {fps} FPS
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            {isSyncBlocked
              ? '🛑 rAF / Recalculate Style / Layout / Paint quedan BLOQUEADOS. Pantalla congelada.'
              : '🟢 Se ejecuta fluidamente a 60 FPS cada 16.6ms gracias a la cesión del hilo.'}
          </p>
          <div className="text-[10px] font-mono text-emerald-400/80">
            requestAnimationFrame & Paint
          </div>
        </div>
      </div>
    </div>
  );
};
