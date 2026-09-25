import { describe, expect, it } from 'vitest';
import {
  canComment,
  canSeeIdea,
  canVote,
  checkComment,
  checkIdeaForm,
  type IdeaAccessFacts,
} from './community-idea-rules';

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};

describe('checkIdeaForm', () => {
  it('accepts a complete idea', () => {
    const result = checkIdeaForm(
      form({
        title: '  Recipe   planner ',
        description: 'Plan meals\r\nfor the week',
        project_id: '5',
        is_public: 'on',
        votes_enabled: 'on',
      }),
      [5, 6],
    );
    expect(result).toEqual({
      ok: true,
      value: {
        title: 'Recipe planner',
        description: 'Plan meals\nfor the week',
        projectId: 5,
        isPublic: true,
        votesEnabled: true,
        commentsEnabled: false,
      },
    });
  });

  it('allows "a new app" (no project) and refuses unknown projects', () => {
    expect(checkIdeaForm(form({ title: 'New app', project_id: '' }), [])).toMatchObject({
      ok: true,
      value: { projectId: null, isPublic: false },
    });
    expect(checkIdeaForm(form({ title: 'Sneaky', project_id: '99' }), [5])).toMatchObject({
      ok: false,
    });
  });

  it('checks lengths', () => {
    expect(checkIdeaForm(form({ title: 'ab' }), [])).toMatchObject({ ok: false });
    expect(checkIdeaForm(form({ title: 'x'.repeat(201) }), [])).toMatchObject({ ok: false });
    expect(checkIdeaForm(form({ title: 'Fine', description: 'x'.repeat(5001) }), [])).toMatchObject(
      { ok: false },
    );
    expect(checkComment(null)).toMatchObject({ ok: false });
    expect(checkComment('  Great!  ')).toEqual({ ok: true, value: 'Great!' });
  });
});

describe('access', () => {
  const idea = (over: Partial<IdeaAccessFacts> = {}): IdeaAccessFacts => ({
    authorUserId: 1,
    isPublic: true,
    hidden: false,
    votesEnabled: true,
    commentsEnabled: true,
    ...over,
  });
  const author = { userId: 1, isAdmin: false };
  const other = { userId: 2, isAdmin: false };
  const admin = { userId: 3, isAdmin: true };

  it('keeps private ideas to their author, even from admins', () => {
    const p = idea({ isPublic: false });
    expect(canSeeIdea(p, author)).toBe(true);
    expect(canSeeIdea(p, other)).toBe(false);
    expect(canSeeIdea(p, admin)).toBe(false);
    expect(canSeeIdea(idea(), null)).toBe(false);
  });

  it('hides moderated ideas from everyone but the author and staff', () => {
    const h = idea({ hidden: true });
    expect([canSeeIdea(h, author), canSeeIdea(h, other), canSeeIdea(h, admin)]).toEqual([
      true,
      false,
      true,
    ]);
    expect(canVote(h, admin)).toBe(false);
  });

  it('lets the author switch voting and comments off', () => {
    expect(canVote(idea(), other)).toBe(true);
    expect(canVote(idea({ votesEnabled: false }), other)).toBe(false);
    expect(canComment(idea({ commentsEnabled: false }), other)).toBe(false);
    expect(canComment(idea({ isPublic: false }), author)).toBe(false);
  });
});
