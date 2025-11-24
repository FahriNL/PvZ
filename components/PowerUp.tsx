
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlantType } from '../types';

// --- SEED PACKET TEXTURE ---
const createSeedPacketTexture = (type: PlantType) => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 84;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // Packet Shape
    ctx.fillStyle = '#eaddcf'; // Beige border
    ctx.fillRect(0, 0, 64, 84);
    
    ctx.fillStyle = '#8b5e3c'; // Darker border line
    ctx.strokeRect(2, 2, 60, 80);

    // Inner Background
    let bgColor = '#4ade80';
    if (type === 'ice') bgColor = '#67e8f9';
    if (type === 'fire') bgColor = '#f97316';
    if (type === 'repeater') bgColor = '#166534';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(6, 20, 52, 44);

    // Text Label
    ctx.fillStyle = '#000';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(type.toUpperCase(), 32, 16);

    // Icon representation (simple circle)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(32, 42, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(32, 42, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
};

interface PowerUpProps {
  position: THREE.Vector3;
  type: PlantType;
}

export const PowerUp: React.FC<PowerUpProps> = ({ position, type }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createSeedPacketTexture(type), [type]);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Floating animation
    const time = state.clock.elapsedTime;
    meshRef.current.position.y = 1.5 + Math.sin(time * 3) * 0.2;
    meshRef.current.rotation.y = Math.sin(time) * 0.2;
    
    // Always face camera
    meshRef.current.lookAt(state.camera.position);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[1.2, 1.6]} />
      <meshStandardMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide} 
        emissive="white"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
};
