import { describe, expect, it } from 'vitest';
import { canStartTrial, trialState, TRIAL_HOURS } from './trial-rules';

const start = new Date('2026-09-25T10:00:00Z');
const trial = {
  startedAt: start,
  expiresAt: new Date(start.getTime() + TRIAL_HOURS * 3_600_000),
};

describe('trialState', () => {
  it('has no trial without a record', () => {
    expect(trialState(null, start)).toEqual({ kind: 'none' });
  });

  it('counts the hours left, rounded up', () => {
    expect(trialState(trial, start)).toMatchObject({ kind: 'active', hoursLeft: 24 });
    expect(trialState(trial, new Date('2026-09-26T09:30:00Z'))).toMatchObject({
      kind: 'active',
      hoursLeft: 1,
    });
  });

  it('ends exactly at the expiry time', () => {
    expect(trialState(trial, trial.expiresAt)).toEqual({
      kind: 'ended',
      endedAt: trial.expiresAt,
    });
  });
});

describe('canStartTrial', () => {
  const base = { appOnline: true, isAdmin: false, member: false, trial: null };

  it('is offered once, for an online app, to members without access', () => {
    expect(canStartTrial(base)).toBe(true);
    expect(canStartTrial({ ...base, trial })).toBe(false);
  });

  it('is not offered to subscribers, assigned users or admins, or for apps that are offline', () => {
    expect(canStartTrial({ ...base, member: true })).toBe(false);
    expect(canStartTrial({ ...base, isAdmin: true })).toBe(false);
    expect(canStartTrial({ ...base, appOnline: false })).toBe(false);
  });
});
