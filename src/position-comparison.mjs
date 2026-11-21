import { FOUNDRY_PROVIDER_ID, HD_PROVIDER_ID } from '../vendor/synthai/services/address-service.mjs';

export const positionCapability = 'compare_position';
const fullCircle = 360 * 3600;
const levels = ['gate', 'line', 'color', 'tone', 'base'];

export async function comparePosition(address, input) {
  const { birthDate, birthTime, planet = 'Sun' } = input ?? {};
  const utc = new Date(`${birthDate}T${birthTime}:00Z`);
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) ||
      typeof birthTime !== 'string' || !/^\d{2}:\d{2}$/.test(birthTime) ||
      typeof planet !== 'string' || !Number.isFinite(utc.valueOf()) ||
      utc.toISOString().slice(0, 16) !== `${birthDate}T${birthTime}`) {
    throw new RangeError('Expected a valid UTC birthDate and birthTime');
  }

  const kimi = await address.resolveAddress({ birthDate, birthTime, planet });
  const { zodiac: sign, degree, minute, second, arc } = kimi.address;
  const coordinate = { sign, degree, minute, second };
  const foundry = await address.resolveAddress({ ephemeris: coordinate });
  const delta = foundry.address.arc - arc;
  // Center the circular difference around zero, including the Aries boundary.
  const difference = (delta + 1.5 * fullCircle) % fullCircle - fullCircle / 2;

  if (kimi.status !== 'resolved' || foundry.status !== 'resolved' ||
      kimi.provider !== HD_PROVIDER_ID || foundry.provider !== FOUNDRY_PROVIDER_ID ||
      !Number.isInteger(arc) || !Number.isInteger(foundry.address.arc) ||
      Math.abs(difference) > 1) {
    throw new Error('Positional providers did not resolve the same tropical coordinate');
  }

  return {
    observedAtUtc: utc.toISOString(),
    coordinate,
    // Kimi's address arc is rounded, while its displayed degrees use the donor's DMS conversion.
    arcDifferenceSeconds: difference,
    kimi: { provider: kimi.provider, address: kimi.address },
    foundry: { provider: foundry.provider, address: foundry.address },
    differingLevels: levels.filter(level => kimi.address[level] !== foundry.address[level]),
    scope: {
      positionSource: 'Kimi approximate birth-time ephemeris',
      comparison: 'Foundry maps the supplied tropical DMS position using its own mandala wheel',
    },
  };
}
