'use client';

import React, { useEffect, useState } from 'react';
import { Activity, ShieldAlert, Cpu, Radio, Sparkles, Layers } from 'lucide-react';
import { ProcessingMode } from '../core/domain/models';

interface TrafficHeaderProps {
  mode: ProcessingMode;
  fps: number;
  lagMs: number;
  onOpenArchitecture: () => void;
}

export const TrafficHeader: React.FC<TrafficHeaderProps> = ({
  mode,
  fps,
  lagMs,
  onOpenArchitecture
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('es-ES', { hour12: false, fractionalSecondDigits: 2 } as Intl.DateTimeFormatOptions));
    };
    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, []);

  const isBlocked = mode === 'BLOCKING' || lagMs >= 100;

  return (
    <header className="relative w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 z-30 shadow-2xl">
      {/* Title and Branding */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] shadow-lg shadow-cyan-500/20">
          <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg lg:text-xl font-bold bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent tracking-tight">
              GeoTraffic Telemetry Hub
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider font-semibold rounded bg-cyan-950/80 border border-cyan-800/60 text-cyan-300">
              POO • SOLID (SRP)
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 font-sans">
            <span>Caso de Estudio: Event Loop & Sobrecarga del Hilo Principal</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400/90 font-mono text-[11px]">Rango de prueba: 100 - 150 ms</span>
          </p>
        </div>
      </div>

      {/* Real-time Status Badges */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Main Thread Status Pill */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 ${
          isBlocked
            ? 'bg-rose-950/70 border-rose-600/80 text-rose-300 shadow-lg shadow-rose-900/30 animate-pulse'
            : mode === 'EVENT_LOOP'
            ? 'bg-emerald-950/70 border-emerald-600/80 text-emerald-300 shadow-lg shadow-emerald-900/20'
            : 'bg-slate-900/80 border-slate-700 text-slate-300'
        }`}>
          {isBlocked ? (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          ) : (
            <Cpu className={`w-4 h-4 ${mode === 'EVENT_LOOP' ? 'text-emerald-400' : 'text-slate-400'}`} />
          )}
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 leading-none">ESTADO HILO PRINCIPAL</span>
            <span className="font-bold">
              {isBlocked ? '🚨 SATURADO / BLOQUEADO' : mode === 'EVENT_LOOP' ? '⚡ NO BLOQUEANTE (YIELD)' : '🟢 DISPONIBLE (IDLE)'}
            </span>
          </div>
        </div>

        {/* Live FPS Counter */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${
          fps < 30 ? 'bg-amber-950/60 border-amber-600/60 text-amber-300' : 'bg-slate-900/80 border-slate-800 text-cyan-300'
        }`}>
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>FPS: <strong className="font-bold text-white">{fps}</strong></span>
        </div>

        {/* System Time */}
        <div className="hidden sm:flex items-center px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 text-xs font-mono">
          ⏱️ {time || '--:--:--'}
        </div>

        {/* Architecture & SRP Documentation Button */}
        <button
          onClick={onOpenArchitecture}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 hover:text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Ver Arquitectura POO (SRP)</span>
        </button>
      </div>
    </header>
  );
};
