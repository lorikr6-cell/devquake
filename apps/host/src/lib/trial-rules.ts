// 24-hour app trials (ADR 0016). Pure, so it is shared by the server and tested.

/** How long a trial lasts. Each member can try each project's app once. */
export const TRIAL_HOURS = 24;

/**
 * Days after a trial ended before the app deletes what the member created in it, unless they
 * subscribed in the meantime (the platform's data clean-up rule; the privacy policy shows it).
 */
export const TRIAL_DATA_KEEP_DAYS = 30;

export interface TrialRecord {
  startedAt: Date;
  expiresAt: Date;
}

export type TrialState =
  | { kind: 'none' }
  | { kind: 'active'; endsAt: Date; hoursLeft: number }
  | { kind: 'ended'; endedAt: Date };

/** Where a member's trial of one project stands at `now`. */
export function trialState(trial: TrialRecord | null | undefined, now: Date): TrialState {
  if (!trial) return { kind: 'none' };
  const left = trial.expiresAt.getTime() - now.getTime();
  if (left <= 0) return { kind: 'ended', endedAt: trial.expiresAt };
  // Rounded up: "1 hour left" until the very end, never "0 hours left".
  return { kind: 'active', endsAt: trial.expiresAt, hoursLeft: Math.ceil(left / 3_600_000) };
}

/**
 * Whether the "Try it for 24 hours" button is offered: only for an app that is online, to a
 * signed-in member who is not subscribed or assigned, is not an admin (admins can open every
 * app), and has never tried this project before.
 */
export function canStartTrial(args: {
  appOnline: boolean;
  isAdmin: boolean;
  member: boolean;
  trial: TrialRecord | null | undefined;
}): boolean {
  return args.appOnline && !args.isAdmin && !args.member && !args.trial;
}
