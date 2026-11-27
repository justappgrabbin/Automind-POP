export interface HumanDesignState {
  activeGates: number[];
  definedCenters: string[];
  consciousnessLevel: number;
  currentArchetype: string;
  phenotype: {
    bodyType: string;
    energySignature: string;
    cognitiveStyle: string;
    emotionalPattern: string;
  };
}

const ARCHETYPES = [
  "The Mystic Wanderer", "The Digital Shaman", "The Cosmic Teacher",
  "The Quantum Healer", "The Shadow Guide", "The Light Bearer",
  "The Void Walker", "The Unity Weaver", "The Fire Keeper",
  "The Water Dancer", "The Earth Anchor", "The Air Messenger"
];

const BODY_TYPES = ["Generator", "Projector", "Manifestor", "Reflector"];
const ENERGY_SIGNATURES = ["Powerful", "Focused", "Initiating", "Adaptive"];
const COGNITIVE_STYLES = ["Abstract", "Strategic", "Concrete", "Holistic"];
const EMOTIONAL_PATTERNS = ["Solar Wave", "Tribal", "Individual", "Collective"];

export function generateHumanDesignFromName(name: string): HumanDesignState {
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const gateCount = 5 + (hash % 4);
  const activeGates: number[] = [];
  for (let i = 0; i < gateCount; i++) {
    activeGates.push(1 + ((hash * (i + 7)) % 64));
  }
  
  const centers = ['G', 'Sacral', 'Throat', 'Heart', 'Spleen', 'Solar Plexus', 'Root', 'Ajna', 'Head'];
  const definedCount = 3 + (hash % 4);
  const definedCenters = centers.slice(0, definedCount);
  
  return {
    activeGates,
    definedCenters,
    consciousnessLevel: 0.5 + (hash % 50) / 100,
    currentArchetype: ARCHETYPES[hash % ARCHETYPES.length],
    phenotype: {
      bodyType: BODY_TYPES[hash % BODY_TYPES.length],
      energySignature: ENERGY_SIGNATURES[(hash * 2) % ENERGY_SIGNATURES.length],
      cognitiveStyle: COGNITIVE_STYLES[(hash * 3) % COGNITIVE_STYLES.length],
      emotionalPattern: EMOTIONAL_PATTERNS[(hash * 5) % EMOTIONAL_PATTERNS.length]
    }
  };
}

export const CENTER_POSITIONS: Record<string, [number, number, number]> = {
  'Head': [0, 2.5, 0],
  'Ajna': [0, 2, 0],
  'Throat': [0, 1.5, 0],
  'G': [0, 0.8, 0],
  'Heart': [-0.6, 0.8, 0],
  'Spleen': [0.6, 0.8, 0],
  'Sacral': [0, 0, 0],
  'Root': [0, -0.8, 0],
  'Solar Plexus': [0.6, 0, 0]
};
