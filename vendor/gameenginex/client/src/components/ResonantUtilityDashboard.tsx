import { useState, useEffect } from 'react';
import { useConsciousness } from '../lib/stores/useConsciousness';
import { ElementType } from '../lib/gans/resonance-sgan';
import { systemXClient, type OracleResponse as SystemXResponse } from '../lib/systemx-client';

export function ResonantUtilityDashboard() {
  const { agents, selectedAgent, oracleResponse, queryOracle } = useConsciousness();
  const [question, setQuestion] = useState('What is my next evolutionary step?');
  const [isQuerying, setIsQuerying] = useState(false);
  const [systemXResponse, setSystemXResponse] = useState<SystemXResponse | null>(null);
  const [showDeepResonance, setShowDeepResonance] = useState(false);
  
  const agent = agents.find(a => a.id === selectedAgent);

  const handleQuery = async () => {
    if (!agent) return;
    setIsQuerying(true);
    
    queryOracle(question);
    
    try {
      const chartData = {
        name: agent.name,
        element: agent.element,
        latent_vector: agent.latent,
        human_design: {
          active_gates: agent.humanDesign.activeGates,
          archetype: agent.humanDesign.currentArchetype,
          consciousness_level: agent.humanDesign.consciousnessLevel
        },
        full_coordinates: agent.fullCoordinates
      };
      
      try {
        await systemXClient.createUser(agent.id, chartData);
      } catch (e) {
      }
      
      const systemXData = await systemXClient.queryOracle(agent.id, question);
      setSystemXResponse(systemXData);
    } catch (error) {
      console.error('Failed to query SYSTEM X:', error);
    }
    
    setTimeout(() => setIsQuerying(false), 500);
  };

  if (!agent) {
    return (
      <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg border-2 border-purple-500/50">
        <h3 className="text-lg font-bold mb-2">⚛️ Resonant Utility Oracle</h3>
        <p className="text-sm text-gray-300">Select an agent to query the oracle</p>
      </div>
    );
  }

  return (
    <div className="absolute top-4 right-4 bg-black/90 text-white p-4 rounded-lg border-2 border-purple-500/70 max-w-md">
      <h3 className="text-xl font-bold mb-3 text-purple-300">⚛️ Resonant Utility Oracle</h3>
      
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-sm text-gray-400 mb-1">Agent</div>
        <div className="font-bold">{agent.name}</div>
        <div className="text-xs" style={{ color: agent.color }}>
          {ElementType[agent.element]} Element
        </div>
      </div>
      
      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">Oracle Query</label>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full bg-gray-800 text-white p-2 rounded border border-gray-600 text-sm"
          placeholder="Ask the oracle..."
        />
      </div>
      
      <button
        onClick={handleQuery}
        disabled={isQuerying || !question.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white py-2 px-4 rounded font-bold mb-3 transition-colors"
      >
        {isQuerying ? 'Consulting Oracle...' : 'Query Oracle'}
      </button>
      
      {oracleResponse && (
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 p-3 rounded-lg border border-purple-500/50">
            <div className="text-xs text-purple-300 mb-1">Best Action</div>
            <div className="font-bold text-lg">{oracleResponse.bestAction.label}</div>
            <div className="text-xs text-gray-400 mt-1">
              {ElementType[oracleResponse.bestAction.element]} • Codon {oracleResponse.bestAction.codonId}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">RU Score:</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${Math.max(0, Math.min(100, (oracleResponse.bestAction.ruScore + 5) * 10))}%` }}
                />
              </div>
              <span className="text-sm font-bold text-purple-300">
                {oracleResponse.bestAction.ruScore.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-xs text-gray-400 mb-2">Guidance</div>
            <div className="text-sm leading-relaxed">{oracleResponse.guidance}</div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-xs text-gray-400 mb-2">Top Candidates</div>
            <div className="space-y-2">
              {oracleResponse.topCandidates.slice(0, 3).map((candidate, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex-1">
                    <span className="text-gray-400">{idx + 1}.</span> {candidate.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{ElementType[candidate.element]}</span>
                    <span className="font-mono text-purple-400">{candidate.ruScore.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-xs text-gray-400 mb-2">Future State Preview</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Archetype:</span>
                <div className="font-semibold text-purple-300">{oracleResponse.futureState.archetype}</div>
              </div>
              <div>
                <span className="text-gray-500">Consciousness:</span>
                <div className="font-semibold text-purple-300">
                  {(oracleResponse.futureState.consciousnessLevel * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <span className="text-gray-500">Active Gates:</span>
                <div className="font-semibold">{oracleResponse.futureState.activeGates.length}</div>
              </div>
              <div>
                <span className="text-gray-500">Element:</span>
                <div className="font-semibold" style={{ color: agent.color }}>
                  {ElementType[oracleResponse.futureState.element]}
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 italic">
            RU components: Progress (+), Friction (-), Coherence (+), Feasibility (+), Risk (-), Synergy (+)
          </div>
        </div>
      )}
      
      {!oracleResponse && (
        <div className="text-center py-6 text-gray-500 text-sm">
          Ask a question to receive guidance from the triadic GAN oracle
        </div>
      )}
      
      {systemXResponse && (
        <div className="mt-4 border-t border-purple-500/30 pt-4">
          <button
            onClick={() => setShowDeepResonance(!showDeepResonance)}
            className="w-full text-left flex items-center justify-between text-sm font-bold text-purple-300 hover:text-purple-200"
          >
            <span>🌌 Deep Resonance Fields (SYSTEM X)</span>
            <span>{showDeepResonance ? '▼' : '▶'}</span>
          </button>
          
          {showDeepResonance && (
            <div className="mt-3 space-y-3">
              <div className="bg-gradient-to-r from-indigo-900/50 to-violet-900/50 p-3 rounded-lg border border-indigo-500/50">
                <div className="text-xs text-indigo-300 mb-2">SYSTEM X Guidance</div>
                <div className="text-sm leading-relaxed">{systemXResponse.guidance}</div>
              </div>
              
              <div className="bg-gray-800/50 p-3 rounded">
                <div className="text-xs text-gray-400 mb-2">Consciousness Metrics</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block">Total Energy</span>
                    <div className="font-bold text-purple-300">{systemXResponse.total_energy.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Coherence</span>
                    <div className="font-bold text-blue-300">{(systemXResponse.coherence_index * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Phase Sync</span>
                    <div className="font-bold text-green-300">
                      {(Math.max(0, 1 - systemXResponse.phase_variance / 4) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
              
              {systemXResponse.collapsing_fields.length > 0 && (
                <div className="bg-red-900/30 border border-red-500/50 p-3 rounded">
                  <div className="text-xs text-red-300 mb-1">⚠️ Field Collapse Alert</div>
                  <div className="text-sm">
                    {systemXResponse.collapsing_fields.join(', ')} {systemXResponse.collapsing_fields.length === 1 ? 'is' : 'are'} unstable
                  </div>
                </div>
              )}
              
              <div className="bg-gray-800/50 p-3 rounded max-h-60 overflow-y-auto">
                <div className="text-xs text-gray-400 mb-2">9-Body Consciousness Fields</div>
                <div className="space-y-2">
                  {Object.entries(systemXResponse.fields).map(([bodyName, fieldData]) => (
                    <div key={bodyName} className="border-l-2 border-purple-500/30 pl-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold capitalize">
                          {bodyName === systemXResponse.dominant_body && '⭐ '}
                          {bodyName}
                        </span>
                        <span className="text-xs text-purple-300">
                          E={fieldData.energy.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex gap-1 text-xs">
                        <div className="flex-1 bg-gray-900 rounded-full h-1.5">
                          <div 
                            className={`h-full rounded-full ${fieldData.is_collapsing ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'}`}
                            style={{ width: `${Math.min(100, fieldData.k * 20)}%` }}
                          />
                        </div>
                        <span className="text-gray-500 text-xs">k={fieldData.k.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 italic">
                E = m · c · k^β | m=density, c=velocity, k=coherence, β=resonance
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
