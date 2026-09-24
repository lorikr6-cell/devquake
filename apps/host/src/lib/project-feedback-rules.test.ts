import { describe, expect, it } from 'vitest';
import { isRating, parseRating, sortByLiveAndLikes } from './project-feedback-rules';

describe('ratings', () => {
  it('accepts whole stars from 1 to 5', () => {
    expect([0, 1, 3, 5, 6, 2.5].map(isRating)).toEqual([false, true, true, true, false, false]);
  });

  it('parses form values: empty = not rated, invalid = NaN', () => {
    expect(parseRating(null)).toBeNull();
    expect(parseRating('')).toBeNull();
    expect(parseRating('4')).toBe(4);
    expect(parseRating('9')).toBeNaN();
    expect(parseRating('x')).toBeNaN();
  });
});

describe('sortByLiveAndLikes', () => {
  const p = (name: string, live: boolean, likes: number) => ({
    name,
    url: live ? `https://${name}.devquake.com` : null,
    feedback: { likes },
  });

  it('puts live projects first, then the most liked, keeping the admin order on ties', () => {
    const sorted = sortByLiveAndLikes([
      p('a', false, 9),
      p('b', true, 1),
      p('c', false, 0),
      p('d', true, 5),
      p('e', false, 9),
      p('f', true, 1),
    ]);
    expect(sorted.map((x) => x.name)).toEqual(['d', 'b', 'f', 'a', 'e', 'c']);
  });
});
