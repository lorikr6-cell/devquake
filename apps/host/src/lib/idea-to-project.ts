// Turning a community idea into a project (control panel, ADR 0020). Pure and tested: the new
// project's slug and its description built from the idea, its votes and its comments.

/** The longest project description kept (the project form allows the same). */
export const PROJECT_DESCRIPTION_MAX = 8000;
const MAX_VOTER_NAMES = 60;

/** "Meal planner für Familien!" → "meal-planner-fur-familien" (a-z, 0-9, dashes; 48 at most). */
export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
  return slug || 'project';
}

/** The first of slug, slug-2, slug-3 … that is not taken. */
export function uniqueSlug(base: string, taken: ReadonlySet<string>): string {
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base.slice(0, 44)}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export interface IdeaForProject {
  id: number;
  description: string | null;
  author: string;
  voters: string[];
  comments: Array<{ author: string; body: string }>;
}

/**
 * The project description: the idea's text, who proposed it, how many people voted and who,
 * and the comments. Cut at PROJECT_DESCRIPTION_MAX (with a note when something was left out).
 */
export function projectDescriptionFromIdea(idea: IdeaForProject): string {
  const parts: string[] = [];
  if (idea.description?.trim()) parts.push(idea.description.trim());
  const votes = idea.voters.length;
  const names =
    votes > MAX_VOTER_NAMES
      ? `${idea.voters.slice(0, MAX_VOTER_NAMES).join(', ')} and ${votes - MAX_VOTER_NAMES} more`
      : idea.voters.join(', ');
  parts.push(
    `From community idea #${idea.id} by ${idea.author}. ` +
      (votes === 0 ? 'No votes yet.' : `${votes} ${votes === 1 ? 'vote' : 'votes'}: ${names}.`),
  );
  if (idea.comments.length) {
    parts.push(
      [
        `Comments (${idea.comments.length}):`,
        ...idea.comments.map((c) => `- ${c.author}: ${c.body.replace(/\s+/g, ' ').trim()}`),
      ].join('\n'),
    );
  }
  const text = parts.join('\n\n');
  if (text.length <= PROJECT_DESCRIPTION_MAX) return text;
  const note = '\n… (shortened)';
  return text.slice(0, PROJECT_DESCRIPTION_MAX - note.length).trimEnd() + note;
}
