import { useConsciousness } from '../lib/stores/useConsciousness';
import { CoordinateResolver } from '../lib/gans/coordinate-resolver';

export function QuantumCoordinateDisplay() {
  const { agents, selectedAgent } = useConsciousness();
  const agent = agents.find(a => a.id === selectedAgent);
  
  if (!agent) {
    return (
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/80 text-white p-4 rounded-lg border-2 border-purple-500/50">
        <h3 className="text-lg font-bold mb-2">🌌 Quantum Coordinates</h3>
        <p className="text-sm text-gray-300">Select an agent to view coordinates</p>
      </div>
    );
  }

  const resolver = new CoordinateResolver();
  const coords = agent.fullCoordinates;
  const colorProps = resolver.getColorProperties(coords.quantum.color);
  const tone = resolver.getToneProperty(coords.quantum.tone);
  const base = resolver.getBaseProperty(coords.quantum.base);
  const zodiac = resolver.getZodiacSign(coords.astrological.zodiacSign);

  return (
    <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black/90 text-white p-4 rounded-lg border-2 border-purple-500/70 max-w-sm max-h-[80vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-3 text-purple-300">🌌 Quantum Coordinates</h3>
      
      <div className="mb-3 pb-3 border-b border-gray-700">
        <div className="text-sm text-gray-400">Agent</div>
        <div className="font-bold">{agent.name}</div>
        <div className="text-xs text-purple-400 font-mono mt-1">
          ID: {coords.coordinateId.toLocaleString()} / 69,120
        </div>
        <div className="text-xs text-gray-500 font-mono">
          {coords.signature}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 p-3 rounded border border-purple-500/30">
          <div className="text-xs text-purple-300 mb-2 font-bold">QUANTUM LAYER (5-Fold)</div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Gate:</span>
              <div className="font-bold text-purple-300">{coords.quantum.gate}/64</div>
            </div>
            <div>
              <span className="text-gray-400">Line:</span>
              <div className="font-bold text-purple-300">{coords.quantum.line}/6</div>
            </div>
            <div>
              <span className="text-gray-400">Color:</span>
              <div className="font-bold text-blue-300">{coords.quantum.color}/6</div>
              <div className="text-xs text-gray-500">{colorProps.name}</div>
            </div>
            <div>
              <span className="text-gray-400">Tone:</span>
              <div className="font-bold text-blue-300">{coords.quantum.tone}/6</div>
              <div className="text-xs text-gray-500">{tone}</div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400">Base:</span>
              <div className="font-bold text-cyan-300">{coords.quantum.base}/5</div>
              <div className="text-xs text-gray-500">{base}</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-amber-900/40 to-red-900/40 p-3 rounded border border-amber-500/30">
          <div className="text-xs text-amber-300 mb-2 font-bold">ASTROLOGICAL OVERLAY</div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-400">Degree:</span>
              <div className="font-bold text-amber-300">{coords.astrological.degree.toFixed(2)}°</div>
            </div>
            <div>
              <span className="text-gray-400">Zodiac:</span>
              <div className="font-bold text-amber-300">{zodiac}</div>
            </div>
            <div>
              <span className="text-gray-400">House:</span>
              <div className="font-bold text-red-300">{coords.astrological.house}/12</div>
            </div>
            <div>
              <span className="text-gray-400">Axis:</span>
              <div className="font-bold text-red-300 capitalize">{coords.astrological.axis}</div>
            </div>
          </div>
          
          <div className="mt-2 pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-400">Planetary Gates</div>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 bg-gray-800/50 p-1 rounded">
                <div className="text-xs text-yellow-400">☉ Sun</div>
                <div className="font-mono text-xs">{coords.astrological.sun}</div>
              </div>
              <div className="flex-1 bg-gray-800/50 p-1 rounded">
                <div className="text-xs text-blue-400">⊕ Earth</div>
                <div className="font-mono text-xs">{coords.astrological.earth}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 bg-gray-800/50 p-1 rounded">
                <div className="text-xs text-green-400">☊ N.Node</div>
                <div className="font-mono text-xs">{coords.astrological.nodes.north}</div>
              </div>
              <div className="flex-1 bg-gray-800/50 p-1 rounded">
                <div className="text-xs text-orange-400">☋ S.Node</div>
                <div className="font-mono text-xs">{coords.astrological.nodes.south}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-900/40 to-teal-900/40 p-3 rounded border border-green-500/30">
          <div className="text-xs text-green-300 mb-2 font-bold">PHENOTYPE EXPRESSION</div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Body Type:</span>
              <span className="font-semibold text-green-300">{agent.phenotype.bodyType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Authority:</span>
              <span className="font-semibold text-green-300">{agent.phenotype.authority}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Profile:</span>
              <span className="font-semibold text-teal-300">{agent.phenotype.profile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Strategy:</span>
              <span className="font-semibold text-teal-300">{agent.phenotype.strategy}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-pink-900/40 to-purple-900/40 p-3 rounded border border-pink-500/30">
          <div className="text-xs text-pink-300 mb-2 font-bold">DETERMINATION & ENVIRONMENT</div>
          
          <div className="space-y-1 text-xs">
            <div>
              <span className="text-gray-400">Digestion:</span>
              <div className="font-semibold text-pink-300">{agent.phenotype.determination}</div>
            </div>
            <div>
              <span className="text-gray-400">Cognition:</span>
              <div className="font-semibold text-pink-300">{agent.phenotype.cognition}</div>
            </div>
            <div>
              <span className="text-gray-400">Frequency:</span>
              <div className="font-semibold text-purple-300">{agent.phenotype.frequency}</div>
            </div>
            <div>
              <span className="text-gray-400">Environment:</span>
              <div className="font-semibold text-purple-300">{agent.phenotype.environment}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>System Precision:</span>
          <span className="text-purple-400">Gate.Line.Color.Tone.Base</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Total Coordinates:</span>
          <span className="text-purple-400">64×6×6×6×5 = 69,120</span>
        </div>
      </div>
    </div>
  );
}
