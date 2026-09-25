import { defineMessages } from '../define';

/** Sign in, sign up, the emailed code, activation. */
export const auth = defineMessages(
  {
    tabs: { signIn: 'Sign in', createAccount: 'Create account' },
    invitedBy: '{name} invited you to DevQuake. Create your free account below.',
    continueTo: 'Sign in to continue to {site}.',
    checkInbox: {
      title: 'Check your inbox',
      body: 'We sent a welcome email to {email}. Open the {link} link in it, then sign in here.',
      link: 'Activate my account',
      spam: 'Nothing arrived after a few minutes? Check your spam folder, or sign in with your email and password: we will send you a new activation link.',
      goToSignIn: 'Go to sign in',
    },
    email: 'Email',
    password: 'Password',
    checking: 'Checking…',
    continue: 'Continue',
    codeNote: 'We will email you a one-time code to finish signing in.',
    signup: {
      name: 'Name',
      email: 'Email',
      password: 'Password (at least {min} characters)',
      repeat: 'Repeat password',
      match: '✓ Passwords match',
      creating: 'Creating…',
      create: 'Create account',
      note: 'We will email you a link to activate your account.',
      privacyNote:
        'For security we record the time, IP address, approximate location, browser and device of every sign-up and sign-in.',
      privacy: 'Privacy policy',
      errors: {
        name: 'Please enter your name.',
        email: 'Enter a valid email address, like name@example.com.',
        password: 'Use at least {min} characters ({length}/{min}).',
        mismatch: 'The passwords do not match.',
      },
    },
    errors: {
      invalid:
        'Wrong email or password. After 3 failed attempts in a row the account is locked for {hours} hours.',
      locked: 'Too many failed attempts. This account is locked for {hours} hours.',
      throttled: 'Too many attempts from your network. Try again later.',
      disabled: 'This account is disabled. Contact {email}.',
      mail: 'We could not send the email with your code. Try again, or contact {email}.',
      exists: 'An account with this email already exists. Sign in instead.',
      weakPassword: 'Use a password with at least {min} characters.',
      badInput: 'Enter your name and a valid email address.',
      notActivated:
        'Your account is not activated yet. We emailed you an activation link: open it, then sign in here.',
      unavailable: 'Sign-in is temporarily unavailable. Please try again in a moment.',
      mismatch: 'The passwords do not match.',
      codeFormat: 'Enter the 6-digit code from the email.',
      codeWrong: {
        one: 'That code is not correct. {count} try left.',
        other: 'That code is not correct. {count} tries left.',
      },
      codeExhausted: 'Too many wrong codes. Sign in again to get a new one.',
      codeExpired: 'This code has expired. Sign in again to get a new one.',
      cooldown: 'Please wait {seconds} seconds before asking for a new code.',
      resendLimit: 'No more codes can be sent for this sign-in. Sign in again.',
      signInExpired: 'This sign-in has expired. Sign in again.',
    },
    resent: 'We sent you a new code. The previous one no longer works.',
    verify: {
      metaTitle: 'Enter your code',
      title: 'Check your email',
      confirm:
        'To confirm your address, enter the code we sent to {email}. It expires in {minutes} minutes.',
      finish:
        'To finish signing in, enter the code we sent to {email}. It expires in {minutes} minutes.',
      none: 'There is no sign-in waiting for a code in this browser, or it has expired. {link}.',
      signInAgain: 'Sign in again',
      code: '6-digit code',
      verify: 'Verify and continue',
      sending: 'Sending…',
      resend: 'Send me a new code',
    },
    notices: {
      activated: 'Your account is active. Sign in to continue.',
      alreadyActive: 'Your account is already active. Sign in to continue.',
      activationExpired:
        'This activation link has expired. Sign in with your email and password and we will send you a new one.',
      activationInvalid:
        'This activation link is not valid. Sign in with your email and password to get a new one.',
      deleted:
        'Your account and your personal data were deleted. Goodbye, and you are always welcome back.',
    },
  },
  {
    de: {
      tabs: { signIn: 'Anmelden', createAccount: 'Konto erstellen' },
      invitedBy: '{name} hat dich zu DevQuake eingeladen. Erstelle unten dein kostenloses Konto.',
      continueTo: 'Melde dich an, um zu {site} weiterzugehen.',
      checkInbox: {
        title: 'Sieh in dein Postfach',
        body: 'Wir haben eine Willkommens-E-Mail an {email} geschickt. Öffne darin den Link {link} und melde dich dann hier an.',
        link: 'Mein Konto aktivieren',
        spam: 'Nach ein paar Minuten ist nichts angekommen? Sieh im Spam-Ordner nach oder melde dich mit E-Mail und Passwort an: Wir schicken dir dann einen neuen Aktivierungslink.',
        goToSignIn: 'Zur Anmeldung',
      },
      email: 'E-Mail',
      password: 'Passwort',
      checking: 'Wird geprüft…',
      continue: 'Weiter',
      codeNote: 'Wir schicken dir einen Einmalcode per E-Mail, um die Anmeldung abzuschließen.',
      signup: {
        name: 'Name',
        email: 'E-Mail',
        password: 'Passwort (mindestens {min} Zeichen)',
        repeat: 'Passwort wiederholen',
        match: '✓ Die Passwörter stimmen überein',
        creating: 'Wird erstellt…',
        create: 'Konto erstellen',
        note: 'Wir schicken dir einen Link per E-Mail, um dein Konto zu aktivieren.',
        privacyNote:
          'Zur Sicherheit speichern wir bei jeder Registrierung und Anmeldung Zeit, IP-Adresse, ungefähren Standort, Browser und Gerät.',
        privacy: 'Datenschutzerklärung',
        errors: {
          name: 'Bitte gib deinen Namen ein.',
          email: 'Gib eine gültige E-Mail-Adresse ein, zum Beispiel name@beispiel.de.',
          password: 'Verwende mindestens {min} Zeichen ({length}/{min}).',
          mismatch: 'Die Passwörter stimmen nicht überein.',
        },
      },
      errors: {
        invalid:
          'E-Mail oder Passwort ist falsch. Nach 3 Fehlversuchen in Folge wird das Konto für {hours} Stunden gesperrt.',
        locked: 'Zu viele Fehlversuche. Dieses Konto ist für {hours} Stunden gesperrt.',
        throttled: 'Zu viele Versuche aus deinem Netzwerk. Versuche es später erneut.',
        disabled: 'Dieses Konto ist deaktiviert. Wende dich an {email}.',
        mail: 'Wir konnten die E-Mail mit deinem Code nicht senden. Versuche es erneut oder wende dich an {email}.',
        exists: 'Es gibt bereits ein Konto mit dieser E-Mail-Adresse. Melde dich stattdessen an.',
        weakPassword: 'Verwende ein Passwort mit mindestens {min} Zeichen.',
        badInput: 'Gib deinen Namen und eine gültige E-Mail-Adresse ein.',
        notActivated:
          'Dein Konto ist noch nicht aktiviert. Wir haben dir einen Aktivierungslink geschickt: Öffne ihn und melde dich dann hier an.',
        unavailable:
          'Die Anmeldung ist vorübergehend nicht verfügbar. Bitte versuche es gleich noch einmal.',
        mismatch: 'Die Passwörter stimmen nicht überein.',
        codeFormat: 'Gib den 6-stelligen Code aus der E-Mail ein.',
        codeWrong: {
          one: 'Der Code ist nicht richtig. Noch {count} Versuch.',
          other: 'Der Code ist nicht richtig. Noch {count} Versuche.',
        },
        codeExhausted: 'Zu viele falsche Codes. Melde dich erneut an, um einen neuen zu erhalten.',
        codeExpired:
          'Dieser Code ist abgelaufen. Melde dich erneut an, um einen neuen zu erhalten.',
        cooldown: 'Bitte warte {seconds} Sekunden, bevor du einen neuen Code anforderst.',
        resendLimit:
          'Für diese Anmeldung können keine weiteren Codes gesendet werden. Melde dich erneut an.',
        signInExpired: 'Diese Anmeldung ist abgelaufen. Melde dich erneut an.',
      },
      resent: 'Wir haben dir einen neuen Code geschickt. Der vorherige gilt nicht mehr.',
      verify: {
        metaTitle: 'Code eingeben',
        title: 'Sieh in deine E-Mails',
        confirm:
          'Um deine Adresse zu bestätigen, gib den Code ein, den wir an {email} geschickt haben. Er ist {minutes} Minuten gültig.',
        finish:
          'Um die Anmeldung abzuschließen, gib den Code ein, den wir an {email} geschickt haben. Er ist {minutes} Minuten gültig.',
        none: 'In diesem Browser wartet keine Anmeldung auf einen Code, oder sie ist abgelaufen. {link}.',
        signInAgain: 'Erneut anmelden',
        code: '6-stelliger Code',
        verify: 'Bestätigen und weiter',
        sending: 'Wird gesendet…',
        resend: 'Neuen Code senden',
      },
      notices: {
        activated: 'Dein Konto ist aktiv. Melde dich an, um fortzufahren.',
        alreadyActive: 'Dein Konto ist bereits aktiv. Melde dich an, um fortzufahren.',
        activationExpired:
          'Dieser Aktivierungslink ist abgelaufen. Melde dich mit E-Mail und Passwort an, dann schicken wir dir einen neuen.',
        activationInvalid:
          'Dieser Aktivierungslink ist ungültig. Melde dich mit E-Mail und Passwort an, um einen neuen zu erhalten.',
        deleted:
          'Dein Konto und deine persönlichen Daten wurden gelöscht. Auf Wiedersehen, du bist jederzeit wieder willkommen.',
      },
    },
    ro: {
      tabs: { signIn: 'Autentificare', createAccount: 'Creează cont' },
      invitedBy: '{name} te-a invitat pe DevQuake. Creează-ți mai jos contul gratuit.',
      continueTo: 'Autentifică-te ca să continui spre {site}.',
      checkInbox: {
        title: 'Verifică-ți căsuța de e-mail',
        body: 'Am trimis un e-mail de bun venit la {email}. Deschide în el linkul {link}, apoi autentifică-te aici.',
        link: 'Activează-mi contul',
        spam: 'Nu a sosit nimic după câteva minute? Uită-te în dosarul de spam sau autentifică-te cu e-mailul și parola: îți trimitem un nou link de activare.',
        goToSignIn: 'Mergi la autentificare',
      },
      email: 'E-mail',
      password: 'Parolă',
      checking: 'Se verifică…',
      continue: 'Continuă',
      codeNote: 'Îți trimitem pe e-mail un cod unic pentru a finaliza autentificarea.',
      signup: {
        name: 'Nume',
        email: 'E-mail',
        password: 'Parolă (cel puțin {min} caractere)',
        repeat: 'Repetă parola',
        match: '✓ Parolele coincid',
        creating: 'Se creează…',
        create: 'Creează cont',
        note: 'Îți trimitem pe e-mail un link pentru activarea contului.',
        privacyNote:
          'Pentru securitate înregistrăm ora, adresa IP, locația aproximativă, browserul și dispozitivul la fiecare înregistrare și autentificare.',
        privacy: 'Politica de confidențialitate',
        errors: {
          name: 'Te rugăm să îți introduci numele.',
          email: 'Introdu o adresă de e-mail validă, de exemplu nume@exemplu.ro.',
          password: 'Folosește cel puțin {min} caractere ({length}/{min}).',
          mismatch: 'Parolele nu coincid.',
        },
      },
      errors: {
        invalid:
          'E-mail sau parolă greșită. După 3 încercări eșuate la rând contul se blochează pentru {hours} ore.',
        locked: 'Prea multe încercări eșuate. Contul este blocat pentru {hours} ore.',
        throttled: 'Prea multe încercări din rețeaua ta. Încearcă mai târziu.',
        disabled: 'Acest cont este dezactivat. Scrie-ne la {email}.',
        mail: 'Nu am putut trimite e-mailul cu codul. Încearcă din nou sau scrie-ne la {email}.',
        exists: 'Există deja un cont cu acest e-mail. Autentifică-te.',
        weakPassword: 'Folosește o parolă de cel puțin {min} caractere.',
        badInput: 'Introdu numele și o adresă de e-mail validă.',
        notActivated:
          'Contul tău nu este încă activat. Ți-am trimis pe e-mail un link de activare: deschide-l, apoi autentifică-te aici.',
        unavailable:
          'Autentificarea nu este disponibilă momentan. Te rugăm să încerci din nou peste puțin timp.',
        mismatch: 'Parolele nu coincid.',
        codeFormat: 'Introdu codul de 6 cifre din e-mail.',
        codeWrong: {
          one: 'Codul nu este corect. Mai ai {count} încercare.',
          few: 'Codul nu este corect. Mai ai {count} încercări.',
          other: 'Codul nu este corect. Mai ai {count} de încercări.',
        },
        codeExhausted: 'Prea multe coduri greșite. Autentifică-te din nou pentru un cod nou.',
        codeExpired: 'Acest cod a expirat. Autentifică-te din nou pentru un cod nou.',
        cooldown: 'Te rugăm să aștepți {seconds} secunde înainte de a cere un cod nou.',
        resendLimit:
          'Nu se mai pot trimite coduri pentru această autentificare. Autentifică-te din nou.',
        signInExpired: 'Această autentificare a expirat. Autentifică-te din nou.',
      },
      resent: 'Ți-am trimis un cod nou. Cel anterior nu mai este valabil.',
      verify: {
        metaTitle: 'Introdu codul',
        title: 'Verifică-ți e-mailul',
        confirm:
          'Ca să îți confirmi adresa, introdu codul trimis la {email}. Expiră în {minutes} minute.',
        finish:
          'Ca să finalizezi autentificarea, introdu codul trimis la {email}. Expiră în {minutes} minute.',
        none: 'Nicio autentificare nu așteaptă un cod în acest browser sau a expirat. {link}.',
        signInAgain: 'Autentifică-te din nou',
        code: 'Codul de 6 cifre',
        verify: 'Verifică și continuă',
        sending: 'Se trimite…',
        resend: 'Trimite-mi un cod nou',
      },
      notices: {
        activated: 'Contul tău este activ. Autentifică-te ca să continui.',
        alreadyActive: 'Contul tău este deja activ. Autentifică-te ca să continui.',
        activationExpired:
          'Acest link de activare a expirat. Autentifică-te cu e-mailul și parola și îți trimitem unul nou.',
        activationInvalid:
          'Acest link de activare nu este valid. Autentifică-te cu e-mailul și parola ca să primești unul nou.',
        deleted:
          'Contul și datele tale personale au fost șterse. La revedere, ești oricând binevenit înapoi.',
      },
    },
    hu: {
      tabs: { signIn: 'Bejelentkezés', createAccount: 'Fiók létrehozása' },
      invitedBy: '{name} meghívott a DevQuake-re. Hozd létre lent az ingyenes fiókodat.',
      continueTo: 'Jelentkezz be a továbblépéshez: {site}.',
      checkInbox: {
        title: 'Nézd meg a postafiókodat',
        body: 'Üdvözlő e-mailt küldtünk ide: {email}. Nyisd meg benne a(z) {link} linket, majd jelentkezz be itt.',
        link: 'Fiókom aktiválása',
        spam: 'Pár perc után sem jött semmi? Nézd meg a spam mappát, vagy jelentkezz be az e-mail-címeddel és jelszavaddal: küldünk új aktiváló linket.',
        goToSignIn: 'Tovább a bejelentkezéshez',
      },
      email: 'E-mail',
      password: 'Jelszó',
      checking: 'Ellenőrzés…',
      continue: 'Tovább',
      codeNote: 'A bejelentkezés befejezéséhez egyszer használatos kódot küldünk e-mailben.',
      signup: {
        name: 'Név',
        email: 'E-mail',
        password: 'Jelszó (legalább {min} karakter)',
        repeat: 'Jelszó újra',
        match: '✓ A jelszavak egyeznek',
        creating: 'Létrehozás…',
        create: 'Fiók létrehozása',
        note: 'E-mailben küldünk egy linket a fiókod aktiválásához.',
        privacyNote:
          'Biztonsági okokból minden regisztrációnál és bejelentkezésnél rögzítjük az időt, az IP-címet, a hozzávetőleges helyet, a böngészőt és az eszközt.',
        privacy: 'Adatvédelmi tájékoztató',
        errors: {
          name: 'Kérjük, add meg a neved.',
          email: 'Adj meg egy érvényes e-mail-címet, például nev@pelda.hu.',
          password: 'Legalább {min} karaktert használj ({length}/{min}).',
          mismatch: 'A jelszavak nem egyeznek.',
        },
      },
      errors: {
        invalid:
          'Hibás e-mail-cím vagy jelszó. 3 egymást követő sikertelen próbálkozás után a fiókot {hours} órára zároljuk.',
        locked: 'Túl sok sikertelen próbálkozás. A fiók {hours} órára zárolva van.',
        throttled: 'Túl sok próbálkozás a hálózatodról. Próbáld újra később.',
        disabled: 'Ez a fiók le van tiltva. Írj nekünk: {email}.',
        mail: 'Nem sikerült elküldeni a kódot tartalmazó e-mailt. Próbáld újra, vagy írj nekünk: {email}.',
        exists: 'Ezzel az e-mail-címmel már van fiók. Jelentkezz be inkább.',
        weakPassword: 'Legalább {min} karakteres jelszót használj.',
        badInput: 'Add meg a neved és egy érvényes e-mail-címet.',
        notActivated:
          'A fiókod még nincs aktiválva. E-mailben küldtünk egy aktiváló linket: nyisd meg, majd jelentkezz be itt.',
        unavailable: 'A bejelentkezés átmenetileg nem érhető el. Próbáld újra egy kis idő múlva.',
        mismatch: 'A jelszavak nem egyeznek.',
        codeFormat: 'Add meg az e-mailben kapott 6 jegyű kódot.',
        codeWrong: {
          one: 'A kód nem helyes. Még {count} próbálkozásod van.',
          other: 'A kód nem helyes. Még {count} próbálkozásod van.',
        },
        codeExhausted: 'Túl sok hibás kód. Jelentkezz be újra, hogy új kódot kapj.',
        codeExpired: 'Ez a kód lejárt. Jelentkezz be újra, hogy új kódot kapj.',
        cooldown: 'Várj {seconds} másodpercet, mielőtt új kódot kérsz.',
        resendLimit: 'Ehhez a bejelentkezéshez több kód nem küldhető. Jelentkezz be újra.',
        signInExpired: 'Ez a bejelentkezés lejárt. Jelentkezz be újra.',
      },
      resent: 'Új kódot küldtünk. Az előző már nem érvényes.',
      verify: {
        metaTitle: 'Kód megadása',
        title: 'Nézd meg az e-mailjeidet',
        confirm:
          'A címed megerősítéséhez add meg a kódot, amelyet ide küldtünk: {email}. {minutes} perc múlva lejár.',
        finish:
          'A bejelentkezés befejezéséhez add meg a kódot, amelyet ide küldtünk: {email}. {minutes} perc múlva lejár.',
        none: 'Ebben a böngészőben nincs kódra váró bejelentkezés, vagy már lejárt. {link}.',
        signInAgain: 'Jelentkezz be újra',
        code: '6 jegyű kód',
        verify: 'Ellenőrzés és tovább',
        sending: 'Küldés…',
        resend: 'Új kódot kérek',
      },
      notices: {
        activated: 'A fiókod aktív. Jelentkezz be a folytatáshoz.',
        alreadyActive: 'A fiókod már aktív. Jelentkezz be a folytatáshoz.',
        activationExpired:
          'Ez az aktiváló link lejárt. Jelentkezz be az e-mail-címeddel és jelszavaddal, és küldünk újat.',
        activationInvalid:
          'Ez az aktiváló link nem érvényes. Jelentkezz be az e-mail-címeddel és jelszavaddal, hogy újat kapj.',
        deleted:
          'A fiókodat és a személyes adataidat töröltük. Viszlát, bármikor szívesen látunk újra.',
      },
    },
  },
);
