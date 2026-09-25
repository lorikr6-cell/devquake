import { defineMessages } from '../define';

/**
 * The privacy policy. Every language version is equally valid (ADR 0011): change all four
 * together, and have translations reviewed by a qualified person.
 */
export const privacy = defineMessages(
  {
    metaTitle: 'Privacy policy',
    metaDescription: 'What personal data DevQuake collects, why, for how long, and your rights.',
    title: 'Privacy policy',
    updated: 'Last updated {date}',
    intro:
      'This page explains what personal data devquake.com and its apps on *.devquake.com collect, why, how long we keep it, and what you can ask us to do with it. In short: we collect what we need to run your account and keep it safe, we never sell data, and analytics only run if you say yes.',
    versions:
      'This policy is available in English, German, Romanian and Hungarian; every language version is equally valid.',
    contents: 'Contents',
    toc: {
      who: 'Who is responsible',
      what: 'What we collect and why',
      cookies: 'Cookies',
      recipients: 'Who else processes data',
      retention: 'How long we keep it',
      rights: 'Your rights',
      security: 'Security',
      changes: 'Changes',
    },
    who: {
      body: 'The controller of your personal data is {controller}{address}. For anything related to your data, write to {email}.',
      fallback: 'the operator of devquake.com',
    },
    what: {
      head: { data: 'Data', when: 'When', why: 'Why', basis: 'Legal basis (GDPR)' },
      account: {
        data: 'Name, email address, password (stored only as a one-way scrypt hash)',
        when: 'When you create an account',
        why: 'To give you an account and sign you in',
        basis: 'Contract (Art. 6(1)(b))',
      },
      language: {
        data: 'Your language (English, German, Romanian or Hungarian), and the preferred language you chose in your profile',
        when: 'When you use the site in a language or pick one',
        why: 'To show the site and send you emails in your language',
        basis: 'Contract (Art. 6(1)(b))',
      },
      roles: {
        data: 'Roles, projects you subscribed to, projects the owner assigned to you, and an internal rating set by the site owner',
        when: 'When the owner configures your account',
        why: 'To give you access to the right apps and manage the community',
        basis: 'Contract; legitimate interest (Art. 6(1)(f))',
      },
      ideas: {
        data: 'Ideas you share (title, description, the project, an optional picture), your votes and your comments on ideas',
        when: 'When you share an idea, vote or comment',
        why: 'To collect and discuss ideas for new apps. Public ideas and comments show your name to signed-in members; private ideas only to you',
        basis: 'Contract (Art. 6(1)(b)); legitimate interest for moderation (Art. 6(1)(f))',
      },
      feedback: {
        data: 'Projects you liked and your ratings of them (quality and usefulness, 1 to 5 stars)',
        when: 'When you like or rate a project',
        why: 'To show which projects people find useful and decide what to build next; only totals and averages are shown publicly',
        basis: 'Legitimate interest (Art. 6(1)(f))',
      },
      codes: {
        data: 'One-time sign-in codes (stored only as a hash, valid {minutes} minutes) and account activation links (stored only as a hash, valid 48 hours)',
        when: 'Every sign-in, and once when you create an account',
        why: 'To confirm it is really you',
        basis: 'Contract; legitimate interest in security',
      },
      signins: {
        data: 'Sign-in details: date and time, IP address, approximate location of the IP (country, region, city), internet provider, whether the IP belongs to a VPN or proxy (and its provider), browser, operating system, device type, and your browser’s time zone, language and screen size',
        when: 'Every sign-up, sign-in and code entry, successful or not',
        why: 'To detect and stop account takeovers, lock an account for {hours} hours after 3 wrong passwords in a row, show you your recent sign-ins, and produce security statistics',
        basis: 'Legitimate interest in keeping accounts and the site secure',
      },
      contact: {
        data: 'Name, email address, subject, message, IP address and browser, and our replies to it. Signed in, your account’s name and email are used, and you see your messages and our replies on your account, where you can delete them',
        when: 'When you use the contact form or write from your account',
        why: 'To answer you (on your account and by email) and to block spam',
        basis: 'Legitimate interest in answering enquiries; pre-contract steps where relevant',
      },
      emails: {
        data: 'Log of emails we sent you (type, time, delivery status; not the content)',
        when: 'When we email you',
        why: 'To troubleshoot delivery and prove security notices were sent',
        basis: 'Legitimate interest',
      },
      activity: {
        data: 'Activity log of actions on the site (for example sign-ins, account changes, errors), with IP address and browser',
        when: 'While you use the site',
        why: 'Security, troubleshooting and abuse prevention',
        basis: 'Legitimate interest',
      },
      profile: {
        data: 'Profile picture (optional, 256x256), your personal invitation code and NPS score, who invited you, and the email addresses you invite',
        when: 'When you upload a picture, share your link or send an invitation',
        why: 'Your profile, and the invitation feature you use (the invited person gets one email naming you)',
        basis: 'Contract; legitimate interest in letting members invite people',
      },
      visits: {
        data: 'Anonymous visit counts: a daily visitor number derived from your IP address and browser with a random salt that is deleted the next day; only daily totals are kept',
        when: 'Each page view on devquake.com',
        why: 'To show how many people visit (also on the landing page)',
        basis: 'Legitimate interest; no cookies, and nobody can be identified from what is stored',
      },
      analytics: {
        data: 'Usage statistics via Google Analytics (pages viewed, which app you use, which app features are used such as “list created” or “product added” without any names or contents, approximate location, device, a random identifier in a cookie)',
        when: 'Only if you click “Accept analytics”',
        why: 'To understand which pages are useful and improve the site',
        basis: 'Consent (Art. 6(1)(a)), which you can withdraw any time',
      },
      reset: {
        data: 'Password-reset links (stored only as a hash, valid 60 minutes), the time and IP address of each request',
        when: 'When you use “Forgot your password?”',
        why: 'To let you choose a new password and to stop abuse of the reset form',
        basis: 'Contract; legitimate interest in security',
      },
      trials: {
        data: 'Which apps you tried for free and when the 24-hour trial started and ended',
        when: 'When you start a free trial of an app',
        why: 'To open the app for you for 24 hours, only once, and to delete what you created in it if you do not subscribe',
        basis: 'Contract (Art. 6(1)(b))',
      },
      themes: {
        data: 'Your custom themes (name, colours, fonts), the members you shared them with, and the theme you last chose',
        when: 'When you create or share a theme',
        why: 'To show the site in your theme on every device you sign in on, and let the people you chose use it; they see the theme and your name',
        basis: 'Contract (Art. 6(1)(b))',
      },
      note: 'We cannot see your device’s MAC address or, if you use a VPN, your real location: we only see the VPN server. We do not use your data for advertising, we do not sell it, and we make no automated decisions about you other than the temporary security lock described above.',
    },
    cookies: {
      head: { cookie: 'Cookie', purpose: 'Purpose', duration: 'Duration', type: 'Type' },
      session: 'Keeps you signed in on devquake.com and its apps (*.devquake.com)',
      sessionDuration: 'Up to {hours} hours',
      challenge: 'Links a sign-in to the code we emailed',
      minutes: '{count} minutes',
      consent: 'Remembers your analytics choice on all *.devquake.com sites',
      theme:
        'Remembers the colour theme you picked (Light, Dark or one of your custom themes, by its number) on all *.devquake.com sites; not set for Adaptive',
      reset: 'Keeps a password-reset link while you choose the new password',
      lang: 'Remembers your language on all *.devquake.com sites',
      timeZone:
        'Your device’s time zone (e.g. Europe/Bucharest), so dates and times are shown in your local time on all *.devquake.com sites',
      sidenav: 'Remembers whether you collapsed the sidebar of your account pages',
      ga: 'Google Analytics: distinguishes visitors',
      gaSession: 'Google Analytics: keeps the session state',
      necessary: 'Strictly necessary',
      functionalTheme: 'Functional, set only when you pick a theme',
      functional: 'Functional',
      analytics: 'Analytics, only with consent',
      note: 'Strictly necessary cookies do not need consent. Google Analytics does not load at all until you accept, advertising features are switched off, and declining deletes its cookies. You can change your choice at any time: {button}.',
    },
    recipients: {
      intro: 'We only share data with service providers that help us run the site:',
      hostinger:
        '{name} hosts the website, the database and our email, so all data above is stored on its servers.',
      proxycheck:
        '{name} receives the IP address of each sign-up and sign-in and returns its approximate location, provider and whether it is a VPN or proxy.',
      google:
        '{name} (Google Analytics) receives usage data only if you accept analytics. Google may process it outside the EU, including in the United States under the EU–US Data Privacy Framework.',
      law: 'We may also disclose data where the law requires it, or to protect the site and its users against fraud or abuse.',
    },
    retention: {
      intro: 'Old data is deleted automatically once a day after these periods:',
      head: { data: 'Data', kept: 'Kept for' },
      account:
        'Your account, picture, language, roles, subscriptions, likes, ratings, invitations, and your ideas, votes and comments',
      accountKept:
        'Until you delete your account (Your account → Delete account) or ask us to. The site owner may remove accounts that have not been used for a long time; you get an email when that happens.',
      apps: 'What you created in an app (for example your shopping lists)',
      appsKept:
        'Until you unsubscribe from that app or delete your account; shared content stays with the other people, without your name',
      trials: 'What you created in an app during a free trial, if you did not subscribe',
      trialsKept: '{days} days after the trial ended',
      themes: 'Your custom themes and who you shared them with',
      themesKept: 'Until you delete the theme or your account',
      invites: 'Addresses you invited who never joined',
      pending: 'Accounts whose email was never confirmed',
      signins: 'Sign-in activity (sign-in details and snapshots)',
      activity: 'Your account activity (sign-ins, subscriptions, changes to your account)',
      attempts: 'Password attempts used for lockouts',
      log: 'Other activity log entries',
      logKept: '{period} (security events {security})',
      sessions: 'Expired sessions, one-time codes, activation and password-reset links',
      emails: 'Record of emails sent',
      contact: 'Contact-form messages and our replies',
      visitors: 'Anonymous visitor hashes and their daily salt',
      visitorsKept: '1 day (only daily totals remain)',
      ga: 'Google Analytics data',
      gaKept: 'Per the retention set in Google Analytics (at most 14 months)',
    },
    rights: {
      intro: 'Under the GDPR you can ask us to:',
      access: 'give you a copy of your personal data (access and portability);',
      correct: 'correct it if it is wrong;',
      delete:
        'delete it, including your whole account (you can do this yourself: Your account → Delete account);',
      restrict:
        'restrict or object to how we use it, including processing based on legitimate interest;',
      withdraw: 'withdraw your analytics consent at any time (with “Cookie settings”).',
      contact:
        'Email {email} from the address on your account. We answer within one month. If you are not satisfied, you can complain to the data protection authority of the EU country where you live or work.',
    },
    security:
      'Passwords are hashed with scrypt, sign-in codes and session tokens are stored only as hashes, every sign-in needs a code sent to your email, connections use HTTPS, and repeated failed sign-ins lock the account temporarily and notify you. Access to user data is limited to the site owner.',
    changes:
      'We update this page when what we collect or why changes, and show the date at the top. For significant changes we will also email account holders.',
  },
  {
    de: {
      metaTitle: 'Datenschutzerklärung',
      metaDescription:
        'Welche personenbezogenen Daten DevQuake erhebt, warum, wie lange, und welche Rechte du hast.',
      title: 'Datenschutzerklärung',
      updated: 'Zuletzt aktualisiert am {date}',
      intro:
        'Diese Seite erklärt, welche personenbezogenen Daten devquake.com und seine Apps auf *.devquake.com erheben, warum, wie lange wir sie aufbewahren und was du von uns verlangen kannst. Kurz gesagt: Wir erheben, was wir brauchen, um dein Konto zu betreiben und zu schützen, wir verkaufen niemals Daten, und Analysen laufen nur, wenn du zustimmst.',
      versions:
        'Diese Erklärung ist auf Englisch, Deutsch, Rumänisch und Ungarisch verfügbar; jede Sprachfassung ist gleichermaßen verbindlich.',
      contents: 'Inhalt',
      toc: {
        who: 'Verantwortlicher',
        what: 'Welche Daten wir erheben und warum',
        cookies: 'Cookies',
        recipients: 'Wer Daten außerdem verarbeitet',
        retention: 'Wie lange wir Daten speichern',
        rights: 'Deine Rechte',
        security: 'Sicherheit',
        changes: 'Änderungen',
      },
      who: {
        body: 'Verantwortlicher für deine personenbezogenen Daten ist {controller}{address}. Bei allen Fragen zu deinen Daten schreibe an {email}.',
        fallback: 'der Betreiber von devquake.com',
      },
      what: {
        head: {
          data: 'Daten',
          when: 'Wann',
          why: 'Warum',
          basis: 'Rechtsgrundlage (DSGVO)',
        },
        account: {
          data: 'Name, E-Mail-Adresse, Passwort (nur als nicht umkehrbarer scrypt-Hash gespeichert)',
          when: 'Wenn du ein Konto erstellst',
          why: 'Um dir ein Konto zu geben und dich anzumelden',
          basis: 'Vertrag (Art. 6 Abs. 1 lit. b)',
        },
        language: {
          data: 'Deine Sprache (Englisch, Deutsch, Rumänisch oder Ungarisch) und die bevorzugte Sprache, die du in deinem Profil gewählt hast',
          when: 'Wenn du die Website in einer Sprache nutzt oder eine auswählst',
          why: 'Um dir die Website anzuzeigen und E-Mails in deiner Sprache zu senden',
          basis: 'Vertrag (Art. 6 Abs. 1 lit. b)',
        },
        roles: {
          data: 'Rollen, von dir abonnierte Projekte, vom Inhaber dir zugewiesene Projekte und eine interne Bewertung durch den Inhaber der Website',
          when: 'Wenn der Inhaber dein Konto einrichtet',
          why: 'Um dir Zugang zu den richtigen Apps zu geben und die Community zu verwalten',
          basis: 'Vertrag; berechtigtes Interesse (Art. 6 Abs. 1 lit. f)',
        },
        ideas: {
          data: 'Ideen, die du teilst (Titel, Beschreibung, das Projekt, ein optionales Bild), deine Stimmen und deine Kommentare zu Ideen',
          when: 'Wenn du eine Idee teilst, abstimmst oder kommentierst',
          why: 'Um Ideen für neue Apps zu sammeln und zu diskutieren. Öffentliche Ideen und Kommentare zeigen angemeldeten Mitgliedern deinen Namen, private Ideen nur dir',
          basis:
            'Vertrag (Art. 6 Abs. 1 lit. b); berechtigtes Interesse an der Moderation (Art. 6 Abs. 1 lit. f)',
        },
        feedback: {
          data: 'Projekte, die dir gefallen, und deine Bewertungen (Qualität und Nützlichkeit, 1 bis 5 Sterne)',
          when: 'Wenn du ein Projekt likst oder bewertest',
          why: 'Um zu zeigen, welche Projekte als nützlich empfunden werden, und zu entscheiden, was als Nächstes gebaut wird; öffentlich werden nur Summen und Durchschnitte angezeigt',
          basis: 'Berechtigtes Interesse (Art. 6 Abs. 1 lit. f)',
        },
        codes: {
          data: 'Einmal-Anmeldecodes (nur als Hash gespeichert, {minutes} Minuten gültig) und Links zur Kontoaktivierung (nur als Hash gespeichert, 48 Stunden gültig)',
          when: 'Bei jeder Anmeldung und einmal bei der Kontoerstellung',
          why: 'Um zu bestätigen, dass wirklich du es bist',
          basis: 'Vertrag; berechtigtes Interesse an der Sicherheit',
        },
        signins: {
          data: 'Anmeldedaten: Datum und Uhrzeit, IP-Adresse, ungefährer Standort der IP (Land, Region, Stadt), Internetanbieter, ob die IP zu einem VPN oder Proxy gehört (und dessen Anbieter), Browser, Betriebssystem, Gerätetyp sowie Zeitzone, Sprache und Bildschirmgröße deines Browsers',
          when: 'Bei jeder Registrierung, Anmeldung und Codeeingabe, erfolgreich oder nicht',
          why: 'Um Kontoübernahmen zu erkennen und zu verhindern, ein Konto nach 3 falschen Passwörtern in Folge für {hours} Stunden zu sperren, dir deine letzten Anmeldungen zu zeigen und Sicherheitsstatistiken zu erstellen',
          basis: 'Berechtigtes Interesse an der Sicherheit der Konten und der Website',
        },
        contact: {
          data: 'Name, E-Mail-Adresse, Betreff, Nachricht, IP-Adresse und Browser sowie unsere Antworten darauf. Angemeldet werden Name und E-Mail-Adresse deines Kontos verwendet, und du siehst deine Nachrichten und unsere Antworten in deinem Konto, wo du sie löschen kannst',
          when: 'Wenn du das Kontaktformular nutzt oder aus deinem Konto schreibst',
          why: 'Um dir zu antworten (in deinem Konto und per E-Mail) und Spam abzuwehren',
          basis:
            'Berechtigtes Interesse an der Beantwortung von Anfragen; gegebenenfalls vorvertragliche Maßnahmen',
        },
        emails: {
          data: 'Protokoll der E-Mails, die wir dir gesendet haben (Art, Zeit, Zustellstatus; nicht der Inhalt)',
          when: 'Wenn wir dir eine E-Mail senden',
          why: 'Um Zustellprobleme zu beheben und den Versand von Sicherheitshinweisen nachzuweisen',
          basis: 'Berechtigtes Interesse',
        },
        activity: {
          data: 'Aktivitätsprotokoll der Aktionen auf der Website (zum Beispiel Anmeldungen, Kontoänderungen, Fehler) mit IP-Adresse und Browser',
          when: 'Während du die Website nutzt',
          why: 'Sicherheit, Fehlerbehebung und Missbrauchsvorbeugung',
          basis: 'Berechtigtes Interesse',
        },
        profile: {
          data: 'Profilbild (optional, 256x256), dein persönlicher Einladungscode und NPS-Wert, wer dich eingeladen hat und die E-Mail-Adressen, die du einlädst',
          when: 'Wenn du ein Bild hochlädst, deinen Link teilst oder eine Einladung sendest',
          why: 'Dein Profil und die Einladungsfunktion, die du nutzt (die eingeladene Person erhält eine E-Mail mit deinem Namen)',
          basis: 'Vertrag; berechtigtes Interesse daran, Mitgliedern das Einladen zu ermöglichen',
        },
        visits: {
          data: 'Anonyme Besuchszählung: eine tägliche Besuchernummer, abgeleitet aus IP-Adresse und Browser mit einem zufälligen Salt, das am nächsten Tag gelöscht wird; nur Tagessummen werden aufbewahrt',
          when: 'Bei jedem Seitenaufruf auf devquake.com',
          why: 'Um zu zeigen, wie viele Menschen die Website besuchen (auch auf der Startseite)',
          basis:
            'Berechtigtes Interesse; keine Cookies, und aus den gespeicherten Daten kann niemand identifiziert werden',
        },
        analytics: {
          data: 'Nutzungsstatistiken über Google Analytics (aufgerufene Seiten, welche App du nutzt, welche App-Funktionen genutzt werden, etwa „Liste erstellt“ oder „Produkt hinzugefügt“, ohne Namen oder Inhalte, ungefährer Standort, Gerät, eine Zufallskennung in einem Cookie)',
          when: 'Nur wenn du auf „Analyse erlauben“ klickst',
          why: 'Um zu verstehen, welche Seiten nützlich sind, und die Website zu verbessern',
          basis: 'Einwilligung (Art. 6 Abs. 1 lit. a), die du jederzeit widerrufen kannst',
        },
        reset: {
          data: 'Links zum Zurücksetzen des Passworts (nur als Hash gespeichert), Zeit und IP-Adresse jeder Anfrage',
          when: 'Wenn du „Passwort vergessen?“ nutzt',
          why: 'Damit du ein neues Passwort wählen kannst und um Missbrauch des Formulars zu verhindern',
          basis: 'Vertrag; berechtigtes Interesse an Sicherheit',
        },
        trials: {
          data: 'Welche Apps du kostenlos getestet hast und wann die 24-stündige Testphase begann und endete',
          when: 'Wenn du eine kostenlose Testphase einer App startest',
          why: 'Um dir die App 24 Stunden lang zu öffnen, nur einmal, und um zu löschen, was du darin erstellt hast, wenn du nicht abonnierst',
          basis: 'Vertrag (Art. 6 Abs. 1 lit. b)',
        },
        themes: {
          data: 'Deine eigenen Designs (Name, Farben, Schriften), die Mitglieder, mit denen du sie geteilt hast, und das zuletzt gewählte Design',
          when: 'Wenn du ein Design erstellst oder teilst',
          why: 'Um die Website auf jedem Gerät, auf dem du dich anmeldest, in deinem Design zu zeigen und den gewählten Personen die Nutzung zu ermöglichen; sie sehen das Design und deinen Namen',
          basis: 'Vertrag (Art. 6 Abs. 1 lit. b)',
        },
        note: 'Wir können weder die MAC-Adresse deines Geräts sehen noch, wenn du ein VPN nutzt, deinen tatsächlichen Standort: Wir sehen nur den VPN-Server. Wir nutzen deine Daten nicht für Werbung, verkaufen sie nicht und treffen keine automatisierten Entscheidungen über dich, außer der oben beschriebenen vorübergehenden Sicherheitssperre.',
      },
      cookies: {
        head: { cookie: 'Cookie', purpose: 'Zweck', duration: 'Dauer', type: 'Art' },
        session: 'Hält dich auf devquake.com und seinen Apps (*.devquake.com) angemeldet',
        sessionDuration: 'Bis zu {hours} Stunden',
        challenge: 'Verknüpft eine Anmeldung mit dem per E-Mail gesendeten Code',
        minutes: '{count} Minuten',
        consent: 'Speichert deine Entscheidung zur Analyse auf allen *.devquake.com-Websites',
        theme:
          'Speichert das gewählte Farbdesign (Hell, Dunkel oder eines deiner eigenen Designs, über seine Nummer) auf allen *.devquake.com-Websites; bei „Automatisch“ nicht gesetzt',
        reset: 'Hält einen Link zum Zurücksetzen des Passworts, während du das neue wählst',
        lang: 'Speichert deine Sprache auf allen *.devquake.com-Websites',
        timeZone:
          'Die Zeitzone deines Geräts (z. B. Europe/Bucharest), damit Datum und Uhrzeit auf allen *.devquake.com-Websites in deiner Ortszeit angezeigt werden',
        sidenav: 'Speichert, ob du die Seitenleiste deiner Kontoseiten eingeklappt hast',
        ga: 'Google Analytics: unterscheidet Besucher',
        gaSession: 'Google Analytics: speichert den Sitzungsstatus',
        necessary: 'Unbedingt erforderlich',
        functionalTheme: 'Funktional, nur gesetzt, wenn du ein Design wählst',
        functional: 'Funktional',
        analytics: 'Analyse, nur mit Einwilligung',
        note: 'Unbedingt erforderliche Cookies benötigen keine Einwilligung. Google Analytics wird erst geladen, wenn du zustimmst, Werbefunktionen sind ausgeschaltet, und eine Ablehnung löscht seine Cookies. Du kannst deine Wahl jederzeit ändern: {button}.',
      },
      recipients: {
        intro:
          'Wir geben Daten nur an Dienstleister weiter, die uns beim Betrieb der Website helfen:',
        hostinger:
          '{name} hostet die Website, die Datenbank und unsere E-Mails, daher werden alle oben genannten Daten auf seinen Servern gespeichert.',
        proxycheck:
          '{name} erhält die IP-Adresse jeder Registrierung und Anmeldung und gibt deren ungefähren Standort, den Anbieter und die Angabe zurück, ob es sich um ein VPN oder einen Proxy handelt.',
        google:
          '{name} (Google Analytics) erhält Nutzungsdaten nur, wenn du der Analyse zustimmst. Google kann sie außerhalb der EU verarbeiten, auch in den Vereinigten Staaten auf Grundlage des EU-US Data Privacy Framework.',
        law: 'Wir können Daten außerdem offenlegen, wenn das Gesetz es verlangt, oder um die Website und ihre Nutzer vor Betrug oder Missbrauch zu schützen.',
      },
      retention: {
        intro: 'Alte Daten werden nach diesen Fristen einmal täglich automatisch gelöscht:',
        head: { data: 'Daten', kept: 'Gespeichert für' },
        account:
          'Dein Konto, Bild, deine Sprache, Rollen, Abos, Likes, Bewertungen, Einladungen sowie deine Ideen, Stimmen und Kommentare',
        accountKept:
          'Bis du dein Konto löschst (Dein Konto → Konto löschen) oder uns darum bittest. Der Inhaber der Website kann Konten entfernen, die lange nicht genutzt wurden; du erhältst dann eine E-Mail.',
        apps: 'Was du in einer App erstellt hast (zum Beispiel deine Einkaufslisten)',
        appsKept:
          'Bis du das Abo dieser App beendest oder dein Konto löschst; geteilte Inhalte bleiben bei den anderen Personen, ohne deinen Namen',
        trials:
          'Was du während einer kostenlosen Testphase in einer App erstellt hast, wenn du nicht abonniert hast',
        trialsKept: '{days} Tage nach dem Ende der Testphase',
        themes: 'Deine eigenen Designs und mit wem du sie geteilt hast',
        themesKept: 'Bis du das Design oder dein Konto löschst',
        invites: 'Eingeladene Adressen, die nie beigetreten sind',
        pending: 'Konten, deren E-Mail-Adresse nie bestätigt wurde',
        signins: 'Anmeldeaktivität (Anmeldedaten und Momentaufnahmen)',
        activity: 'Deine Kontoaktivität (Anmeldungen, Abos, Änderungen an deinem Konto)',
        attempts: 'Passwortversuche für Sperren',
        log: 'Sonstige Einträge im Aktivitätsprotokoll',
        logKept: '{period} (Sicherheitsereignisse {security})',
        sessions: 'Abgelaufene Sitzungen, Einmalcodes, Aktivierungs- und Passwort-Links',
        emails: 'Protokoll gesendeter E-Mails',
        contact: 'Nachrichten aus dem Kontaktformular und unsere Antworten',
        visitors: 'Anonyme Besucher-Hashes und ihr tägliches Salt',
        visitorsKept: '1 Tag (nur Tagessummen bleiben)',
        ga: 'Google-Analytics-Daten',
        gaKept: 'Gemäß der in Google Analytics eingestellten Speicherdauer (höchstens 14 Monate)',
      },
      rights: {
        intro: 'Nach der DSGVO kannst du von uns verlangen:',
        access:
          'dir eine Kopie deiner personenbezogenen Daten zu geben (Auskunft und Übertragbarkeit);',
        correct: 'sie zu berichtigen, wenn sie falsch sind;',
        delete:
          'sie zu löschen, einschließlich deines gesamten Kontos (das kannst du selbst tun: Dein Konto → Konto löschen);',
        restrict:
          'ihre Verarbeitung einzuschränken oder ihr zu widersprechen, auch einer Verarbeitung aufgrund berechtigten Interesses;',
        withdraw:
          'deine Einwilligung zur Analyse jederzeit zu widerrufen (über „Cookie-Einstellungen“).',
        contact:
          'Schreibe eine E-Mail an {email} von der Adresse deines Kontos. Wir antworten innerhalb eines Monats. Wenn du nicht zufrieden bist, kannst du dich bei der Datenschutzaufsichtsbehörde des EU-Landes beschweren, in dem du lebst oder arbeitest.',
      },
      security:
        'Passwörter werden mit scrypt gehasht, Anmeldecodes und Sitzungstoken werden nur als Hashes gespeichert, jede Anmeldung erfordert einen an deine E-Mail-Adresse gesendeten Code, Verbindungen nutzen HTTPS, und wiederholte fehlgeschlagene Anmeldungen sperren das Konto vorübergehend und benachrichtigen dich. Der Zugriff auf Nutzerdaten ist auf den Inhaber der Website beschränkt.',
      changes:
        'Wir aktualisieren diese Seite, wenn sich ändert, was wir erheben oder warum, und zeigen das Datum oben an. Bei wesentlichen Änderungen informieren wir Kontoinhaber auch per E-Mail.',
    },
    ro: {
      metaTitle: 'Politica de confidențialitate',
      metaDescription:
        'Ce date personale colectează DevQuake, de ce, pentru cât timp și care sunt drepturile tale.',
      title: 'Politica de confidențialitate',
      updated: 'Ultima actualizare: {date}',
      intro:
        'Această pagină explică ce date personale colectează devquake.com și aplicațiile sale de pe *.devquake.com, de ce, cât timp le păstrăm și ce ne poți cere să facem cu ele. Pe scurt: colectăm ce ne trebuie ca să îți administrăm contul și să-l protejăm, nu vindem niciodată date, iar statisticile rulează doar dacă ești de acord.',
      versions:
        'Această politică este disponibilă în engleză, germană, română și maghiară; fiecare versiune lingvistică este la fel de valabilă.',
      contents: 'Cuprins',
      toc: {
        who: 'Cine este responsabil',
        what: 'Ce colectăm și de ce',
        cookies: 'Cookie-uri',
        recipients: 'Cine mai prelucrează date',
        retention: 'Cât timp le păstrăm',
        rights: 'Drepturile tale',
        security: 'Securitate',
        changes: 'Modificări',
      },
      who: {
        body: 'Operatorul datelor tale personale este {controller}{address}. Pentru orice legat de datele tale, scrie-ne la {email}.',
        fallback: 'operatorul devquake.com',
      },
      what: {
        head: { data: 'Date', when: 'Când', why: 'De ce', basis: 'Temei juridic (RGPD)' },
        account: {
          data: 'Nume, adresă de e-mail, parolă (stocată doar ca hash scrypt ireversibil)',
          when: 'Când îți creezi un cont',
          why: 'Ca să îți oferim un cont și să te autentificăm',
          basis: 'Contract (art. 6 alin. (1) lit. (b))',
        },
        language: {
          data: 'Limba ta (engleză, germană, română sau maghiară) și limba preferată aleasă în profil',
          when: 'Când folosești site-ul într-o limbă sau alegi una',
          why: 'Ca să îți afișăm site-ul și să îți trimitem e-mailuri în limba ta',
          basis: 'Contract (art. 6 alin. (1) lit. (b))',
        },
        roles: {
          data: 'Roluri, proiectele la care te-ai abonat, proiectele atribuite ție de proprietar și o evaluare internă stabilită de proprietarul site-ului',
          when: 'Când proprietarul îți configurează contul',
          why: 'Ca să îți oferim acces la aplicațiile potrivite și să administrăm comunitatea',
          basis: 'Contract; interes legitim (art. 6 alin. (1) lit. (f))',
        },
        ideas: {
          data: 'Ideile pe care le propui (titlu, descriere, proiectul, o imagine opțională), voturile tale și comentariile tale la idei',
          when: 'Când propui o idee, votezi sau comentezi',
          why: 'Ca să adunăm și să discutăm idei pentru aplicații noi. Ideile și comentariile publice îți arată numele membrilor autentificați; ideile private doar ție',
          basis:
            'Contract (art. 6 alin. (1) lit. (b)); interes legitim pentru moderare (art. 6 alin. (1) lit. (f))',
        },
        feedback: {
          data: 'Proiectele pe care le-ai apreciat și evaluările tale (calitate și utilitate, 1 până la 5 stele)',
          when: 'Când apreciezi sau evaluezi un proiect',
          why: 'Ca să arătăm ce proiecte consideră oamenii utile și să decidem ce construim în continuare; public se afișează doar totaluri și medii',
          basis: 'Interes legitim (art. 6 alin. (1) lit. (f))',
        },
        codes: {
          data: 'Coduri unice de autentificare (stocate doar ca hash, valabile {minutes} minute) și linkuri de activare a contului (stocate doar ca hash, valabile 48 de ore)',
          when: 'La fiecare autentificare și o dată la crearea contului',
          why: 'Ca să confirmăm că ești chiar tu',
          basis: 'Contract; interes legitim privind securitatea',
        },
        signins: {
          data: 'Detalii de autentificare: data și ora, adresa IP, locația aproximativă a IP-ului (țară, regiune, oraș), furnizorul de internet, dacă IP-ul aparține unui VPN sau proxy (și furnizorul acestuia), browserul, sistemul de operare, tipul dispozitivului și fusul orar, limba și dimensiunea ecranului browserului tău',
          when: 'La fiecare înregistrare, autentificare și introducere de cod, reușită sau nu',
          why: 'Ca să detectăm și să oprim preluările de conturi, să blocăm un cont pentru {hours} ore după 3 parole greșite la rând, să îți arătăm autentificările recente și să realizăm statistici de securitate',
          basis: 'Interes legitim privind securitatea conturilor și a site-ului',
        },
        contact: {
          data: 'Nume, adresă de e-mail, subiect, mesaj, adresă IP și browser, precum și răspunsurile noastre. Când ești autentificat se folosesc numele și e-mailul contului, iar mesajele și răspunsurile noastre le vezi în contul tău, unde le poți șterge',
          when: 'Când folosești formularul de contact sau scrii din contul tău',
          why: 'Ca să îți răspundem (în cont și pe e-mail) și să blocăm spamul',
          basis: 'Interes legitim de a răspunde solicitărilor; demersuri precontractuale, după caz',
        },
        emails: {
          data: 'Jurnalul e-mailurilor pe care ți le-am trimis (tip, oră, stare de livrare; nu conținutul)',
          when: 'Când îți trimitem un e-mail',
          why: 'Ca să rezolvăm problemele de livrare și să dovedim că notificările de securitate au fost trimise',
          basis: 'Interes legitim',
        },
        activity: {
          data: 'Jurnalul acțiunilor de pe site (de exemplu autentificări, modificări ale contului, erori), cu adresa IP și browserul',
          when: 'Cât timp folosești site-ul',
          why: 'Securitate, depanare și prevenirea abuzurilor',
          basis: 'Interes legitim',
        },
        profile: {
          data: 'Poza de profil (opțională, 256x256), codul tău personal de invitație și scorul NPS, cine te-a invitat și adresele de e-mail pe care le inviți',
          when: 'Când încarci o poză, îți distribui linkul sau trimiți o invitație',
          why: 'Profilul tău și funcția de invitații pe care o folosești (persoana invitată primește un singur e-mail cu numele tău)',
          basis: 'Contract; interes legitim de a le permite membrilor să invite persoane',
        },
        visits: {
          data: 'Numărarea anonimă a vizitelor: un număr zilnic de vizitator derivat din adresa IP și browser cu o valoare aleatorie (salt) care se șterge a doua zi; se păstrează doar totalurile zilnice',
          when: 'La fiecare afișare de pagină pe devquake.com',
          why: 'Ca să arătăm câți oameni vizitează site-ul (inclusiv pe pagina principală)',
          basis:
            'Interes legitim; fără cookie-uri, iar din ce se stochează nimeni nu poate fi identificat',
        },
        analytics: {
          data: 'Statistici de utilizare prin Google Analytics (pagini vizualizate, ce aplicație folosești, ce funcții ale aplicațiilor sunt folosite, cum ar fi „listă creată” sau „produs adăugat”, fără nume sau conținut, locația aproximativă, dispozitivul, un identificator aleatoriu într-un cookie)',
          when: 'Doar dacă apeși „Accept statisticile”',
          why: 'Ca să înțelegem ce pagini sunt utile și să îmbunătățim site-ul',
          basis: 'Consimțământ (art. 6 alin. (1) lit. (a)), pe care îl poți retrage oricând',
        },
        reset: {
          data: 'Linkuri de resetare a parolei (stocate doar ca hash), ora și adresa IP a fiecărei cereri',
          when: 'Când folosești „Ai uitat parola?”',
          why: 'Ca să poți alege o parolă nouă și pentru a opri abuzul formularului de resetare',
          basis: 'Contract; interes legitim privind securitatea',
        },
        trials: {
          data: 'Aplicațiile pe care le-ai încercat gratuit și când a început și s-a încheiat perioada de probă de 24 de ore',
          when: 'Când pornești o perioadă de probă gratuită a unei aplicații',
          why: 'Ca să-ți deschidem aplicația 24 de ore, o singură dată, și să ștergem ce ai creat în ea dacă nu te abonezi',
          basis: 'Contract (art. 6 alin. (1) lit. (b))',
        },
        themes: {
          data: 'Temele tale personalizate (nume, culori, fonturi), membrii cu care le-ai partajat și tema aleasă ultima dată',
          when: 'Când creezi sau partajezi o temă',
          why: 'Ca să afișăm site-ul în tema ta pe orice dispozitiv pe care te autentifici și să le permitem persoanelor alese s-o folosească; ele văd tema și numele tău',
          basis: 'Contract (art. 6 alin. (1) lit. (b))',
        },
        note: 'Nu putem vedea adresa MAC a dispozitivului tău și nici, dacă folosești un VPN, locația ta reală: vedem doar serverul VPN. Nu folosim datele tale pentru publicitate, nu le vindem și nu luăm decizii automate despre tine, în afara blocării temporare de securitate descrise mai sus.',
      },
      cookies: {
        head: { cookie: 'Cookie', purpose: 'Scop', duration: 'Durată', type: 'Tip' },
        session: 'Te menține autentificat pe devquake.com și în aplicațiile sale (*.devquake.com)',
        sessionDuration: 'Până la {hours} ore',
        challenge: 'Leagă o autentificare de codul trimis pe e-mail',
        minutes: '{count} minute',
        consent: 'Ține minte alegerea ta privind statisticile pe toate site-urile *.devquake.com',
        theme:
          'Ține minte tema de culori aleasă (Luminoasă, Întunecată sau una dintre temele tale personalizate, prin numărul ei) pe toate site-urile *.devquake.com; nu se setează pentru Automată',
        reset: 'Păstrează linkul de resetare a parolei cât timp alegi parola nouă',
        lang: 'Ține minte limba ta pe toate site-urile *.devquake.com',
        timeZone:
          'Fusul orar al dispozitivului tău (de ex. Europe/Bucharest), ca datele și orele să fie afișate în ora ta locală pe toate site-urile *.devquake.com',
        sidenav: 'Ține minte dacă ai restrâns bara laterală a paginilor contului',
        ga: 'Google Analytics: deosebește vizitatorii',
        gaSession: 'Google Analytics: păstrează starea sesiunii',
        necessary: 'Strict necesar',
        functionalTheme: 'Funcțional, setat doar când alegi o temă',
        functional: 'Funcțional',
        analytics: 'Statistici, doar cu consimțământ',
        note: 'Cookie-urile strict necesare nu au nevoie de consimțământ. Google Analytics nu se încarcă deloc până nu accepți, funcțiile de publicitate sunt dezactivate, iar refuzul îi șterge cookie-urile. Îți poți schimba alegerea oricând: {button}.',
      },
      recipients: {
        intro: 'Împărțim date doar cu furnizori de servicii care ne ajută să administrăm site-ul:',
        hostinger:
          '{name} găzduiește site-ul, baza de date și e-mailul nostru, deci toate datele de mai sus sunt stocate pe serverele sale.',
        proxycheck:
          '{name} primește adresa IP a fiecărei înregistrări și autentificări și returnează locația aproximativă, furnizorul și dacă este un VPN sau proxy.',
        google:
          '{name} (Google Analytics) primește date de utilizare doar dacă accepți statisticile. Google le poate prelucra în afara UE, inclusiv în Statele Unite în baza Cadrului UE-SUA privind protecția datelor.',
        law: 'Putem divulga date și atunci când legea o cere sau pentru a proteja site-ul și utilizatorii lui împotriva fraudei sau abuzului.',
      },
      retention: {
        intro: 'Datele vechi se șterg automat o dată pe zi după aceste perioade:',
        head: { data: 'Date', kept: 'Păstrate' },
        account:
          'Contul tău, poza, limba, rolurile, abonamentele, aprecierile, evaluările, invitațiile, precum și ideile, voturile și comentariile tale',
        accountKept:
          'Până când îți ștergi contul (Contul tău → Șterge contul) sau ne ceri asta. Proprietarul site-ului poate elimina conturile nefolosite de mult timp; primești un e-mail când se întâmplă.',
        apps: 'Ce ai creat într-o aplicație (de exemplu listele tale de cumpărături)',
        appsKept:
          'Până când te dezabonezi de la acea aplicație sau îți ștergi contul; conținutul partajat rămâne la celelalte persoane, fără numele tău',
        trials:
          'Ce ai creat într-o aplicație în timpul unei perioade de probă gratuite, dacă nu te-ai abonat',
        trialsKept: '{days} de zile după încheierea perioadei de probă',
        themes: 'Temele tale personalizate și cu cine le-ai partajat',
        themesKept: 'Până ștergi tema sau contul',
        invites: 'Adresele invitate care nu s-au alăturat niciodată',
        pending: 'Conturile al căror e-mail nu a fost confirmat niciodată',
        signins: 'Activitatea de autentificare (detalii și instantanee de autentificare)',
        activity: 'Activitatea contului tău (autentificări, abonamente, modificări ale contului)',
        attempts: 'Încercările de parolă folosite pentru blocări',
        log: 'Alte intrări din jurnalul de activitate',
        logKept: '{period} (evenimente de securitate {security})',
        sessions: 'Sesiuni expirate, coduri unice, linkuri de activare și de resetare a parolei',
        emails: 'Evidența e-mailurilor trimise',
        contact: 'Mesajele din formularul de contact și răspunsurile noastre',
        visitors: 'Hash-urile anonime ale vizitatorilor și valoarea lor zilnică (salt)',
        visitorsKept: '1 zi (rămân doar totalurile zilnice)',
        ga: 'Datele Google Analytics',
        gaKept: 'Conform perioadei setate în Google Analytics (cel mult 14 luni)',
      },
      rights: {
        intro: 'Conform RGPD ne poți cere:',
        access: 'să îți dăm o copie a datelor tale personale (acces și portabilitate);',
        correct: 'să le corectăm dacă sunt greșite;',
        delete:
          'să le ștergem, inclusiv întregul cont (poți face asta și singur: Contul tău → Șterge contul);',
        restrict:
          'să restricționăm modul în care le folosim sau să te opui acestuia, inclusiv prelucrării bazate pe interes legitim;',
        withdraw: 'să îți retragi oricând consimțământul pentru statistici (din „Setări cookie”).',
        contact:
          'Scrie-ne la {email} de pe adresa contului tău. Răspundem în cel mult o lună. Dacă nu ești mulțumit, poți depune o plângere la autoritatea de protecție a datelor din țara UE în care locuiești sau lucrezi.',
      },
      security:
        'Parolele sunt transformate în hash cu scrypt, codurile de autentificare și tokenurile de sesiune sunt stocate doar ca hash-uri, fiecare autentificare cere un cod trimis pe e-mailul tău, conexiunile folosesc HTTPS, iar autentificările eșuate repetate blochează temporar contul și te anunță. Accesul la datele utilizatorilor este limitat la proprietarul site-ului.',
      changes:
        'Actualizăm această pagină când se schimbă ce colectăm sau de ce și afișăm data în partea de sus. Pentru modificări importante le trimitem și un e-mail deținătorilor de conturi.',
    },
    hu: {
      metaTitle: 'Adatvédelmi tájékoztató',
      metaDescription:
        'Milyen személyes adatokat gyűjt a DevQuake, miért, mennyi ideig, és milyen jogaid vannak.',
      title: 'Adatvédelmi tájékoztató',
      updated: 'Utolsó frissítés: {date}',
      intro:
        'Ez az oldal elmagyarázza, milyen személyes adatokat gyűjt a devquake.com és a *.devquake.com alatti alkalmazásai, miért, mennyi ideig őrizzük meg őket, és mit kérhetsz tőlünk velük kapcsolatban. Röviden: azt gyűjtjük, ami a fiókod működtetéséhez és védelméhez kell, adatokat soha nem adunk el, és a mérés csak a beleegyezéseddel fut.',
      versions:
        'Ez a tájékoztató angolul, németül, románul és magyarul érhető el; minden nyelvi változat egyformán érvényes.',
      contents: 'Tartalom',
      toc: {
        who: 'Ki a felelős',
        what: 'Mit gyűjtünk és miért',
        cookies: 'Sütik',
        recipients: 'Ki kezel még adatokat',
        retention: 'Meddig őrizzük',
        rights: 'Jogaid',
        security: 'Biztonság',
        changes: 'Változások',
      },
      who: {
        body: 'A személyes adataid adatkezelője {controller}{address}. Az adataiddal kapcsolatos bármilyen ügyben írj ide: {email}.',
        fallback: 'a devquake.com üzemeltetője',
      },
      what: {
        head: { data: 'Adat', when: 'Mikor', why: 'Miért', basis: 'Jogalap (GDPR)' },
        account: {
          data: 'Név, e-mail-cím, jelszó (csak visszafejthetetlen scrypt-hashként tárolva)',
          when: 'Amikor fiókot hozol létre',
          why: 'Hogy fiókot adjunk neked, és bejelentkeztessünk',
          basis: 'Szerződés (6. cikk (1) bekezdés b) pont)',
        },
        language: {
          data: 'A nyelved (angol, német, román vagy magyar), és a profilodban választott nyelv',
          when: 'Amikor egy nyelven használod az oldalt, vagy nyelvet választasz',
          why: 'Hogy az oldalt a nyelveden mutassuk, és a nyelveden küldjünk e-mailt',
          basis: 'Szerződés (6. cikk (1) bekezdés b) pont)',
        },
        roles: {
          data: 'Szerepek, a projektek, amelyekre feliratkoztál, a tulajdonos által hozzád rendelt projektek, valamint az oldal tulajdonosa által adott belső értékelés',
          when: 'Amikor a tulajdonos beállítja a fiókodat',
          why: 'Hogy hozzáférést adjunk a megfelelő alkalmazásokhoz, és kezeljük a közösséget',
          basis: 'Szerződés; jogos érdek (6. cikk (1) bekezdés f) pont)',
        },
        ideas: {
          data: 'Az általad megosztott ötletek (cím, leírás, a projekt, egy nem kötelező kép), a szavazataid és az ötletekhez írt hozzászólásaid',
          when: 'Amikor ötletet osztasz meg, szavazol vagy hozzászólsz',
          why: 'Hogy ötleteket gyűjtsünk és beszéljünk meg új alkalmazásokhoz. A nyilvános ötletek és hozzászólások megmutatják a neved a bejelentkezett tagoknak; a privát ötletek csak neked',
          basis:
            'Szerződés (6. cikk (1) bekezdés b) pont); a moderálás jogos érdeke (6. cikk (1) bekezdés f) pont)',
        },
        feedback: {
          data: 'A projektek, amelyeket kedveltél, és az értékeléseid (minőség és hasznosság, 1–5 csillag)',
          when: 'Amikor kedvelsz vagy értékelsz egy projektet',
          why: 'Hogy megmutassuk, mely projekteket tartják hasznosnak, és eldöntsük, mi készüljön ezután; nyilvánosan csak összesítések és átlagok jelennek meg',
          basis: 'Jogos érdek (6. cikk (1) bekezdés f) pont)',
        },
        codes: {
          data: 'Egyszer használatos bejelentkezési kódok (csak hashként tárolva, {minutes} percig érvényesek) és fiókaktiváló linkek (csak hashként tárolva, 48 óráig érvényesek)',
          when: 'Minden bejelentkezéskor, és egyszer a fiók létrehozásakor',
          why: 'Hogy megerősítsük, valóban te vagy',
          basis: 'Szerződés; a biztonsághoz fűződő jogos érdek',
        },
        signins: {
          data: 'Bejelentkezési adatok: dátum és idő, IP-cím, az IP hozzávetőleges helye (ország, régió, város), internetszolgáltató, hogy az IP VPN-hez vagy proxyhoz tartozik-e (és annak szolgáltatója), böngésző, operációs rendszer, eszköztípus, valamint a böngésződ időzónája, nyelve és képernyőmérete',
          when: 'Minden regisztrációnál, bejelentkezésnél és kódmegadásnál, akár sikeres, akár nem',
          why: 'Hogy felismerjük és megakadályozzuk a fiókok eltérítését, 3 egymást követő hibás jelszó után {hours} órára zároljuk a fiókot, megmutassuk a legutóbbi bejelentkezéseidet, és biztonsági statisztikákat készítsünk',
          basis: 'A fiókok és az oldal biztonságához fűződő jogos érdek',
        },
        contact: {
          data: 'Név, e-mail-cím, tárgy, üzenet, IP-cím és böngésző, valamint a válaszaink. Bejelentkezve a fiókod neve és e-mail-címe szerepel, és az üzeneteidet és válaszainkat a fiókodban látod, ahol törölheted is őket',
          when: 'Amikor a kapcsolatfelvételi űrlapot használod, vagy a fiókodból írsz',
          why: 'Hogy válaszoljunk neked (a fiókodban és e-mailben), és kiszűrjük a spamet',
          basis:
            'A megkeresések megválaszolásához fűződő jogos érdek; adott esetben szerződéskötést megelőző lépések',
        },
        emails: {
          data: 'A neked küldött e-mailek naplója (típus, idő, kézbesítési állapot; a tartalom nem)',
          when: 'Amikor e-mailt küldünk neked',
          why: 'A kézbesítési hibák elhárítására, és annak igazolására, hogy a biztonsági értesítéseket elküldtük',
          basis: 'Jogos érdek',
        },
        activity: {
          data: 'Az oldalon végzett műveletek naplója (például bejelentkezések, fiókmódosítások, hibák) IP-címmel és böngészővel',
          when: 'Amíg az oldalt használod',
          why: 'Biztonság, hibaelhárítás és a visszaélések megelőzése',
          basis: 'Jogos érdek',
        },
        profile: {
          data: 'Profilkép (nem kötelező, 256x256), a személyes meghívókódod és NPS-pontszámod, hogy ki hívott meg, valamint az általad meghívott e-mail-címek',
          when: 'Amikor képet töltesz fel, megosztod a linkedet vagy meghívót küldesz',
          why: 'A profilod és az általad használt meghívó funkció (a meghívott személy egy e-mailt kap, amely megnevez téged)',
          basis: 'Szerződés; jogos érdek, hogy a tagok meghívhassanak másokat',
        },
        visits: {
          data: 'Névtelen látogatásszámlálás: napi látogatói szám, amelyet az IP-címből és a böngészőből képzünk egy véletlen értékkel (salt), amelyet másnap törlünk; csak a napi összesítéseket őrizzük meg',
          when: 'Minden oldalmegtekintéskor a devquake.com-on',
          why: 'Hogy megmutassuk, hányan látogatják az oldalt (a kezdőlapon is)',
          basis: 'Jogos érdek; sütik nélkül, és a tárolt adatokból senki sem azonosítható',
        },
        analytics: {
          data: 'Használati statisztikák a Google Analytics révén (megtekintett oldalak, melyik alkalmazást használod, mely alkalmazásfunkciókat használják, például „lista létrehozva” vagy „termék hozzáadva”, nevek és tartalom nélkül, hozzávetőleges hely, eszköz, egy véletlen azonosító egy sütiben)',
          when: 'Csak ha az „Elfogadom a mérést” gombra kattintasz',
          why: 'Hogy megértsük, mely oldalak hasznosak, és javítsuk az oldalt',
          basis: 'Hozzájárulás (6. cikk (1) bekezdés a) pont), amelyet bármikor visszavonhatsz',
        },
        reset: {
          data: 'Jelszó-visszaállító linkek (csak hash-ként tárolva), minden kérés ideje és IP-címe',
          when: 'Amikor az „Elfelejtetted a jelszavad?” funkciót használod',
          why: 'Hogy új jelszót választhass, és megakadályozzuk az űrlap visszaélésszerű használatát',
          basis: 'Szerződés; a biztonsághoz fűződő jogos érdek',
        },
        trials: {
          data: 'Mely alkalmazásokat próbáltad ki ingyen, és mikor kezdődött és ért véget a 24 órás próbaidőszak',
          when: 'Amikor elindítod egy alkalmazás ingyenes próbaidőszakát',
          why: 'Hogy 24 órára, egyszer megnyissuk neked az alkalmazást, és töröljük, amit benne létrehoztál, ha nem iratkozol fel',
          basis: 'Szerződés (6. cikk (1) bekezdés b) pont)',
        },
        themes: {
          data: 'A saját témáid (név, színek, betűtípusok), a tagok, akikkel megosztottad őket, és a legutóbb választott téma',
          when: 'Amikor témát hozol létre vagy osztasz meg',
          why: 'Hogy az oldalt minden eszközön, ahol bejelentkezel, a témádban mutassuk, és az általad választott emberek is használhassák; ők látják a témát és a nevedet',
          basis: 'Szerződés (6. cikk (1) bekezdés b) pont)',
        },
        note: 'Nem látjuk az eszközöd MAC-címét, és ha VPN-t használsz, a valódi helyedet sem: csak a VPN-szervert látjuk. Az adataidat nem használjuk reklámra, nem adjuk el, és a fent leírt ideiglenes biztonsági zároláson kívül nem hozunk rólad automatizált döntést.',
      },
      cookies: {
        head: { cookie: 'Süti', purpose: 'Cél', duration: 'Időtartam', type: 'Típus' },
        session: 'Bejelentkezve tart a devquake.com-on és alkalmazásaiban (*.devquake.com)',
        sessionDuration: 'Legfeljebb {hours} óra',
        challenge: 'Összekapcsol egy bejelentkezést az e-mailben küldött kóddal',
        minutes: '{count} perc',
        consent: 'Megjegyzi a méréssel kapcsolatos döntésedet minden *.devquake.com oldalon',
        theme:
          'Megjegyzi a választott színtémát (Világos, Sötét vagy valamelyik saját témád, a száma alapján) minden *.devquake.com oldalon; Automatikus esetén nincs beállítva',
        reset: 'Megőrzi a jelszó-visszaállító linket, amíg az új jelszót választod',
        lang: 'Megjegyzi a nyelvedet minden *.devquake.com oldalon',
        timeZone:
          'Az eszközöd időzónája (pl. Europe/Bucharest), hogy a dátumok és időpontok minden *.devquake.com oldalon a helyi időd szerint jelenjenek meg',
        sidenav: 'Megjegyzi, hogy összecsuktad-e a fiókoldalak oldalsávját',
        ga: 'Google Analytics: megkülönbözteti a látogatókat',
        gaSession: 'Google Analytics: megőrzi a munkamenet állapotát',
        necessary: 'Feltétlenül szükséges',
        functionalTheme: 'Funkcionális, csak témaválasztáskor beállítva',
        functional: 'Funkcionális',
        analytics: 'Mérés, csak hozzájárulással',
        note: 'A feltétlenül szükséges sütikhez nem kell hozzájárulás. A Google Analytics egyáltalán nem töltődik be, amíg el nem fogadod, a reklámfunkciók ki vannak kapcsolva, elutasításkor pedig a sütijei törlődnek. A döntésedet bármikor megváltoztathatod: {button}.',
      },
      recipients: {
        intro:
          'Adatokat csak olyan szolgáltatókkal osztunk meg, akik segítenek az oldal működtetésében:',
        hostinger:
          'A(z) {name} biztosítja a weboldal, az adatbázis és az e-mailjeink tárhelyét, így a fenti adatok mind az ő szerverein vannak.',
        proxycheck:
          'A(z) {name} megkapja minden regisztráció és bejelentkezés IP-címét, és visszaadja annak hozzávetőleges helyét, szolgáltatóját, valamint azt, hogy VPN-ről vagy proxyról van-e szó.',
        google:
          'A(z) {name} (Google Analytics) csak akkor kap használati adatokat, ha elfogadod a mérést. A Google az EU-n kívül is kezelheti őket, többek között az Egyesült Államokban, az EU–USA adatvédelmi keretrendszer alapján.',
        law: 'Adatokat akkor is kiadhatunk, ha a jogszabály előírja, vagy ha az oldal és felhasználói csalással vagy visszaéléssel szembeni védelméhez szükséges.',
      },
      retention: {
        intro:
          'A régi adatokat naponta egyszer, a következő időszakok után automatikusan töröljük:',
        head: { data: 'Adat', kept: 'Megőrzés' },
        account:
          'A fiókod, képed, nyelved, szerepeid, feliratkozásaid, kedveléseid, értékeléseid, meghívásaid, valamint az ötleteid, szavazataid és hozzászólásaid',
        accountKept:
          'Amíg nem törlöd a fiókodat (Fiókod → Fiók törlése), vagy nem kéred tőlünk. Az oldal tulajdonosa eltávolíthatja a régóta nem használt fiókokat; ilyenkor e-mailt kapsz.',
        apps: 'Amit egy alkalmazásban létrehoztál (például a bevásárlólistáid)',
        appsKept:
          'Amíg le nem iratkozol az alkalmazásról, vagy nem törlöd a fiókodat; a megosztott tartalom a többieknél marad, a neved nélkül',
        trials:
          'Amit egy ingyenes próbaidőszak alatt létrehoztál egy alkalmazásban, ha nem iratkoztál fel',
        trialsKept: '{days} nappal a próbaidőszak vége után',
        themes: 'A saját témáid, és hogy kivel osztottad meg őket',
        themesKept: 'Amíg nem törlöd a témát vagy a fiókodat',
        invites: 'Meghívott címek, akik soha nem csatlakoztak',
        pending: 'Fiókok, amelyek e-mail-címét soha nem erősítették meg',
        signins: 'Bejelentkezési tevékenység (bejelentkezési adatok és pillanatképek)',
        activity: 'A fióktevékenységed (bejelentkezések, feliratkozások, a fiókod módosításai)',
        attempts: 'A zároláshoz használt jelszópróbálkozások',
        log: 'Egyéb tevékenységnapló-bejegyzések',
        logKept: '{period} (biztonsági események: {security})',
        sessions:
          'Lejárt munkamenetek, egyszer használatos kódok, aktiváló és jelszó-visszaállító linkek',
        emails: 'Az elküldött e-mailek nyilvántartása',
        contact: 'A kapcsolatfelvételi űrlap üzenetei és a válaszaink',
        visitors: 'A látogatók névtelen hashei és napi véletlen értékük (salt)',
        visitorsKept: '1 nap (csak a napi összesítések maradnak meg)',
        ga: 'Google Analytics-adatok',
        gaKept: 'A Google Analyticsben beállított megőrzési idő szerint (legfeljebb 14 hónap)',
      },
      rights: {
        intro: 'A GDPR alapján kérheted tőlünk, hogy:',
        access: 'adjunk másolatot a személyes adataidról (hozzáférés és adathordozhatóság);',
        correct: 'helyesbítsük őket, ha hibásak;',
        delete:
          'töröljük őket, akár a teljes fiókodat is (ezt magad is megteheted: Fiókod → Fiók törlése);',
        restrict:
          'korlátozzuk a felhasználásukat, vagy tiltakozhatsz ellene, a jogos érdeken alapuló adatkezelést is beleértve;',
        withdraw:
          'bármikor visszavonhasd a méréshez adott hozzájárulásodat (a „Sütibeállítások” alatt).',
        contact:
          'Írj a(z) {email} címre a fiókodhoz tartozó e-mail-címről. Egy hónapon belül válaszolunk. Ha nem vagy elégedett, panaszt tehetsz annak az EU-országnak az adatvédelmi hatóságánál, ahol élsz vagy dolgozol.',
      },
      security:
        'A jelszavakat scrypttel hasheljük, a bejelentkezési kódokat és a munkamenet-tokeneket csak hashként tároljuk, minden bejelentkezéshez az e-mail-címedre küldött kód kell, a kapcsolatok HTTPS-t használnak, az ismételt sikertelen bejelentkezések pedig ideiglenesen zárolják a fiókot, és értesítenek téged. A felhasználói adatokhoz csak az oldal tulajdonosa fér hozzá.',
      changes:
        'Frissítjük ezt az oldalt, ha megváltozik, mit gyűjtünk vagy miért, és a dátumot a lap tetején jelezzük. Jelentős változásokról a fióktulajdonosoknak e-mailt is küldünk.',
    },
  },
);
