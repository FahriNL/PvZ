
import React from 'react';
import { GameSettings } from '../../types';
import { ArrowLeft, Volume2, Music, Monitor, Volume1 } from 'lucide-react';

interface SettingsMenuProps {
  settings: GameSettings;
  onUpdate: (newSettings: GameSettings) => void;
  onBack: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ settings, onUpdate, onBack }) => {
  
  const handleChange = (key: keyof GameSettings, value: any) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
            <ArrowLeft className="text-white" />
          </button>
          <h2 className="text-3xl font-bold text-white">SETTINGS</h2>
        </div>

        <div className="space-y-8">
          {/* Audio Section */}
          <div className="space-y-4">
            <h3 className="text-purple-400 text-xs font-bold uppercase tracking-widest">Audio</h3>
            
            {/* Master Volume */}
            <div>
              <div className="flex justify-between text-sm text-slate-300 mb-2">
                <span className="flex items-center gap-2"><Volume2 size={16} /> Master Volume</span>
                <span>{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleChange('masterVolume', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Music Volume */}
            <div>
              <div className="flex justify-between text-sm text-slate-300 mb-2">
                <span className="flex items-center gap-2"><Music size={16} /> Music Volume</span>
                <span>{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleChange('musicVolume', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex justify-between text-sm text-slate-300 mb-2">
                <span className="flex items-center gap-2"><Volume1 size={16} /> SFX Volume</span>
                <span>{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleChange('sfxVolume', parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>
          </div>

          <div className="w-full h-px bg-slate-700" />

          {/* Graphics Section */}
          <div className="space-y-4">
            <h3 className="text-purple-400 text-xs font-bold uppercase tracking-widest">Graphics</h3>
            
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-300 text-sm">
                <Monitor size={16} /> High Quality (Shadows)
              </span>
              <button 
                onClick={() => handleChange('highQuality', !settings.highQuality)}
                className={`w-12 h-6 rounded-full transition-colors relative ${settings.highQuality ? 'bg-green-500' : 'bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.highQuality ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Disabling High Quality turns off shadows and reduces resolution for better performance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
