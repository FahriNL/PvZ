
import React from 'react';
import { RefreshCcw, Skull } from 'lucide-react';

interface GameOverScreenProps {
  level: number;
  xp: number;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ level, xp, onRestart }) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-sm animate-in fade-in duration-1000">
      <Skull className="w-24 h-24 text-red-500 mb-4 animate-bounce" />
      <h1 className="text-6xl font-black text-white mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] tracking-widest">DEFEATED</h1>
      <p className="text-red-200 text-xl mb-8 font-mono">The garden has fallen...</p>

      <div className="bg-black/50 p-8 rounded-2xl border border-red-900/50 mb-8 text-center min-w-[320px] shadow-2xl transform hover:scale-105 transition-transform">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <div className="text-red-400 text-xs uppercase tracking-widest mb-1">Survived Until</div>
            <div className="text-5xl font-bold text-white">Lvl {level}</div>
          </div>
          <div>
            <div className="text-yellow-600 text-xs uppercase tracking-widest mb-1">Total Score</div>
            <div className="text-5xl font-bold text-yellow-400">{Math.floor(xp)}</div>
          </div>
        </div>
      </div>

      <button 
        onClick={onRestart}
        className="group flex items-center gap-3 px-10 py-5 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold text-xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(220,38,38,0.6)]"
      >
        <RefreshCcw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
        PLANT AGAIN
      </button>
    </div>
  );
};
