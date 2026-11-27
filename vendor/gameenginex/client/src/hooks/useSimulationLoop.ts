import { useEffect } from 'react';
import { useConsciousness } from '../lib/stores/useConsciousness';

export function useSimulationLoop() {
  const { simulationActive, stepSimulation } = useConsciousness();
  
  useEffect(() => {
    if (!simulationActive) return;
    
    const intervalId = setInterval(() => {
      stepSimulation();
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [simulationActive, stepSimulation]);
}
