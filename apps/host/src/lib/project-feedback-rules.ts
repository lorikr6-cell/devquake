// Pure types and rules for project likes and ratings (no server imports; unit-tested).

export interface ProjectFeedbackSummary {
  likes: number;
  /** Number of people who rated (quality and/or usefulness). */
  ratings: number;
  /** Averages 1..5 rounded to one decimal, null when nobody rated. */
  quality: number | null;
  usefulness: number | null;
}

export interface MyFeedback {
  liked: boolean;
  quality: number | null;
  usefulness: number | null;
}

export const EMPTY_FEEDBACK: ProjectFeedbackSummary = {
  likes: 0,
  ratings: 0,
  quality: null,
  usefulness: null,
};

export function isRating(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/** Form value → rating: "" or missing = not rated, anything else must be 1..5 (else NaN). */
export function parseRating(value: FormDataEntryValue | null): number | null {
  if (value === null || value === '') return null;
  const n = Number(value);
  return isRating(n) ? n : NaN;
}

/**
 * Landing order: live projects first, then the most liked, then the admin's order (the input
 * order, kept stable).
 */
export function sortByLiveAndLikes<T extends { url: string | null; feedback: { likes: number } }>(
  projects: T[],
): T[] {
  return projects
    .map((p, i) => ({ p, i }))
    .sort(
      (a, b) =>
        Number(!!b.p.url) - Number(!!a.p.url) ||
        b.p.feedback.likes - a.p.feedback.likes ||
        a.i - b.i,
    )
    .map(({ p }) => p);
}
