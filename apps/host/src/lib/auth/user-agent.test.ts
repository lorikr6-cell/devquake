import { describe, expect, it } from 'vitest';
import { parseUserAgent } from './user-agent';

describe('parseUserAgent', () => {
  it('detects Edge on Windows before Chrome', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.80';
    expect(parseUserAgent(ua)).toEqual({
      browser: 'Edge',
      browserVersion: '124',
      os: 'Windows 10/11',
      deviceType: 'desktop',
    });
  });

  it('detects Safari on iPhone as mobile', () => {
    const ua =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
    expect(parseUserAgent(ua)).toMatchObject({
      browser: 'Safari',
      browserVersion: '17',
      os: 'iOS 17.4',
      deviceType: 'mobile',
    });
  });

  it('detects Firefox on Android', () => {
    const ua = 'Mozilla/5.0 (Android 14; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0';
    expect(parseUserAgent(ua)).toMatchObject({
      browser: 'Firefox',
      os: 'Android 14',
      deviceType: 'mobile',
    });
  });

  it('prefers client hints (e.g. Brave, which looks like Chrome)', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    const info = parseUserAgent(ua, {
      brands: '"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"',
      platform: '"Windows"',
      mobile: '?0',
    });
    expect(info).toMatchObject({ browser: 'Brave', browserVersion: '124', deviceType: 'desktop' });
  });

  it('flags bots and handles missing input', () => {
    expect(parseUserAgent('curl/8.4.0').deviceType).toBe('bot');
    expect(parseUserAgent(null)).toEqual({
      browser: null,
      browserVersion: null,
      os: null,
      deviceType: null,
    });
  });
});
