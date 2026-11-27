import { useState } from 'react';
import { useConsciousness } from '../lib/stores/useConsciousness';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { getElementName } from '../lib/gans/resonance-sgan';

export function CharacterPicker() {
  const [name, setName] = useState('');
  const [showBirthdayInput, setShowBirthdayInput] = useState(false);
  const [birthday, setBirthday] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const { agents, selectedAgent, createAgent, removeAgent } = useConsciousness();
  
  const handleCreate = () => {
    if (name.trim()) {
      createAgent(name.trim());
      setName('');
      setBirthday('');
      setBirthTime('12:00');
      setShowBirthdayInput(false);
    }
  };
  
  const selectedAgentData = agents.find(a => a.id === selectedAgent);
  
  return (
    <div className="fixed top-4 left-4 w-96 z-10 pointer-events-auto">
      <Card className="bg-black/80 backdrop-blur-md border-purple-500/50">
        <CardHeader>
          <CardTitle className="text-2xl text-purple-400">Consciousness Engine</CardTitle>
          <CardDescription className="text-gray-300">
            Enter a name or phrase to generate a consciousness agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name..."
                className="bg-black/50 border-purple-500/50 text-white"
                onKeyPress={(e) => e.key === 'Enter' && !showBirthdayInput && handleCreate()}
              />
              <Button
                onClick={() => setShowBirthdayInput(!showBirthdayInput)}
                variant="outline"
                className="border-purple-500/50 hover:bg-purple-900/30"
              >
                📅
              </Button>
            </div>
            
            {showBirthdayInput && (
              <div className="space-y-2 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                <div className="text-xs text-purple-300 font-semibold">Birth Data (for 3-Chart Analysis)</div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="bg-black/50 border-purple-500/50 text-white text-sm"
                    placeholder="Birthday"
                  />
                  <Input
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="bg-black/50 border-purple-500/50 text-white text-sm"
                    placeholder="Time"
                  />
                </div>
                <div className="text-xs text-gray-400">
                  Generates: Sidereal (Mind) • Tropical (Heart) • Draconic (Body)
                </div>
              </div>
            )}
            
            <Button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Create Agent
            </Button>
          </div>
          
          {selectedAgentData && (
            <div className="p-4 bg-purple-900/30 rounded-lg border border-purple-500/30 space-y-2">
              <h3 className="font-bold text-lg text-white">{selectedAgentData.name}</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Element:</span>
                  <Badge style={{ backgroundColor: selectedAgentData.color }}>
                    {getElementName(selectedAgentData.element)}
                  </Badge>
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Archetype:</span> {selectedAgentData.humanDesign.currentArchetype}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Body Type:</span> {selectedAgentData.humanDesign.phenotype.bodyType}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Energy:</span> {selectedAgentData.humanDesign.phenotype.energySignature}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Cognitive Style:</span> {selectedAgentData.humanDesign.phenotype.cognitiveStyle}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Consciousness:</span> {(selectedAgentData.humanDesign.consciousnessLevel * 100).toFixed(0)}%
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-400">Active Gates:</span> {selectedAgentData.humanDesign.activeGates.length}
                </div>
                <div className="text-gray-300 text-xs">
                  Gates: {selectedAgentData.humanDesign.activeGates.join(', ')}
                </div>
              </div>
              <Button
                onClick={() => removeAgent(selectedAgentData.id)}
                variant="destructive"
                size="sm"
                className="w-full mt-2"
              >
                Remove Agent
              </Button>
            </div>
          )}
          
          {agents.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-purple-300">All Agents ({agents.length})</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedAgent === agent.id
                        ? 'bg-purple-600/50 border border-purple-400'
                        : 'bg-purple-900/20 hover:bg-purple-800/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span className="text-sm text-white">{agent.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
