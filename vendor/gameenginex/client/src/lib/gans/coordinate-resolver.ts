import { ElementType } from './resonance-sgan';

export interface QuantumCoordinates {
  gate: number;
  line: number;
  color: number;
  tone: number;
  base: number;
}

export interface AstrologicalModifiers {
  degree: number;
  zodiacSign: number;
  house: number;
  axis: 'design' | 'personality';
  sun: number;
  earth: number;
  nodes: { north: number; south: number };
}

export interface FullCoordinate {
  quantum: QuantumCoordinates;
  astrological: AstrologicalModifiers;
  coordinateId: number;
  signature: string;
}

export const COLOR_DETERMINATION = [
  { name: 'Fear/Hunter', digestion: 'Consecutive', environment: 'Caves' },
  { name: 'Hope/Gatherer', digestion: 'Alternating', environment: 'Markets' },
  { name: 'Desire/Thirst', digestion: 'Hot', environment: 'Kitchens' },
  { name: 'Need/Touch', digestion: 'Cold', environment: 'Mountains' },
  { name: 'Guilt/Sound', digestion: 'Calm', environment: 'Valleys' },
  { name: 'Innocence/Light', digestion: 'Nervous', environment: 'Shores' }
];

export const TONE_COGNITION = [
  'Smell', 'Taste', 'Outer Vision', 'Inner Vision', 'Feeling', 'Touch'
];

export const BASE_FREQUENCY = [
  'Security', 'Theism', 'Leadership', 'Wanting', 'Power'
];

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export class CoordinateResolver {
  resolveFromName(name: string): FullCoordinate {
    const hash = this.hashString(name);
    
    const gate = (hash % 64) + 1;
    const line = (Math.floor(hash / 64) % 6) + 1;
    const color = (Math.floor(hash / (64 * 6)) % 6) + 1;
    const tone = (Math.floor(hash / (64 * 6 * 6)) % 6) + 1;
    const base = (Math.floor(hash / (64 * 6 * 6 * 6)) % 5) + 1;
    
    const degree = (hash % 360);
    const zodiacSign = Math.floor(degree / 30) + 1;
    const house = (Math.floor(hash / 1000) % 12) + 1;
    const axis: 'design' | 'personality' = (hash % 2) === 0 ? 'design' : 'personality';
    
    const sun = (hash % 64) + 1;
    const earth = ((sun + 31) % 64) + 1;
    const northNode = (Math.floor(hash / 100000) % 64) + 1;
    const southNode = ((northNode + 31) % 64) + 1;
    
    const coordinateId = this.calculateCoordinateId({ gate, line, color, tone, base });
    const signature = `${gate}.${line}.${color}.${tone}.${base}`;
    
    return {
      quantum: { gate, line, color, tone, base },
      astrological: {
        degree,
        zodiacSign,
        house,
        axis,
        sun,
        earth,
        nodes: { north: northNode, south: southNode }
      },
      coordinateId,
      signature
    };
  }
  
  resolveFromBirthData(
    datetime: Date,
    latitude: number,
    longitude: number,
    chartType: 'tropical' | 'sidereal' | 'draconic' = 'tropical'
  ): FullCoordinate {
    const julianDay = this.dateToJulian(datetime);
    let sunPosition: number;
    
    if (chartType === 'sidereal') {
      sunPosition = this.calculateSiderealSunPosition(julianDay);
    } else if (chartType === 'draconic') {
      sunPosition = this.calculateDraconicSunPosition(julianDay);
    } else {
      sunPosition = this.calculateSunPosition(julianDay);
    }
    
    const gate = this.degreeToGate(sunPosition);
    const line = this.calculateLine(sunPosition);
    const color = this.calculateColor(sunPosition, latitude);
    const tone = this.calculateTone(sunPosition, longitude);
    const base = this.calculateBase(sunPosition, datetime.getHours());
    
    const degree = sunPosition;
    const zodiacSign = Math.floor(sunPosition / 30) + 1;
    const house = this.calculateHouse(sunPosition, latitude, longitude, julianDay);
    
    const coordinateId = this.calculateCoordinateId({ gate, line, color, tone, base });
    const signature = `${gate}.${line}.${color}.${tone}.${base}-${chartType}`;
    
    return {
      quantum: { gate, line, color, tone, base },
      astrological: {
        degree,
        zodiacSign,
        house,
        axis: 'personality',
        sun: gate,
        earth: ((gate + 31) % 64) + 1,
        nodes: this.calculateNodes(julianDay)
      },
      coordinateId,
      signature
    };
  }
  
  private calculateSiderealSunPosition(julianDay: number): number {
    const tropicalSun = this.calculateSunPosition(julianDay);
    const ayanamsa = this.calculateFaganBradleyAyanamsa(julianDay);
    const siderealSun = (tropicalSun - ayanamsa + 360) % 360;
    return siderealSun;
  }
  
  private calculateFaganBradleyAyanamsa(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const ayanamsa = 24.042506 + 0.0222222 * T;
    return ayanamsa;
  }
  
  private calculateDraconicSunPosition(julianDay: number): number {
    const tropicalSun = this.calculateSunPosition(julianDay);
    const nodes = this.calculateNodes(julianDay);
    const northNodeDegree = ((nodes.north - 1) * 360 / 64);
    const draconicSun = (tropicalSun - northNodeDegree + 360) % 360;
    return draconicSun;
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
  
  private calculateCoordinateId(coords: QuantumCoordinates): number {
    const { gate, line, color, tone, base } = coords;
    return (
      ((gate - 1) * 1080) +
      ((line - 1) * 180) +
      ((color - 1) * 30) +
      ((tone - 1) * 5) +
      (base - 1)
    );
  }
  
  private degreeToGate(degree: number): number {
    const gateWidth = 360 / 64;
    const gate = Math.floor(degree / gateWidth) + 1;
    return Math.max(1, Math.min(64, gate));
  }
  
  private calculateLine(degree: number): number {
    const gateWidth = 360 / 64;
    const lineWidth = gateWidth / 6;
    const positionInGate = degree % gateWidth;
    const line = Math.floor(positionInGate / lineWidth) + 1;
    return Math.max(1, Math.min(6, line));
  }
  
  private calculateColor(degree: number, latitude: number): number {
    const color = Math.floor(((degree + latitude) % 360) / 60) + 1;
    return Math.max(1, Math.min(6, color));
  }
  
  private calculateTone(degree: number, longitude: number): number {
    const tone = Math.floor(((degree + longitude) % 360) / 60) + 1;
    return Math.max(1, Math.min(6, tone));
  }
  
  private calculateBase(degree: number, hour: number): number {
    const base = Math.floor(((degree + hour * 15) % 360) / 72) + 1;
    return Math.max(1, Math.min(5, base));
  }
  
  private calculateHouse(
    sunDegree: number,
    latitude: number,
    longitude: number,
    julianDay: number
  ): number {
    const localSiderealTime = this.calculateLST(longitude, julianDay);
    const ascendant = this.calculateAscendant(localSiderealTime, latitude);
    const houseCusp = ((sunDegree - ascendant + 360) % 360) / 30;
    return Math.floor(houseCusp) + 1;
  }
  
  private calculateNodes(julianDay: number): { north: number; south: number } {
    const meanNode = 125.0445479 - 1934.1362891 * ((julianDay - 2451545.0) / 36525);
    const nodeDegree = (meanNode % 360 + 360) % 360;
    const northGate = this.degreeToGate(nodeDegree);
    const southGate = ((northGate + 31) % 64) + 1;
    return { north: northGate, south: southGate };
  }
  
  private dateToJulian(date: Date): number {
    const time = date.getTime();
    return (time / 86400000) + 2440587.5;
  }
  
  private calculateSunPosition(julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const MRad = M * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(MRad) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * MRad) +
              0.000289 * Math.sin(3 * MRad);
    const sunLongitude = (L0 + C) % 360;
    return (sunLongitude + 360) % 360;
  }
  
  private calculateLST(longitude: number, julianDay: number): number {
    const T = (julianDay - 2451545.0) / 36525.0;
    const theta0 = 280.46061837 + 360.98564736629 * (julianDay - 2451545.0) +
                   0.000387933 * T * T - T * T * T / 38710000.0;
    const LST = (theta0 + longitude) % 360;
    return (LST + 360) % 360;
  }
  
  private calculateAscendant(LST: number, latitude: number): number {
    const latRad = latitude * Math.PI / 180;
    const LSTRad = LST * Math.PI / 180;
    const asc = Math.atan2(Math.sin(LSTRad), Math.cos(LSTRad) * Math.sin(latRad)) * 180 / Math.PI;
    return (asc + 360) % 360;
  }
  
  getColorProperties(color: number): typeof COLOR_DETERMINATION[0] {
    return COLOR_DETERMINATION[color - 1];
  }
  
  getToneProperty(tone: number): string {
    return TONE_COGNITION[tone - 1];
  }
  
  getBaseProperty(base: number): string {
    return BASE_FREQUENCY[base - 1];
  }
  
  getZodiacSign(zodiacSign: number): string {
    return ZODIAC_SIGNS[zodiacSign - 1];
  }
  
  calculateElementalModulation(coords: FullCoordinate): {
    elementBias: ElementType;
    resonanceMultiplier: number;
  } {
    const zodiacElements: ElementType[] = [
      ElementType.FIRE, ElementType.EARTH, ElementType.AIR, ElementType.WATER,
      ElementType.FIRE, ElementType.EARTH, ElementType.AIR, ElementType.WATER,
      ElementType.FIRE, ElementType.EARTH, ElementType.AIR, ElementType.WATER
    ];
    
    const elementBias = zodiacElements[coords.astrological.zodiacSign - 1];
    const resonanceMultiplier = 0.8 + (coords.quantum.tone / 6) * 0.4;
    
    return { elementBias, resonanceMultiplier };
  }
}

export function getPhenotypeFromCoordinates(coords: FullCoordinate): {
  bodyType: string;
  authority: string;
  profile: string;
  strategy: string;
  determination: string;
  cognition: string;
  frequency: string;
  environment: string;
} {
  const resolver = new CoordinateResolver();
  const colorProps = resolver.getColorProperties(coords.quantum.color);
  const tone = resolver.getToneProperty(coords.quantum.tone);
  const base = resolver.getBaseProperty(coords.quantum.base);
  
  const profileLine1 = coords.quantum.line;
  const profileLine2 = ((coords.quantum.line + 2) % 6) + 1;
  
  const bodyTypes = ['Generator', 'Projector', 'Manifestor', 'Reflector', 'Manifesting Generator'];
  const authorities = ['Emotional', 'Sacral', 'Splenic', 'Ego', 'Self-Projected', 'Mental', 'Lunar'];
  const strategies = ['To Respond', 'Wait for Invitation', 'To Inform', 'Wait 28 Days'];
  
  return {
    bodyType: bodyTypes[coords.quantum.gate % bodyTypes.length],
    authority: authorities[(coords.quantum.line + coords.quantum.color) % authorities.length],
    profile: `${profileLine1}/${profileLine2}`,
    strategy: strategies[coords.quantum.tone % strategies.length],
    determination: colorProps.digestion,
    cognition: tone,
    frequency: base,
    environment: colorProps.environment
  };
}
