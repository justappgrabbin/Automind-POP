export var ElementType;
(function (ElementType) {
    ElementType[ElementType["EARTH"] = 0] = "EARTH";
    ElementType[ElementType["WATER"] = 1] = "WATER";
    ElementType[ElementType["AIR"] = 2] = "AIR";
    ElementType[ElementType["FIRE"] = 3] = "FIRE";
    ElementType[ElementType["AETHER"] = 4] = "AETHER";
})(ElementType || (ElementType = {}));
export const ELEMENT_COMPATIBILITY_MATRIX = [
    [1.0, 0.8, 0.7, 0.5, 1.0],
    [0.8, 1.0, 0.6, 0.2, 1.0],
    [0.7, 0.6, 1.0, 0.9, 1.0],
    [0.5, 0.2, 0.9, 1.0, 1.0],
    [1.0, 1.0, 1.0, 1.0, 1.0]
];
export function elemental_operator(elem1, elem2, operation) {
    const compat12 = ELEMENT_COMPATIBILITY_MATRIX[elem1][elem2];
    const compat21 = ELEMENT_COMPATIBILITY_MATRIX[elem2][elem1];
    const elem1Name = ElementType[elem1];
    const elem2Name = ElementType[elem2];
    switch (operation) {
        case 'blend':
            const blendedResonance = (compat12 + compat21) / 2;
            return {
                resonance: blendedResonance,
                symbol: `${elem1Name} ⊕ ${elem2Name}`
            };
        case 'amplify':
            return {
                resonance: compat12 * compat12,
                symbol: `${elem1Name} ⊗ ${elem2Name}`
            };
        case 'dampen':
            const dampenedResonance = 1.0 - 2.0 * Math.abs(compat12 - 0.5);
            return {
                resonance: Math.max(0, Math.min(1.0, dampenedResonance)),
                symbol: `${elem1Name} ⊖ ${elem2Name}`
            };
        default:
            return { resonance: compat12, symbol: `${elem1Name} ~ ${elem2Name}` };
    }
}
export function latentToElement(latentVector) {
    if (latentVector.length !== 5) {
        throw new Error('Latent vector must be 5D');
    }
    const normalized = latentVector.map(v => (v + 1) / 2);
    const elementIdx = normalized.indexOf(Math.max(...normalized));
    return elementIdx;
}
export function generateLatentFromName(name) {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const latent = [];
    for (let i = 0; i < 5; i++) {
        const seed = (hash * (i + 1)) % 1000;
        const normalized = (seed / 1000) * 2 - 1;
        latent.push(normalized);
    }
    return latent;
}
export function getElementColor(element) {
    const colors = {
        [ElementType.EARTH]: '#8B4513',
        [ElementType.WATER]: '#1E90FF',
        [ElementType.AIR]: '#87CEEB',
        [ElementType.FIRE]: '#FF4500',
        [ElementType.AETHER]: '#9370DB'
    };
    return colors[element];
}
export function getElementName(element) {
    return ElementType[element];
}
export function elementalMismatchPenalty(actionElement, stateElement) {
    const compatibility = ELEMENT_COMPATIBILITY_MATRIX[actionElement][stateElement];
    return 1.0 - compatibility;
}
export function latentToActionProperties(latentVector, currentState) {
    const element = latentToElement(latentVector);
    const dimension = Math.floor((latentVector[0] + 1) * 2.5);
    let frictionBase = 0.5;
    if (currentState && currentState.length === 5) {
        const dotProduct = latentVector.reduce((sum, val, i) => sum + val * currentState[i], 0);
        const mag1 = Math.sqrt(latentVector.reduce((sum, val) => sum + val * val, 0));
        const mag2 = Math.sqrt(currentState.reduce((sum, val) => sum + val * val, 0));
        const similarity = dotProduct / (mag1 * mag2);
        frictionBase = (1 - similarity) / 2;
    }
    return {
        element,
        elementIdx: element,
        dimension: Math.max(0, Math.min(4, dimension)),
        latentVector: [...latentVector],
        frictionBase
    };
}
export const DEFAULT_RU_WEIGHTS = {
    P: 1.0,
    F: 0.8,
    C: 0.6,
    R: 0.5,
    K: 0.7,
    S: 0.4
};
export class UnifiedResonanceEngine {
    weights;
    lambdaM;
    currentStateVector;
    currentStateElement;
    nodePi;
    constructor(weights = DEFAULT_RU_WEIGHTS, lambdaM = 0.3) {
        this.weights = weights;
        this.lambdaM = lambdaM;
        this.currentStateElement = ElementType.EARTH;
        this.nodePi = [0.2, 0.2, 0.2, 0.2, 0.2];
    }
    setCurrentState(stateVector, stateElement = ElementType.EARTH) {
        this.currentStateVector = stateVector;
        this.currentStateElement = stateElement;
    }
    setNodeDistribution(nodePi) {
        if (nodePi.length !== 5) {
            throw new Error('Must provide 5 node weights');
        }
        const sum = nodePi.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1.0) > 0.01) {
            throw new Error('Node weights must sum to 1.0');
        }
        this.nodePi = [...nodePi];
    }
    generateActionCandidates(numCandidates = 5, temperature = 1.0) {
        const candidates = [];
        for (let i = 0; i < numCandidates; i++) {
            const latent = Array.from({ length: 5 }, () => {
                const u1 = Math.random();
                const u2 = Math.random();
                const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
                return Math.tanh(z * temperature);
            });
            candidates.push(latent);
        }
        return candidates;
    }
    calculateResonantUtility(action, useElementalFriction = true) {
        let P = action.progress;
        let F = action.friction;
        const C = action.coherence;
        const R = action.feasibility;
        const K = action.risk;
        const S = action.synergy;
        if (useElementalFriction && action.latent) {
            const actionElement = action.latent.element;
            const mismatch = elementalMismatchPenalty(actionElement, this.currentStateElement);
            F = F + this.lambdaM * mismatch;
            F = Math.min(F, 1.0);
        }
        const w = this.weights;
        const ru = (w.P * P -
            w.F * F +
            w.C * C +
            w.R * R -
            w.K * K +
            w.S * S);
        action.ruBreakdown = {
            progress: w.P * P,
            friction: -w.F * F,
            coherence: w.C * C,
            feasibility: w.R * R,
            risk: -w.K * K,
            synergy: w.S * S
        };
        action.ruScore = ru;
        return ru;
    }
    generateAndSelect(numCandidates = 20, topK = 5) {
        const latents = this.generateActionCandidates(numCandidates);
        const candidates = latents.map((latent, idx) => {
            const actionProps = latentToActionProperties(latent, this.currentStateVector);
            const candidate = {
                label: `Action ${idx + 1}`,
                progress: Math.random() * 0.3 + 0.6,
                friction: Math.random() * 0.4 + 0.1,
                coherence: Math.random() * 0.3 + 0.5,
                feasibility: Math.random() * 0.4 + 0.4,
                risk: Math.random() * 0.3 + 0.1,
                synergy: Math.random() * 0.4 + 0.3,
                latent: actionProps
            };
            this.calculateResonantUtility(candidate);
            return candidate;
        });
        candidates.sort((a, b) => (b.ruScore || 0) - (a.ruScore || 0));
        return candidates.slice(0, topK);
    }
}
