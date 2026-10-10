import { isBotUserAgent, buildVisitorAlertMessage, shouldAlertForVisit } from '../visitor-alert';

describe('isBotUserAgent', () => {
  it('flags common search engine crawlers', () => {
    expect(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)')).toBe(true);
  });

  it('flags headless browsers and automation tools', () => {
    expect(isBotUserAgent('Mozilla/5.0 HeadlessChrome/120.0.0.0')).toBe(true);
    expect(isBotUserAgent('Playwright/1.40.0')).toBe(true);
    expect(isBotUserAgent('Mozilla/5.0 (compatible; Puppeteer)')).toBe(true);
  });

  it('flags uptime monitors and simple HTTP clients', () => {
    expect(isBotUserAgent('Pingdom.com_bot_version_1.4')).toBe(true);
    expect(isBotUserAgent('curl/8.4.0')).toBe(true);
    expect(isBotUserAgent('python-requests/2.31.0')).toBe(true);
  });

  it('flags missing or empty user-agent as suspicious', () => {
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent(undefined)).toBe(true);
    expect(isBotUserAgent('')).toBe(true);
    expect(isBotUserAgent('   ')).toBe(true);
  });

  it('does not flag a normal desktop browser', () => {
    expect(isBotUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    )).toBe(false);
  });

  it('does not flag a normal mobile browser', () => {
    expect(isBotUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    )).toBe(false);
  });
});

describe('buildVisitorAlertMessage', () => {
  it('includes the path, site host, and a formatted timestamp', () => {
    const msg = buildVisitorAlertMessage({
      path: '/book/',
      timestamp: new Date('2026-10-10T16:00:00Z'),
    });
    expect(msg).toContain('/book/');
    expect(msg).toContain('getcyberjuice.com');
  });

  it('includes an external referrer when present', () => {
    const msg = buildVisitorAlertMessage({
      path: '/',
      referrer: 'https://google.com/search?q=ev+charging+atlanta',
      timestamp: new Date('2026-10-10T16:00:00Z'),
    });
    expect(msg).toContain('google.com');
  });

  it('omits the referrer line for internal/self referrers', () => {
    const msg = buildVisitorAlertMessage({
      path: '/book/',
      referrer: 'https://getcyberjuice.com/',
      timestamp: new Date('2026-10-10T16:00:00Z'),
    });
    expect(msg).not.toContain('From:');
  });

  it('omits the referrer line when none is provided', () => {
    const msg = buildVisitorAlertMessage({
      path: '/',
      timestamp: new Date('2026-10-10T16:00:00Z'),
    });
    expect(msg).not.toContain('From:');
  });
});

describe('shouldAlertForVisit', () => {
  it('returns false for bot user agents', () => {
    expect(shouldAlertForVisit({ userAgent: 'Googlebot', path: '/' })).toBe(false);
  });

  it('returns false for missing path', () => {
    expect(shouldAlertForVisit({ userAgent: 'Mozilla/5.0', path: '' })).toBe(false);
    expect(shouldAlertForVisit({ userAgent: 'Mozilla/5.0', path: null })).toBe(false);
  });

  it('returns true for a real browser hitting a real page', () => {
    expect(shouldAlertForVisit({ userAgent: 'Mozilla/5.0 (Macintosh)', path: '/book/' })).toBe(true);
  });
});
