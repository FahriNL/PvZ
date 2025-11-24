
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Particle } from '../types';

const MAX_PARTICLES = 1000;

// Helper class to manage particle data without triggering React re-renders
export class ParticleHandler {
  particles: Particle[] = [];
  
  spawn(position: THREE.Vector3, colorHex: string, count: number, baseScale: number) {
    const color = new THREE.Color(colorHex);
    for (let i = 0; i < count; i++) {
       if (this.particles.length >= MAX_PARTICLES) break; 
       
       this.particles.push({
         position: position.clone(),
         velocity: new THREE.Vector3(
           (Math.random() - 0.5) * 0.5,
           (Math.random() - 0.5) * 0.5 + 0.5,
           (Math.random() - 0.5) * 0.5
         ),
         color: color,
         life: 1.0,
         maxLife: 0.5 + Math.random() * 0.5,
         scale: baseScale * (0.5 + Math.random() * 0.5),
         gravity: 0.02 + Math.random() * 0.02
       });
    }
  }

  update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      
      if (p.life <= 0) {
        // Fast remove (swap with last and pop)
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }

      p.velocity.y -= p.gravity;
      p.position.add(p.velocity);
    }
  }
}

interface ParticleSystemProps {
  handler: ParticleHandler;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ handler }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // 1. Update Physics Data
    handler.update(delta);

    // 2. Update Instanced Mesh
    const particles = handler.particles;
    meshRef.current.count = particles.length;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      dummy.position.copy(p.position);
      // Scale shrinks as life fades
      const currentScale = p.scale * (p.life / p.maxLife);
      dummy.scale.set(currentScale, currentScale, currentScale);
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, p.color);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial 
        vertexColors 
        transparent 
        opacity={0.8}
      />
    </instancedMesh>
  );
};
