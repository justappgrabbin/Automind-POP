import { useState } from 'react';
import { useConsciousness } from '../lib/stores/useConsciousness';
import { ElementType, ELEMENT_COMPATIBILITY_MATRIX, elemental_operator } from '../lib/gans/resonance-sgan';

export function ElementalOperatorUI() {
  const agents = useConsciousness((state) => state.agents);
  const [selectedAgent1, setSelectedAgent1] = useState<string | null>(null);
  const [selectedAgent2, setSelectedAgent2] = useState<string | null>(null);

  const agent1 = agents.find(a => a.id === selectedAgent1);
  const agent2 = agents.find(a => a.id === selectedAgent2);

  if (agents.length < 2) {
    return (
      <div className="absolute bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg border-2 border-purple-500/50">
        <h3 className="text-lg font-bold mb-2">Elemental Resonance Analyzer</h3>
        <p className="text-sm text-gray-300">Create at least 2 agents to analyze resonance</p>
      </div>
    );
  }

  const compatibility = agent1 && agent2 
    ? ELEMENT_COMPATIBILITY_MATRIX[agent1.element][agent2.element]
    : null;

  const blendResult = agent1 && agent2 
    ? elemental_operator(agent1.element, agent2.element, 'blend')
    : null;
    
  const amplifyResult = agent1 && agent2 
    ? elemental_operator(agent1.element, agent2.element, 'amplify')
    : null;
    
  const dampenResult = agent1 && agent2 
    ? elemental_operator(agent1.element, agent2.element, 'dampen')
    : null;

  const getRecommendation = (compat: number) => {
    if (compat > 0.7) return { op: 'AMPLIFY', color: 'text-green-400' };
    if (compat > 0.5) return { op: 'BLEND', color: 'text-yellow-400' };
    return { op: 'DAMPEN', color: 'text-red-400' };
  };

  const recommendation = compatibility ? getRecommendation(compatibility) : null;

  return (
    <div className="absolute bottom-4 left-4 bg-black/90 text-white p-6 rounded-lg border-2 border-purple-500/70 max-w-md">
      <h3 className="text-xl font-bold mb-4 text-purple-300">⚡ Elemental Resonance Analyzer</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Agent 1</label>
          <select 
            value={selectedAgent1 || ''} 
            onChange={(e) => setSelectedAgent1(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm"
          >
            <option value="">Select...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({ElementType[agent.element]})
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Agent 2</label>
          <select 
            value={selectedAgent2 || ''} 
            onChange={(e) => setSelectedAgent2(e.target.value)}
            className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm"
          >
            <option value="">Select...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({ElementType[agent.element]})
              </option>
            ))}
          </select>
        </div>
      </div>

      {agent1 && agent2 && compatibility !== null && (
        <div className="space-y-3">
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-xs text-gray-400 mb-1">Base Compatibility</div>
            <div className="text-2xl font-bold">
              {(compatibility * 100).toFixed(0)}%
            </div>
            <div className="flex gap-2 mt-2">
              <div className="px-2 py-1 rounded text-xs" style={{ backgroundColor: agent1.color }}>
                {ElementType[agent1.element]}
              </div>
              <span className="text-gray-500">×</span>
              <div className="px-2 py-1 rounded text-xs" style={{ backgroundColor: agent2.color }}>
                {ElementType[agent2.element]}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            {blendResult && (
              <div className="bg-yellow-900/30 p-2 rounded border border-yellow-600/50">
                <div className="text-yellow-400 font-bold mb-1">BLEND</div>
                <div>{(blendResult.resonance * 100).toFixed(0)}%</div>
                <div className="text-gray-400 text-xs mt-1">{blendResult.symbol}</div>
              </div>
            )}
            
            {amplifyResult && (
              <div className="bg-green-900/30 p-2 rounded border border-green-600/50">
                <div className="text-green-400 font-bold mb-1">AMPLIFY</div>
                <div>{(amplifyResult.resonance * 100).toFixed(0)}%</div>
                <div className="text-gray-400 text-xs mt-1">{amplifyResult.symbol}</div>
              </div>
            )}
            
            {dampenResult && (
              <div className="bg-red-900/30 p-2 rounded border border-red-600/50">
                <div className="text-red-400 font-bold mb-1">DAMPEN</div>
                <div>{(dampenResult.resonance * 100).toFixed(0)}%</div>
                <div className="text-gray-400 text-xs mt-1">{dampenResult.symbol}</div>
              </div>
            )}
          </div>

          {recommendation && (
            <div className={`bg-gray-800/70 p-3 rounded border-2 ${recommendation.color.replace('text-', 'border-')}`}>
              <div className="text-xs text-gray-400 mb-1">Recommended Operation</div>
              <div className={`text-lg font-bold ${recommendation.color}`}>
                {recommendation.op}
              </div>
              <div className="text-xs text-gray-300 mt-1">
                {recommendation.op === 'AMPLIFY' && 'High harmony - Strengthen this connection'}
                {recommendation.op === 'BLEND' && 'Moderate sync - Merge energies carefully'}
                {recommendation.op === 'DAMPEN' && 'Low resonance - Reduce interaction or balance'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
