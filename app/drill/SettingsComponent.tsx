import { useState } from "react";
import { Config, getConfig, updateConfig } from "./settings"; // dopasuj ścieżki

interface Props {
  onClose: () => void;
}

export default function SettingsComponent({ onClose }: Props) {
  const [config, setConfig] = useState<Config>(getConfig());
  const [_, setTick] = useState(0); // Stan do wymuszania re-rendera przy zmianie trybu

  const handleSliderChange = (key: keyof Config, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    updateConfig({ [key]: value });
  };

  return (
    <div className="absolute left-0 mt-2 w-72 p-5 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50">
      <h3 className="text-orange-400 font-bold mb-4 uppercase tracking-wider text-xs">
        Drill Configuration
      </h3>

      <div className="space-y-6">
        {/* Suwak: Sensitivity */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-400">Sensitivity</label>
            <span className="text-xs text-orange-400 font-mono">{config.treshold}</span>
          </div>
          <input
            type="range" min="0.01" max="0.5" step="0.01"
            value={config.treshold}
            onChange={(e) => handleSliderChange('treshold', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Suwak: Recording Duration */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-400">Recording Duration (ms)</label>
            <span className="text-xs text-orange-400 font-mono">{config.recordingDuration}</span>
          </div>
          <input
            type="range" min="0" max="10000" step="100"
            value={config.recordingDuration}
            onChange={(e) => handleSliderChange('recordingDuration', parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>

        {/* Suwak: Playback Speed */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="text-xs text-zinc-400">Playback Speed</label>
            <span className="text-xs text-orange-400 font-mono">{config.playbackSpeed}</span>
          </div>
          <input
            type="range" min="0.1" max="2.0" step="0.1"
            value={config.playbackSpeed}
            onChange={(e) => handleSliderChange('playbackSpeed', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
        </div>
      </div>

     <div className="flex-1 flex bg-zinc-900 p-1 rounded-full border border-zinc-800 mx-4 relative overflow-hidden">
  <button
    onClick={() => {
      updateConfig({ mode: "DLINE" });
      setTick(0); // <--- TO WYMUSZA RE-RENDER
    }}
    className={`flex-1 py-2 rounded-full text-[11px] font-black transition-all z-10 ${
      config.mode === "DLINE" 
        ? "bg-orange-600 text-white shadow-lg" 
        : "text-zinc-500"
    }`}
  >
    FOOTBALL
  </button>

  <button
    onClick={() => {
      updateConfig({ mode: "SPRINT" });
      setTick(1); // <--- TO WYMUSZA RE-RENDER
    }}
    className={`flex-1 py-2 rounded-full text-[11px] font-black transition-all z-10 ${
      config.mode === "SPRINT" 
        ? "bg-orange-600 text-white shadow-lg" 
        : "text-zinc-500"
    }`}
  >
    SPRINT
  </button>
</div>

      <button
        onClick={onClose}
        className="mt-6 w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 border border-zinc-700 transition-colors"
      >
        Close
      </button>
    </div>
  );
}