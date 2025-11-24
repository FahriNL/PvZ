
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ZombieType, ZombieBiome } from '../types';

// GLOBAL TEXTURE CACHE
const textureCache: Record<string, THREE.Texture> = {};

// --- SHIELD TEXTURE GENERATOR ---
const getShieldTexture = () => {
  if (textureCache['shield-door']) return textureCache['shield-door'];
  
  const canvas = document.createElement('canvas');
  canvas.width = 64; 
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
      ctx.fillStyle = '#475569'; // Frame color
      ctx.fillRect(0, 0, 64, 128);
      
      // Screen pattern
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(4, 4, 56, 50);
      ctx.fillRect(4, 60, 56, 64);
      
      // Mesh effect
      ctx.fillStyle = '#334155';
      for(let i=6; i<60; i+=4) ctx.fillRect(i, 4, 1, 50);
      for(let j=6; j<54; j+=4) ctx.fillRect(4, j, 56, 1);
      
      for(let i=6; i<60; i+=4) ctx.fillRect(i, 60, 1, 64);
      for(let j=62; j<124; j+=4) ctx.fillRect(4, j, 56, 1);
      
      // Handle
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(54, 64, 6, 12);
  }
  
  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  textureCache['shield-door'] = tex;
  return tex;
};

const getZombieTexture = (type: ZombieType, biome: ZombieBiome, isWalking: boolean) => {
  const key = `${type}-${biome}-${isWalking}`;
  if (textureCache[key]) return textureCache[key];

  const width = 32;
  const height = 48;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, width, height);

    const isImp = type === 'imp';
    const yOffset = isImp ? 20 : 16;
    
    // -- COLORS BASED ON BIOME & TYPE --
    let skinColor = '#6a8348'; // Default Green
    let coatColor = '#3f3845'; // Default Grey Suit
    let pantsColor = '#28262e';
    let tieColor = '#bf4040';

    if (type === 'healer') {
        coatColor = '#f8fafc'; // White coat
        pantsColor = '#e2e8f0'; // White pants
        tieColor = 'transparent';
        skinColor = '#bbf7d0'; // Healthy pale green
    } else if (type === 'shield') {
        coatColor = '#334155'; // Dark tactical
        pantsColor = '#0f172a';
        skinColor = '#57534e'; // Tough skin
    } else if (biome === 'urban') {
        coatColor = '#1e3a8a'; 
        tieColor = '#facc15';  
        pantsColor = '#172554';
    } else if (biome === 'countryside') {
        coatColor = '#854d0e'; 
        pantsColor = '#1d4ed8'; 
        tieColor = 'transparent'; 
        skinColor = '#84cc16'; 
    } else if (biome === 'suburban') {
        coatColor = '#ffffff'; 
        pantsColor = '#374151'; 
        tieColor = 'transparent';
    } else if (biome === 'graveyard') {
        skinColor = '#94a3b8'; 
        coatColor = '#333333'; 
        pantsColor = '#1c1917';
    }

    if (isImp) {
      coatColor = '#e07f1f'; 
      if (biome === 'graveyard') coatColor = '#7f1d1d'; 
    }

    // Legs
    ctx.fillStyle = pantsColor;
    if (isWalking) {
      ctx.fillRect(10, yOffset + 20, 5, 8); 
      ctx.fillRect(18, yOffset + 18, 5, 8); 
    } else {
      ctx.fillRect(10, yOffset + 20, 5, 8);
      ctx.fillRect(18, yOffset + 20, 5, 8);
    }

    // Torso
    ctx.fillStyle = coatColor;
    ctx.fillRect(9, yOffset + 10, 14, 10);
    
    // Healer Cross
    if (type === 'healer') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(14, yOffset + 12, 4, 6);
        ctx.fillRect(13, yOffset + 14, 6, 2);
    }

    // Overalls detail for countryside
    if (biome === 'countryside' && !isImp && type !== 'healer' && type !== 'shield') {
        ctx.fillStyle = pantsColor;
        ctx.fillRect(11, yOffset + 10, 2, 10);
        ctx.fillRect(19, yOffset + 10, 2, 10);
        ctx.fillRect(10, yOffset + 15, 12, 5);
    }

    if (!isImp && tieColor !== 'transparent' && biome !== 'countryside' && type !== 'healer') {
      ctx.fillStyle = tieColor;
      ctx.fillRect(15, yOffset + 10, 3, 6);
    }

    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(10, yOffset, 12, 11);
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.fillRect(12, yOffset + 3, 3, 3);
    ctx.fillRect(17, yOffset + 3, 3, 3);
    ctx.fillStyle = 'black';
    ctx.fillRect(13, yOffset + 4, 1, 1); 
    ctx.fillRect(18, yOffset + 4, 1, 1);

    // Mouth
    ctx.fillStyle = 'black';
    ctx.fillRect(13, yOffset + 8, 6, 2);

    // Arms
    ctx.fillStyle = coatColor;
    const armY = yOffset + 11;
    if (isWalking) {
      ctx.fillRect(22, armY, 6, 4); 
      ctx.fillRect(4, armY + 1, 6, 4);  
      ctx.fillStyle = skinColor;
      ctx.fillRect(28, armY, 3, 4);
      ctx.fillRect(1, armY + 1, 3, 4);
    } else {
      ctx.fillRect(20, armY + 1, 6, 4);
      ctx.fillRect(6, armY + 1, 6, 4);
      ctx.fillStyle = skinColor;
      ctx.fillRect(26, armY + 1, 3, 4);
      ctx.fillRect(3, armY + 1, 3, 4);
    }

    // HATS
    if (type === 'cone') {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(10, yOffset);
      ctx.lineTo(22, yOffset);
      ctx.lineTo(16, yOffset - 12);
      ctx.fill();
    } else if (type === 'bucket') {
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(10, yOffset - 8, 12, 9);
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(9, yOffset - 1, 14, 2);
    } else if (type === 'shield') {
      // Helmet
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(9, yOffset - 4, 14, 6);
    }
    
    // Straw hat for countryside regular zombies
    if (biome === 'countryside' && type === 'regular') {
       ctx.fillStyle = '#fcd34d'; // Straw
       ctx.fillRect(8, yOffset - 2, 16, 2);
       ctx.fillRect(10, yOffset - 6, 12, 4);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  
  // Cache it
  textureCache[key] = tex;
  return tex;
};

interface ZombieProps {
  position: THREE.Vector3;
  type: ZombieType;
  biome: ZombieBiome;
  level: number;
  onDeath: (xpReward: number) => void;
  onHit: (position: THREE.Vector3, color: string) => void;
  isGameOver: boolean;
}

export const Zombie: React.FC<ZombieProps> = ({ position: initialPos, type, biome, level, onDeath, onHit, isGameOver }) => {
  // Group ref handles the position in World Space
  const groupRef = useRef<THREE.Group>(null);
  // Mesh ref handles the texture/material updates
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { scene } = useThree();
  
  // Stats with Difficulty Scaling
  const initialStats = useMemo(() => {
    // Difficulty modifier
    const hpMultiplier = 1 + (level * 0.1);
    const speedMultiplier = 1 + (level * 0.02);

    let stats = { hp: 4, speed: 2.0, scale: 1.8, xp: 10, shieldHp: 0 };
    
    switch(type) {
      case 'cone': stats = { ...stats, hp: 8, xp: 20 }; break;
      case 'bucket': stats = { ...stats, hp: 14, xp: 35 }; break;
      case 'imp': stats = { ...stats, hp: 2, speed: 4.5, scale: 1.2, xp: 15 }; break; 
      case 'shield': stats = { ...stats, hp: 8, shieldHp: 15, speed: 1.5, xp: 40 }; break;
      case 'healer': stats = { ...stats, hp: 6, speed: 1.8, xp: 50 }; break;
      default: break;
    }

    return {
        ...stats,
        hp: stats.hp * hpMultiplier,
        shieldHp: stats.shieldHp * hpMultiplier,
        speed: stats.speed * speedMultiplier
    };
  }, [type, level]);

  const [hp, setHp] = useState(initialStats.hp);
  const [shieldHp, setShieldHp] = useState(initialStats.shieldHp);
  const [flash, setFlash] = useState(0);
  
  // State for Death Animation
  const [isDying, setIsDying] = useState(false);
  
  // Status Effects
  const [isFrozen, setIsFrozen] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const burnTimerRef = useRef(0); 
  
  // AI Logic
  const flankingFactor = useRef((Math.random() - 0.5) * 2); // -1 to 1: Left or Right flank
  const healTimer = useRef(0);

  // Texture state
  const [isWalking, setIsWalking] = useState(false);
  const animTimer = useRef(0);
  
  const shieldTexture = useMemo(() => type === 'shield' ? getShieldTexture() : null, [type]);

  // --- HEALING EVENT LISTENER ---
  useEffect(() => {
    if (isGameOver || isDying) return;
    
    const handleHealEvent = (e: CustomEvent) => {
        if (!groupRef.current) return;
        const { position, range, amount } = e.detail;
        const dist = groupRef.current.position.distanceTo(position);
        
        if (dist < range && dist > 0.1) { // Don't heal self
            setHp(prev => {
                const max = initialStats.hp;
                if (prev < max) {
                    onHit(groupRef.current!.position.clone().add(new THREE.Vector3(0,1,0)), '#4ade80'); // Green sparkle
                    return Math.min(max, prev + amount);
                }
                return prev;
            });
        }
    };

    window.addEventListener('zombie-heal' as any, handleHealEvent as any);
    return () => window.removeEventListener('zombie-heal' as any, handleHealEvent as any);
  }, [initialStats.hp, onHit, isGameOver, isDying]);


  useFrame((state, delta) => {
    if (!groupRef.current || !meshRef.current) return;
    const group = groupRef.current;
    const mesh = meshRef.current;
    const material = mesh.material as THREE.MeshStandardMaterial;

    // --- DEATH ANIMATION ---
    if (isDying) {
        if (type === 'imp') {
            // Imp spins wildly and shrinks
            group.rotation.z += delta * 15;
            group.scale.subScalar(delta * 2);
        } else if (type === 'healer') {
            // Healer floats up and dissolves
            group.position.y += delta * 1.5;
            group.rotation.y += delta * 5;
            group.scale.subScalar(delta * 0.5);
            if (material) material.opacity = Math.max(0, material.opacity - delta);
        } else {
            // Standard Fall (Backwards)
            const fallSpeed = 5;
            if (group.rotation.x > -Math.PI / 2) {
               group.rotation.x -= delta * fallSpeed;
            }
            group.position.y -= delta * 0.5; // Sink into ground
        }
        return; // Skip other updates
    }

    // --- TEXTURE ANIMATION ---
    const animSpeed = type === 'imp' ? 8 : 4;
    const effectiveAnimSpeed = isGameOver ? 0 : (isFrozen ? animSpeed * 0.5 : animSpeed);
    animTimer.current += delta * effectiveAnimSpeed;
    const walkingFrame = Math.floor(animTimer.current) % 2 === 1;
    
    if (walkingFrame !== isWalking) setIsWalking(walkingFrame);
    
    const tex = getZombieTexture(type, biome, walkingFrame);
    if (material.map !== tex) {
        material.map = tex;
        material.needsUpdate = true;
    }

    // --- VISUAL FEEDBACK ---
    if (flash > 0) {
      material.color.set('#ff0000');
      setFlash(prev => Math.max(0, prev - delta * 5));
    } else if (isBurning) {
      const flicker = Math.sin(state.clock.elapsedTime * 20) * 0.2 + 0.8;
      material.color.setHSL(0.05, 1, flicker * 0.5 + 0.2); 
    } else if (isFrozen) {
      material.color.set('#22d3ee'); 
    } else {
      material.color.set('white');
    }

    if (isGameOver) return;

    // --- BURN DOT ---
    if (isBurning) {
      burnTimerRef.current += delta;
      if (burnTimerRef.current > 0.5) { 
        burnTimerRef.current = 0;
        setHp(prev => {
           const newHp = prev - 0.5; 
           if (Math.random() > 0.5) onHit(group.position.clone().add(new THREE.Vector3(0, 1, 0)), '#525252');
           if (newHp <= 0 && !isDying) {
             setIsDying(true);
             setTimeout(() => onDeath(initialStats.xp), 1000);
             return 0;
           }
           return newHp;
        });
        setFlash(0.5); 
      }
    }
    
    // --- HEALER LOGIC ---
    if (type === 'healer') {
        healTimer.current += delta;
        if (healTimer.current > 4.0) { // Heal pulse every 4 seconds
            healTimer.current = 0;
            // Dispatch heal event
            const event = new CustomEvent('zombie-heal', {
                detail: {
                    position: group.position.clone(),
                    range: 8.0,
                    amount: 2.0
                }
            });
            window.dispatchEvent(event);
            
            // Visual pulse
            onHit(group.position, '#bbf7d0'); 
        }
    }

    // --- AI MOVEMENT (SMART) ---
    const player = scene.getObjectByName('Player');
    if (player) {
      // Player position is world position. 
      // Group position is world position.
      const target = player.position.clone();
      const distToPlayer = group.position.distanceTo(target);
      
      // Imp Suicide
      if (type === 'imp' && distToPlayer < 1.5) {
        onHit(group.position, '#ff0000');
        window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'explosion' }));
        setIsDying(true);
        setTimeout(() => onDeath(initialStats.xp), 200); // Fast fade
        return;
      }
      
      // Calculate Direction
      const dir = new THREE.Vector3().subVectors(target, group.position);
      dir.y = 0;
      dir.normalize();

      // --- FLANKING BEHAVIOR ---
      let finalDir = dir.clone();

      if (type === 'healer') {
          // Healer Kiting Logic: If too close, back away. If too far, move closer.
          if (distToPlayer < 8) {
              finalDir.negate(); // Move away
          }
          // Else move towards normally
      } else if (biome === 'urban' || type === 'shield') {
          // Add tangential component for flanking
          const right = new THREE.Vector3(0, 1, 0).cross(dir);
          finalDir.addScaledVector(right, flankingFactor.current * 0.8);
          finalDir.normalize();
      }

      let currentSpeed = initialStats.speed;
      if (isFrozen) currentSpeed *= 0.5;

      // MOVE THE GROUP (World Space)
      group.position.addScaledVector(finalDir, currentSpeed * delta);
      
      // Look at logic
      group.lookAt(state.camera.position); 
    }

    // --- COLLISION WITH BULLETS ---
    // Check world position of bullets vs world position of group
    if (group.position.length() > 150) return; 

    scene.traverse((obj) => {
      if (obj.name === 'Bullet') {
        if (obj.userData.active) {
            const dx = obj.position.x - group.position.x;
            const dz = obj.position.z - group.position.z;
            const distSq = dx*dx + dz*dz;
            const hitRadius = type === 'imp' ? 1.0 : 1.5;
            
            if (distSq < hitRadius * hitRadius) {
              const bulletData = obj.userData;
              let particleColor = '#4ade80'; 
              if (bulletData.effects?.burns) particleColor = '#f97316';
              if (bulletData.effects?.slows) particleColor = '#22d3ee';
              
              const damage = bulletData.damage || 1;
              let actualDamageToHp = damage;

              // SFX Logic
              let isMetal = type === 'shield' || type === 'bucket' || type === 'cone';
              
              // SHIELD BLOCK LOGIC
              if (type === 'shield' && shieldHp > 0) {
                  const shieldDamage = Math.min(shieldHp, damage);
                  setShieldHp(prev => prev - shieldDamage);
                  actualDamageToHp = damage - shieldDamage;
                  
                  // Visual Feedback for Shield Hit
                  onHit(obj.position, '#94a3b8'); // Metal spark
                  window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'hit-metal' }));
                  
                  if (shieldHp - shieldDamage <= 0) {
                      // Shield broke
                      onHit(group.position.clone().add(new THREE.Vector3(0,1,0)), '#cbd5e1'); // Debris
                  }
              } else if (isMetal && actualDamageToHp > 0) {
                  window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'hit-metal' }));
              } else {
                  window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'hit-flesh' }));
              }

              if (actualDamageToHp > 0) {
                  onHit(obj.position, particleColor);
                  setHp(prev => {
                    const newHp = prev - actualDamageToHp;
                    if (newHp <= 0 && !isDying) {
                      onHit(group.position, '#6a8348'); 
                      setIsDying(true);
                      window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'explosion' }));
                      setTimeout(() => onDeath(initialStats.xp), 1000); // Animation delay
                      return 0;
                    }
                    return newHp;
                  });
              }
              
              // Status Effects
              if (bulletData.effects?.slows) {
                setIsFrozen(true);
                setTimeout(() => setIsFrozen(false), 3000);
              }
              if (bulletData.effects?.burns) {
                setIsBurning(true);
                setTimeout(() => setIsBurning(false), 4000);
              }

              setFlash(1.0);
              obj.userData.active = false; 
              obj.position.set(9999, 9999, 9999); 
            }
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={initialPos} name={isDying ? "DeadEnemy" : "Enemy"}>
        <mesh 
          ref={meshRef} 
          // name="Enemy" - Moved to Group for correct world collision detection
          scale={[initialStats.scale, initialStats.scale, 1]}
        >
          <planeGeometry args={[1, 1.5]} /> 
          <meshStandardMaterial 
            transparent 
            alphaTest={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* PHYSICAL SHIELD OBJECT */}
        {type === 'shield' && shieldHp > 0 && !isDying && (
            <mesh position={[0.3, 1, 0.2]} rotation={[0, -0.4, 0]}>
                <boxGeometry args={[0.9, 1.4, 0.05]} />
                <meshStandardMaterial map={shieldTexture} />
            </mesh>
        )}
    </group>
  );
};
