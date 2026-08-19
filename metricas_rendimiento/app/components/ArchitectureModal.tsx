'use client';

import React from 'react';
import { X, Code2, Layers, ShieldAlert, Activity, CheckCircle, Clock, Zap } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base lg:text-lg font-bold text-white">
                Fundamentos Técnicos: POO, Event Loop y Validación con INP
              </h2>
              <p className="text-xs text-slate-400">
                Cómo la métrica Interaction to Next Paint demuestra empíricamente la salud del Event Loop.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-slate-300 text-xs sm:text-sm">
          {/* Section 1: How INP Validates the Event Loop */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-900 border border-indigo-500/40 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>¿Cómo valida el INP (Interaction to Next Paint) el uso del Event Loop?</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              El <strong>INP (Interaction to Next Paint)</strong> es la métrica oficial de Google Core Web Vitals que mide la latencia total desde que un usuario realiza una acción física (clic, tap, tecla o arrastre) hasta que el navegador presenta el siguiente fotograma visual con el cambio en la pantalla.
            </p>

            <div className="p-3 bg-slate-950/90 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300">
              INP = Input Delay (Espera en Cola) + Processing Time (Callback JS) + Presentation Delay (Next Paint)
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 space-y-1">
                <span className="font-bold text-rose-300 flex items-center gap-1.5 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Con Hilo Principal Bloqueado (Síncrono 100-150ms)
                </span>
                <p className="text-[11px] text-slate-400">
                  1. <strong>Input Delay se dispara:</strong> El evento del usuario ingresa a la cola de Macrotareas, pero como el Call Stack está saturado, el Event Loop no puede tomar el evento hasta que termine el cálculo pesado.<br/>
                  2. <strong>Presentation Delay se bloquea:</strong> El navegador no puede ejecutar el ciclo de estilo, layout y pintura.<br/>
                  3. <strong>Resultado:</strong> INP salta a &gt; 500 ms (Clasificación: <em>POOR / Deficiente</em>).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 space-y-1">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Con Event Loop Diferido (Time-Slicing & Microtareas)
                </span>
                <p className="text-[11px] text-slate-400">
                  1. <strong>Input Delay mínimo (&lt;12ms):</strong> Como el cálculo cede voluntariamente el hilo cada 10-12ms, el Event Loop atiende el clic del usuario en la siguiente frontera de tiempo.<br/>
                  2. <strong>Presentation Delay fluido:</strong> El Render Pipeline actualiza la pantalla a 60 FPS (cada 16.6ms).<br/>
                  3. <strong>Resultado:</strong> INP óptimo de 15-50 ms (Clasificación: <em>GOOD / Bueno</em>).
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: SOLID & POO Architecture */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Code2 className="w-4 h-4" />
              <span>Arquitectura POO y Responsabilidad Única (SRP)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-mono font-bold text-cyan-300">INPMonitor</span>
                <p className="text-xs text-slate-400">
                  <strong>SRP:</strong> Medir y desglosar las 3 fases de latencia de las interacciones del usuario (Input Delay, Processing, Presentation) mediante PerformanceObserver y doble rAF.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-mono font-bold text-cyan-300">MainThreadLockManager</span>
                <p className="text-xs text-slate-400">
                  <strong>SRP:</strong> Gestionar el bloqueo continuo síncrono en ráfagas de 100-150ms y el desbloqueo instantáneo con liberación del Call Stack.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-mono font-bold text-cyan-300">EventLoopDeferredStrategy</span>
                <p className="text-xs text-slate-400">
                  <strong>SRP:</strong> Estrategia no bloqueante con microtareas (<code className="text-amber-300">queueMicrotask</code>) y cesión (<code className="text-amber-300">scheduler.yield</code> / <code className="text-amber-300">setTimeout</code>).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                <span className="font-mono font-bold text-cyan-300">TrafficProcessingController</span>
                <p className="text-xs text-slate-400">
                  <strong>SRP:</strong> Fachada que orquesta el generador de datos, motores de cálculo, monitores de lag e INP y notificaciones a la UI.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 transition-all cursor-pointer"
          >
            Entendido, Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
