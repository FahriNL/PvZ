
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { World } from './World';
import { Character } from './Character';
import { Zombie } from './Enemy';
import { Pea } from './Projectile';
import { PowerUp as PowerUpMesh } from './PowerUp';
import { ParticleSystem, ParticleHandler } from './ParticleSystem';
import { AudioManager } from './AudioManager';
import { HUD } from './UI/HUD';
import { UpgradeMenu } from './UI/UpgradeMenu';
import { GameOverScreen } from './UI/GameOverScreen';
import { MainMenu } from './UI/MainMenu';
import { SettingsMenu } from './UI/SettingsMenu';
import { 
  Bullet, EnemyData, ZombieType, PlantType, PowerUp, 
  Obstacle, ZombieBiome, PlayerStats, UpgradeOption, GameSettings
} from '../types';

// --- MENU CAMERA COMPONENT ---
const MenuCamera: React.FC = () => {
  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime() * 0.1;
    // Orbit high above the map
    camera.position.x = Math.sin(t) * 60;
    camera.position.z = Math.cos(t) * 60;
    camera.position.y = 40;
    camera.lookAt(0, 0, 0);
  });
  return null;
};

export const Scene: React.FC = () => {
  // --- GAME STATE MACHINE ---
  // 'menu' -> 'playing' -> 'gameover' -> 'menu' or 'playing'
  // 'settings' is an overlay on top of 'menu'
  const [gameState, setGameState] = useState<'menu' | 'settings' | 'playing' | 'gameover'>('menu');
  
  // Settings State
  const [settings, setSettings] = useState<GameSettings>({
    masterVolume: 0.3,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    highQuality: true
  });

  // --- GAMEPLAY STATE ---
  const [gameId, setGameId] = useState(0); 
  
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<EnemyData[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [plantType, setPlantType] = useState<PlantType>('normal');
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  
  // Leveling State
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  
  // Player Stats
  const [stats, setStats] = useState<PlayerStats>({
    maxHp: 100,
    regenRate: 0, 
    damageMultiplier: 1.0,
    attackSpeedMultiplier: 1.0
  });

  const requiredXp = level * 100;

  // Refs for performance
  const particleHandler = useRef<ParticleHandler>(new ParticleHandler());

  // Biome Detection
  const getBiome = (x: number, z: number): ZombieBiome => {
    if (x > 40) return 'urban';
    if (z > 40 && x > -30) return 'suburban';
    if (x < -40 && z > -40) return 'countryside';
    if (x < -20 && z < -40) return 'graveyard';
    return 'nature';
  };

  // Particle Spawner
  const spawnParticles = useCallback((position: THREE.Vector3, color: string, count: number = 5, scale: number = 0.2) => {
    particleHandler.current.spawn(position, color, count, scale);
  }, []);

  // Shoot Callback
  const handleShoot = useCallback((
    position: THREE.Vector3, 
    direction: THREE.Vector3, 
    type: PlantType,
    damage: number,
    effects: any
  ) => {
    if (gameState !== 'playing' || isUpgradeOpen) return;

    const newBullet: Bullet = {
      id: Math.random().toString(36).substr(2, 9),
      position,
      direction,
      type,
      damage,
      effects
    };
    setBullets(prev => [...prev, newBullet]);
  }, [gameState, isUpgradeOpen]);

  const removeBullet = (id: string) => {
    setBullets(prev => prev.filter(b => b.id !== id));
  };

  // Enemy Spawning Logic
  useEffect(() => {
    if (gameState !== 'playing' || isUpgradeOpen) return;

    const spawnInterval = Math.max(300, 1200 - (level * 50));

    const interval = setInterval(() => {
      if (document.hidden) return; 
      
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const rand = Math.random();
      let type: ZombieType = 'regular';
      const hardChance = Math.min(0.7, level * 0.08); 
      
      if (rand > (1 - hardChance)) {
         const subRand = Math.random();
         if (level >= 5 && subRand > 0.92) type = 'healer';
         else if (level >= 3 && subRand > 0.8) type = 'shield';
         else if (subRand > 0.6) type = 'bucket';
         else if (subRand > 0.3) type = 'cone';
         else type = 'imp';
      }

      const biome = getBiome(x, z);
      const newEnemy: EnemyData = {
        id: Math.random().toString(36).substr(2, 9),
        position: new THREE.Vector3(x, 1, z),
        type: type,
        biome: biome
      };

      setEnemies(prev => {
        if (prev.length > 50 + level * 2) return prev; 
        return [...prev, newEnemy];
      });
    }, spawnInterval); 

    return () => clearInterval(interval);
  }, [level, isUpgradeOpen, gameState]);

  // PowerUp Spawning Logic
  useEffect(() => {
    if (gameState !== 'playing' || isUpgradeOpen) return;
    
    const interval = setInterval(() => {
       if (document.hidden) return;
       if (Math.random() > 0.7) return;

       const angle = Math.random() * Math.PI * 2;
       const radius = 5 + Math.random() * 15; 
       const x = Math.cos(angle) * radius;
       const z = Math.sin(angle) * radius;

       const rand = Math.random();
       let type: PlantType = 'normal';
       if (rand < 0.35) type = 'repeater';
       else if (rand < 0.55) type = 'ice';
       else if (rand < 0.70) type = 'fire';
       else type = 'normal';

       const newPowerUp: PowerUp = {
         id: Math.random().toString(36).substr(2, 9),
         position: new THREE.Vector3(x, 1, z),
         type
       };

       setPowerUps(prev => {
         if (prev.length > 5) return prev; 
         return [...prev, newPowerUp];
       });
    }, 8000); 

    return () => clearInterval(interval);
  }, [isUpgradeOpen, gameState]);

  // --- HANDLERS ---

  const handleEnemyDeath = (id: string, xpReward: number) => {
    if (gameState !== 'playing') return;
    setEnemies(prev => prev.filter(e => e.id !== id));
    setXp(prev => {
      const nextXp = prev + xpReward;
      if (nextXp >= requiredXp) {
        handleLevelUp();
        return nextXp - requiredXp;
      }
      return nextXp;
    });
  };

  const handleLevelUp = () => {
    window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'levelup' }));
    setLevel(prevLevel => {
      const newLevel = prevLevel + 1;
      if (newLevel % 5 === 0) {
        setIsUpgradeOpen(true);
      }
      return newLevel;
    });
  };

  const handleUpgradeSelect = (upgrade: UpgradeOption) => {
    setStats(prev => upgrade.apply(prev));
    setIsUpgradeOpen(false);
  };

  const handleCollectPowerUp = (id: string, type: PlantType) => {
    setPlantType(type);
    setPowerUps(prev => {
      const pu = prev.find(p => p.id === id);
      if (pu) {
        spawnParticles(pu.position, '#fbbf24', 20, 0.15);
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handleEnemyHit = (position: THREE.Vector3, color: string) => {
    spawnParticles(position, color, 3, 0.1);
  };

  const handlePlayerDeath = () => {
    window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'gameover' }));
    setGameState('gameover');
  };

  const startGame = () => {
    setGameId(prev => prev + 1);
    setEnemies([]);
    setBullets([]);
    setPowerUps([]);
    setXp(0);
    setLevel(1);
    setPlantType('normal');
    setStats({
      maxHp: 100,
      regenRate: 0,
      damageMultiplier: 1.0,
      attackSpeedMultiplier: 1.0
    });
    setGameState('playing');
  };

  return (
    <>
      <AudioManager 
        masterVolume={settings.masterVolume} 
        musicVolume={settings.musicVolume} 
      />
      
      {/* --- UI OVERLAYS --- */}
      
      {gameState === 'menu' && (
        <MainMenu 
          onPlay={startGame} 
          onSettings={() => setGameState('settings')} 
        />
      )}

      {gameState === 'settings' && (
        <SettingsMenu 
          settings={settings}
          onUpdate={setSettings}
          onBack={() => setGameState('menu')}
        />
      )}
      
      {gameState === 'playing' && !isUpgradeOpen && (
        <HUD level={level} xp={xp} nextLevelXp={requiredXp} />
      )}
      
      {gameState === 'gameover' && (
        <GameOverScreen 
          level={level} 
          xp={xp + (level-1)*100} 
          onRestart={startGame} 
        />
      )}
      
      {isUpgradeOpen && gameState === 'playing' && (
        <UpgradeMenu onSelect={handleUpgradeSelect} />
      )}

      {/* --- 3D SCENE --- */}
      <Canvas
        shadows={settings.highQuality}
        camera={{ position: [0, 12, 12], fov: 45 }}
        gl={{ 
          antialias: settings.highQuality, 
          powerPreference: "high-performance" 
        }}
        dpr={settings.highQuality ? [1, 2] : [0.5, 1]} 
      >
        <color attach="background" args={['#2e1065']} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <fog attach="fog" args={['#2e1065', 15, 60]} />

        <ambientLight intensity={0.6} color="#c4b5fd" />
        <directionalLight
          position={[5, 10, 5]}
          intensity={1.2}
          color="#e879f9"
          castShadow={settings.highQuality}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />

        <World setObstacles={setObstacles} />
        
        {/* Render Logic based on GameState */}
        
        {(gameState === 'menu' || gameState === 'settings') && <MenuCamera />}

        {(gameState === 'playing' || gameState === 'gameover') && (
          <Character 
            key={gameId}
            plantType={plantType}
            stats={stats}
            onShoot={handleShoot} 
            powerUps={powerUps}
            onCollect={handleCollectPowerUp}
            obstacles={obstacles}
            onDeath={handlePlayerDeath}
            isGameOver={gameState === 'gameover'}
          />
        )}

        <ParticleSystem handler={particleHandler.current} />

        {/* Only show game entities if we are actually in a game session (playing or just died) */}
        {(gameState === 'playing' || gameState === 'gameover') && (
          <>
            {powerUps.map(p => (
              <PowerUpMesh key={p.id} position={p.position} type={p.type} />
            ))}

            {bullets.map(b => (
              <Pea 
                key={b.id} 
                position={b.position} 
                direction={b.direction} 
                type={b.type}
                damage={b.damage}
                effects={b.effects}
                onRemove={() => removeBullet(b.id)} 
              />
            ))}

            {enemies.map(e => (
              <Zombie 
                key={e.id}
                position={e.position}
                type={e.type}
                biome={e.biome}
                level={level}
                onDeath={(reward) => handleEnemyDeath(e.id, reward)}
                onHit={handleEnemyHit}
                isGameOver={gameState === 'gameover'}
              />
            ))}
          </>
        )}
      </Canvas>
    </>
  );
};
