import { OrbitControls, Environment, Grid } from '@react-three/drei';
import { useConsciousness } from '../lib/stores/useConsciousness';
import { ConsciousnessAgentComponent } from './ConsciousnessAgent';

export function GameWorld() {
  const { agents, selectedAgent, selectAgent } = useConsciousness();
  
  return (
    <>
      <color attach="background" args={['#0a0a1a']} />
      
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <pointLight position={[0, 5, 0]} intensity={1} color="#9370DB" />
      
      <Environment preset="night" />
      
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6366f1"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#8b5cf6"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />
      
      {agents.map((agent) => (
        <ConsciousnessAgentComponent
          key={agent.id}
          agent={agent}
          selected={selectedAgent === agent.id}
          onClick={() => selectAgent(agent.id)}
        />
      ))}
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        target={[0, 0, 0]}
      />
    </>
  );
}
