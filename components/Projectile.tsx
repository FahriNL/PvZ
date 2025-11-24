
import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlantType } from '../types';

interface PeaProps {
  position: THREE.Vector3;
  direction: THREE.Vector3;
  type: PlantType;
  damage: number;
  effects: { slows?: boolean; burns?: boolean };
  onRemove: () => void;
}

export const Pea: React.FC<PeaProps> = ({ position, direction, type, damage, effects, onRemove }) => {
  const ref = useRef<THREE.Mesh>(null);
  const speed = 20;

  // Visuals based on type
  const { color, emissive } = useMemo(() => {
    switch (type) {
      case 'ice': return { color: '#06b6d4', emissive: '#22d3ee' }; // Cyan
      case 'fire': return { color: '#ef4444', emissive: '#f97316' }; // Red/Orange
      case 'repeater': return { color: '#166534', emissive: '#14532d' }; // Dark Green
      default: return { color: '#4ade80', emissive: '#15803d' }; // Standard Green
    }
  }, [type]);

  // Initialize position and UserData for collision
  useEffect(() => {
    if (ref.current) {
      ref.current.position.copy(position);
      
      // Attach stats to userData so Enemy can read them on collision
      ref.current.userData = {
        damage,
        effects,
        active: true // flag to prevent double hits
      };
    }
  }, [position, damage, effects]);

  useFrame((state, delta) => {
    if (!ref.current) return;
    
    // Move projectile
    ref.current.position.addScaledVector(direction, speed * delta);

    // Cleanup if too far
    if (ref.current.position.length() > 150) {
      onRemove();
    }
  });

  return (
    <mesh ref={ref} name="Bullet">
      <sphereGeometry args={[0.25, 8, 8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={emissive} 
        emissiveIntensity={0.8} 
      />
    </mesh>
  );
};
