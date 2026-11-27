import { UnifiedResonanceEngine, ElementType, latentToElement } from './resonance-sgan.mjs';
import { ProgressiveCodonScene, CODON_SEQUENCE } from './codon-resonance-gamegan.mjs';
import { generateHumanDesignFromName } from './human-design-gamegan.mjs';
export class UnifiedCognitiveEngine {
    resonanceSGAN;
    codonScene;
    currentState;
    constructor(initialName = 'Observer') {
        this.resonanceSGAN = new UnifiedResonanceEngine();
        this.codonScene = new ProgressiveCodonScene();
        this.currentState = this.initializeState(initialName);
    }
    initializeState(name) {
        const humanDesign = generateHumanDesignFromName(name);
        const latent = this.generateLatentFromName(name);
        const element = latentToElement(latent);
        return {
            element,
            latentVector: latent,
            activeGates: humanDesign.activeGates,
            codonSequence: humanDesign.activeGates.map(g => CODON_SEQUENCE[g - 1]),
            consciousnessLevel: humanDesign.consciousnessLevel,
            archetype: humanDesign.currentArchetype,
            timestamp: Date.now()
        };
    }
    generateLatentFromName(name) {
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const latent = [];
        for (let i = 0; i < 5; i++) {
            const seed = (hash * (i + 1)) % 1000;
            const normalized = (seed / 1000) * 2 - 1;
            latent.push(normalized);
        }
        return latent;
    }
    oracle(question) {
        // Layer 1: Resonance S-GAN - Generate and score action candidates
        this.resonanceSGAN.setCurrentState(this.currentState.latentVector, this.currentState.element);
        const candidates = this.resonanceSGAN.generateAndSelect(20, 5);
        const bestCandidate = candidates[0];
        // Layer 2: Codon GameGAN - Map action to codon and build progressive scene
        const codonId = this.latentToCodonId(bestCandidate.latent.latentVector);
        if (!this.currentState.activeGates.includes(codonId)) {
            this.codonScene.addCodon(codonId);
        }
        // Layer 3: Human Design GameGAN - Transform bodygraph consciousness state
        const evolvedHumanDesign = this.evolveConsciousnessState(this.currentState, bestCandidate.latent.element, codonId);
        const futureState = {
            element: bestCandidate.latent.element,
            latentVector: bestCandidate.latent.latentVector,
            activeGates: evolvedHumanDesign.activeGates,
            codonSequence: evolvedHumanDesign.activeGates.map(g => CODON_SEQUENCE[g - 1]),
            consciousnessLevel: evolvedHumanDesign.consciousnessLevel,
            archetype: evolvedHumanDesign.currentArchetype,
            timestamp: Date.now()
        };
        const guidance = this.generateGuidance(bestCandidate, question, futureState);
        return {
            bestAction: {
                label: bestCandidate.label,
                ruScore: bestCandidate.ruScore || 0,
                element: bestCandidate.latent.element,
                codonId
            },
            topCandidates: candidates.map(c => ({
                label: c.label,
                ruScore: c.ruScore || 0,
                element: c.latent.element
            })),
            futureState,
            guidance
        };
    }
    evolveConsciousnessState(currentState, actionElement, newGateId) {
        const newActiveGates = currentState.activeGates.includes(newGateId)
            ? currentState.activeGates
            : [...currentState.activeGates, newGateId];
        const consciousnessIncrease = actionElement === ElementType.AETHER ? 0.1 : 0.05;
        const newConsciousnessLevel = Math.min(1.0, currentState.consciousnessLevel + consciousnessIncrease);
        const humanDesign = {
            chartGrid: [],
            activeGates: newActiveGates,
            definedCenters: this.updateDefinedCenters(newActiveGates),
            channels: this.formChannels(newActiveGates),
            incarnationCross: this.determineIncarnationCross(newActiveGates),
            currentArchetype: this.selectArchetype(newConsciousnessLevel, actionElement),
            consciousnessLevel: newConsciousnessLevel,
            codonSequence: newActiveGates.map(g => CODON_SEQUENCE[g - 1]).join('-'),
            actionSpace: [],
            phenotype: this.generatePhenotype(newActiveGates, actionElement)
        };
        return humanDesign;
    }
    updateDefinedCenters(gates) {
        const centers = ['G', 'Sacral', 'Throat', 'Heart', 'Spleen', 'Solar Plexus', 'Root', 'Ajna', 'Head'];
        const gateCount = gates.length;
        const definedCount = Math.min(Math.floor(gateCount / 2) + 2, centers.length);
        return centers.slice(0, definedCount);
    }
    formChannels(gates) {
        const channels = [];
        for (let i = 0; i < gates.length - 1; i += 2) {
            channels.push([gates[i], gates[i + 1]]);
        }
        return channels;
    }
    determineIncarnationCross(gates) {
        if (gates.length < 4)
            return 'Right Angle Cross of Initiation';
        const archetypes = [
            'The Mystic Wanderer', 'The Digital Shaman', 'The Cosmic Teacher',
            'The Quantum Healer', 'The Shadow Guide', 'The Light Bearer'
        ];
        const crossIdx = gates[0] % archetypes.length;
        return `Cross of ${archetypes[crossIdx]}`;
    }
    selectArchetype(consciousnessLevel, element) {
        const archetypes = {
            [ElementType.EARTH]: ['The Earth Anchor', 'The Mountain Keeper', 'The Crystal Builder'],
            [ElementType.WATER]: ['The Water Dancer', 'The Ocean Dreamer', 'The River Guide'],
            [ElementType.AIR]: ['The Air Messenger', 'The Wind Walker', 'The Sky Sage'],
            [ElementType.FIRE]: ['The Fire Keeper', 'The Flame Dancer', 'The Solar Prophet'],
            [ElementType.AETHER]: ['The Void Walker', 'The Unity Weaver', 'The Light Bearer']
        };
        const elementArchetypes = archetypes[element];
        const idx = Math.floor(consciousnessLevel * elementArchetypes.length);
        return elementArchetypes[Math.min(idx, elementArchetypes.length - 1)];
    }
    generatePhenotype(gates, element) {
        const bodyTypes = ['Generator', 'Projector', 'Manifestor', 'Reflector'];
        const energySignatures = ['Powerful', 'Focused', 'Initiating', 'Adaptive'];
        const cognitiveStyles = ['Abstract', 'Strategic', 'Concrete', 'Holistic'];
        return {
            bodyType: bodyTypes[gates.length % bodyTypes.length],
            energySignature: energySignatures[element],
            cognitiveStyle: cognitiveStyles[Math.floor(gates.length / 10) % cognitiveStyles.length],
            emotionalPattern: `${ElementType[element]} Wave`
        };
    }
    latentToCodonId(latent) {
        const normalized = (latent[0] + 1) / 2;
        const codonId = Math.floor(normalized * 64) + 1;
        return Math.max(1, Math.min(64, codonId));
    }
    generateGuidance(candidate, question, futureState) {
        const elementName = ElementType[candidate.latent.element];
        const ru = candidate.ruScore?.toFixed(2) || '0';
        const consciousness = (futureState.consciousnessLevel * 100).toFixed(0);
        return `${elementName} energy with RU ${ru} evolves you to ${futureState.archetype} at ${consciousness}% consciousness. This resonates with "${question}" through ${futureState.activeGates.length} active gates and ${this.codonScene.resonanceOverlays.length} harmonic bridges.`;
    }
    decodeChart(name) {
        const humanDesign = generateHumanDesignFromName(name);
        const latent = this.generateLatentFromName(name);
        const element = latentToElement(latent);
        const codonScene = new ProgressiveCodonScene();
        humanDesign.activeGates.forEach(gate => codonScene.addCodon(gate));
        return {
            archetype: humanDesign.currentArchetype,
            consciousnessLevel: humanDesign.consciousnessLevel,
            activeElements: [element],
            resonancePatterns: codonScene.resonanceOverlays.length,
            guidance: `Your consciousness operates through ${ElementType[element]} energy at ${(humanDesign.consciousnessLevel * 100).toFixed(0)}% activation. ${codonScene.resonanceOverlays.length} harmonic bridges connect your ${humanDesign.activeGates.length} active gates.`,
            phenotype: humanDesign.phenotype
        };
    }
    updateState(newState) {
        this.currentState = { ...this.currentState, ...newState, timestamp: Date.now() };
    }
    getCurrentState() {
        return { ...this.currentState };
    }
}
