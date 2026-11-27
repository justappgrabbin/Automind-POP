import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { ConsciousnessAgent } from '../lib/stores/useConsciousness';
import { CENTER_POSITIONS } from '../lib/gans/human-design-gamegan';
import { CodonVisualization } from './CodonVisualization';

interface ConsciousnessAgentProps {
  agent: ConsciousnessAgent;
  selected: boolean;
  onClick: () => void;
}

export function ConsciousnessAgentComponent({ agent, selected, onClick }: ConsciousnessAgentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bodygraphRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.lerp(
        new THREE.Vector3(agent.position.x, agent.position.y + 1, agent.position.z),
        0.1
      );
    }
    
    if (bodygraphRef.current) {
      bodygraphRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });
  
  return (
    <group ref={groupRef} onClick={onClick}>
      {selected && (
        <CodonVisualization activeGates={agent.humanDesign.activeGates} />
      )}
      <group ref={bodygraphRef} position={[0, 1, 0]}>
        {agent.humanDesign.definedCenters.map((center) => {
          const pos = CENTER_POSITIONS[center];
          if (!pos) return null;
          
          return (
            <mesh key={center} position={pos}>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial
                color={agent.color}
                emissive={agent.color}
                emissiveIntensity={selected ? 0.8 : 0.3}
                metalness={0.8}
                roughness={0.2}
              />
            </mesh>
          );
        })}
        
        {agent.humanDesign.definedCenters.map((center, i) => {
          if (i === 0) return null;
          const pos1 = CENTER_POSITIONS[agent.humanDesign.definedCenters[i - 1]];
          const pos2 = CENTER_POSITIONS[center];
          if (!pos1 || !pos2) return null;
          
          const start = new THREE.Vector3(...pos1);
          const end = new THREE.Vector3(...pos2);
          const mid = start.clone().lerp(end, 0.5);
          const distance = start.distanceTo(end);
          
          return (
            <mesh key={`line-${i}`} position={mid}>
              <cylinderGeometry args={[0.02, 0.02, distance, 8]} />
              <meshStandardMaterial
                color={agent.color}
                emissive={agent.color}
                emissiveIntensity={0.5}
                transparent
                opacity={0.6}
              />
            </mesh>
          );
        })}
      </group>
      
      <mesh position={[0, 0.3, 0]} onClick={onClick} castShadow>
        <capsuleGeometry args={[0.3, 0.8, 8, 16]} />
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={selected ? 0.5 : 0.2}
          metalness={0.6}
          roughness={0.4}
        />
      </mesh>
      
      <mesh position={[0, 0.9, 0]} onClick={onClick} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial
          color={agent.color}
          emissive={agent.color}
          emissiveIntensity={selected ? 0.6 : 0.3}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
      
      <Text
        position={[0, 2.8, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {agent.name}
      </Text>
      
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.15}
        color={agent.color}
        anchorX="center"
        anchorY="middle"
      >
        {agent.humanDesign.currentArchetype}
      </Text>
      
      {selected && (
        <mesh position={[0, 0, 0]} scale={1.5}>
          <ringGeometry args={[0.5, 0.55, 32]} />
          <meshBasicMaterial color={agent.color} side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}
