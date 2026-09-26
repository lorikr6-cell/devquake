import type { Locale } from '@devquake/ui';

// The user manual (/help) in every language (ADR 0011). Inline markup: **bold**; {host} is a
// link to devquake.com. Every language has the same sections and blocks (checked by a test).

export type ManualBlock =
  { p: string } | { steps: string[] } | { list: string[] } | { tip: string };

export interface Manual {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  /** For visitors who are not signed in; {link} is the sign-in link. */
  cta: string;
  ctaLink: string;
  kicker: string;
  title: string;
  intro: string;
  contents: string;
  sections: Array<{ id: string; title: string; blocks: ManualBlock[] }>;
  /** {email} is the contact address. */
  questions: string;
  back: string;
}

const en: Manual = {
  metaTitle: 'User manual · My vault',
  metaDescription:
    'Keep private information encrypted with a vault key and three questions, keep it only for yourself, or let it reach the people you choose if you become inactive.',
  ogTitle: 'My vault: user manual',
  cta: 'Want to try it? My vault is an app for DevQuake members. {link}, then subscribe to the app.',
  ctaLink: 'Create an account or sign in',
  kicker: 'My vault · User manual',
  title: 'How to use your vault',
  intro:
    'My vault keeps private information encrypted. Each entry opens only with its vault key and the answers to three questions you choose. It can stay yours alone, or reach people you trust when you have not used DevQuake for a while.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          steps: [
            'Sign in on {host} (or create an account and confirm your email).',
            'Open **Your account → Available projects** and **Subscribe** to “My vault”.',
            'Open the app and choose **New entry**.',
          ],
        },
      ],
    },
    {
      id: 'what',
      title: '2. What an entry can hold',
      blocks: [
        {
          p: 'Every entry has a **note**, **secret fields** (a label and a hidden value) and **files**, all encrypted together. For example:',
        },
        {
          list: [
            '**Logins and passwords**: online banking, email, the password manager’s master password hint.',
            '**Crypto and recovery**: wallet seed phrases, two-factor recovery codes.',
            '**Bank and finance**: account and card details, PINs, safe or alarm codes, insurance and pension policy numbers.',
            '**Identity and documents**: ID and passport numbers, scans of a will, deeds or contracts (files).',
            '**Wishes and instructions**: a letter, where important things are, who to call first (lawyer, notary, accountant).',
            '**Anything else** private: a diary page, health information, photos or a short voice message.',
          ],
        },
        {
          tip: 'The **title** and **category** are not encrypted: they appear in lists and in the email to recipients. Keep the title general (“For the family”, not the PIN).',
        },
      ],
    },
    {
      id: 'private',
      title: '3. Entries only for you',
      blocks: [
        {
          p: 'An entry without recipients is **private forever**: nobody is ever sent its key, and the server does not even keep it. Good uses:',
        },
        {
          list: [
            'Your own backup of recovery codes and seed phrases, apart from your devices.',
            'Things you do not want in an ordinary notes app: health notes, a diary, a secret you keep.',
            'Sensitive documents you keep for yourself: contracts in negotiation, scans of papers.',
            'A “letter to my future self”, or drafts you may share later: you can add recipients at any time.',
          ],
        },
      ],
    },
    {
      id: 'create',
      title: '4. Create an entry',
      blocks: [
        {
          steps: [
            '**Content**: a title, a category, and the note, secret fields and files.',
            '**Questions**: three questions and their right answers (see below).',
            '**Vault key**: the app makes a random key (52 characters). **Copy** or **download** it and keep it safe; tick that you saved it.',
            '**Recipients** (optional): people who receive the key if you become inactive.',
            '**Encrypt and save**: the entry is encrypted on your device and only then uploaded.',
          ],
        },
      ],
    },
    {
      id: 'questions',
      title: '5. The three questions',
      blocks: [
        {
          list: [
            'Each question has a type: **a date**, **text**, **a number**, **one choice** or **several choices** (you write the choices, one per line).',
            'You enter the right answer; it is never stored in readable form, only as a check.',
            'Text answers ignore capitals, accents and extra spaces (“Érdi Anna” = “erdi anna”); numbers ignore leading zeros.',
            'The questions are shown to whoever opens the entry, so choose ones only the right people can answer.',
          ],
        },
        {
          tip: 'Make at least one answer hard to guess, like a serial number or a private memory; a birth date alone is easy to find out.',
        },
      ],
    },
    {
      id: 'key',
      title: '6. The vault key',
      blocks: [
        {
          p: 'The vault key is shown once, when you create the entry. The entry opens only with the key **and** the three answers.',
        },
        {
          tip: 'Nobody can recover a lost key, DevQuake included. Keep it in a password manager or on paper in a safe place. Dashes, spaces and small letters do not matter when you type it.',
        },
      ],
    },
    {
      id: 'recipients',
      title: '7. Recipients and the release',
      blocks: [
        {
          list: [
            'Recipients are people from your **DevQuake referrals** (people you invited or who invited you). They need a DevQuake account, not the app.',
            'Choose after how many **days or months without activity** the key is sent. Activity is any use of DevQuake: signing in, any page or app.',
            'Optionally, a day **before which nothing is sent** even if you are inactive.',
            'A few days before the release you get a **warning email**; signing in or opening any DevQuake page postpones it.',
            'At the release, each recipient gets an email with the vault key and a link. They open the entry with the key and the answers to your three questions.',
          ],
        },
        {
          tip: 'To change recipients later, open the entry (or type its key) on its page and save the recipients again. After the release they can no longer change.',
        },
      ],
    },
    {
      id: 'opening',
      title: '8. Opening an entry, and the tries',
      blocks: [
        {
          list: [
            'Type the vault key and answer the three questions; the content is decrypted on your device.',
            'Every try is recorded: who, when, and for wrong ones the answers given.',
            'After **3 wrong tries** the entry is **locked for 36 hours** and you get an email. On the entry’s page you see who tried and what they answered, and you can unlock it earlier.',
            'As the owner you can also **change the content**; it is encrypted again with the same key and answers.',
          ],
        },
      ],
    },
    {
      id: 'security',
      title: '9. How it is protected',
      blocks: [
        {
          list: [
            'The content is encrypted in your browser (AES-256) with a key made from the vault key and the three answers. The server stores only the encrypted content.',
            'The answers are stored only as a slow check value, and the key only as a check value.',
            'For entries **with recipients**, the server also keeps the vault key, sealed with its own secret key, because it must be able to send it without you. Someone with full access to the server could therefore try to guess the answers: this is why at least one answer should be hard to guess.',
            'Private entries (no recipients) keep no key on the server at all.',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: '10. Your data',
      blocks: [
        {
          p: 'When you delete your DevQuake account or unsubscribe from the app, your entries, their tries and your place as a recipient on others’ entries are deleted for good.',
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: '← Back to your vault',
};

const de: Manual = {
  metaTitle: 'Anleitung · Mein Tresor',
  metaDescription:
    'Bewahre private Informationen verschlüsselt mit einem Tresorschlüssel und drei Fragen auf, nur für dich oder für Menschen deiner Wahl, falls du inaktiv wirst.',
  ogTitle: 'Mein Tresor: Anleitung',
  cta: 'Möchtest du es ausprobieren? Mein Tresor ist eine App für DevQuake-Mitglieder. {link} und abonniere dann die App.',
  ctaLink: 'Erstelle ein Konto oder melde dich an',
  kicker: 'Mein Tresor · Anleitung',
  title: 'So nutzt du deinen Tresor',
  intro:
    'Mein Tresor bewahrt private Informationen verschlüsselt auf. Jeder Eintrag öffnet sich nur mit seinem Tresorschlüssel und den Antworten auf drei Fragen, die du wählst. Er kann nur dir gehören oder Menschen deines Vertrauens erreichen, wenn du DevQuake eine Weile nicht genutzt hast.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          steps: [
            'Melde dich auf {host} an (oder erstelle ein Konto und bestätige deine E-Mail-Adresse).',
            'Öffne **Dein Konto → Verfügbare Projekte** und **abonniere** „Mein Tresor“.',
            'Öffne die App und wähle **Neuer Eintrag**.',
          ],
        },
      ],
    },
    {
      id: 'what',
      title: '2. Was ein Eintrag enthalten kann',
      blocks: [
        {
          p: 'Jeder Eintrag hat eine **Notiz**, **geheime Felder** (eine Bezeichnung und ein verborgener Wert) und **Dateien**, alles gemeinsam verschlüsselt. Zum Beispiel:',
        },
        {
          list: [
            '**Zugänge und Passwörter**: Online-Banking, E-Mail, ein Hinweis auf das Master-Passwort des Passwortmanagers.',
            '**Krypto und Wiederherstellung**: Seed-Phrasen von Wallets, Wiederherstellungscodes der Zwei-Faktor-Anmeldung.',
            '**Bank und Finanzen**: Konto- und Kartendaten, PINs, Tresor- oder Alarmcodes, Versicherungs- und Rentennummern.',
            '**Ausweise und Dokumente**: Ausweis- und Passnummern, Scans eines Testaments, von Urkunden oder Verträgen (Dateien).',
            '**Wünsche und Anweisungen**: ein Brief, wo wichtige Dinge sind, wen man zuerst anruft (Anwalt, Notar, Steuerberater).',
            '**Alles andere** Private: eine Tagebuchseite, Gesundheitsdaten, Fotos oder eine kurze Sprachnachricht.',
          ],
        },
        {
          tip: '**Titel** und **Kategorie** sind nicht verschlüsselt: Sie stehen in Listen und in der E-Mail an Empfänger. Halte den Titel allgemein („Für die Familie“, nicht die PIN).',
        },
      ],
    },
    {
      id: 'private',
      title: '3. Einträge nur für dich',
      blocks: [
        {
          p: 'Ein Eintrag ohne Empfänger ist **für immer privat**: Niemandem wird je sein Schlüssel geschickt, und der Server bewahrt ihn nicht einmal auf. Gute Verwendungen:',
        },
        {
          list: [
            'Deine eigene Sicherung von Wiederherstellungscodes und Seed-Phrasen, getrennt von deinen Geräten.',
            'Dinge, die du nicht in einer gewöhnlichen Notiz-App haben willst: Gesundheitsnotizen, ein Tagebuch, ein Geheimnis.',
            'Sensible Dokumente nur für dich: Verträge in Verhandlung, Scans von Unterlagen.',
            'Ein „Brief an mein zukünftiges Ich“ oder Entwürfe, die du später teilen willst: Empfänger kannst du jederzeit hinzufügen.',
          ],
        },
      ],
    },
    {
      id: 'create',
      title: '4. Einen Eintrag anlegen',
      blocks: [
        {
          steps: [
            '**Inhalt**: ein Titel, eine Kategorie sowie Notiz, geheime Felder und Dateien.',
            '**Fragen**: drei Fragen und ihre richtigen Antworten (siehe unten).',
            '**Tresorschlüssel**: Die App erzeugt einen zufälligen Schlüssel (52 Zeichen). **Kopiere** oder **lade** ihn **herunter** und bewahre ihn sicher auf; bestätige, dass du ihn gespeichert hast.',
            '**Empfänger** (optional): Personen, die den Schlüssel bekommen, wenn du inaktiv wirst.',
            '**Verschlüsseln und speichern**: Der Eintrag wird auf deinem Gerät verschlüsselt und erst dann hochgeladen.',
          ],
        },
      ],
    },
    {
      id: 'questions',
      title: '5. Die drei Fragen',
      blocks: [
        {
          list: [
            'Jede Frage hat eine Art: **ein Datum**, **Text**, **eine Zahl**, **eine Auswahl** oder **mehrere Auswahlen** (die Möglichkeiten schreibst du selbst, eine pro Zeile).',
            'Du gibst die richtige Antwort ein; sie wird nie lesbar gespeichert, nur als Prüfwert.',
            'Textantworten ignorieren Groß- und Kleinschreibung, Akzente und zusätzliche Leerzeichen („Érdi Anna“ = „erdi anna“); Zahlen ignorieren führende Nullen.',
            'Die Fragen sieht jeder, der den Eintrag öffnet; wähle also solche, die nur die richtigen Menschen beantworten können.',
          ],
        },
        {
          tip: 'Mach mindestens eine Antwort schwer zu erraten, etwa eine Seriennummer oder eine private Erinnerung; ein Geburtsdatum allein ist leicht herauszufinden.',
        },
      ],
    },
    {
      id: 'key',
      title: '6. Der Tresorschlüssel',
      blocks: [
        {
          p: 'Der Tresorschlüssel wird einmal angezeigt, wenn du den Eintrag anlegst. Der Eintrag öffnet sich nur mit dem Schlüssel **und** den drei Antworten.',
        },
        {
          tip: 'Niemand kann einen verlorenen Schlüssel wiederherstellen, auch DevQuake nicht. Bewahre ihn in einem Passwortmanager oder auf Papier an einem sicheren Ort auf. Bindestriche, Leerzeichen und Kleinbuchstaben spielen beim Eintippen keine Rolle.',
        },
      ],
    },
    {
      id: 'recipients',
      title: '7. Empfänger und Freigabe',
      blocks: [
        {
          list: [
            'Empfänger sind Personen aus deinen **DevQuake-Empfehlungen** (von dir Eingeladene oder die, die dich eingeladen haben). Sie brauchen ein DevQuake-Konto, nicht die App.',
            'Wähle, nach wie vielen **Tagen oder Monaten ohne Aktivität** der Schlüssel gesendet wird. Aktivität ist jede Nutzung von DevQuake: Anmeldung, jede Seite oder App.',
            'Optional einen Tag, **vor dem nichts gesendet wird**, auch wenn du inaktiv bist.',
            'Einige Tage vor der Freigabe bekommst du eine **Warn-E-Mail**; eine Anmeldung oder das Öffnen irgendeiner DevQuake-Seite schiebt sie auf.',
            'Bei der Freigabe bekommt jeder Empfänger eine E-Mail mit dem Tresorschlüssel und einem Link. Er öffnet den Eintrag mit dem Schlüssel und den Antworten auf deine drei Fragen.',
          ],
        },
        {
          tip: 'Um Empfänger später zu ändern, öffne den Eintrag (oder gib seinen Schlüssel ein) auf seiner Seite und speichere die Empfänger erneut. Nach der Freigabe lassen sie sich nicht mehr ändern.',
        },
      ],
    },
    {
      id: 'opening',
      title: '8. Einen Eintrag öffnen, und die Versuche',
      blocks: [
        {
          list: [
            'Gib den Tresorschlüssel ein und beantworte die drei Fragen; der Inhalt wird auf deinem Gerät entschlüsselt.',
            'Jeder Versuch wird festgehalten: wer, wann und bei falschen die gegebenen Antworten.',
            'Nach **3 falschen Versuchen** ist der Eintrag **36 Stunden gesperrt**, und du bekommst eine E-Mail. Auf der Seite des Eintrags siehst du, wer es versucht und was geantwortet hat, und kannst ihn früher entsperren.',
            'Als Besitzer kannst du auch **den Inhalt ändern**; er wird mit demselben Schlüssel und denselben Antworten neu verschlüsselt.',
          ],
        },
      ],
    },
    {
      id: 'security',
      title: '9. Wie er geschützt ist',
      blocks: [
        {
          list: [
            'Der Inhalt wird in deinem Browser verschlüsselt (AES-256), mit einem Schlüssel aus dem Tresorschlüssel und den drei Antworten. Der Server speichert nur den verschlüsselten Inhalt.',
            'Die Antworten werden nur als langsamer Prüfwert gespeichert, der Schlüssel nur als Prüfwert.',
            'Bei Einträgen **mit Empfängern** bewahrt der Server den Tresorschlüssel zusätzlich auf, versiegelt mit seinem eigenen geheimen Schlüssel, weil er ihn ohne dich senden können muss. Jemand mit vollem Zugriff auf den Server könnte deshalb versuchen, die Antworten zu erraten: Darum sollte mindestens eine Antwort schwer zu erraten sein.',
            'Private Einträge (ohne Empfänger) hinterlassen gar keinen Schlüssel auf dem Server.',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: '10. Deine Daten',
      blocks: [
        {
          p: 'Wenn du dein DevQuake-Konto löschst oder die App abbestellst, werden deine Einträge, ihre Versuche und dein Platz als Empfänger bei Einträgen anderer endgültig gelöscht.',
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: '← Zurück zu deinem Tresor',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Seiful meu',
  metaDescription:
    'Păstrează informații private criptate cu o cheie de seif și trei întrebări, doar pentru tine sau pentru persoanele alese de tine dacă devii inactiv.',
  ogTitle: 'Seiful meu: manual de utilizare',
  cta: 'Vrei să încerci? Seiful meu este o aplicație pentru membrii DevQuake. {link}, apoi abonează-te la aplicație.',
  ctaLink: 'Creează un cont sau autentifică-te',
  kicker: 'Seiful meu · Manual de utilizare',
  title: 'Cum îți folosești seiful',
  intro:
    'Seiful meu păstrează informații private criptate. Fiecare intrare se deschide doar cu cheia ei de seif și cu răspunsurile la trei întrebări alese de tine. Poate rămâne doar a ta sau poate ajunge la oamenii în care ai încredere când nu ai mai folosit DevQuake o vreme.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          steps: [
            'Autentifică-te pe {host} (sau creează un cont și confirmă-ți adresa de e-mail).',
            'Deschide **Contul tău → Proiecte disponibile** și **abonează-te** la „Seiful meu”.',
            'Deschide aplicația și alege **Intrare nouă**.',
          ],
        },
      ],
    },
    {
      id: 'what',
      title: '2. Ce poate conține o intrare',
      blocks: [
        {
          p: 'Fiecare intrare are o **notă**, **câmpuri secrete** (o etichetă și o valoare ascunsă) și **fișiere**, toate criptate împreună. De exemplu:',
        },
        {
          list: [
            '**Conturi și parole**: internet banking, e-mail, un indiciu pentru parola principală a managerului de parole.',
            '**Cripto și recuperare**: fraze seed ale portofelelor, coduri de recuperare pentru autentificarea în doi pași.',
            '**Bancă și finanțe**: date de cont și card, PIN-uri, coduri de seif sau alarmă, numere de polițe de asigurare și pensie.',
            '**Acte și documente**: numere de buletin și pașaport, scanări ale unui testament, acte sau contracte (fișiere).',
            '**Dorințe și instrucțiuni**: o scrisoare, unde sunt lucrurile importante, pe cine să suni întâi (avocat, notar, contabil).',
            '**Orice altceva** privat: o pagină de jurnal, informații medicale, fotografii sau un scurt mesaj vocal.',
          ],
        },
        {
          tip: '**Titlul** și **categoria** nu sunt criptate: apar în liste și în e-mailul către destinatari. Păstrează titlul general („Pentru familie”, nu PIN-ul).',
        },
      ],
    },
    {
      id: 'private',
      title: '3. Intrări doar pentru tine',
      blocks: [
        {
          p: 'O intrare fără destinatari este **privată pentru totdeauna**: nimănui nu i se trimite vreodată cheia, iar serverul nici nu o păstrează. Folosiri bune:',
        },
        {
          list: [
            'Propria ta copie de siguranță a codurilor de recuperare și a frazelor seed, separat de dispozitivele tale.',
            'Lucruri pe care nu le vrei într-o aplicație obișnuită de notițe: note medicale, un jurnal, un secret.',
            'Documente sensibile doar pentru tine: contracte în negociere, scanări de acte.',
            'O „scrisoare pentru viitorul meu” sau ciorne pe care le vei partaja mai târziu: poți adăuga destinatari oricând.',
          ],
        },
      ],
    },
    {
      id: 'create',
      title: '4. Creează o intrare',
      blocks: [
        {
          steps: [
            '**Conținut**: un titlu, o categorie și nota, câmpurile secrete și fișierele.',
            '**Întrebări**: trei întrebări și răspunsurile lor corecte (vezi mai jos).',
            '**Cheia seifului**: aplicația face o cheie aleatorie (52 de caractere). **Copiaz-o** sau **descarc-o** și păstreaz-o în siguranță; bifează că ai salvat-o.',
            '**Destinatari** (opțional): persoane care primesc cheia dacă devii inactiv.',
            '**Criptează și salvează**: intrarea este criptată pe dispozitivul tău și abia apoi încărcată.',
          ],
        },
      ],
    },
    {
      id: 'questions',
      title: '5. Cele trei întrebări',
      blocks: [
        {
          list: [
            'Fiecare întrebare are un tip: **o dată**, **text**, **un număr**, **o singură variantă** sau **mai multe variante** (le scrii tu, câte una pe rând).',
            'Introduci răspunsul corect; nu este păstrat niciodată în formă lizibilă, doar ca valoare de verificare.',
            'Răspunsurile text ignoră majusculele, diacriticele și spațiile în plus („Érdi Anna” = „erdi anna”); numerele ignoră zerourile din față.',
            'Întrebările le vede oricine deschide intrarea, deci alege-le pe cele la care pot răspunde doar persoanele potrivite.',
          ],
        },
        {
          tip: 'Fă cel puțin un răspuns greu de ghicit, de exemplu un număr de serie sau o amintire personală; doar o dată de naștere se află ușor.',
        },
      ],
    },
    {
      id: 'key',
      title: '6. Cheia seifului',
      blocks: [
        {
          p: 'Cheia seifului este afișată o singură dată, când creezi intrarea. Intrarea se deschide doar cu cheia **și** cu cele trei răspunsuri.',
        },
        {
          tip: 'Nimeni nu poate recupera o cheie pierdută, nici DevQuake. Păstreaz-o într-un manager de parole sau pe hârtie, într-un loc sigur. Cratimele, spațiile și literele mici nu contează când o scrii.',
        },
      ],
    },
    {
      id: 'recipients',
      title: '7. Destinatarii și eliberarea',
      blocks: [
        {
          list: [
            'Destinatarii sunt persoane din **recomandările tale DevQuake** (pe care le-ai invitat sau care te-au invitat). Au nevoie de un cont DevQuake, nu de aplicație.',
            'Alege după câte **zile sau luni fără activitate** se trimite cheia. Activitate înseamnă orice folosire a DevQuake: autentificare, orice pagină sau aplicație.',
            'Opțional, o zi **înainte de care nu se trimite nimic**, chiar dacă ești inactiv.',
            'Cu câteva zile înainte de eliberare primești un **e-mail de avertizare**; autentificarea sau deschiderea oricărei pagini DevQuake o amână.',
            'La eliberare, fiecare destinatar primește un e-mail cu cheia seifului și un link. Deschide intrarea cu cheia și cu răspunsurile la cele trei întrebări ale tale.',
          ],
        },
        {
          tip: 'Ca să schimbi destinatarii mai târziu, deschide intrarea (sau scrie-i cheia) pe pagina ei și salvează din nou destinatarii. După eliberare nu mai pot fi schimbați.',
        },
      ],
    },
    {
      id: 'opening',
      title: '8. Deschiderea unei intrări și încercările',
      blocks: [
        {
          list: [
            'Scrie cheia seifului și răspunde la cele trei întrebări; conținutul este decriptat pe dispozitivul tău.',
            'Fiecare încercare este înregistrată: cine, când și, la cele greșite, răspunsurile date.',
            'După **3 încercări greșite** intrarea este **blocată 36 de ore** și primești un e-mail. Pe pagina intrării vezi cine a încercat și ce a răspuns și o poți debloca mai devreme.',
            'Ca proprietar poți și **modifica conținutul**; este criptat din nou cu aceeași cheie și aceleași răspunsuri.',
          ],
        },
      ],
    },
    {
      id: 'security',
      title: '9. Cum este protejată',
      blocks: [
        {
          list: [
            'Conținutul este criptat în browserul tău (AES-256), cu o cheie făcută din cheia seifului și din cele trei răspunsuri. Serverul păstrează doar conținutul criptat.',
            'Răspunsurile sunt păstrate doar ca valoare de verificare lentă, iar cheia doar ca valoare de verificare.',
            'Pentru intrările **cu destinatari**, serverul păstrează și cheia seifului, sigilată cu propria cheie secretă, pentru că trebuie s-o poată trimite fără tine. Cineva cu acces complet la server ar putea deci încerca să ghicească răspunsurile: de aceea cel puțin un răspuns ar trebui să fie greu de ghicit.',
            'Intrările private (fără destinatari) nu lasă deloc cheia pe server.',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: '10. Datele tale',
      blocks: [
        {
          p: 'Când îți ștergi contul DevQuake sau te dezabonezi de la aplicație, intrările tale, încercările lor și locul tău ca destinatar la intrările altora sunt șterse definitiv.',
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie-ne la {email}.',
  back: '← Înapoi la seiful tău',
};

const hu: Manual = {
  metaTitle: 'Útmutató · Széfem',
  metaDescription:
    'Őrizz meg privát adatokat széfkulccsal és három kérdéssel titkosítva, csak magadnak, vagy az általad választott embereknek arra az esetre, ha inaktívvá válnál.',
  ogTitle: 'Széfem: útmutató',
  cta: 'Kipróbálnád? A Széfem a DevQuake tagjainak szóló alkalmazás. {link}, majd iratkozz fel az alkalmazásra.',
  ctaLink: 'Hozz létre fiókot vagy jelentkezz be',
  kicker: 'Széfem · Útmutató',
  title: 'Így használd a széfedet',
  intro:
    'A Széfem titkosítva őrzi a privát adatokat. Minden bejegyzés csak a széfkulcsával és az általad választott három kérdés válaszaival nyílik meg. Maradhat csak a tiéd, vagy eljuthat azokhoz, akikben megbízol, ha egy ideig nem használtad a DevQuake-et.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Első lépések',
      blocks: [
        {
          steps: [
            'Jelentkezz be a {host} oldalon (vagy hozz létre fiókot, és erősítsd meg az e-mail-címed).',
            'Nyisd meg a **Fiókod → Elérhető projektek** részt, és **iratkozz fel** a „Széfem” alkalmazásra.',
            'Nyisd meg az alkalmazást, és válaszd az **Új bejegyzés** gombot.',
          ],
        },
      ],
    },
    {
      id: 'what',
      title: '2. Mit tartalmazhat egy bejegyzés',
      blocks: [
        {
          p: 'Minden bejegyzésnek van **jegyzete**, **titkos mezői** (egy címke és egy rejtett érték) és **fájljai**, mind együtt titkosítva. Például:',
        },
        {
          list: [
            '**Belépések és jelszavak**: netbank, e-mail, a jelszókezelő mesterjelszavának emlékeztetője.',
            '**Kripto és helyreállítás**: tárcák seed-kifejezései, kétlépcsős azonosítás helyreállító kódjai.',
            '**Bank és pénzügyek**: számla- és kártyaadatok, PIN-kódok, széf- vagy riasztókódok, biztosítási és nyugdíjszámok.',
            '**Igazolványok és iratok**: személyi és útlevélszámok, végrendelet, okiratok vagy szerződések szkennelt képe (fájlok).',
            '**Kívánságok és utasítások**: egy levél, hol vannak a fontos dolgok, kit kell először felhívni (ügyvéd, közjegyző, könyvelő).',
            '**Bármi más** privát: egy naplóoldal, egészségügyi adatok, fotók vagy egy rövid hangüzenet.',
          ],
        },
        {
          tip: 'A **cím** és a **kategória** nincs titkosítva: megjelenik a listákban és a címzetteknek küldött e-mailben. Maradjon általános a cím („A családnak”, nem a PIN).',
        },
      ],
    },
    {
      id: 'private',
      title: '3. Csak neked szóló bejegyzések',
      blocks: [
        {
          p: 'A címzett nélküli bejegyzés **örökre privát**: a kulcsát soha senkinek nem küldjük el, és a szerver meg sem őrzi. Jó felhasználások:',
        },
        {
          list: [
            'Saját biztonsági mentésed a helyreállító kódokról és seed-kifejezésekről, az eszközeidtől külön.',
            'Amit nem akarsz egy hétköznapi jegyzetalkalmazásban: egészségügyi jegyzetek, napló, egy titok.',
            'Érzékeny iratok csak magadnak: tárgyalás alatt álló szerződések, szkennelt papírok.',
            'Egy „levél a jövőbeli önmagamnak”, vagy piszkozatok, amelyeket később megosztanál: címzetteket bármikor hozzáadhatsz.',
          ],
        },
      ],
    },
    {
      id: 'create',
      title: '4. Bejegyzés létrehozása',
      blocks: [
        {
          steps: [
            '**Tartalom**: cím, kategória, valamint jegyzet, titkos mezők és fájlok.',
            '**Kérdések**: három kérdés és a helyes válaszok (lásd lent).',
            '**Széfkulcs**: az alkalmazás véletlenszerű kulcsot készít (52 karakter). **Másold ki** vagy **töltsd le**, és őrizd biztonságban; jelöld be, hogy elmentetted.',
            '**Címzettek** (nem kötelező): akik megkapják a kulcsot, ha inaktívvá válsz.',
            '**Titkosítás és mentés**: a bejegyzést az eszközödön titkosítjuk, és csak utána töltjük fel.',
          ],
        },
      ],
    },
    {
      id: 'questions',
      title: '5. A három kérdés',
      blocks: [
        {
          list: [
            'Minden kérdésnek van típusa: **dátum**, **szöveg**, **szám**, **egy választás** vagy **több választás** (a lehetőségeket te írod, soronként egyet).',
            'Megadod a helyes választ; soha nem tároljuk olvasható formában, csak ellenőrző értékként.',
            'A szöveges válaszoknál nem számít a kis- és nagybetű, az ékezet és a felesleges szóköz („Érdi Anna” = „erdi anna”); a számoknál a kezdő nullák sem.',
            'A kérdéseket mindenki látja, aki megnyitja a bejegyzést, ezért olyanokat válassz, amelyekre csak a megfelelő emberek tudnak felelni.',
          ],
        },
        {
          tip: 'Legalább egy válasz legyen nehezen kitalálható, például egy sorozatszám vagy egy személyes emlék; egy születési dátum önmagában könnyen kideríthető.',
        },
      ],
    },
    {
      id: 'key',
      title: '6. A széfkulcs',
      blocks: [
        {
          p: 'A széfkulcs egyszer jelenik meg, a bejegyzés létrehozásakor. A bejegyzés csak a kulccsal **és** a három válasszal nyílik meg.',
        },
        {
          tip: 'Az elveszett kulcsot senki sem tudja visszaállítani, a DevQuake sem. Tartsd jelszókezelőben vagy papíron, biztonságos helyen. Begépeléskor a kötőjelek, szóközök és kisbetűk nem számítanak.',
        },
      ],
    },
    {
      id: 'recipients',
      title: '7. Címzettek és a kiadás',
      blocks: [
        {
          list: [
            'Címzett a **DevQuake-ajánlásaid** közül lehet (akiket meghívtál, vagy akik téged meghívtak). DevQuake-fiók kell nekik, az alkalmazás nem.',
            'Válaszd ki, hány **nap vagy hónap inaktivitás** után küldjük el a kulcsot. Aktivitás a DevQuake bármilyen használata: bejelentkezés, bármely oldal vagy alkalmazás.',
            'Nem kötelezően egy nap, **amely előtt semmit sem küldünk**, akkor sem, ha inaktív vagy.',
            'A kiadás előtt néhány nappal **figyelmeztető e-mailt** kapsz; egy bejelentkezés vagy bármely DevQuake-oldal megnyitása elhalasztja.',
            'A kiadáskor minden címzett e-mailt kap a széfkulccsal és egy linkkel. A kulccsal és a három kérdésed válaszaival nyitja meg a bejegyzést.',
          ],
        },
        {
          tip: 'A címzettek későbbi módosításához nyisd meg a bejegyzést (vagy írd be a kulcsát) az oldalán, és mentsd újra a címzetteket. A kiadás után már nem módosíthatók.',
        },
      ],
    },
    {
      id: 'opening',
      title: '8. Bejegyzés megnyitása és a próbálkozások',
      blocks: [
        {
          list: [
            'Írd be a széfkulcsot, és válaszolj a három kérdésre; a tartalmat az eszközödön fejtjük vissza.',
            'Minden próbálkozást rögzítünk: ki, mikor, és a hibásaknál a megadott válaszokat.',
            '**3 hibás próbálkozás** után a bejegyzés **36 órára zárolódik**, és e-mailt kapsz. A bejegyzés oldalán látod, ki próbálkozott és mit válaszolt, és korábban is feloldhatod.',
            'Tulajdonosként **módosíthatod a tartalmat** is; ugyanazzal a kulccsal és válaszokkal titkosítjuk újra.',
          ],
        },
      ],
    },
    {
      id: 'security',
      title: '9. Hogyan védjük',
      blocks: [
        {
          list: [
            'A tartalmat a böngésződben titkosítjuk (AES-256), a széfkulcsból és a három válaszból képzett kulccsal. A szerver csak a titkosított tartalmat tárolja.',
            'A válaszokat csak lassú ellenőrző értékként, a kulcsot csak ellenőrző értékként tároljuk.',
            'A **címzettes** bejegyzéseknél a szerver a széfkulcsot is megőrzi, a saját titkos kulcsával lepecsételve, mert nélküled is el kell tudnia küldeni. Aki teljes hozzáférést szerez a szerverhez, megpróbálhatná kitalálni a válaszokat: ezért legalább egy válasz legyen nehezen kitalálható.',
            'A privát (címzett nélküli) bejegyzések egyáltalán nem hagynak kulcsot a szerveren.',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: '10. Az adataid',
      blocks: [
        {
          p: 'Ha törlöd a DevQuake-fiókodat, vagy leiratkozol az alkalmazásról, a bejegyzéseid, azok próbálkozásai és a címzetti helyed mások bejegyzéseinél véglegesen törlődnek.',
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj ide: {email}.',
  back: '← Vissza a széfedhez',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu };
