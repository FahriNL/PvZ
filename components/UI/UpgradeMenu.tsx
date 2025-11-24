
import React from 'react';
import { UpgradeOption, PlayerStats } from '../../types';
import { Shield, Zap, Heart, Crosshair, Sprout } from 'lucide-react';

const UPGRADES: Omit<UpgradeOption, 'apply'>[] = [
  { 
    id: 'fertilizer', 
    name: 'Fertilizer', 
    description: 'Increase Max HP by 20 and heal fully.', 
    icon: 'heart', 
    rarity: 'common' 
  },
  { 
    id: 'photosynthesis', 
    name: 'Photosynthesis', 
    description: 'Increase Health Regeneration by +1 HP/sec.', 
    icon: 'leaf', 
    rarity: 'rare' 
  },
  { 
    id: 'thorns', 
    name: 'Thorns', 
    description: 'Increase Base Damage by 15%.', 
    icon: 'sword', 
    rarity: 'common' 
  },
  { 
    id: 'gmo', 
    name: 'Genetic Mod', 
    description: 'Huge Damage Boost (+30%) but -10 Max HP.', 
    icon: 'dna', 
    rarity: 'epic' 
  },
  {
    id: 'root_reinforcement',
    name: 'Root Armor',
    description: 'Increase Max HP by 50.',
    icon: 'shield',
    rarity: 'rare'
  }
];

// Helper to get logic
const getApplyLogic = (id: string) => {
  switch(id) {
    case 'fertilizer': return (s: PlayerStats) => ({ ...s, maxHp: s.maxHp + 20 });
    case 'photosynthesis': return (s: PlayerStats) => ({ ...s, regenRate: s.regenRate + 1 });
    case 'thorns': return (s: PlayerStats) => ({ ...s, damageMultiplier: s.damageMultiplier + 0.15 });
    case 'gmo': return (s: PlayerStats) => ({ ...s, damageMultiplier: s.damageMultiplier + 0.3, maxHp: Math.max(50, s.maxHp - 10) });
    case 'root_reinforcement': return (s: PlayerStats) => ({ ...s, maxHp: s.maxHp + 50 });
    default: return (s: PlayerStats) => s;
  }
};

interface UpgradeMenuProps {
  onSelect: (upgrade: UpgradeOption) => void;
}

export const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ onSelect }) => {
  // Pick 3 random
  const options = React.useMemo(() => {
    const shuffled = [...UPGRADES].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(u => ({ ...u, apply: getApplyLogic(u.id) }));
  }, []);

  const getIcon = (icon: string) => {
    switch(icon) {
      case 'heart': return <Heart className="w-8 h-8 text-red-500" />;
      case 'leaf': return <Sprout className="w-8 h-8 text-green-500" />;
      case 'sword': return <Crosshair className="w-8 h-8 text-blue-500" />;
      case 'shield': return <Shield className="w-8 h-8 text-yellow-500" />;
      case 'dna': return <Zap className="w-8 h-8 text-purple-500" />;
      default: return <Zap />;
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <h2 className="text-4xl font-bold text-yellow-400 mb-2 animate-pulse">LEVEL UP!</h2>
        <p className="text-white mb-8">Choose a mutation to evolve</p>

        <div className="flex gap-4 flex-wrap justify-center p-4">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className={`
                relative group w-64 p-6 rounded-xl border-2 transition-all transform hover:scale-105 hover:-translate-y-2
                flex flex-col items-center text-center gap-4
                ${opt.rarity === 'epic' ? 'bg-purple-900/80 border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]' : ''}
                ${opt.rarity === 'rare' ? 'bg-blue-900/80 border-blue-400 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]' : ''}
                ${opt.rarity === 'common' ? 'bg-slate-800/80 border-slate-500 hover:shadow-[0_0_20px_rgba(148,163,184,0.5)]' : ''}
              `}
            >
              <div className="p-3 bg-white/10 rounded-full">
                {getIcon(opt.icon)}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white">{opt.name}</h3>
                <span className={`text-xs uppercase tracking-widest font-bold
                  ${opt.rarity === 'epic' ? 'text-purple-300' : ''}
                  ${opt.rarity === 'rare' ? 'text-blue-300' : ''}
                  ${opt.rarity === 'common' ? 'text-slate-400' : ''}
                `}>
                  {opt.rarity}
                </span>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                {opt.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
