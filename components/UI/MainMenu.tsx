
import React from 'react';
import { Play, Settings, Github } from 'lucide-react';

interface MainMenuProps {
  onPlay: () => void;
  onSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onPlay, onSettings }) => {
  const handleClick = (action: () => void) => {
    window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'ui-click' }));
    action();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
      {/* Title Section */}
      <div className="mb-12 text-center animate-in fade-in zoom-in duration-1000">
        <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-purple-400 to-purple-900 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-tighter">
          TERRAPLANE
        </h1>
        <h2 className="text-4xl font-bold text-green-500 -mt-2 tracking-widest drop-shadow-md">
          UNDEAD GARDEN
        </h2>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-4 w-64 animate-in slide-in-from-bottom-10 duration-700 delay-200">
        <button 
          onClick={() => handleClick(onPlay)}
          className="group relative flex items-center justify-center gap-3 px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xl transition-all hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
        >
          <Play className="w-6 h-6 fill-current" />
          PLAY
        </button>

        <button 
          onClick={() => handleClick(onSettings)}
          className="flex items-center justify-center gap-3 px-8 py-3 bg-slate-800/80 hover:bg-slate-700 text-gray-200 rounded-xl font-bold text-lg transition-all border border-slate-600 backdrop-blur-md"
        >
          <Settings className="w-5 h-5" />
          SETTINGS
        </button>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 text-white/40 text-sm font-mono flex items-center gap-2">
        <span>v1.2.0 - Spooky Update</span>
      </div>
    </div>
  );
};
