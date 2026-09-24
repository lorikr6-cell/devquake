import 'server-only';
import { ACCOUNT_EVENT_ACTIONS } from './account-events';
import { execute } from './db';

/**
 * How long personal data is kept. The privacy policy (/privacy) renders these same values,
 * so changing a number here changes both the clean-up and what we promise visitors.
 */
export const RETENTION_DAYS = {
  /** Sign-in / sign-up snapshots (IP, location, browser, VPN detection): "sign-in activity". */
  authSnapshots: 90,
  /** What users see as their "account activity" (sign-ins, subscriptions, owner changes...). */
  accountActivity: 90,
  /** Password attempts used for lockout and throttling. */
  loginAttempts: 90,
  /** General activity log (security events are kept as long as snapshots). */
  activityLog: 180,
  securityLog: 365,
  /** Expired sessions, one-time codes and activation links. */
  sessions: 7,
  challenges: 7,
  activations: 7,
  /** Record of emails sent (no bodies). */
  emailOutbox: 365,
  /** Contact-form messages. */
  contactMessages: 730,
  /** Addresses invited by members that never joined (the person never agreed to anything). */
  unansweredInvites: 90,
  /** Accounts that never confirmed their email address. */
  pendingAccounts: 30,
} as const;

const RUN_EVERY_MS = 24 * 60 * 60 * 1000;
const globalForRetention = globalThis as unknown as { devquakeRetentionAt?: number };

/**
 * Deletes data older than RETENTION_DAYS. Managed hosting has no cron, so it runs
 * opportunistically (from sign-ins and contact messages) at most once a day per server
 * process. Never throws.
 */
export async function maybeRunRetention(): Promise<void> {
  const now = Date.now();
  if (now - (globalForRetention.devquakeRetentionAt ?? 0) < RUN_EVERY_MS) return;
  globalForRetention.devquakeRetentionAt = now;

  const d = RETENTION_DAYS;
  const statements: Array<[string, unknown[]]> = [
    [
      'DELETE FROM auth_snapshots WHERE occurred_at < UTC_TIMESTAMP() - INTERVAL ? DAY',
      [d.authSnapshots],
    ],
    // Account activity first: it is shorter than the general and security log periods.
    [
      `DELETE FROM activity_log
        WHERE occurred_at < UTC_TIMESTAMP() - INTERVAL ? DAY
          AND ((actor_user_id IS NOT NULL AND action IN (?))
               OR (entity_type = 'user' AND action = 'user.updated'))`,
      [d.accountActivity, [...ACCOUNT_EVENT_ACTIONS]],
    ],
    [
      'DELETE FROM login_attempts WHERE created_at < UTC_TIMESTAMP() - INTERVAL ? DAY',
      [d.loginAttempts],
    ],
    [
      "DELETE FROM activity_log WHERE level <> 'security' AND occurred_at < UTC_TIMESTAMP() - INTERVAL ? DAY",
      [d.activityLog],
    ],
    [
      "DELETE FROM activity_log WHERE level = 'security' AND occurred_at < UTC_TIMESTAMP() - INTERVAL ? DAY",
      [d.securityLog],
    ],
    ['DELETE FROM sessions WHERE expires_at < UTC_TIMESTAMP() - INTERVAL ? DAY', [d.sessions]],
    [
      'DELETE FROM login_challenges WHERE expires_at < UTC_TIMESTAMP() - INTERVAL ? DAY',
      [d.challenges],
    ],
    [
      'DELETE FROM account_activations WHERE expires_at < UTC_TIMESTAMP() - INTERVAL ? DAY',
      [d.activations],
    ],
    [
      "DELETE FROM referral_invites WHERE status = 'sent' AND created_at < UTC_TIMESTAMP() - INTERVAL ? DAY",
      [d.unansweredInvites],
    ],
    [
      'DELETE FROM email_outbox WHERE created_at < UTC_TIMESTAMP() - INTERVAL ? DAY',
      [d.emailOutbox],
    ],
    [
      'DELETE FROM contact_messages WHERE created_at < UTC_TIMESTAMP() - INTERVAL ? DAY',
      [d.contactMessages],
    ],
    [
      "DELETE FROM users WHERE status = 'pending' AND email_verified_at IS NULL AND created_at < UTC_TIMESTAMP() - INTERVAL ? DAY",
      [d.pendingAccounts],
    ],
  ];
  for (const [sql, params] of statements) {
    try {
      await execute(sql, params);
    } catch (err) {
      console.error('[retention] failed:', sql.slice(0, 60), err);
    }
  }
}
