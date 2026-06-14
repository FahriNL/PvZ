
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { PlantType, PowerUp, Obstacle, PlayerStats } from '../types';

// --- TEXTURE GENERATION ---
const createPeashooterTexture = (type: PlantType) => {
  const canvas = document.createElement('canvas');
  canvas.width = 32; 
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 32, 32);

    // Palette
    let darkColor = '#15803d';  // Green
    let mainColor = '#4ade80';  // Light Green
    let detailColor = '#000000';

    if (type === 'ice') {
      darkColor = '#0e7490'; // Cyan Dark
      mainColor = '#67e8f9'; // Cyan Light
    } else if (type === 'fire') {
      darkColor = '#b91c1c'; // Red Dark
      mainColor = '#f97316'; // Orange
    } else if (type === 'repeater') {
      darkColor = '#14532d'; // Very Dark Green
      mainColor = '#22c55e'; // Standard Green
    }

    // Draw Stalk
    ctx.fillStyle = darkColor;
    ctx.fillRect(14, 18, 4, 10);

    // Draw Leaves
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.ellipse(16, 28, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Repeater has a "mohawk" leaf
    if (type === 'repeater') {
      ctx.beginPath();
      ctx.ellipse(16, 6, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Head
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(14, 10, 9, 0, Math.PI * 2); 
    ctx.fill();

    // Snout
    ctx.fillStyle = mainColor;
    ctx.fillRect(18, 6, 10, 8); 
    
    // Snout Rim
    ctx.fillStyle = darkColor;
    ctx.fillRect(26, 5, 3, 10); 

    // Mouth Opening
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.arc(28, 10, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye
    ctx.fillStyle = detailColor;
    ctx.beginPath();
    ctx.arc(12, 7, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry Eyes for Repeater
    if (type === 'repeater') {
       ctx.fillStyle = darkColor;
       ctx.beginPath();
       ctx.moveTo(9, 5);
       ctx.lineTo(15, 8);
       ctx.stroke();
    }

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(11.5, 6.5, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Fire Particle effect (static)
    if (type === 'fire') {
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(12, 2, 4, 4);
      ctx.fillRect(8, 5, 2, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

// Check for collision between a point (player) and an obstacle
const checkCollision = (position: THREE.Vector3, obs: Obstacle): boolean => {
  const playerRadius = 0.5;

  if (obs.type === 'circle') {
    const dx = position.x - obs.position.x;
    const dz = position.z - obs.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance < (playerRadius + (obs.radius || 0.5));
  } else {
    // Box Collision (AABB)
    const halfWidth = (obs.size?.x || 1) / 2;
    const halfDepth = (obs.size?.y || 1) / 2;

    const minX = obs.position.x - halfWidth - playerRadius;
    const maxX = obs.position.x + halfWidth + playerRadius;
    const minZ = obs.position.z - halfDepth - playerRadius;
    const maxZ = obs.position.z + halfDepth + playerRadius;

    return (
      position.x > minX &&
      position.x < maxX &&
      position.z > minZ &&
      position.z < maxZ
    );
  }
};

interface CharacterProps {
  plantType: PlantType;
  stats: PlayerStats;
  onShoot: (position: THREE.Vector3, direction: THREE.Vector3, type: PlantType, damage: number, effects: any) => void;
  powerUps: PowerUp[];
  onCollect: (id: string, type: PlantType) => void;
  obstacles: Obstacle[];
  onDeath: () => void;
  isGameOver: boolean;
}

export const Character: React.FC<CharacterProps> = ({ 
  plantType, stats, onShoot, powerUps, onCollect, obstacles, onDeath, isGameOver
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Mesh>(null);
  
  const { camera, pointer, raycaster, scene } = useThree();
  
  const texture = useMemo(() => createPeashooterTexture(plantType), [plantType]);
  
  // State
  const [keys, setKeys] = useState<Set<string>>(new Set());
  const [currentHp, setCurrentHp] = useState(stats.maxHp);
  const lastHitTime = useRef(0);
  const regenTimer = useRef(0);

  // Sync HP when MaxHP changes (Upgrades)
  useEffect(() => {
    setCurrentHp(prev => Math.min(prev, stats.maxHp));
  }, [stats.maxHp]);

  const shoot = () => {
    if (isGameOver || !groupRef.current || !spriteRef.current) return;
    
    const charPos = groupRef.current.position.clone();
    const rotation = spriteRef.current.rotation.y;
    
    // Direction vector
    const dir = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
    
    // Base Spawn point
    const spawnPos = charPos.clone().add(new THREE.Vector3(0, 0.2, 0)).addScaledVector(dir, 0.8);

    let baseDamage = 1;
    let effects = {};
    let sfxName = 'shoot';

    if (plantType === 'ice') {
      baseDamage = 1.5; 
      effects = { slows: true };
    } else if (plantType === 'fire') {
      baseDamage = 1; 
      effects = { burns: true }; 
      sfxName = 'shoot-fire';
    }

    const finalDamage = baseDamage * stats.damageMultiplier;

    window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: sfxName }));

    if (plantType === 'repeater') {
      onShoot(spawnPos, dir, plantType, finalDamage, {});
      const offsetPos = spawnPos.clone().addScaledVector(dir, -0.5);
      setTimeout(() => {
        if (!isGameOver) {
          onShoot(offsetPos, dir, plantType, finalDamage, {});
          window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: sfxName }));
        }
      }, 80);
    } else {
      onShoot(spawnPos, dir, plantType, finalDamage, effects);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys((prev) => new Set(prev).add(e.code));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };
    
    const handleMouseDown = () => {
      shoot(); 
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [onShoot, plantType, stats.damageMultiplier, isGameOver]);

  useFrame((state, delta) => {
    if (!groupRef.current || !spriteRef.current || isGameOver) return;

    // --- HEALTH REGEN ---
    if (currentHp < stats.maxHp && stats.regenRate > 0 && currentHp > 0) {
        regenTimer.current += delta;
        if (regenTimer.current >= 1.0) { // Every second
            setCurrentHp(prev => Math.min(stats.maxHp, prev + stats.regenRate));
            regenTimer.current = 0;
        }
    }

    const speed = 6 * delta;
    const group = groupRef.current;
    const sprite = spriteRef.current;
    const position = group.position;

    // --- MOVEMENT ---
    let moveDir = new THREE.Vector3(0, 0, 0);
    
    // Keyboard Input
    if (keys.has('ArrowUp') || keys.has('KeyW')) moveDir.z -= 1;
    if (keys.has('ArrowDown') || keys.has('KeyS')) moveDir.z += 1;
    if (keys.has('ArrowLeft') || keys.has('KeyA')) moveDir.x -= 1;
    if (keys.has('ArrowRight') || keys.has('KeyD')) moveDir.x += 1;

    // --- AIMING ---
    // Aim using Mouse
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    raycaster.setFromCamera(pointer, camera);
    const targetPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(groundPlane, targetPoint);

    if (targetPoint) {
      const dx = targetPoint.x - position.x;
      const dz = targetPoint.z - position.z;
      const angle = -Math.atan2(dz, dx); 
      sprite.rotation.y = angle;
    }

    if (moveDir.length() > 0) {
      moveDir.normalize().multiplyScalar(speed);
      
      const nextPos = position.clone().add(moveDir);
      
      // COLLISION DETECTION
      let canMove = true;
      for (const obs of obstacles) {
        if (checkCollision(nextPos, obs)) {
          canMove = false;
          break;
        }
      }

      if (canMove) {
        position.add(moveDir);
        // Simple bobbing effect when walking
        const time = state.clock.getElapsedTime();
        position.y = 1 + Math.sin(time * 15) * 0.1;
      }
    } else {
      position.y = 1;
    }

    // --- CAMERA FOLLOW ---
    const offset = new THREE.Vector3(0, 12, 12);
    const targetPos = position.clone().add(offset);
    state.camera.position.lerp(targetPos, 0.1);
    state.camera.lookAt(position);

    // --- POWERUP COLLISION ---
    powerUps.forEach(p => {
      if (position.distanceTo(p.position) < 1.5) {
        window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'powerup' }));
        onCollect(p.id, p.type);
      }
    });

    // --- ENEMY COLLISION & HP ---
    const now = Date.now();
    if (now - lastHitTime.current > 1000) { 
      scene.traverse((obj) => {
        if (obj.name === 'Enemy') {
           const enemyPos = new THREE.Vector3();
           obj.getWorldPosition(enemyPos);
           
           if (position.distanceTo(enemyPos) < 1.5) { 
             window.dispatchEvent(new CustomEvent('terraplane-sfx', { detail: 'hit-flesh' }));
             setCurrentHp(prev => {
               const next = prev - 20;
               if (next <= 0) {
                   if (!isGameOver) onDeath(); 
                   return 0;
               }
               return next;
             });
             lastHitTime.current = now;
           }
        }
      });
    }
  });

  // Death Effect (Simple rotation)
  useFrame((state) => {
    if (isGameOver && spriteRef.current && currentHp <= 0) {
        spriteRef.current.rotation.z = -Math.PI / 2; // Fall over
        spriteRef.current.position.y = 0.2;
    }
  });

  return (
    <group ref={groupRef} name="Player" position={[0, 1, 0]}>
      <mesh ref={spriteRef} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshStandardMaterial 
          map={texture} 
          transparent 
          alphaTest={0.5} 
          side={THREE.DoubleSide}
          color={currentHp <= 0 ? '#555' : 'white'}
        />
      </mesh>

      {currentHp > 0 && (
        <Billboard position={[0, 1.2, 0]}>
          <mesh position={[0, 0, -0.01]}>
              <planeGeometry args={[1.2, 0.15]} />
              <meshBasicMaterial color="black" />
          </mesh>
          <mesh 
            position-x={-0.6 * (1 - currentHp / stats.maxHp)}
            scale-x={Math.max(0.001, currentHp / stats.maxHp)}
          >
              <planeGeometry args={[1.2, 0.1]} />
              <meshBasicMaterial color={currentHp > (stats.maxHp * 0.3) ? "#22c55e" : "#ef4444"} />
          </mesh>
        </Billboard>
      )}
    </group>
  );
};
