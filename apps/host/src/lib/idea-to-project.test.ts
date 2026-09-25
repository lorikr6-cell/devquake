import { describe, expect, it } from 'vitest';
import {
  PROJECT_DESCRIPTION_MAX,
  projectDescriptionFromIdea,
  slugify,
  uniqueSlug,
} from './idea-to-project';

describe('slugify', () => {
  it('makes a subdomain-safe slug', () => {
    expect(slugify('Meal planner für Familien!')).toBe('meal-planner-fur-familien');
    expect(slugify('Țară și ăsta')).toBe('tara-si-asta');
    expect(slugify('!!!')).toBe('project');
    expect(slugify('x'.repeat(80))).toHaveLength(48);
  });

  it('adds a number when the slug is taken', () => {
    expect(uniqueSlug('meal', new Set())).toBe('meal');
    expect(uniqueSlug('meal', new Set(['meal', 'meal-2']))).toBe('meal-3');
  });
});

describe('projectDescriptionFromIdea', () => {
  it('keeps the text, the author, the voters and the comments', () => {
    const text = projectDescriptionFromIdea({
      id: 7,
      description: 'Plan meals for the week.',
      author: 'Ana',
      voters: ['Bob', 'Cleo'],
      comments: [{ author: 'Bob', body: 'Yes\nplease' }],
    });
    expect(text).toBe(
      'Plan meals for the week.\n\nFrom community idea #7 by Ana. 2 votes: Bob, Cleo.\n\nComments (1):\n- Bob: Yes please',
    );
  });

  it('says when nobody voted and shortens very long texts', () => {
    expect(
      projectDescriptionFromIdea({
        id: 1,
        description: null,
        author: 'A',
        voters: [],
        comments: [],
      }),
    ).toBe('From community idea #1 by A. No votes yet.');
    const long = projectDescriptionFromIdea({
      id: 1,
      description: 'x'.repeat(20_000),
      author: 'A',
      voters: [],
      comments: [],
    });
    expect(long.length).toBe(PROJECT_DESCRIPTION_MAX);
    expect(long.endsWith('(shortened)')).toBe(true);
  });
});
