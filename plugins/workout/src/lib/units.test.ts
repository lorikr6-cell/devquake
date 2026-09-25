import { describe, expect, it } from 'vitest';
import {
  cmToFeetInches,
  displayDistance,
  displayWeight,
  distanceToM,
  feetInchesToCm,
  weightToKg,
} from './units';

describe('units', () => {
  it('converts weights both ways', () => {
    expect(weightToKg(100, 'kg')).toBe(100);
    expect(weightToKg(220, 'lb')).toBe(99.79);
    expect(displayWeight(99.79, 'lb')).toBe(220);
    expect(displayWeight(72.3, 'kg')).toBe(72.5);
    expect(displayWeight(12.5, 'kg', 0.5)).toBe(12.5);
  });

  it('converts heights to feet and inches and back', () => {
    expect(cmToFeetInches(180)).toEqual({ feet: 5, inches: 11 });
    expect(cmToFeetInches(182.9)).toEqual({ feet: 6, inches: 0 });
    expect(feetInchesToCm(5, 11)).toBe(180.3);
  });

  it('converts distances', () => {
    expect(displayDistance(5000, 'km')).toBe(5);
    expect(displayDistance(1609, 'mi')).toBe(1);
    expect(distanceToM(3.1, 'mi')).toBe(4989);
    expect(distanceToM(2.5, 'km')).toBe(2500);
  });
});
