'use client';

import React from 'react';
import { X, CheckCircle, Code2, Layers, Cpu, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

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
                Arquitectura de Software y Principios POO / SOLID
              </h2>
              <p className="text-xs text-slate-400">
                Diseño profesional con Principio de Responsabilidad Única (SRP) y patrones de diseño.
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
          {/* Section 1: POO & Single Responsibility Principle (SRP) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Code2 className="w-4 h-4" />
              <span>1. Clases Implementadas y Principio de Responsabilidad Única (SRP)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono font-bold text-cyan-300">TrafficDataGenerator</span>
                <p className="text-xs text-slate-400">
                  <strong>Responsabilidad Única:</strong> Exclusivamente generar datos sintéticos, nodos viales y lotes de telemetría geoespacial (pings de GPS y velocidades). No conoce nada de render ni de estrategias.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono font-bold text-cyan-300">TrafficMetricsEngine</span>
                <p className="text-xs text-slate-400">
                  <strong>Responsabilidad Única:</strong> Lógica de cálculo matemático puro e intensivo en CPU (fórmulas Haversine, fricción vial, matrices de congestión). No maneja asincronía ni estado de UI.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono font-bold text-cyan-300">SynchronousBlockingStrategy</span>
                <p className="text-xs text-slate-400">
                  <strong>Responsabilidad Única:</strong> Implementar la estrategia de ejecución síncrona continua. Satura deliberadamente el Call Stack en el hilo principal sin ceder control al Event Loop.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono font-bold text-cyan-300">EventLoopDeferredStrategy</span>
                <p className="text-xs text-slate-400">
                  <strong>Responsabilidad Única:</strong> Implementar la estrategia no bloqueante mediante particionamiento de tiempo (time-slicing ~12ms), microtareas (<code className="text-amber-300 font-mono">queueMicrotask</code>) y cesión voluntaria (<code className="text-amber-300 font-mono">yield</code>/<code className="text-amber-300 font-mono">setTimeout</code>).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono font-bold text-cyan-300">EventLoopLagMonitor</span>
                <p className="text-xs text-slate-400">
                  <strong>Responsabilidad Única:</strong> Medir el drift de latencia del hilo principal y la tasa de FPS mediante heartbeats y <code className="text-amber-300 font-mono">requestAnimationFrame</code>, alertando cuando se supera el rango crítico de <strong>100 - 150 ms</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="font-mono font-bold text-cyan-300">TrafficProcessingController (Fachada)</span>
                <p className="text-xs text-slate-400">
                  <strong>Responsabilidad Única:</strong> Orquestar la inyección de dependencias, la selección de estrategias (Strategy Pattern), los tokens de cancelación y el flujo reactivo de eventos hacia React.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Event Loop & The 100-150ms Threshold */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
              <span>2. Fundamentos del Event Loop y el Rango Crítico de 100 - 150 ms</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 space-y-2 text-xs leading-relaxed text-slate-300">
              <p>
                En JavaScript (monohilo / Single-Threaded), el <strong>Event Loop</strong> coordina la ejecución de código, la recolección y procesamiento de eventos, y la ejecución de subtareas encoladas.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>
                  <strong>Límite de Long Tasks (50 ms):</strong> Según el modelo RAIL de Google, cualquier tarea síncrona continua que supere los 50 ms se clasifica como <em>Long Task</em>.
                </li>
                <li>
                  <strong>Zona de Congelamiento (100 - 150 ms):</strong> En este rango específico, el usuario percibe retraso táctil evidente (Jank), los eventos de arrastre (sliders) se bloquean por completo y el navegador suspende la pintura a 60 FPS (16.6ms por frame), reduciendo los FPS a 0.
                </li>
                <li>
                  <strong>Solución con Time-Slicing y Microtareas:</strong> Al dividir el cálculo en fragmentos de 10-14 ms y ceder el control al Event Loop, el motor de JavaScript puede despachar las microtareas pendientes, atender los clics del usuario y ejecutar el Render Pipeline fluidamente.
                </li>
              </ul>
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
