
import React, { useMemo, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Obstacle } from '../types';

// --- ASSETS ---

const VoxelTree: React.FC<{ position: [number, number, number], scale: number, type?: 'normal' | 'dead' }> = React.memo(({ position, scale, type = 'normal' }) => {
  const isDead = type === 'dead';
  const woodColor = isDead ? "#44403c" : "#5d4037"; // Greyish for dead
  
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.6, 2, 0.6]} />
        <meshStandardMaterial color={woodColor} />
      </mesh>
      {!isDead && (
        <>
          <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.6, 1.2, 2.6]} />
            <meshStandardMaterial color="#1e4d2b" />
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 1.2, 1.8]} />
            <meshStandardMaterial color="#2d6a4f" />
          </mesh>
          <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.0, 0.8, 1.0]} />
            <meshStandardMaterial color="#4ade80" />
          </mesh>
        </>
      )}
      {isDead && (
        <>
           {/* Dead branches */}
           <mesh position={[0.6, 1.5, 0]} rotation={[0, 0, -0.5]}>
              <boxGeometry args={[0.8, 0.2, 0.2]} />
              <meshStandardMaterial color={woodColor} />
           </mesh>
           <mesh position={[-0.5, 1.8, 0.2]} rotation={[0.2, 0, 0.4]}>
              <boxGeometry args={[0.7, 0.2, 0.2]} />
              <meshStandardMaterial color={woodColor} />
           </mesh>
        </>
      )}
    </group>
  );
});

const VoxelRock: React.FC<{ position: [number, number, number], scale: number, rotation: [number, number, number] }> = React.memo(({ position, scale, rotation }) => {
  return (
    <mesh position={position} rotation={rotation} scale={[scale, scale, scale]} castShadow receiveShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#78716c" flatShading />
    </mesh>
  );
});

const Tombstone: React.FC<{ position: [number, number, number], rotationY: number }> = React.memo(({ position, rotationY }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {/* Base Stone */}
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.6, 1.0, 0.2]} />
      <meshStandardMaterial color="#57534e" />
    </mesh>
    {/* Rounded Top */}
    <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
      <meshStandardMaterial color="#57534e" />
    </mesh>
    {/* Dirt Patch */}
    <mesh position={[0, 0.02, 0.6]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
       <planeGeometry args={[0.8, 1.3]} />
       <meshStandardMaterial color="#292524" />
    </mesh>
  </group>
));

const FencePost: React.FC<{ position: [number, number, number] }> = React.memo(({ position }) => (
  <mesh position={position} castShadow receiveShadow>
     <boxGeometry args={[0.35, 1.6, 0.35]} />
     <meshStandardMaterial color="#7c2d12" />
  </mesh>
));

const VoxelBuilding: React.FC<{ position: [number, number, number], height: number }> = React.memo(({ position, height }) => (
  <group position={position}>
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[4, height, 4]} />
      <meshStandardMaterial color="#374151" />
    </mesh>
    {/* Windows */}
    {[...Array(Math.floor(height / 1.5))].map((_, i) => (
       <React.Fragment key={i}>
         <mesh position={[0, 1 + i * 1.5, 2.05]}>
           <planeGeometry args={[3, 0.8]} />
           <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.5} />
         </mesh>
         <mesh position={[0, 1 + i * 1.5, -2.05]} rotation={[0, Math.PI, 0]}>
           <planeGeometry args={[3, 0.8]} />
           <meshStandardMaterial color="#fef3c7" emissive="#fef3c7" emissiveIntensity={0.5} />
         </mesh>
       </React.Fragment>
    ))}
  </group>
));

const VoxelHouse: React.FC<{ position: [number, number, number] }> = React.memo(({ position }) => (
  <group position={position}>
     <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
       <boxGeometry args={[3.5, 3, 3]} />
       <meshStandardMaterial color="#fca5a5" />
     </mesh>
     <mesh position={[0, 3.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
       <coneGeometry args={[3, 2, 4]} />
       <meshStandardMaterial color="#be123c" />
     </mesh>
     <mesh position={[0, 1, 1.55]}>
       <planeGeometry args={[1, 2]} />
       <meshStandardMaterial color="#451a03" />
     </mesh>
  </group>
));

const VoxelCottage: React.FC<{ position: [number, number, number], rotation: [number, number, number] }> = React.memo(({ position, rotation }) => (
  <group position={position} rotation={rotation}>
    {/* Base */}
    <mesh position={[0, 1, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.5, 2, 2]} />
      <meshStandardMaterial color="#5d4037" />
    </mesh>
    {/* Roof */}
    <mesh position={[0, 2.3, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0, 1.8, 1.5, 4, 1]} rotation={[0, Math.PI/4, 0]} />
       <meshStandardMaterial color="#3f2e27" />
    </mesh>
    {/* Door */}
    <mesh position={[0, 0.8, 1.05]}>
       <planeGeometry args={[0.8, 1.4]} />
       <meshStandardMaterial color="#271c19" />
    </mesh>
    {/* Chimney */}
    <mesh position={[0.8, 2.5, 0]}>
       <boxGeometry args={[0.5, 1.5, 0.5]} />
       <meshStandardMaterial color="#78716c" />
    </mesh>
  </group>
));

const WheatPatch: React.FC<{ position: [number, number, number] }> = React.memo(({ position }) => (
  <group position={position}>
      {[...Array(6)].map((_, i) => (
           <mesh key={i} position={[(Math.random()-0.5)*0.8, 0.3, (Math.random()-0.5)*0.8]}>
               <boxGeometry args={[0.08, 0.6 + Math.random()*0.4, 0.08]} />
               <meshStandardMaterial color="#eab308" />
           </mesh>
      ))}
  </group>
));

const StreetLamp: React.FC<{ position: [number, number, number] }> = React.memo(({ position }) => (
  <group position={position}>
    <mesh position={[0, 2.5, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.1, 5]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
    <mesh position={[0.5, 4.8, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.1, 0.1, 1]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
    <mesh position={[1, 4.6, 0]}>
       <boxGeometry args={[0.4, 0.2, 0.4]} />
       <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={1} />
    </mesh>
    <pointLight position={[1, 4, 0]} intensity={0.5} distance={10} color="#fbbf24" />
  </group>
));

// --- LIGHTING OBJECTS ---

const LanternPost: React.FC<{ position: [number, number, number] }> = React.memo(({ position }) => (
  <group position={position}>
    <mesh position={[0, 1, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.05, 0.05, 2]} />
      <meshStandardMaterial color="#3f2e27" />
    </mesh>
    <mesh position={[0.3, 1.8, 0]} castShadow>
       <boxGeometry args={[0.3, 0.4, 0.3]} />
       <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} />
    </mesh>
    <mesh position={[0.15, 1.8, 0]} rotation={[0,0,Math.PI/2]}>
       <cylinderGeometry args={[0.02, 0.02, 0.3]} />
       <meshStandardMaterial color="#3f2e27" />
    </mesh>
    <pointLight position={[0.3, 1.8, 0]} intensity={1.2} distance={12} color="#fbbf24" decay={2} />
  </group>
));

const GardenLight: React.FC<{ position: [number, number, number] }> = React.memo(({ position }) => (
  <group position={position}>
    <mesh position={[0, 0.4, 0]} castShadow>
      <cylinderGeometry args={[0.05, 0.05, 0.8]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
    <mesh position={[0, 0.8, 0]}>
       <sphereGeometry args={[0.15, 8, 8]} />
       <meshStandardMaterial color="#e0f2fe" emissive="#e0f2fe" emissiveIntensity={1} />
    </mesh>
    <pointLight position={[0, 1.0, 0]} intensity={0.8} distance={8} color="#e0f2fe" decay={2} />
  </group>
));

const GhostWisp: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + 1.5 + Math.sin(clock.elapsedTime * 1.5 + position[0]) * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[position[0], 0, position[2]]}>
       <mesh>
         <sphereGeometry args={[0.2, 8, 8]} />
         <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} transparent opacity={0.8} />
       </mesh>
       <pointLight intensity={1.5} distance={7} color="#22d3ee" decay={2} />
    </group>
  );
};

interface WorldProps {
  setObstacles?: (obstacles: Obstacle[]) => void;
}

export const World: React.FC<WorldProps> = React.memo(({ setObstacles }) => {
  const { renderData, collisionData } = useMemo(() => {
    const trees = [];
    const rocks = [];
    const grass = [];
    const fences = [];
    const buildings = [];
    const houses = [];
    const cottages = [];
    const wheat = [];
    const lamps = [];
    const tombstones = [];
    
    // Lighting Objects
    const lanternPosts = [];
    const gardenLights = [];
    const wisps = [];
    
    const obstacles: Obstacle[] = [];

    // --- ZONING ---
    // West (x < -40): Countryside
    // East (x > 40): Urban
    // South (z > 40): Suburban
    // North-West (x < -20 && z < -20): Graveyard
    // Everywhere else: Nature/Forest

    // 1. Urban Zone (East)
    for (let x = 50; x < 120; x += 15) {
      for (let z = -80; z < 80; z += 15) {
        if (Math.random() > 0.3) {
           const pos = new THREE.Vector3(x, 0, z);
           buildings.push({ pos: [x, 0, z] as [number, number, number], id: `b-${x}-${z}`, height: 5 + Math.random() * 10 });
           
           obstacles.push({
             id: `obs-b-${x}-${z}`,
             type: 'box',
             position: pos,
             size: new THREE.Vector2(4, 4)
           });
        }
        if (x === 50 && z % 30 === 0) {
           const pos = new THREE.Vector3(x - 4, 0, z);
           lamps.push({ pos: [x - 4, 0, z] as [number, number, number], id: `l-${x}-${z}` });
           
           obstacles.push({
             id: `obs-l-${x}-${z}`,
             type: 'circle',
             position: pos,
             radius: 0.3
           });
        }
      }
    }

    // 2. Suburban Zone (South)
    for (let x = -30; x < 40; x += 12) {
      for (let z = 50; z < 100; z += 12) {
         if (Math.random() > 0.2) {
           const pos = new THREE.Vector3(x, 0, z);
           houses.push({ pos: [x, 0, z] as [number, number, number], id: `h-${x}-${z}` });
           
           obstacles.push({
             id: `obs-h-${x}-${z}`,
             type: 'box',
             position: pos,
             size: new THREE.Vector2(3.5, 3)
           });

           // Add Garden Light occasionally
           if (Math.random() > 0.5) {
             const lightPos = new THREE.Vector3(x + 1.5, 0, z + 2.5);
             gardenLights.push({ pos: [lightPos.x, 0, lightPos.z] as [number, number, number], id: `gl-${x}-${z}` });
             obstacles.push({
                id: `obs-gl-${x}-${z}`,
                type: 'circle',
                position: lightPos,
                radius: 0.1
             });
           }
         }
      }
    }

    // 3. Graveyard Zone (Deep North West)
    // Define specific area
    for (let x = -90; x < -20; x += 6) {
      for (let z = -120; z < -40; z += 8) {
        // Skip if overlapping with countryside cottages too much (simple check)
        if (x > -50 && z > -60) continue; 

        const rand = Math.random();
        if (rand > 0.4) {
           const offsetX = (Math.random() - 0.5) * 2;
           const offsetZ = (Math.random() - 0.5) * 2;
           const pos = new THREE.Vector3(x + offsetX, 0, z + offsetZ);
           
           tombstones.push({ 
             pos: [pos.x, 0, pos.z] as [number, number, number], 
             rotationY: (Math.random() - 0.5) * 0.5, // slight tilt
             id: `grave-${x}-${z}` 
           });

           obstacles.push({
             id: `obs-grave-${x}-${z}`,
             type: 'box',
             position: pos,
             size: new THREE.Vector2(0.6, 0.3) 
           });
        }
        // Add some Dead Trees in the graveyard
        else if (rand < 0.15) {
           const pos = new THREE.Vector3(x, 0, z);
           trees.push({ pos: [x, 0, z] as [number, number, number], id: `tree-dead-${x}-${z}`, scale: 0.8 + Math.random() * 0.4, type: 'dead' });
           obstacles.push({
               id: `obs-tree-dead-${x}-${z}`,
               type: 'circle',
               position: pos,
               radius: 0.5
           });
        }
        
        // Ghost Wisps
        if (Math.random() < 0.08) {
          const pos = new THREE.Vector3(x + (Math.random()-0.5)*4, 0, z + (Math.random()-0.5)*4);
          wisps.push({ pos: [pos.x, 0, pos.z] as [number, number, number], id: `wisp-${x}-${z}` });
          // No collision for wisps
        }
      }
    }

    // 4. Countryside Zone (West, below Graveyard)
    for (let x = -100; x < -40; x += 10) {
      for (let z = -40; z < 80; z += 10) {
         const rand = Math.random();
         
         if (rand > 0.85) {
            const pos = new THREE.Vector3(x + Math.random()*2, 0, z + Math.random()*2);
            cottages.push({ 
              pos: [pos.x, 0, pos.z] as [number, number, number], 
              id: `c-${x}-${z}`,
              rotation: [0, Math.random() * Math.PI, 0] as [number, number, number]
            });
            
            obstacles.push({
              id: `obs-c-${x}-${z}`,
              type: 'box',
              position: pos,
              size: new THREE.Vector2(2.5, 2)
            });

            for(let w=0; w<3; w++) {
                wheat.push({ pos: [x + Math.random()*4 - 2, 0, z + Math.random()*4 - 2] as [number, number, number], id: `w-${x}-${z}-${w}` });
            }
            
            // Lantern Post
            if (Math.random() > 0.5) {
               const lPos = new THREE.Vector3(pos.x - 2, 0, pos.z + 1.5);
               lanternPosts.push({ pos: [lPos.x, 0, lPos.z] as [number, number, number], id: `lp-${x}-${z}` });
               obstacles.push({ id: `obs-lp-${x}-${z}`, type: 'circle', position: lPos, radius: 0.1 });
            }
         } 
         else if (rand > 0.5) {
             const pos = new THREE.Vector3(x, 0, z);
             const scale = 1.0 + Math.random() * 0.4;
             trees.push({ pos: [x, 0, z] as [number, number, number], id: `t-rural-${x}-${z}`, scale, type: 'normal' });
             
             obstacles.push({
               id: `obs-t-rural-${x}-${z}`,
               type: 'circle',
               position: pos,
               radius: 0.6 * scale
             });
         }
         else if (rand < 0.2) {
             wheat.push({ pos: [x, 0, z] as [number, number, number], id: `w-field-${x}-${z}` });
         }
      }
    }

    // 5. Dense Nature & Forest (Filling the rest)
    // Increased count from 150 to 400 for density
    for (let i = 0; i < 400; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 25 + Math.random() * 90; 
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      // Exclude Zones
      if (x > 40) continue; // Urban
      if (z > 40 && x > -30) continue; // Suburb
      if (x < -40 && z > -40) continue; // Countryside
      if (x < -20 && z < -40) continue; // Graveyard

      const scale = 1.2 + Math.random() * 0.6;
      const pos = new THREE.Vector3(x, 0, z);
      trees.push({ pos: [x, 0, z] as [number, number, number], id: `t-wild-${i}`, scale, type: 'normal' });
      
      obstacles.push({
        id: `obs-t-${i}`,
        type: 'circle',
        position: pos,
        radius: 0.6 * scale
      });
    }

    // Rocks (Scattered)
    for (let i = 0; i < 80; i++) {
       const x = (Math.random() - 0.5) * 200;
       const z = (Math.random() - 0.5) * 200;
       if (x*x + z*z < 600) continue; // clear center
       if (x > 40 || z > 40) continue; // clear city/suburbs
       
       const scale = 0.5 + Math.random() * 0.8;
       const rotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number];
       const pos = new THREE.Vector3(x, 0.6, z);
       rocks.push({ pos: [x, 0.6, z] as [number, number, number], id: i, scale, rotation });

       obstacles.push({
         id: `obs-r-${i}`,
         type: 'circle',
         position: pos,
         radius: 0.8 * scale
       });
    }

    // Dense Grass (Everywhere except asphalt)
    // Increased from 400 to 2000 for lush vegetation
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 220;
      const z = (Math.random() - 0.5) * 220;
      
      // Logic to avoid asphalt/roads roughly
      if (x > 40) continue; // Urban
      if (z > 70 && x > -30 && x < 40) continue; // Main Suburb Road area roughly

      // Clear center spawn
      if (x*x + z*z < 100) continue;

      const rotationY = Math.random() * Math.PI;
      const height = 0.4 + Math.random() * 0.4;
      grass.push({ pos: [x, 0.2, z] as [number, number, number], id: i, rotationY, height });
    }

    // Fence
    const perimeterRadius = 40;
    const postCount = 40;
    for (let i = 0; i < postCount; i++) {
       const angle = (i / postCount) * Math.PI * 2;
       if ((angle > -0.2 && angle < 0.2) || (angle > 1.4 && angle < 1.8) || (angle > 3.0 && angle < 3.4)) continue;

       const x = Math.cos(angle) * perimeterRadius;
       const z = Math.sin(angle) * perimeterRadius;
       const pos = new THREE.Vector3(x, 0, z);
       fences.push({ pos: [x, 0.8, z] as [number, number, number], angle, id: i });
       
       obstacles.push({
         id: `obs-f-${i}`,
         type: 'circle',
         position: pos,
         radius: 0.2
       });
    }

    return { 
      renderData: { 
        trees, rocks, grass, fences, buildings, houses, cottages, wheat, lamps, tombstones,
        lanternPosts, gardenLights, wisps 
      },
      collisionData: obstacles 
    };
  }, []);

  useEffect(() => {
    if (setObstacles) {
      setObstacles(collisionData);
    }
  }, [collisionData, setObstacles]);

  const { 
    trees, rocks, grass, fences, buildings, houses, cottages, wheat, lamps, tombstones,
    lanternPosts, gardenLights, wisps 
  } = renderData;

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#4f772d" />
      </mesh>

      {/* Urban Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[80, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 200]} />
        <meshStandardMaterial color="#374151" />
      </mesh>

      {/* Suburban Pavement */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, 0.01, 75]} receiveShadow>
        <planeGeometry args={[70, 5]} />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>

      {/* Assets */}
      {trees.map((t) => <VoxelTree key={t.id} position={t.pos} scale={t.scale} type={t.type as any} />)}
      {rocks.map((r) => <VoxelRock key={r.id} position={r.pos} scale={r.scale} rotation={r.rotation} />)}
      {buildings.map((b) => <VoxelBuilding key={b.id} position={b.pos} height={b.height} />)}
      {houses.map((h) => <VoxelHouse key={h.id} position={h.pos} />)}
      {cottages.map((c) => <VoxelCottage key={c.id} position={c.pos} rotation={c.rotation} />)}
      {wheat.map((w) => <WheatPatch key={w.id} position={w.pos} />)}
      {lamps.map((l) => <StreetLamp key={l.id} position={l.pos} />)}
      {tombstones.map((t) => <Tombstone key={t.id} position={t.pos} rotationY={t.rotationY} />)}

      {/* New Lighting Objects */}
      {lanternPosts.map(l => <LanternPost key={l.id} position={l.pos} />)}
      {gardenLights.map(l => <GardenLight key={l.id} position={l.pos} />)}
      {wisps.map(w => <GhostWisp key={w.id} position={w.pos} />)}

      {fences.map((f) => (
         <React.Fragment key={f.id}>
            <FencePost position={f.pos} />
            <mesh position={[f.pos[0], 1.2, f.pos[1]]} rotation={[0, -f.angle, 0]} castShadow>
                <boxGeometry args={[0.15, 0.15, 4.0]} />
                <meshStandardMaterial color="#5c220b" />
            </mesh>
            <mesh position={[f.pos[0], 0.6, f.pos[1]]} rotation={[0, -f.angle, 0]} castShadow>
                <boxGeometry args={[0.15, 0.15, 4.0]} />
                <meshStandardMaterial color="#5c220b" />
            </mesh>
         </React.Fragment>
      ))}

      {grass.map((g) => (
        <mesh key={g.id} position={g.pos} rotation={[0, g.rotationY, 0]}>
           <boxGeometry args={[0.1, g.height, 0.1]} />
           <meshStandardMaterial color="#65a30d" />
        </mesh>
      ))}

      {/* Background Mountains */}
      <group>
        <mesh position={[-90, 0, -90]} scale={[1, 1, 1]}>
          <coneGeometry args={[40, 50, 4]} />
          <meshStandardMaterial color="#3f6212" />
        </mesh>
        <mesh position={[60, 0, -120]} scale={[1, 0.8, 1]}>
          <coneGeometry args={[50, 40, 4]} />
          <meshStandardMaterial color="#365314" />
        </mesh>
      </group>

      <gridHelper args={[100, 100, 0x000000, 0x000000]} position={[0, 0.02, 0]}>
        <meshBasicMaterial attach="material" color="black" transparent opacity={0.05} />
      </gridHelper>
    </group>
  );
});
