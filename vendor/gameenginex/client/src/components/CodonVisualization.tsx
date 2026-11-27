import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ProgressiveCodonScene, createCodonElement } from '../lib/gans/codon-resonance-gamegan';

interface CodonVisualizationProps {
  activeGates: number[];
}

export function CodonVisualization({ activeGates }: CodonVisualizationProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  const scene = useMemo(() => {
    const progressiveScene = new ProgressiveCodonScene();
    activeGates.forEach(gate => progressiveScene.addCodon(gate));
    return progressiveScene;
  }, [activeGates]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  
  const radius = 3;
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {scene.elements.map((element, idx) => {
        const angle = (idx / scene.elements.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(idx * 0.5) * 0.5;
        
        const hue = element.colorHue / 360;
        const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
        
        return (
          <group key={element.id} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={element.glowIntensity}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
            
            <mesh position={[0, 0, 0]} scale={1.2}>
              <ringGeometry args={[0.15, 0.18, 16]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}
      
      {scene.resonanceOverlays.map((overlay, idx) => {
        const elem1 = scene.elements.find(e => e.id === overlay.element1Id);
        const elem2 = scene.elements.find(e => e.id === overlay.element2Id);
        if (!elem1 || !elem2) return null;
        
        const idx1 = scene.elements.indexOf(elem1);
        const idx2 = scene.elements.indexOf(elem2);
        
        const angle1 = (idx1 / scene.elements.length) * Math.PI * 2;
        const angle2 = (idx2 / scene.elements.length) * Math.PI * 2;
        
        const x1 = Math.cos(angle1) * radius;
        const z1 = Math.sin(angle1) * radius;
        const y1 = Math.sin(idx1 * 0.5) * 0.5;
        
        const x2 = Math.cos(angle2) * radius;
        const z2 = Math.sin(angle2) * radius;
        const y2 = Math.sin(idx2 * 0.5) * 0.5;
        
        const start = new THREE.Vector3(x1, y1, z1);
        const end = new THREE.Vector3(x2, y2, z2);
        const distance = start.distanceTo(end);
        const mid = start.clone().lerp(end, 0.5);
        
        const hue = overlay.colorBlend / 360;
        const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
        
        return (
          <mesh key={`overlay-${idx}`} position={mid}>
            <cylinderGeometry args={[0.02, 0.02, distance, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={overlay.resonanceStrength * 0.5}
              transparent
              opacity={overlay.resonanceStrength * 0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}
