/**
 * Activity-log actions shown to users as their "account activity" (Your account page). They
 * are deleted after RETENTION_DAYS.accountActivity, together with the owner's changes to the
 * account (user.updated).
 */
export const ACCOUNT_EVENT_ACTIONS = [
  'auth.signup.started',
  'auth.signup.activated',
  'auth.signin.success',
  'auth.signout',
  'auth.signin.failed',
  'auth.signin.locked',
  'auth.account.locked',
  'auth.code.failed',
  'project.subscribed',
  'project.unsubscribed',
  'project.trial.started',
  'auth.password.reset',
  'contact.received',
  'referral.invited',
  'referral.joined',
] as const;
