import React, { useState } from 'react';
import { useIslandPosition } from '@/src/context/IslandPositionContext';
import { X, Copy, Check, RotateCcw, Sliders } from 'lucide-react';

export function IslandPositionPanel() {
  const { config, updateConfig, resetConfig, isEditorOpen, setIsEditorOpen } = useIslandPosition();
  const [copied, setCopied] = useState(false);

  if (!isEditorOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed top-16 right-4 sm:right-6 z-50 w-[92vw] max-w-[360px] bg-[#1E293B] text-slate-100 border-2 border-amber-400 rounded-xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md">
      <div className="bg-[#0F172A] px-4 py-3 border-b border-amber-400/40 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-amber-400 font-bold text-sm uppercase tracking-wider">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Island Position</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetConfig}
            title="Reset Defaults"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsEditorOpen(false)}
            className="p-1 hover:bg-rose-900/50 rounded text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 font-mono text-xs">
        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/80 space-y-2">
          <div>
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>Left / Right</span>
              <span className="text-amber-400 font-bold">{config.offsetX}px</span>
            </div>
            <input
              type="range"
              min={-200}
              max={200}
              step={1}
              value={config.offsetX}
              onChange={(e) => updateConfig({ offsetX: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-400 bg-slate-800"
            />
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>Up / Down</span>
              <span className="text-amber-400 font-bold">{config.offsetY}px</span>
            </div>
            <input
              type="range"
              min={-200}
              max={200}
              step={1}
              value={config.offsetY}
              onChange={(e) => updateConfig({ offsetY: parseInt(e.target.value, 10) })}
              className="w-full accent-amber-400 bg-slate-800"
            />
          </div>
          <div>
            <div className="flex justify-between text-slate-300 mb-0.5">
              <span>Scale</span>
              <span className="text-amber-400 font-bold">{config.scale.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.05}
              value={config.scale}
              onChange={(e) => updateConfig({ scale: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 bg-slate-800"
            />
          </div>
        </div>

        <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
          {JSON.stringify(config, null, 2)}
        </pre>
        <button
          onClick={handleCopy}
          className="w-full py-2 px-4 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-800" />
              <span>COPIED!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>COPY CONFIG</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
