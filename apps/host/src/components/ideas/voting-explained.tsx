import Link from 'next/link';
import { PRIVACY_PATH } from '@/lib/legal';

/** What voting means and the few rules for posting. Shown on the ideas pages. */
export function VotingExplained({ compact = false }: { compact?: boolean }) {
  return (
    <aside className="rounded-lg border border-quake/30 bg-quake/5 p-4 text-sm">
      <p className="font-semibold">How ideas and votes work</p>
      <p className="mt-1">
        Vote for the ideas you would like to see built. The ideas with the most votes may be turned
        into DevQuake projects and built in the future, as long as they do not harm DevQuake’s
        reputation and respect the law and our{' '}
        <Link href={PRIVACY_PATH} className="underline decoration-quake/50 underline-offset-2">
          privacy policy
        </Link>
        . A vote is a wish, not a promise: DevQuake decides what gets built and when.
      </p>
      {compact ? null : (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/80 dark:text-paper/80">
          <li>Public ideas show your name to every signed-in member; private ones only to you.</li>
          <li>
            No personal data about other people, nothing illegal, hateful or advertising. Ideas and
            comments that break these rules are hidden or removed.
          </li>
          <li>
            You can edit or delete your ideas at any time; they are removed with your account.
          </li>
        </ul>
      )}
    </aside>
  );
}
