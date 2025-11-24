
import * as THREE from 'three';

export type PlantType = 'normal' | 'repeater' | 'ice' | 'fire';

export interface Bullet {
  id: string;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  type: PlantType;
  damage: number;
  effects: {
    slows?: boolean;
    burns?: boolean;
  };
}

export type ZombieType = 'regular' | 'cone' | 'bucket' | 'imp' | 'shield' | 'healer';
export type ZombieBiome = 'nature' | 'urban' | 'suburban' | 'countryside' | 'graveyard';

export interface EnemyData {
  id: string;
  position: THREE.Vector3;
  type: ZombieType;
  biome: ZombieBiome;
}

export interface PowerUp {
  id: string;
  position: THREE.Vector3;
  type: PlantType;
}

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  life: number;
  maxLife: number;
  scale: number;
  gravity: number;
}

export interface Obstacle {
  id: string;
  type: 'circle' | 'box';
  position: THREE.Vector3;
  radius?: number; // For circle colliders (Trees, Rocks, Lamps)
  size?: THREE.Vector2; // For box colliders (Buildings, Houses) - Width (x), Depth (z)
}

export interface PlayerStats {
  maxHp: number;
  regenRate: number; // HP per second
  damageMultiplier: number;
  attackSpeedMultiplier: number; // Not implemented in this iteration but good for future
}

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic';
  apply: (stats: PlayerStats) => PlayerStats;
}

export interface GameSettings {
  masterVolume: number; // 0 to 1
  musicVolume: number;  // 0 to 1
  sfxVolume: number;    // 0 to 1
  highQuality: boolean; // toggles shadows/antialias
  joystickOpacity: number; // 0 to 1
}
