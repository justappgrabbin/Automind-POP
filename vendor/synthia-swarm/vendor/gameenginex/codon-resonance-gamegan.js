export const CODON_SEQUENCE = [
    "TTT", "TTC", "TTA", "TTG", "TCT", "TCC", "TCA", "TCG",
    "TAT", "TAC", "TAA", "TAG", "TGT", "TGC", "TGA", "TGG",
    "CTT", "CTC", "CTA", "CTG", "CCT", "CCC", "CCA", "CCG",
    "CAT", "CAC", "CAA", "CAG", "CGT", "CGC", "CGA", "CGG",
    "ATT", "ATC", "ATA", "ATG", "ACT", "ACC", "ACA", "ACG",
    "AAT", "AAC", "AAA", "AAG", "AGT", "AGC", "AGA", "AGG",
    "GTT", "GTC", "GTA", "GTG", "GCT", "GCC", "GCA", "GCG",
    "GAT", "GAC", "GAA", "GAG", "GGT", "GGC", "GGA", "GGG"
];
const NUCLEOTIDE_FREQ = {
    'T': 220.0,
    'C': 293.66,
    'A': 329.63,
    'G': 392.0
};
export function calculateCodonFrequency(codonSequence) {
    let freq = 1.0;
    for (const nucleotide of codonSequence) {
        freq *= NUCLEOTIDE_FREQ[nucleotide];
    }
    return Math.pow(freq, 1 / 3) / 100;
}
export function generateHarmonics(baseFrequency) {
    const harmonics = [];
    for (let i = 1; i <= 7; i++) {
        harmonics.push(baseFrequency * i);
    }
    return harmonics;
}
export function createCodonElement(codonId) {
    const sequence = CODON_SEQUENCE[codonId - 1];
    const frequency = calculateCodonFrequency(sequence);
    return {
        id: codonId,
        sequence,
        frequency,
        harmonics: generateHarmonics(frequency),
        colorHue: (codonId * 5.625) % 360,
        glowIntensity: 0.3 + (frequency / 10),
        pulseRate: frequency * 2
    };
}
export function calculateResonanceStrength(freq1, freq2) {
    const freqRatio = freq1 / freq2;
    const harmonicRatios = [0.5, 0.75, 1.0, 1.33, 1.5, 2.0];
    const tolerance = 0.1;
    for (const ratio of harmonicRatios) {
        if (Math.abs(freqRatio - ratio) < tolerance) {
            return 1.0 - Math.abs(freqRatio - ratio) / tolerance;
        }
    }
    return 0.2;
}
export class ProgressiveCodonScene {
    elements = [];
    resonanceOverlays = [];
    addCodon(codonId) {
        const newElement = createCodonElement(codonId);
        for (const existing of this.elements) {
            const strength = calculateResonanceStrength(newElement.frequency, existing.frequency);
            if (strength > 0.4) {
                this.resonanceOverlays.push({
                    element1Id: existing.id,
                    element2Id: newElement.id,
                    resonanceStrength: strength,
                    colorBlend: (existing.colorHue + newElement.colorHue) / 2
                });
            }
        }
        this.elements.push(newElement);
    }
    getActiveGatesFromName(name) {
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const gateCount = 5 + (hash % 4);
        const gates = [];
        for (let i = 0; i < gateCount; i++) {
            gates.push(1 + ((hash * (i + 7)) % 64));
        }
        return gates;
    }
    reset() {
        this.elements = [];
        this.resonanceOverlays = [];
    }
}
