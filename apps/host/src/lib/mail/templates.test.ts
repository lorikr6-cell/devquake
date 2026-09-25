import { describe, expect, it } from 'vitest';
import {
  CONTACT_EMAIL,
  accountChangedEmail,
  contactNotificationEmail,
  esc,
  referralInviteEmail,
  signInCodeEmail,
  welcomeActivationEmail,
} from './templates';

const siteUrl = 'https://devquake.com';

describe('email templates', () => {
  it('escapes HTML in every dynamic value', () => {
    expect(esc(`<img src=x onerror="alert('x')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;',
    );
    const mail = accountChangedEmail({
      siteUrl,
      name: '<script>alert(1)</script>',
      changes: [{ kind: 'roleGranted', role: 'Tester <b>x</b>' }],
      isAdmin: false,
      adminUrl: `${siteUrl}/admin-cp`,
      projects: [{ name: 'Bills & co', role: 'member', url: null }],
      disabled: false,
    });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('Bills &amp; co');
    expect(mail.html).toContain('Tester &lt;b&gt;x&lt;/b&gt;');
  });

  it('signs every email with the contact address only', () => {
    const mail = signInCodeEmail({
      siteUrl,
      name: 'Ana',
      code: '123456',
      minutes: 10,
      context: { location: 'Cluj-Napoca, Romania', device: 'Chrome 124 on Windows', vpn: null },
      forAdmin: false,
    });
    expect(mail.subject).toContain('123456');
    expect(mail.html).toContain(`mailto:${CONTACT_EMAIL}`);
    expect(mail.text).toContain(CONTACT_EMAIL);
    expect(mail.text).toContain('Cluj-Napoca, Romania');
  });

  it('only mentions the control panel to administrators', () => {
    const base = {
      siteUrl,
      name: 'Ana',
      changes: [{ kind: 'projectAdded' as const, project: 'Bills', projectRole: 'member' }],
      adminUrl: `${siteUrl}/admin-cp`,
      projects: [],
      disabled: false,
    };
    expect(accountChangedEmail({ ...base, isAdmin: false }).html).not.toContain('/admin-cp');
    expect(accountChangedEmail({ ...base, isAdmin: true }).html).toContain('/admin-cp');
  });

  it('escapes visitor input in contact notifications', () => {
    const mail = contactNotificationEmail({
      siteUrl,
      adminUrl: `${siteUrl}/admin-cp`,
      name: 'Eve <img src=x onerror=alert(1)>',
      email: 'eve@example.com',
      subject: '<b>hi</b>',
      message: 'line 1\n<script>steal()</script>',
      context: { location: null, device: 'Firefox 125 on Linux', vpn: null },
    });
    expect(mail.html).not.toMatch(/<script|<img src=x|<b>hi/);
    expect(mail.html).toContain('&lt;script&gt;steal()&lt;/script&gt;');
    expect(mail.text).toContain('eve@example.com');
  });

  it('welcome email: branded images, activation button and a plain-text link', () => {
    const url = 'https://devquake.com/activate?token=abc_DEF-123';
    const mail = welcomeActivationEmail({
      siteUrl,
      name: 'Ana <b>',
      activationUrl: url,
      hours: 48,
    });
    expect(mail.subject).toMatch(/activate/i);
    expect(mail.html).toContain(`${siteUrl}/brand/email-logo.png`);
    expect(mail.html).toContain(`${siteUrl}/brand/email-welcome.png`);
    expect(mail.html).toContain('alt="Welcome to DevQuake"');
    expect(mail.html).toContain('Activate my account');
    // Button + plain-text fallback both link to the activation URL.
    expect(mail.html.split(`href="${url}"`).length - 1).toBe(2);
    expect(mail.html).toContain('Ana &lt;b&gt;');
    expect(mail.text).toContain(url);
    expect(mail.text).toContain('48 hours');
  });

  it('every email shows the logo image with alt text', () => {
    const mail = signInCodeEmail({
      siteUrl,
      name: 'Ana',
      code: '123456',
      minutes: 10,
      context: { location: null, device: null, vpn: null },
      forAdmin: false,
    });
    expect(mail.html).toContain(`src="${siteUrl}/brand/email-logo.png"`);
    expect(mail.html).toContain('alt="DevQuake"');
    expect(mail.html).not.toContain('email-welcome.png');
  });

  it('invitation: names the inviter (escaped), links the invite and shows the QR image', () => {
    const inviteUrl = 'https://devquake.com/r/ABCD2345';
    const qrUrl = 'https://devquake.com/r/ABCD2345/qr';
    const mail = referralInviteEmail({
      siteUrl,
      inviterName: 'Eve <script>',
      inviteUrl,
      qrUrl,
    });
    expect(mail.subject).toBe('Eve <script> invited you to DevQuake');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('Eve &lt;script&gt;');
    expect(mail.html).toContain(`src="${qrUrl}"`);
    expect(mail.html.split(`href="${inviteUrl}"`).length - 1).toBe(2);
    expect(mail.text).toContain(inviteUrl);
  });
});

describe('emails in the recipient language (ADR 0011)', () => {
  it('writes the whole email, links and banner in that language', () => {
    const url = 'https://devquake.com/de/activate?token=abc';
    const mail = welcomeActivationEmail({
      siteUrl,
      name: 'Ana',
      activationUrl: url,
      hours: 48,
      locale: 'de',
    });
    expect(mail.subject).toBe('Willkommen bei DevQuake — aktiviere dein Konto');
    expect(mail.html).toContain('<html lang="de">');
    expect(mail.html).toContain('/brand/email-welcome-de.png');
    expect(mail.html).toContain('Mein Konto aktivieren');
    expect(mail.text).toContain('Das DevQuake-Team');
    expect(mail.text).not.toContain('The DevQuake team');
  });

  it('words account changes in the member language', () => {
    const mail = accountChangedEmail({
      siteUrl,
      name: 'Ana',
      changes: [
        { kind: 'projectAdded', project: 'Bills', projectRole: 'manager' },
        { kind: 'roleGranted', role: 'x', adminRole: true },
      ],
      isAdmin: true,
      adminUrl: `${siteUrl}/admin-cp`,
      projects: [],
      disabled: false,
      locale: 'ro',
    });
    expect(mail.text).toContain('Adăugat la proiectul Bills ca manager');
    expect(mail.text).toContain('Administrator (acces la panoul de control)');
    // Links to the member's pages open in their language; the control panel stays English.
    expect(mail.html).toContain('https://devquake.com/ro/account');
    expect(mail.html).toContain('https://devquake.com/admin-cp');
  });

  it('keeps English as the default', () => {
    const mail = signInCodeEmail({
      siteUrl,
      name: 'Ana',
      code: '654321',
      minutes: 10,
      context: { location: null, device: null, vpn: null },
      forAdmin: false,
    });
    expect(mail.subject).toBe('654321 is your DevQuake sign-in code');
  });
});
