import { ElementType, ELEMENT_COMPATIBILITY_MATRIX } from './resonance-sgan';
import { FullCoordinate, CoordinateResolver } from './coordinate-resolver';

export interface PhysicalPhenotype {
  skinTone: number;
  eyeColor: string;
  hairColor: string;
  hairTexture: string;
  height: number;
  build: string;
  facialStructure: string;
  eyeShape: string;
  elementalSignature: Record<ElementType, number>;
}

export interface MindBodyHeartBalance {
  mind: number;
  body: number;
  heart: number;
  aether: number;
}

export interface ExperiencePhenotype {
  mindDevelopment: number;
  bodyDevelopment: number;
  heartDevelopment: number;
  overallMaturity: number;
  elementalMastery: Record<ElementType, number>;
}

export interface AttractionPhenotype {
  primaryAttraction: ElementType[];
  secondaryAttraction: ElementType[];
  challengeElements: ElementType[];
  compatibilityProfile: Record<ElementType, number>;
  resonancePattern: string;
}

export interface FullPhenotype5D {
  physical: PhysicalPhenotype;
  experience: ExperiencePhenotype;
  attraction: AttractionPhenotype;
  mindBodyHeart: MindBodyHeartBalance;
  dominantElement: ElementType;
  elementalBalance: Record<ElementType, number>;
  birthSignature: string;
}

export class Phenotype5DPredictor {
  private resolver: CoordinateResolver;

  constructor() {
    this.resolver = new CoordinateResolver();
  }

  predictFromBirthday(
    datetime: Date,
    latitude: number = 0,
    longitude: number = 0
  ): FullPhenotype5D {
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

  private calculateMindBodyHeart(
    elementalBalance: Record<ElementType, number>,
    coords: FullCoordinate
  ): MindBodyHeartBalance {
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

  private calculate5DElementBalance(
    coords: FullCoordinate,
    datetime: Date
  ): Record<ElementType, number> {
    const balance: Record<ElementType, number> = {
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
      balance[elem as unknown as ElementType] /= sum;
    }

    return balance;
  }

  private getDominantElement(balance: Record<ElementType, number>): ElementType {
    let maxVal = 0;
    let dominant = ElementType.EARTH;
    for (const [elem, val] of Object.entries(balance)) {
      if (val > maxVal) {
        maxVal = val;
        dominant = parseInt(elem) as ElementType;
      }
    }
    return dominant;
  }

  private predictPhysicalPhenotype(
    mindBodyHeart: MindBodyHeartBalance,
    coords: FullCoordinate
  ): PhysicalPhenotype {
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

    const elementalSignature: Record<ElementType, number> = {
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

  private predictExperiencePhenotype(
    mindBodyHeart: MindBodyHeartBalance,
    coords: FullCoordinate,
    datetime: Date
  ): ExperiencePhenotype {
    const mindDevelopment = mindBodyHeart.mind * (coords.quantum.tone / 6);
    const bodyDevelopment = mindBodyHeart.body * (coords.quantum.base / 5);
    const heartDevelopment = mindBodyHeart.heart * (coords.quantum.color / 6);
    
    const overallMaturity = (mindDevelopment + bodyDevelopment + heartDevelopment) / 3 + mindBodyHeart.aether * 0.2;

    const elementalMastery: Record<ElementType, number> = {
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

  private predictAttractionPhenotype(
    mindBodyHeart: MindBodyHeartBalance,
    elementalBalance: Record<ElementType, number>
  ): AttractionPhenotype {
    const dominant = this.getDominantElement(elementalBalance);

    const primaryAttraction: ElementType[] = [];
    const secondaryAttraction: ElementType[] = [];
    const challengeElements: ElementType[] = [];

    if (mindBodyHeart.heart > 0.4) {
      primaryAttraction.push(ElementType.WATER);
      if (mindBodyHeart.body > 0.3) primaryAttraction.push(ElementType.EARTH);
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

    const compatibilityProfile: Record<ElementType, number> = {
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

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  private calculateAge(birthdate: Date): number {
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
