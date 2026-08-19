'use client';

import React, { useState } from 'react';
import { Sliders, MousePointerClick, Zap, RotateCcw, Activity } from 'lucide-react';
import { INPMonitor } from '../core/monitoring/INPMonitor';

interface InteractiveStressTesterProps {
  isBlocked: boolean;
  blockRangeMs: number;
  inpMonitor?: INPMonitor;
  onBlockRangeChange: (val: number) => void;
}

export const InteractiveStressTester: React.FC<InteractiveStressTesterProps> = ({
  isBlocked,
  blockRangeMs,
  inpMonitor,
  onBlockRangeChange
}) => {
  const [sliderValue, setSliderValue] = useState<number>(45);
  const [clickCount, setClickCount] = useState<number>(0);
  const [lastClickLatency, setLastClickLatency] = useState<number | null>(null);

  const handleUserClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const eventStartTime = e.timeStamp || performance.now();
    const processingStart = performance.now();

    setClickCount((prev) => prev + 1);

    const processingEnd = performance.now();
    const immediateLatency = Math.round(processingEnd - eventStartTime);
    setLastClickLatency(immediateLatency);

    if (inpMonitor) {
      inpMonitor.recordManualInteraction(
        'click',
        'Reactor-Button',
        eventStartTime,
        processingStart,
        processingEnd
      );
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const eventStartTime = performance.now();
    const processingStart = performance.now();
    const val = Number(e.target.value);
    setSliderValue(val);
    const processingEnd = performance.now();

    if (inpMonitor) {
      inpMonitor.recordManualInteraction(
        'input',
        'Friction-Slider',
        eventStartTime,
        processingStart,
        processingEnd
      );
    }
  };

  const handleResetClicks = () => {
    setClickCount(0);
    setLastClickLatency(null);
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center">
            <Sliders className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Generador de Interacciones & Pruebas de INP
            </h2>
            <p className="text-xs text-slate-400">
              Interactúa con estos elementos durante el bloqueo síncrono para verificar cómo se degrada el INP.
            </p>
          </div>
        </div>

        {/* Target Range Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-600/60 text-amber-300 text-xs font-mono">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Calibración: <strong>100 - 150 ms</strong></span>
        </div>
      </div>

      {/* Grid of Interactive Elements */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Real-time Responsive Slider */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Control Deslizante en Vivo</span>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/60">
              {sliderValue}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Intenta arrastrar este slider mientras el hilo esté bloqueado:
          </p>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={handleSliderChange}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
            <span>0% Fricción</span>
            <span>100% Turbulencia</span>
          </div>
        </div>

        {/* 2. Reactive Click Counter */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Reactor de Clics e INP</span>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60">
              {clickCount} clics
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Durante el bloqueo, el clic se retiene en el Event Loop y dispara el INP al desbloquear.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUserClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              <span>¡Clic para Medir INP!</span>
            </button>
            <button
              onClick={handleResetClicks}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reiniciar contador"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
            <span>Latencia del evento:</span>
            <strong className={lastClickLatency && lastClickLatency > 100 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {lastClickLatency !== null ? `${lastClickLatency} ms` : '--'}
            </strong>
          </div>
        </div>

        {/* 3. Latency Range Selector (100 - 150 ms) */}
        <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/70 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-300">Rango de Sobrecarga</span>
            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
              {blockRangeMs} ms
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Duración de bloqueo síncrono continuo por ráfaga:
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {[100, 125, 150, 250].map((preset) => (
              <button
                key={preset}
                onClick={() => onBlockRangeChange(preset)}
                className={`px-2.5 py-1 text-[11px] font-mono rounded cursor-pointer transition-all ${
                  blockRangeMs === preset
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {preset} ms {preset >= 100 && preset <= 150 ? '⭐' : ''}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-amber-400/80 font-mono">
            * 100 - 150 ms degrada el INP hacia &#39;Needs Improvement&#39; o &#39;Poor&#39;.
          </div>
        </div>
      </div>
    </div>
  );
};
