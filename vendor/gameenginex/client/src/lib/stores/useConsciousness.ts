import { create } from 'zustand';
import { ElementType, generateLatentFromName, latentToElement } from '../gans/resonance-sgan';
import { generateHumanDesignFromName, HumanDesignState } from '../gans/human-design-gamegan';
import { UnifiedCognitiveEngine, OracleResponse } from '../gans/unified-cognitive-engine';
import { GameGANSimulator, GameState } from '../gans/gamegan-simulator';
import { CoordinateResolver, FullCoordinate, getPhenotypeFromCoordinates } from '../gans/coordinate-resolver';

export interface ConsciousnessAgent {
  id: string;
  name: string;
  element: ElementType;
  humanDesign: HumanDesignState;
  position: { x: number; y: number; z: number };
  latent: number[];
  color: string;
  cognitiveEngine: UnifiedCognitiveEngine;
  gameGAN: GameGANSimulator;
  gameState: GameState;
  fullCoordinates: FullCoordinate;
  phenotype: ReturnType<typeof getPhenotypeFromCoordinates>;
}

interface ConsciousnessStore {
  agents: ConsciousnessAgent[];
  selectedAgent: string | null;
  oracleResponse: OracleResponse | null;
  simulationActive: boolean;
  createAgent: (name: string) => void;
  selectAgent: (id: string) => void;
  removeAgent: (id: string) => void;
  updateAgentPosition: (id: string, position: { x: number; y: number; z: number }) => void;
  queryOracle: (question: string) => void;
  stepSimulation: () => void;
  toggleSimulation: () => void;
}

const ELEMENT_COLORS: Record<ElementType, string> = {
  [ElementType.EARTH]: '#8B4513',
  [ElementType.WATER]: '#1E90FF',
  [ElementType.AIR]: '#87CEEB',
  [ElementType.FIRE]: '#FF4500',
  [ElementType.AETHER]: '#9370DB'
};

const createDefaultAgent = (): ConsciousnessAgent => {
  const name = "Oracle";
  const latent = generateLatentFromName(name);
  const element = latentToElement(latent);
  const humanDesign = generateHumanDesignFromName(name);
  const cognitiveEngine = new UnifiedCognitiveEngine(name);
  const gameGAN = new GameGANSimulator();
  const gameState = gameGAN.getState();
  
  const resolver = new CoordinateResolver();
  const fullCoordinates = resolver.resolveFromName(name);
  const phenotype = getPhenotypeFromCoordinates(fullCoordinates);
  
  return {
    id: 'agent-default-oracle',
    name,
    element,
    humanDesign,
    position: { x: 0, y: 0, z: 0 },
    latent,
    color: ELEMENT_COLORS[element],
    cognitiveEngine,
    gameGAN,
    gameState,
    fullCoordinates,
    phenotype
  };
};

export const useConsciousness = create<ConsciousnessStore>((set, get) => ({
  agents: [createDefaultAgent()],
  selectedAgent: 'agent-default-oracle',
  oracleResponse: null,
  simulationActive: true,
  
  createAgent: (name: string) => {
    const latent = generateLatentFromName(name);
    const element = latentToElement(latent);
    const humanDesign = generateHumanDesignFromName(name);
    const cognitiveEngine = new UnifiedCognitiveEngine(name);
    const gameGAN = new GameGANSimulator();
    const gameState = gameGAN.getState();
    
    const resolver = new CoordinateResolver();
    const fullCoordinates = resolver.resolveFromName(name);
    const phenotype = getPhenotypeFromCoordinates(fullCoordinates);
    
    const newAgent: ConsciousnessAgent = {
      id: `agent-${Date.now()}-${Math.random()}`,
      name,
      element,
      humanDesign,
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: (Math.random() - 0.5) * 10
      },
      latent,
      color: ELEMENT_COLORS[element],
      cognitiveEngine,
      gameGAN,
      gameState,
      fullCoordinates,
      phenotype
    };
    
    set((state) => ({
      agents: [...state.agents, newAgent],
      selectedAgent: newAgent.id
    }));
  },
  
  selectAgent: (id: string) => set({ selectedAgent: id }),
  
  removeAgent: (id: string) => set((state) => ({
    agents: state.agents.filter(a => a.id !== id),
    selectedAgent: state.selectedAgent === id ? null : state.selectedAgent
  })),
  
  updateAgentPosition: (id: string, position: { x: number; y: number; z: number }) => 
    set((state) => ({
      agents: state.agents.map(a => 
        a.id === id ? { ...a, position } : a
      )
    })),
  
  queryOracle: (question: string) => {
    const { agents, selectedAgent } = get();
    const agent = agents.find(a => a.id === selectedAgent);
    
    if (agent) {
      const response = agent.cognitiveEngine.oracle(question);
      set({ oracleResponse: response });
    }
  },
  
  stepSimulation: () => {
    set((state) => {
      const updatedAgents = state.agents.map(agent => {
        const action = agent.gameGAN.autonomousAction();
        const newGameState = agent.gameGAN.step(action);
        
        agent.gameGAN.setState(newGameState);
        
        return {
          ...agent,
          gameState: newGameState,
          position: newGameState.position
        };
      });
      
      return { agents: updatedAgents };
    });
  },
  
  toggleSimulation: () => set((state) => ({ simulationActive: !state.simulationActive }))
}));
