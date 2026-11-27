import { ElementType, ELEMENT_COMPATIBILITY_MATRIX } from './resonance-sgan.js';
import { CoordinateResolver } from './coordinate-resolver.js';
export class Phenotype5DPredictor {
    resolver;
    constructor() {
        this.resolver = new CoordinateResolver();
    }
    predictFromBirthday(datetime, latitude = 0, longitude = 0) {
        const coords = this.resolver.resolveFromBirthData(datetime, latitude, longitude);
        const elementalBalance = this.calculate5DElementBalance(coords, datetime);
        const mindBodyHeart = this.calculateMindBodyHeart(elementalBalance, coords);
        const dominantElement = this.getDominantElement(elementalBalance);
        const physical = this.predictPhysicalPhenotype(mindBodyHeart, coords);
        const experience = this.predictExperiencePhenotype(mindBodyHeart, coords, datetime);
        const attraction = this.predictAttractionPhenotype(mindBodyHeart, elementalBalance);
        const birthSignature = `${coords.signature}-${dominantElement}`;
        return {
            physical,
            experience,
            attraction,
            mindBodyHeart,
            dominantElement,
            elementalBalance,
            birthSignature
        };
    }
    calculateMindBodyHeart(elementalBalance, coords) {
        const mind = (elementalBalance[ElementType.AIR] + elementalBalance[ElementType.FIRE]) / 2;
        const body = elementalBalance[ElementType.EARTH];
        const heart = elementalBalance[ElementType.WATER];
        const aether = elementalBalance[ElementType.AETHER];
        const sum = mind + body + heart;
        return {
            mind: mind / sum,
            body: body / sum,
            heart: heart / sum,
            aether
        };
    }
    calculate5DElementBalance(coords, datetime) {
        const balance = {
            [ElementType.EARTH]: 0,
            [ElementType.WATER]: 0,
            [ElementType.AIR]: 0,
            [ElementType.FIRE]: 0,
            [ElementType.AETHER]: 0
        };
        const dayOfYear = this.getDayOfYear(datetime);
        const hourOfDay = datetime.getHours() + datetime.getMinutes() / 60;
        balance[ElementType.EARTH] = (coords.quantum.base / 5) * 0.3 + (coords.quantum.line / 6) * 0.2 + ((12 - datetime.getMonth()) / 12) * 0.5;
        balance[ElementType.WATER] = (coords.quantum.color / 6) * 0.4 + ((coords.astrological.zodiacSign % 3 === 2) ? 0.4 : 0.1) + (Math.sin(dayOfYear / 365 * Math.PI * 2) + 1) / 4 * 0.2;
        balance[ElementType.AIR] = (coords.quantum.tone / 6) * 0.4 + ((coords.astrological.zodiacSign % 3 === 0) ? 0.4 : 0.1) + (hourOfDay / 24) * 0.2;
        balance[ElementType.FIRE] = (coords.quantum.gate / 64) * 0.3 + ((coords.astrological.zodiacSign % 3 === 1) ? 0.4 : 0.1) + ((dayOfYear < 180) ? 0.4 : 0.1) * 0.3;
        balance[ElementType.AETHER] = (coords.coordinateId / 69120) * 0.5 + ((coords.quantum.line + coords.quantum.color + coords.quantum.tone) / 18) * 0.3 + 0.2;
        const sum = Object.values(balance).reduce((a, b) => a + b, 0);
        for (const elem in balance) {
            balance[elem] /= sum;
        }
        return balance;
    }
    getDominantElement(balance) {
        let maxVal = 0;
        let dominant = ElementType.EARTH;
        for (const [elem, val] of Object.entries(balance)) {
            if (val > maxVal) {
                maxVal = val;
                dominant = parseInt(elem);
            }
        }
        return dominant;
    }
    predictPhysicalPhenotype(mindBodyHeart, coords) {
        const bodyStrength = mindBodyHeart.body;
        const heartStrength = mindBodyHeart.heart;
        const mindStrength = mindBodyHeart.mind;
        const skinTone = Math.round(bodyStrength * 10);
        const eyeColors = ['Brown', 'Hazel', 'Green', 'Blue', 'Gray', 'Amber'];
        const eyeColorIndex = Math.floor(heartStrength * 6);
        const eyeColor = eyeColors[Math.min(eyeColorIndex, 5)];
        const hairColors = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Blonde', 'Red', 'Auburn'];
        const hairColorIndex = Math.floor(bodyStrength * 7);
        const hairColor = hairColors[Math.min(hairColorIndex, 6)];
        const hairTextures = ['Straight', 'Wavy', 'Curly', 'Coily'];
        const hairTextureIndex = Math.floor(heartStrength * 4);
        const hairTexture = hairTextures[Math.min(hairTextureIndex, 3)];
        const height = Math.round(160 + bodyStrength * 30);
        const builds = ['Petite', 'Slender', 'Athletic', 'Muscular', 'Robust'];
        const buildIndex = Math.floor(bodyStrength * 5);
        const build = builds[Math.min(buildIndex, 4)];
        const facialStructures = ['Oval', 'Round', 'Square', 'Heart', 'Long', 'Diamond'];
        const faceIndex = Math.floor(mindStrength * 6);
        const facialStructure = facialStructures[Math.min(faceIndex, 5)];
        const eyeShapes = ['Almond', 'Round', 'Hooded', 'Upturned', 'Downturned', 'Monolid'];
        const eyeShapeIndex = Math.floor(heartStrength * 6);
        const eyeShape = eyeShapes[Math.min(eyeShapeIndex, 5)];
        const elementalSignature = {
            [ElementType.EARTH]: bodyStrength,
            [ElementType.WATER]: heartStrength,
            [ElementType.AIR]: mindStrength * 0.5,
            [ElementType.FIRE]: mindStrength * 0.5,
            [ElementType.AETHER]: mindBodyHeart.aether
        };
        return {
            skinTone,
            eyeColor,
            hairColor,
            hairTexture,
            height,
            build,
            facialStructure,
            eyeShape,
            elementalSignature
        };
    }
    predictExperiencePhenotype(mindBodyHeart, coords, datetime) {
        const mindDevelopment = mindBodyHeart.mind * (coords.quantum.tone / 6);
        const bodyDevelopment = mindBodyHeart.body * (coords.quantum.base / 5);
        const heartDevelopment = mindBodyHeart.heart * (coords.quantum.color / 6);
        const overallMaturity = (mindDevelopment + bodyDevelopment + heartDevelopment) / 3 + mindBodyHeart.aether * 0.2;
        const elementalMastery = {
            [ElementType.EARTH]: bodyDevelopment,
            [ElementType.WATER]: heartDevelopment,
            [ElementType.AIR]: mindDevelopment * 0.5,
            [ElementType.FIRE]: mindDevelopment * 0.5,
            [ElementType.AETHER]: mindBodyHeart.aether * overallMaturity
        };
        return {
            mindDevelopment,
            bodyDevelopment,
            heartDevelopment,
            overallMaturity,
            elementalMastery
        };
    }
    predictAttractionPhenotype(mindBodyHeart, elementalBalance) {
        const dominant = this.getDominantElement(elementalBalance);
        const primaryAttraction = [];
        const secondaryAttraction = [];
        const challengeElements = [];
        if (mindBodyHeart.heart > 0.4) {
            primaryAttraction.push(ElementType.WATER);
            if (mindBodyHeart.body > 0.3)
                primaryAttraction.push(ElementType.EARTH);
        }
        if (mindBodyHeart.mind > 0.4) {
            secondaryAttraction.push(ElementType.AIR, ElementType.FIRE);
        }
        if (mindBodyHeart.aether > 0.3) {
            primaryAttraction.push(ElementType.AETHER);
        }
        const allElements = [ElementType.EARTH, ElementType.WATER, ElementType.AIR, ElementType.FIRE, ElementType.AETHER];
        for (const elem of allElements) {
            if (!primaryAttraction.includes(elem) && !secondaryAttraction.includes(elem)) {
                const compatibility = ELEMENT_COMPATIBILITY_MATRIX[dominant][elem];
                if (compatibility < 0.5) {
                    challengeElements.push(elem);
                }
            }
        }
        const compatibilityProfile = {
            [ElementType.EARTH]: Math.min(1.0, ELEMENT_COMPATIBILITY_MATRIX[dominant][ElementType.EARTH] * (1 + mindBodyHeart.body * 0.3)),
            [ElementType.WATER]: Math.min(1.0, ELEMENT_COMPATIBILITY_MATRIX[dominant][ElementType.WATER] * (1 + mindBodyHeart.heart * 0.3)),
            [ElementType.AIR]: Math.min(1.0, ELEMENT_COMPATIBILITY_MATRIX[dominant][ElementType.AIR] * (1 + mindBodyHeart.mind * 0.3)),
            [ElementType.FIRE]: Math.min(1.0, ELEMENT_COMPATIBILITY_MATRIX[dominant][ElementType.FIRE] * (1 + mindBodyHeart.mind * 0.3)),
            [ElementType.AETHER]: Math.min(1.0, ELEMENT_COMPATIBILITY_MATRIX[dominant][ElementType.AETHER] * (1 + mindBodyHeart.aether * 0.3))
        };
        const resonancePattern = mindBodyHeart.mind > mindBodyHeart.heart
            ? (mindBodyHeart.mind > mindBodyHeart.body ? 'Cerebral' : 'Grounded')
            : (mindBodyHeart.heart > mindBodyHeart.body ? 'Emotional' : 'Balanced');
        return {
            primaryAttraction,
            secondaryAttraction,
            challengeElements,
            compatibilityProfile,
            resonancePattern
        };
    }
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }
    calculateAge(birthdate) {
        const today = new Date();
        const age = today.getFullYear() - birthdate.getFullYear();
        const m = today.getMonth() - birthdate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
            return age - 1;
        }
        return age;
    }
}
export const phenotype5DPredictor = new Phenotype5DPredictor();
