import { defineMessages } from './define';

/** API errors, field names and the emails. */
export const appTexts = defineMessages(
  {
    errors: {
      signIn: 'Please sign in to DevQuake first.',
      unavailable: 'The vault is not available right now. Please try again later.',
      generic: 'Something went wrong (error {status}). Please try again.',
      genericShort: 'Something went wrong. Please try again.',
      notFound: 'Not found.',
      invalidRequest: 'This request is not valid.',
      required: '{field} is required.',
      tooLong: '{field} can be at most {max} characters long.',
      threeQuestions: 'An entry needs exactly three questions.',
      options: 'Question {n} needs 2 to 12 different choices.',
      answersInvalid: 'Every question needs a valid right answer.',
      tooLarge: 'The entry is too large.',
      inactiveDays: 'Choose between {min} and {max} days.',
      date: 'Choose a valid date.',
      tooManyRecipients: 'At most {max} recipients.',
      entryNotFound: 'This entry does not exist or you cannot open it.',
      locked:
        'This entry is locked after 3 wrong tries (for {hours} hours, or until its owner unlocks it).',
      lockedNow:
        'Wrong again: the entry is now locked for {hours} hours. Its owner will see the tries.',
      wrongKeyOrAnswers: {
        one: 'The vault key or an answer is wrong. {left} try left before the entry is locked.',
        other: 'The vault key or an answer is wrong. {left} tries left before the entry is locked.',
      },
      referralOnly: 'Recipients can only be people from your DevQuake referrals.',
      wrongKey: 'This is not the vault key of this entry.',
      alreadyReleased: 'This entry was already released; its recipients cannot change any more.',
    },
    fields: {
      title: 'Title',
      question: 'Question',
      option: 'Choice',
    },
    mail: {
      footer: 'You get this email from My vault on DevQuake.',
      warnSubject: 'Your vault entry “{title}” will be sent soon',
      warnPreheader: {
        one: 'Sent to its recipients in about {count} day',
        other: 'Sent to its recipients in about {count} days',
      },
      warnHeading: 'Still there?',
      warnBody: {
        one: 'You have not used DevQuake for a while. In about {count} day, the vault key of “{title}” will be sent to the recipients you chose.',
        other:
          'You have not used DevQuake for a while. In about {count} days, the vault key of “{title}” will be sent to the recipients you chose.',
      },
      warnAction: 'To postpone it, simply sign in or open any DevQuake page or app.',
      warnButton: 'Open my vault',
      releaseSubject: '{name} left you a vault entry',
      releasePreheader: '“{title}” can now be opened',
      releaseHeading: '{name} left you something in their vault',
      releaseBody:
        '{name} chose you to receive the vault entry “{title}” if they were inactive for a while. That has now happened.',
      releaseHow:
        'Open it with the vault key below and the answers to three questions only people close to {name} should know. Sign in with your DevQuake account; every try is recorded and after 3 wrong tries it is locked for a while.',
      releaseKeep: 'Keep this email private: the key is part of what opens the entry.',
      entry: 'Entry',
      vaultKey: 'Vault key',
      releaseButton: 'Open the entry',
      lockSubject: 'Your vault entry “{title}” was locked',
      lockPreheader: 'Three wrong tries to open it',
      lockHeading: 'Someone tried to open your entry',
      lockBody:
        'Three wrong tries were made to open “{title}”. It is locked for {hours} hours, or until you unlock it.',
      lockAction: 'See who tried and which answers they gave, then unlock it if you want.',
      lockButton: 'Review the tries',
    },
  },
  {
    de: {
      errors: {
        signIn: 'Bitte melde dich zuerst bei DevQuake an.',
        unavailable: 'Der Tresor ist gerade nicht verfügbar. Bitte versuche es später noch einmal.',
        generic: 'Etwas ist schiefgelaufen (Fehler {status}). Bitte versuche es noch einmal.',
        genericShort: 'Etwas ist schiefgelaufen. Bitte versuche es noch einmal.',
        notFound: 'Nicht gefunden.',
        invalidRequest: 'Diese Anfrage ist ungültig.',
        required: '{field} ist erforderlich.',
        tooLong: '{field} darf höchstens {max} Zeichen lang sein.',
        threeQuestions: 'Ein Eintrag braucht genau drei Fragen.',
        options: 'Frage {n} braucht 2 bis 12 verschiedene Auswahlmöglichkeiten.',
        answersInvalid: 'Jede Frage braucht eine gültige richtige Antwort.',
        tooLarge: 'Der Eintrag ist zu groß.',
        inactiveDays: 'Wähle zwischen {min} und {max} Tagen.',
        date: 'Wähle ein gültiges Datum.',
        tooManyRecipients: 'Höchstens {max} Empfänger.',
        entryNotFound: 'Diesen Eintrag gibt es nicht, oder du kannst ihn nicht öffnen.',
        locked:
          'Dieser Eintrag ist nach 3 falschen Versuchen gesperrt (für {hours} Stunden oder bis sein Besitzer ihn entsperrt).',
        lockedNow:
          'Wieder falsch: Der Eintrag ist jetzt für {hours} Stunden gesperrt. Sein Besitzer sieht die Versuche.',
        wrongKeyOrAnswers: {
          one: 'Der Tresorschlüssel oder eine Antwort ist falsch. Noch {left} Versuch, bevor der Eintrag gesperrt wird.',
          other:
            'Der Tresorschlüssel oder eine Antwort ist falsch. Noch {left} Versuche, bevor der Eintrag gesperrt wird.',
        },
        referralOnly: 'Empfänger können nur Personen aus deinen DevQuake-Empfehlungen sein.',
        wrongKey: 'Das ist nicht der Tresorschlüssel dieses Eintrags.',
        alreadyReleased:
          'Dieser Eintrag wurde bereits freigegeben; seine Empfänger lassen sich nicht mehr ändern.',
      },
      fields: {
        title: 'Titel',
        question: 'Frage',
        option: 'Auswahl',
      },
      mail: {
        footer: 'Du bekommst diese E-Mail von „Mein Tresor“ auf DevQuake.',
        warnSubject: 'Dein Tresoreintrag „{title}“ wird bald gesendet',
        warnPreheader: {
          one: 'Geht in etwa {count} Tag an seine Empfänger',
          other: 'Geht in etwa {count} Tagen an seine Empfänger',
        },
        warnHeading: 'Noch da?',
        warnBody: {
          one: 'Du hast DevQuake eine Weile nicht genutzt. In etwa {count} Tag wird der Tresorschlüssel von „{title}“ an die gewählten Empfänger gesendet.',
          other:
            'Du hast DevQuake eine Weile nicht genutzt. In etwa {count} Tagen wird der Tresorschlüssel von „{title}“ an die gewählten Empfänger gesendet.',
        },
        warnAction:
          'Um das aufzuschieben, melde dich einfach an oder öffne irgendeine DevQuake-Seite oder -App.',
        warnButton: 'Meinen Tresor öffnen',
        releaseSubject: '{name} hat dir einen Tresoreintrag hinterlassen',
        releasePreheader: '„{title}“ kann jetzt geöffnet werden',
        releaseHeading: '{name} hat dir etwas in seinem Tresor hinterlassen',
        releaseBody:
          '{name} hat dich als Empfänger des Tresoreintrags „{title}“ gewählt, falls er oder sie eine Weile inaktiv ist. Das ist jetzt eingetreten.',
        releaseHow:
          'Öffne ihn mit dem Tresorschlüssel unten und den Antworten auf drei Fragen, die nur Menschen kennen sollten, die {name} nahestehen. Melde dich mit deinem DevQuake-Konto an; jeder Versuch wird festgehalten, und nach 3 falschen Versuchen ist er eine Weile gesperrt.',
        releaseKeep:
          'Halte diese E-Mail privat: Der Schlüssel ist ein Teil dessen, was den Eintrag öffnet.',
        entry: 'Eintrag',
        vaultKey: 'Tresorschlüssel',
        releaseButton: 'Eintrag öffnen',
        lockSubject: 'Dein Tresoreintrag „{title}“ wurde gesperrt',
        lockPreheader: 'Drei falsche Versuche, ihn zu öffnen',
        lockHeading: 'Jemand hat versucht, deinen Eintrag zu öffnen',
        lockBody:
          'Es gab drei falsche Versuche, „{title}“ zu öffnen. Er ist für {hours} Stunden gesperrt oder bis du ihn entsperrst.',
        lockAction:
          'Sieh nach, wer es versucht hat und welche Antworten gegeben wurden, und entsperre ihn, wenn du willst.',
        lockButton: 'Versuche ansehen',
      },
    },
    ro: {
      errors: {
        signIn: 'Te rugăm să te autentifici mai întâi pe DevQuake.',
        unavailable: 'Seiful nu este disponibil acum. Te rugăm să încerci din nou mai târziu.',
        generic: 'Ceva nu a mers bine (eroarea {status}). Te rugăm să încerci din nou.',
        genericShort: 'Ceva nu a mers bine. Te rugăm să încerci din nou.',
        notFound: 'Nu a fost găsit.',
        invalidRequest: 'Această cerere nu este validă.',
        required: '{field} este obligatoriu.',
        tooLong: '{field} poate avea cel mult {max} caractere.',
        threeQuestions: 'O intrare are nevoie de exact trei întrebări.',
        options: 'Întrebarea {n} are nevoie de 2 până la 12 variante diferite.',
        answersInvalid: 'Fiecare întrebare are nevoie de un răspuns corect valid.',
        tooLarge: 'Intrarea este prea mare.',
        inactiveDays: 'Alege între {min} și {max} de zile.',
        date: 'Alege o dată validă.',
        tooManyRecipients: 'Cel mult {max} destinatari.',
        entryNotFound: 'Această intrare nu există sau nu o poți deschide.',
        locked:
          'Această intrare este blocată după 3 încercări greșite (pentru {hours} de ore sau până când proprietarul o deblochează).',
        lockedNow:
          'Din nou greșit: intrarea este acum blocată pentru {hours} de ore. Proprietarul va vedea încercările.',
        wrongKeyOrAnswers: {
          one: 'Cheia seifului sau un răspuns este greșit. Mai ai {left} încercare până la blocarea intrării.',
          few: 'Cheia seifului sau un răspuns este greșit. Mai ai {left} încercări până la blocarea intrării.',
          other:
            'Cheia seifului sau un răspuns este greșit. Mai ai {left} de încercări până la blocarea intrării.',
        },
        referralOnly: 'Destinatarii pot fi doar persoane din recomandările tale DevQuake.',
        wrongKey: 'Aceasta nu este cheia de seif a acestei intrări.',
        alreadyReleased:
          'Această intrare a fost deja eliberată; destinatarii nu mai pot fi schimbați.',
      },
      fields: {
        title: 'Titlul',
        question: 'Întrebarea',
        option: 'Varianta',
      },
      mail: {
        footer: 'Primești acest e-mail de la „Seiful meu” pe DevQuake.',
        warnSubject: 'Intrarea ta din seif „{title}” va fi trimisă curând',
        warnPreheader: {
          one: 'Trimisă destinatarilor în aproximativ {count} zi',
          few: 'Trimisă destinatarilor în aproximativ {count} zile',
          other: 'Trimisă destinatarilor în aproximativ {count} de zile',
        },
        warnHeading: 'Mai ești aici?',
        warnBody: {
          one: 'Nu ai folosit DevQuake de ceva vreme. În aproximativ {count} zi, cheia de seif a intrării „{title}” va fi trimisă destinatarilor aleși de tine.',
          few: 'Nu ai folosit DevQuake de ceva vreme. În aproximativ {count} zile, cheia de seif a intrării „{title}” va fi trimisă destinatarilor aleși de tine.',
          other:
            'Nu ai folosit DevQuake de ceva vreme. În aproximativ {count} de zile, cheia de seif a intrării „{title}” va fi trimisă destinatarilor aleși de tine.',
        },
        warnAction:
          'Ca s-o amâni, doar autentifică-te sau deschide orice pagină sau aplicație DevQuake.',
        warnButton: 'Deschide seiful meu',
        releaseSubject: '{name} ți-a lăsat o intrare din seif',
        releasePreheader: '„{title}” poate fi deschisă acum',
        releaseHeading: '{name} ți-a lăsat ceva în seiful său',
        releaseBody:
          '{name} te-a ales să primești intrarea din seif „{title}” dacă ar fi inactiv o vreme. Acest lucru s-a întâmplat acum.',
        releaseHow:
          'Deschide-o cu cheia de seif de mai jos și cu răspunsurile la trei întrebări pe care ar trebui să le știe doar cei apropiați lui {name}. Autentifică-te cu contul tău DevQuake; fiecare încercare este înregistrată, iar după 3 încercări greșite intrarea este blocată o vreme.',
        releaseKeep: 'Păstrează acest e-mail privat: cheia face parte din ce deschide intrarea.',
        entry: 'Intrarea',
        vaultKey: 'Cheia seifului',
        releaseButton: 'Deschide intrarea',
        lockSubject: 'Intrarea ta din seif „{title}” a fost blocată',
        lockPreheader: 'Trei încercări greșite de deschidere',
        lockHeading: 'Cineva a încercat să-ți deschidă intrarea',
        lockBody:
          'Au fost trei încercări greșite de a deschide „{title}”. Este blocată pentru {hours} de ore sau până când o deblochezi.',
        lockAction: 'Vezi cine a încercat și ce răspunsuri a dat, apoi deblocheaz-o dacă vrei.',
        lockButton: 'Vezi încercările',
      },
    },
    hu: {
      errors: {
        signIn: 'Előbb jelentkezz be a DevQuake-be.',
        unavailable: 'A széf most nem érhető el. Kérjük, próbáld újra később.',
        generic: 'Valami hiba történt ({status}. hiba). Kérjük, próbáld újra.',
        genericShort: 'Valami hiba történt. Kérjük, próbáld újra.',
        notFound: 'Nem található.',
        invalidRequest: 'Ez a kérés érvénytelen.',
        required: '{field}: kötelező megadni.',
        tooLong: '{field}: legfeljebb {max} karakter lehet.',
        threeQuestions: 'Egy bejegyzéshez pontosan három kérdés kell.',
        options: 'A(z) {n}. kérdéshez 2–12 különböző választás kell.',
        answersInvalid: 'Minden kérdéshez érvényes helyes válasz kell.',
        tooLarge: 'A bejegyzés túl nagy.',
        inactiveDays: '{min} és {max} nap között válassz.',
        date: 'Válassz érvényes dátumot.',
        tooManyRecipients: 'Legfeljebb {max} címzett.',
        entryNotFound: 'Ez a bejegyzés nem létezik, vagy nem nyithatod meg.',
        locked:
          'Ez a bejegyzés 3 hibás próbálkozás után zárolva van ({hours} órára, vagy amíg a tulajdonosa fel nem oldja).',
        lockedNow:
          'Ismét hibás: a bejegyzés most {hours} órára zárolva van. A tulajdonosa látni fogja a próbálkozásokat.',
        wrongKeyOrAnswers: {
          one: 'A széfkulcs vagy egy válasz hibás. Még {left} próbálkozás maradt a zárolásig.',
          other: 'A széfkulcs vagy egy válasz hibás. Még {left} próbálkozás maradt a zárolásig.',
        },
        referralOnly: 'Címzett csak a DevQuake-ajánlásaid közül lehet.',
        wrongKey: 'Ez nem ennek a bejegyzésnek a széfkulcsa.',
        alreadyReleased: 'Ezt a bejegyzést már kiadták; a címzettjei nem módosíthatók.',
      },
      fields: {
        title: 'Cím',
        question: 'Kérdés',
        option: 'Választás',
      },
      mail: {
        footer: 'Ezt az e-mailt a DevQuake Széfem alkalmazásától kaptad.',
        warnSubject: 'Hamarosan elküldjük a(z) „{title}” széfbejegyzésedet',
        warnPreheader: {
          one: 'Kb. {count} nap múlva megkapják a címzettjei',
          other: 'Kb. {count} nap múlva megkapják a címzettjei',
        },
        warnHeading: 'Még itt vagy?',
        warnBody: {
          one: 'Egy ideje nem használtad a DevQuake-et. Kb. {count} nap múlva a(z) „{title}” széfkulcsát elküldjük az általad választott címzetteknek.',
          other:
            'Egy ideje nem használtad a DevQuake-et. Kb. {count} nap múlva a(z) „{title}” széfkulcsát elküldjük az általad választott címzetteknek.',
        },
        warnAction:
          'Ha el akarod halasztani, egyszerűen jelentkezz be, vagy nyiss meg bármilyen DevQuake-oldalt vagy -alkalmazást.',
        warnButton: 'A széfem megnyitása',
        releaseSubject: '{name} egy széfbejegyzést hagyott rád',
        releasePreheader: 'A(z) „{title}” most már megnyitható',
        releaseHeading: '{name} hagyott neked valamit a széfjében',
        releaseBody:
          '{name} téged választott, hogy megkapd a(z) „{title}” széfbejegyzést, ha egy ideig inaktív lesz. Ez most megtörtént.',
        releaseHow:
          'Nyisd meg az alábbi széfkulccsal és három olyan kérdés válaszával, amelyeket csak a(z) {name} közelében állók tudhatnak. Jelentkezz be a DevQuake-fiókoddal; minden próbálkozást rögzítünk, és 3 hibás próbálkozás után egy időre zárolódik.',
        releaseKeep:
          'Tartsd ezt az e-mailt titokban: a kulcs része annak, ami megnyitja a bejegyzést.',
        entry: 'Bejegyzés',
        vaultKey: 'Széfkulcs',
        releaseButton: 'A bejegyzés megnyitása',
        lockSubject: 'A(z) „{title}” széfbejegyzésedet zároltuk',
        lockPreheader: 'Három hibás megnyitási próbálkozás',
        lockHeading: 'Valaki megpróbálta megnyitni a bejegyzésedet',
        lockBody:
          'Háromszor próbálták sikertelenül megnyitni ezt: „{title}”. {hours} órára zárolva van, vagy amíg fel nem oldod.',
        lockAction:
          'Nézd meg, ki próbálkozott és milyen válaszokat adott, majd ha szeretnéd, oldd fel.',
        lockButton: 'Próbálkozások megtekintése',
      },
    },
  },
);
