/**
 * Small, dependency-free user-agent parser for sign-in snapshots. It only needs to be good
 * enough for a human reading the statistics page, not for feature detection.
 * Chromium's client-hint headers (sec-ch-ua*) are preferred when present because modern
 * Chrome/Edge freeze parts of the user-agent string.
 */
export interface BrowserInfo {
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | null;
}

export interface ClientHints {
  brands?: string | null; // sec-ch-ua
  platform?: string | null; // sec-ch-ua-platform
  mobile?: string | null; // sec-ch-ua-mobile
}

const BROWSERS: Array<[name: string, pattern: RegExp]> = [
  // Order matters: Edge, Opera, Samsung etc. also contain "Chrome" and "Safari".
  ['Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/],
  ['Opera', /(?:OPR|Opera)\/([\d.]+)/],
  ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
  ['Vivaldi', /Vivaldi\/([\d.]+)/],
  ['Yandex', /YaBrowser\/([\d.]+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
  ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
  ['Safari', /Version\/([\d.]+).*Safari/],
];

const HINT_BRANDS: Record<string, string> = {
  'Microsoft Edge': 'Edge',
  'Google Chrome': 'Chrome',
  Opera: 'Opera',
  Brave: 'Brave',
  Vivaldi: 'Vivaldi',
  'Samsung Internet': 'Samsung Internet',
  'Yandex Browser': 'Yandex',
};

function parseOs(ua: string): string | null {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
  if (/Windows/.test(ua)) return 'Windows';
  const ios = ua.match(/(?:iPhone|iPad|iPod).*? OS (\d+)[_.](\d+)/);
  if (ios) return `iOS ${ios[1]}.${ios[2]}`;
  const android = ua.match(/Android (\d+(?:\.\d+)?)/);
  if (android) return `Android ${android[1]}`;
  const mac = ua.match(/Mac OS X (\d+)[_.](\d+)/);
  if (mac) return `macOS ${mac[1]}.${mac[2]}`;
  if (/CrOS/.test(ua)) return 'ChromeOS';
  if (/Linux/.test(ua)) return 'Linux';
  return null;
}

function unquote(value: string | null | undefined): string | null {
  return value ? value.replace(/^"|"$/g, '') || null : null;
}

export function parseUserAgent(
  ua: string | null | undefined,
  hints: ClientHints = {},
): BrowserInfo {
  const s = ua ?? '';
  if (!s && !hints.brands)
    return { browser: null, browserVersion: null, os: null, deviceType: null };

  if (/bot|crawler|spider|curl|wget|python-requests|headless/i.test(s)) {
    return { browser: 'Bot', browserVersion: null, os: parseOs(s), deviceType: 'bot' };
  }

  let browser: string | null = null;
  let browserVersion: string | null = null;
  for (const [name, pattern] of BROWSERS) {
    const m = s.match(pattern);
    if (m) {
      browser = name;
      browserVersion = m[1]!.split('.')[0]!;
      break;
    }
  }

  // Client hints, e.g. `"Chromium";v="124", "Brave";v="124", "Not-A.Brand";v="99"`.
  if (hints.brands) {
    for (const m of hints.brands.matchAll(/"([^"]+)";v="(\d+)"/g)) {
      const mapped = HINT_BRANDS[m[1]!];
      if (mapped) {
        browser = mapped;
        browserVersion = m[2]!;
        break;
      }
    }
  }

  const os = parseOs(s) ?? unquote(hints.platform);

  let deviceType: BrowserInfo['deviceType'] = 'desktop';
  if (/iPad|Tablet/.test(s) || (/Android/.test(s) && !/Mobile/.test(s))) deviceType = 'tablet';
  else if (/Mobi|iPhone|iPod/.test(s) || hints.mobile === '?1') deviceType = 'mobile';

  return { browser, browserVersion, os, deviceType };
}
