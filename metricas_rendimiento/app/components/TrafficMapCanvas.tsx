'use client';

import React, { useEffect, useRef } from 'react';
import { TrafficCanvasRenderer } from '../core/rendering/TrafficCanvasRenderer';
import { Compass, Car, AlertTriangle } from 'lucide-react';

interface TrafficMapCanvasProps {
  isBlocked: boolean;
  mode: string;
}

export const TrafficMapCanvas: React.FC<TrafficMapCanvasProps> = ({ isBlocked }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<TrafficCanvasRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const renderer = new TrafficCanvasRenderer();
    rendererRef.current = renderer;

    const updateCanvasSize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(300, rect.width);
      const height = Math.max(250, rect.height);
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      renderer.initializeFleet(70, width, height);
    };

    updateCanvasSize();

    // Observador de cambios de tamaño del contenedor
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(container);

    let animationFrameId: number;

    const renderLoop = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(300, rect.width);
      const height = Math.max(250, rect.height);
      const ctx = canvas.getContext('2d');

      if (ctx) {
        renderer.renderFrame(ctx, width, height);
      }
      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Actualizar estado de bloqueo en el renderizador
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setBlockedState(isBlocked);
    }
  }, [isBlocked]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[320px] lg:h-[380px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl"
    >
      {/* Canvas Element */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* Overlay UI Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-mono text-slate-300">
        <Compass
          className={`w-4 h-4 text-cyan-400 ${isBlocked ? '' : 'animate-spin'}`}
          style={{ animationDuration: '8s' }}
        />
        <span>RADAR DE TRÁFICO GEOESPACIAL EN VIVO</span>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs font-mono">
        <Car className="w-4 h-4 text-amber-400" />
        <span className="text-slate-300">70 Vehículos Activos</span>
      </div>

      {/* Freeze Warning Overlay */}
      {isBlocked && (
        <div className="absolute inset-0 bg-rose-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-rose-950/90 border border-rose-500 shadow-2xl text-rose-200 animate-pulse">
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-sm">HILO PRINCIPAL SATURADO (100 - 150 ms)</p>
              <p className="text-xs text-rose-300">El Event Loop no puede despachar requestAnimationFrame ni eventos de usuario.</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Status bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-950/70 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-400">
        <span>Coords: 19.4326° N, 99.1332° W</span>
        <span className={isBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
          {isBlocked ? '🛑 ANIMACIÓN CONGELADA (JANK)' : '🟢 PIPELINE DE RENDER EN TIEMPO REAL (60 FPS)'}
        </span>
      </div>
    </div>
  );
};
