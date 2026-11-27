export var OutputModality;
(function (OutputModality) {
    OutputModality["TEXT"] = "text";
    OutputModality["AUDIO"] = "audio";
    OutputModality["VISUAL_2D"] = "visual_2d";
    OutputModality["VISUAL_3D"] = "visual_3d";
    OutputModality["HAPTIC"] = "haptic";
    OutputModality["KINESTHETIC"] = "kinesthetic";
    OutputModality["SYNESTHETIC"] = "synesthetic";
})(OutputModality || (OutputModality = {}));
export function renderVisual2D(elementalState, resonance) {
    const colors = {
        fire: `rgb(${Math.floor(255 * elementalState.fire)}, 69, 0)`,
        earth: `rgb(139, ${Math.floor(255 * elementalState.earth)}, 87)`,
        metal: `rgb(${Math.floor(255 * elementalState.metal)}, ${Math.floor(255 * elementalState.metal)}, ${Math.floor(255 * elementalState.metal)})`,
        water: `rgb(0, ${Math.floor(200 * elementalState.water)}, ${Math.floor(255 * elementalState.water)})`,
        wood: `rgb(${Math.floor(100 * elementalState.wood)}, ${Math.floor(200 * elementalState.wood)}, 0)`
    };
    return {
        modality: OutputModality.VISUAL_2D,
        data: {
            colors,
            glowIntensity: resonance,
            pulseRate: 1.0 + resonance * 2.0,
            shapes: ['circle', 'pentagon', 'hexagon']
        },
        intensity: resonance,
        resonance,
        timestamp: Date.now()
    };
}
export function getElementalState(element) {
    const states = {
        0: { fire: 0.2, earth: 0.9, metal: 0.6, water: 0.3, wood: 0.4 },
        1: { fire: 0.1, earth: 0.3, metal: 0.4, water: 0.95, wood: 0.5 },
        2: { fire: 0.3, earth: 0.2, metal: 0.7, water: 0.4, wood: 0.8 },
        3: { fire: 0.95, earth: 0.3, metal: 0.5, water: 0.1, wood: 0.6 },
        4: { fire: 0.7, earth: 0.7, metal: 0.7, water: 0.7, wood: 0.7 }
    };
    return states[element] || states[4];
}
