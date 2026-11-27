import { useConsciousness } from '../lib/stores/useConsciousness';
import { ElementType } from '../lib/gans/resonance-sgan';
import { useEffect, useState } from 'react';

interface CenterState {
  name: string;
  activation: number;
  frequency: number;
  quality: string;
  color: string;
}

export function AwarenessCenterUI() {
  const { agents, selectedAgent } = useConsciousness();
  const agent = agents.find(a => a.id === selectedAgent);
  
  const [spleenState, setSpleenState] = useState<CenterState>({
    name: 'Spleen',
    activation: 0,
    frequency: 0,
    quality: 'Dormant',
    color: '#8B4513'
  });
  
  const [ajnaState, setAjnaState] = useState<CenterState>({
    name: 'Ajna',
    activation: 0,
    frequency: 0,
    quality: 'Dormant',
    color: '#4169E1'
  });
  
  const [solarPlexusState, setSolarPlexusState] = useState<CenterState>({
    name: 'Solar Plexus',
    activation: 0,
    frequency: 0,
    quality: 'Dormant',
    color: '#FFD700'
  });

  useEffect(() => {
    if (!agent) return;
    
    const definedCenters = agent.humanDesign.definedCenters;
    const consciousnessLevel = agent.humanDesign.consciousnessLevel;
    const activeGates = agent.humanDesign.activeGates;
    
    const spleenGates = activeGates.filter(g => [18, 28, 32, 44, 48, 50, 57].includes(g));
    const spleenActivation = Math.min(1.0, spleenGates.length / 7);
    const spleenFreq = 126.22 + (spleenActivation * 50);
    setSpleenState({
      name: 'Spleen',
      activation: spleenActivation,
      frequency: spleenFreq,
      quality: definedCenters.includes('Spleen') 
        ? spleenActivation > 0.7 ? 'Heightened Intuition' 
          : spleenActivation > 0.4 ? 'Active Awareness' 
          : 'Sensing'
        : 'Open/Receptive',
      color: '#8B4513'
    });
    
    const ajnaGates = activeGates.filter(g => [4, 11, 17, 24, 43, 47].includes(g));
    const ajnaActivation = Math.min(1.0, ajnaGates.length / 6);
    const ajnaFreq = 221.23 + (ajnaActivation * 60);
    setAjnaState({
      name: 'Ajna',
      activation: ajnaActivation,
      frequency: ajnaFreq,
      quality: definedCenters.includes('Ajna')
        ? ajnaActivation > 0.7 ? 'Mental Certainty'
          : ajnaActivation > 0.4 ? 'Conceptualizing'
          : 'Processing'
        : 'Open Mind',
      color: '#4169E1'
    });
    
    const solarPlexusGates = activeGates.filter(g => [6, 22, 30, 36, 37, 49, 55].includes(g));
    const solarPlexusActivation = Math.min(1.0, solarPlexusGates.length / 7);
    const solarPlexusFreq = 210.42 + (solarPlexusActivation * 70);
    setSolarPlexusState({
      name: 'Solar Plexus',
      activation: solarPlexusActivation,
      frequency: solarPlexusFreq,
      quality: definedCenters.includes('Solar Plexus')
        ? solarPlexusActivation > 0.7 ? 'Emotional Wave Peak'
          : solarPlexusActivation > 0.4 ? 'Feeling Deeply'
          : 'Emotional Processing'
        : 'Empathic Receiver',
      color: '#FFD700'
    });
  }, [agent]);

  if (!agent) {
    return (
      <div className="absolute top-4 left-4 bg-black/80 text-white p-4 rounded-lg border-2 border-purple-500/50">
        <h3 className="text-lg font-bold mb-2">⚡ Awareness Centers</h3>
        <p className="text-sm text-gray-300">Select an agent to view awareness centers</p>
      </div>
    );
  }

  const renderCenterReadout = (center: CenterState) => (
    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold" style={{ color: center.color }}>{center.name}</div>
        <div className="text-xs bg-gray-900 px-2 py-1 rounded">
          {(center.activation * 100).toFixed(0)}%
        </div>
      </div>
      
      <div className="mb-2">
        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${center.activation * 100}%`,
              backgroundColor: center.color,
              boxShadow: `0 0 8px ${center.color}`
            }}
          />
        </div>
      </div>
      
      <div className="text-xs text-gray-400 mb-1">
        Frequency: <span className="text-white">{center.frequency.toFixed(2)} Hz</span>
      </div>
      
      <div className="text-sm font-medium" style={{ color: center.color }}>
        {center.quality}
      </div>
    </div>
  );

  return (
    <div className="absolute top-4 left-4 bg-black/90 text-white p-4 rounded-lg border-2 border-purple-500/70 max-w-sm">
      <h3 className="text-xl font-bold mb-3 text-purple-300">⚡ Awareness Centers</h3>
      
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-sm text-gray-400">Agent</div>
        <div className="font-bold">{agent.name}</div>
        <div className="text-xs" style={{ color: agent.color }}>
          {ElementType[agent.element]} • {agent.humanDesign.currentArchetype}
        </div>
      </div>
      
      <div className="space-y-3">
        {renderCenterReadout(ajnaState)}
        {renderCenterReadout(spleenState)}
        {renderCenterReadout(solarPlexusState)}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Consciousness Level</span>
          <span className="text-purple-400 font-bold">
            {(agent.humanDesign.consciousnessLevel * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Active Gates</span>
          <span className="text-purple-400">{agent.humanDesign.activeGates.length}/64</span>
        </div>
      </div>
    </div>
  );
}
