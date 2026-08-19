'use client';

import React from 'react';
import { HelpCircle, Activity, RotateCcw, MousePointer } from 'lucide-react';
import { INPSummary, INPInteractionEntry, INPRating } from '../core/domain/models';

interface INPScoreCardProps {
  inpSummary: INPSummary;
  onResetINP: () => void;
  onOpenInfo: () => void;
}

export const INPScoreCard: React.FC<INPScoreCardProps> = ({
  inpSummary,
  onResetINP,
  onOpenInfo
}) => {
  const { worstInpMs, rating, totalInteractions, recentInteractions } = inpSummary;

  const getRatingBadge = (currentRating: INPRating) => {
    switch (currentRating) {
      case 'GOOD':
        return {
          label: 'BUENO (Óptimo)',
          color: 'bg-emerald-950/80 border-emerald-500 text-emerald-300',
          desc: '≤ 200 ms • Event Loop fluido y disponible'
        };
      case 'NEEDS_IMPROVEMENT':
        return {
          label: 'REQUIERE MEJORA',
          color: 'bg-amber-950/80 border-amber-500 text-amber-300',
          desc: '200 - 500 ms • Tareas en rango 100-150ms retrasan el render'
        };
      case 'POOR':
      default:
        return {
          label: 'DEFICIENTE (Crítico)',
          color: 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse',
          desc: '> 500 ms • Hilo principal saturado (Call Stack bloqueado)'
        };
    }
  };

  const badge = getRatingBadge(rating);
  const latest = recentInteractions[0];

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-100">
                Métrica Core Web Vital: INP (Interaction to Next Paint)
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                W3C Standard
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mide la capacidad de respuesta y latencia de cada interacción desde el clic hasta la pintura en pantalla.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenInfo}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors cursor-pointer"
            title="¿Cómo valida el Event Loop?"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">¿Cómo valida el Event Loop?</span>
          </button>
          <button
            onClick={onResetINP}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reiniciar métricas INP"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Score Card (5 cols) */}
        <div className="md:col-span-5 rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">PUNTUACIÓN INP ACTUAL (p98)</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${badge.color}`}>
              {badge.label}
            </span>
          </div>

          <div className="my-2 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono text-white tracking-tight">
              {worstInpMs}
            </span>
            <span className="text-sm font-mono text-slate-400">ms</span>
            <span className="text-xs text-slate-500 font-mono ml-auto">
              {totalInteractions} interacciones
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            {badge.desc}
          </p>

          {/* Threshold Visual Bar */}
          <div className="mt-3 flex flex-col gap-1">
            <div className="flex justify-between text-[9px] font-mono text-slate-500">
              <span className="text-emerald-400">Bueno (≤200ms)</span>
              <span className="text-amber-400">Mejora (200-500ms)</span>
              <span className="text-rose-400">Deficiente (&gt;500ms)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: '40%' }} />
              <div className="h-full bg-amber-500" style={{ width: '30%' }} />
              <div className="h-full bg-rose-500" style={{ width: '30%' }} />
            </div>
          </div>
        </div>

        {/* 3 Phases Breakdown of Latest Interaction (7 cols) */}
        <div className="md:col-span-7 rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">
              Desglose Anatómico de la Interacción ({latest ? latest.interactionType : 'Sin datos'})
            </span>
            {latest && (
              <span className="text-[10px] font-mono text-cyan-400">
                Total: {latest.totalDurationMs} ms
              </span>
            )}
          </div>

          {latest ? (
            <div className="grid grid-cols-3 gap-2">
              {/* Phase 1: Input Delay */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                <span className="text-[10px] font-mono text-slate-400">1. INPUT DELAY</span>
                <span className={`text-base font-bold font-mono my-1 ${
                  latest.inputDelayMs > 100 ? 'text-rose-400' : 'text-slate-200'
                }`}>
                  {latest.inputDelayMs} ms
                </span>
                <span className="text-[9px] text-slate-500 leading-tight">
                  Espera en la cola del Event Loop antes de ejecutar.
                </span>
              </div>

              {/* Phase 2: Processing Time */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                <span className="text-[10px] font-mono text-slate-400">2. PROCESSING</span>
                <span className="text-base font-bold font-mono text-slate-200 my-1">
                  {latest.processingDurationMs} ms
                </span>
                <span className="text-[9px] text-slate-500 leading-tight">
                  Duración síncrona del callback JS en Call Stack.
                </span>
              </div>

              {/* Phase 3: Presentation Delay */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col">
                <span className="text-[10px] font-mono text-slate-400">3. NEXT PAINT</span>
                <span className={`text-base font-bold font-mono my-1 ${
                  latest.presentationDelayMs > 50 ? 'text-amber-400' : 'text-slate-200'
                }`}>
                  {latest.presentationDelayMs} ms
                </span>
                <span className="text-[9px] text-slate-500 leading-tight">
                  Tiempo hasta que el render pipeline pinta el frame.
                </span>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">
              Haz clic en cualquier botón o arrastra el slider para registrar la primera interacción.
            </div>
          )}

          {/* Educational Note */}
          <div className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800">
            💡 <strong>Fórmula INP:</strong> Latencia Total = Input Delay (Event Loop) + Callback JS + Next Paint (rAF)
          </div>
        </div>
      </div>

      {/* Recent Interactions Stream Log */}
      {recentInteractions.length > 0 && (
        <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3">
          <span className="text-[11px] font-mono text-slate-400 block mb-2">
            Registro en Vivo de Interacciones Capturadas:
          </span>
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
            {recentInteractions.slice(0, 8).map((inter: INPInteractionEntry) => (
              <div
                key={inter.id}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 ${
                  inter.rating === 'GOOD'
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : inter.rating === 'NEEDS_IMPROVEMENT'
                    ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                    : 'bg-rose-950/60 border-rose-700/80 text-rose-300'
                }`}
              >
                <MousePointer className="w-3 h-3" />
                <span>{inter.interactionType} ({inter.targetElement}):</span>
                <strong className="font-bold">{inter.totalDurationMs} ms</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
