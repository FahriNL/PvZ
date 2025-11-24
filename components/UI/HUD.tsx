
import React from 'react';

interface HUDProps {
  level: number;
  xp: number;
  nextLevelXp: number;
}

export const HUD: React.FC<HUDProps> = ({ level, xp, nextLevelXp }) => {
  const progress = Math.min(100, (xp / nextLevelXp) * 100);

  return (
    <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-10 flex flex-col items-center">
      {/* Level Badge */}
      <div className="bg-gray-900/80 border-2 border-yellow-500 rounded-full w-16 h-16 flex items-center justify-center mb-2 shadow-lg">
        <span className="text-2xl font-bold text-yellow-400">{level}</span>
      </div>

      {/* XP Bar Container */}
      <div className="w-full max-w-md bg-gray-800/80 h-6 rounded-full border border-gray-600 relative overflow-hidden shadow-lg">
        {/* Fill */}
        <div 
          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        {/* Text */}
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-md">
          XP: {Math.floor(xp)} / {nextLevelXp}
        </div>
      </div>

      {/* Next Milestone Info */}
      {level % 5 !== 0 && (
         <div className="text-xs text-yellow-200 mt-1 opacity-80 font-mono">
           Next Upgrade Choice at Level {Math.ceil(level / 5) * 5}
         </div>
      )}
    </div>
  );
};
