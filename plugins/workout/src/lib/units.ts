/**
 * Units (ADR 0013): the database holds kg, cm and metres; people can type and read lb, ft + in
 * and miles. Conversion happens only at the edges (forms and display).
 */

export type WeightUnit = 'kg' | 'lb';
export type HeightUnit = 'cm' | 'ft';
/** Distances follow the height choice: centimetres go with km, feet with miles. */
export type DistanceUnit = 'km' | 'mi';

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;
export const M_PER_MI = 1609.344;

const round = (n: number, step: number) => Math.round(n / step) * step;
/** Rounds away floating-point noise (0.1 + 0.2). */
const clean = (n: number) => Math.round(n * 1000) / 1000;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Weight in the person's unit, rounded for display (0.5 kg / 1 lb for body weight). */
export function displayWeight(
  kg: number,
  unit: WeightUnit,
  step = unit === 'kg' ? 0.5 : 1,
): number {
  return clean(round(unit === 'kg' ? kg : kgToLb(kg), step));
}

/** Typed weight → kg with two decimals. */
export function weightToKg(value: number, unit: WeightUnit): number {
  return Math.round((unit === 'kg' ? value : lbToKg(value)) * 100) / 100;
}

/** 180 cm → { feet: 5, inches: 11 } (inches rounded, 12 carried over). */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const total = Math.round(cm / CM_PER_IN);
  return { feet: Math.floor(total / 12), inches: total % 12 };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * CM_PER_IN * 10) / 10;
}

export function distanceUnit(height: HeightUnit): DistanceUnit {
  return height === 'ft' ? 'mi' : 'km';
}

/** Metres → km or miles with two decimals. */
export function displayDistance(m: number, unit: DistanceUnit): number {
  return clean(Math.round((unit === 'km' ? m / 1000 : m / M_PER_MI) * 100) / 100);
}

/** Typed km or miles → whole metres. */
export function distanceToM(value: number, unit: DistanceUnit): number {
  return Math.round(unit === 'km' ? value * 1000 : value * M_PER_MI);
}

/** The step of the weight field in the workout: 2.5 kg or 5 lb. */
export function weightInputStep(unit: WeightUnit): number {
  return unit === 'kg' ? 2.5 : 5;
}
