import { describe, expect, it } from 'vitest';
import { NPS_START, missingPoints, parseNpsCost, subscriptionCost } from './nps-rules';

describe('NPS points', () => {
  it('starts every account with 3 points', () => {
    expect(NPS_START).toBe(3);
  });

  it('charges members the project cost; admins and assigned members are exempt', () => {
    expect(subscriptionCost(2, { isAdmin: false, assigned: false })).toBe(2);
    expect(subscriptionCost(0, { isAdmin: false, assigned: false })).toBe(0);
    expect(subscriptionCost(5, { isAdmin: true, assigned: false })).toBe(0);
    expect(subscriptionCost(5, { isAdmin: false, assigned: true })).toBe(0);
  });

  it('says how many points are missing', () => {
    expect(missingPoints(3, 2)).toBe(0);
    expect(missingPoints(3, 3)).toBe(0);
    expect(missingPoints(1, 4)).toBe(3);
  });

  it('accepts whole costs from 0 (FREE) up to the limit', () => {
    expect(parseNpsCost('0')).toBe(0);
    expect(parseNpsCost(' 5 ')).toBe(5);
    expect(parseNpsCost('1000')).toBe(1000);
    expect(parseNpsCost('1001')).toBeNull();
    expect(parseNpsCost('-1')).toBeNull();
    expect(parseNpsCost('2.5')).toBeNull();
    expect(parseNpsCost('')).toBeNull();
  });
});
