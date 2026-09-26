import { describe, expect, it } from 'vitest';
import {
  checkLogo,
  isSafeReferralUrl,
  LOGO_MAX_BYTES,
  parseReferralForm,
  textsFor,
} from './external-referral-rules';

const complete = (overrides: Record<string, string> = {}) => {
  const values: Record<string, string> = {
    slug: 'bitget',
    name: 'Bitget',
    url: 'https://www.bitgetapps.com/referral/register?clacCode=QAKXLDX4',
    sort_order: '10',
    is_active: 'on',
    ...overrides,
  };
  for (const l of ['en', 'de', 'ro', 'hu']) {
    for (const f of ['label', 'title', 'body', 'button']) values[`${l}.${f}`] ??= `${f} ${l}`;
  }
  return { get: (name: string) => values[name] ?? null };
};

describe('external referrals', () => {
  it('accepts only https links', () => {
    expect(isSafeReferralUrl('https://www.bitgetapps.com/referral/register?x=1')).toBe(true);
    expect(isSafeReferralUrl('http://example.com')).toBe(false);
    expect(isSafeReferralUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeReferralUrl('https://user:pw@example.com')).toBe(false);
  });

  it('needs every text in every language', () => {
    const ok = parseReferralForm(complete());
    expect(ok.ok && ok.value.texts.hu.button).toBe('button hu');
    expect(ok.ok && ok.value.isActive).toBe(true);
    expect(parseReferralForm(complete({ 'ro.title': '' }))).toEqual({ ok: false, error: 'texts' });
    expect(parseReferralForm(complete({ slug: 'Bit Get' }))).toEqual({ ok: false, error: 'slug' });
    expect(parseReferralForm(complete({ url: 'ftp://x.y' }))).toEqual({ ok: false, error: 'url' });
    expect(parseReferralForm(complete({ code: 'bad code!' }))).toEqual({
      ok: false,
      error: 'code',
    });
    const coded = parseReferralForm(complete({ code: '6h28v4e788' }));
    expect(coded.ok && coded.value.code).toBe('6h28v4e788');
    expect(ok.ok && ok.value.code).toBeNull();
  });

  it('shows the visitor’s language, or English', () => {
    const json = JSON.stringify({
      en: { label: 'L', title: 'T', body: 'B', button: 'Go' },
      de: { label: 'L', title: 'T-de', body: 'B', button: 'Los' },
    });
    expect(textsFor(json, 'de')?.title).toBe('T-de');
    expect(textsFor(json, 'hu')?.title).toBe('T');
    expect(textsFor('not json', 'en')).toBeNull();
  });

  it('accepts only safe logos, judged by their content', () => {
    const svg = (body: string) => new TextEncoder().encode(body);
    const ok =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';
    expect(checkLogo(svg(ok))).toBe('image/svg+xml');
    expect(
      checkLogo(
        svg(`<?xml version="1.0"?>
${ok}`),
      ),
    ).toBe('image/svg+xml');
    expect(checkLogo(svg(ok.replace('<path', '<script>alert(1)</script><path')))).toBeNull();
    expect(checkLogo(svg(ok.replace('<path', '<path onload="x()"')))).toBeNull();
    expect(checkLogo(svg(ok.replace('<path', '<a href="https://x.y"><path')))).toBeNull();
    expect(checkLogo(svg('<html><svg></svg></html>'))).toBeNull();
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
    expect(checkLogo(png)).toBe('image/png');
    expect(checkLogo(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(checkLogo(new Uint8Array(LOGO_MAX_BYTES + 1))).toBeNull();
    expect(checkLogo(new Uint8Array())).toBeNull();
  });
});
