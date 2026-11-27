import { Canvas } from "@react-three/fiber";
import { Suspense, useState } from "react";
import "@fontsource/inter";
import { GameWorld } from "./components/GameWorld";
import { GameUI } from "./components/GameUI";
import { ResponsiveOraclePanels } from "./components/ResponsiveOraclePanels";
import { HomeScreen } from "./components/HomeScreen";
import { useSimulationLoop } from "./hooks/useSimulationLoop";

function App() {
  const [showHome, setShowHome] = useState(true);
  useSimulationLoop();
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {showHome && <HomeScreen onEnter={() => setShowHome(false)} />}
      
      <Canvas
        shadows
        camera={{
          position: [0, 8, 12],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        gl={{
          antialias: true,
          powerPreference: "high-performance"
        }}
      >
        <Suspense fallback={null}>
          <GameWorld />
        </Suspense>
      </Canvas>
      
      <GameUI />
      <ResponsiveOraclePanels />
    </div>
  );
}

export default App;
