import { defineMessages } from './define';

// Every text of the app (ADR 0011). English is the source; the other languages must have the
// same keys and {placeholders} (src/i18n/catalog.test.ts).

const en = {
  appName: 'Workout tracker',
  meta: { home: 'Workout tracker' },
  nav: { devquake: 'DevQuake', language: 'Language' },
  guard: {
    signInTitle: 'Sign in to use the workout tracker',
    signInBody: 'The workout tracker uses your DevQuake account. {link} and come back here.',
    signInLink: 'Sign in on DevQuake',
    unavailableTitle: 'Not available right now',
    unavailableBody: 'The workout tracker is being set up. Please try again later.',
  },
  home: {
    greeting: 'Hi {name}!',
    intro:
      'The workout tracker is on its way. Soon you will log your workouts set by set, follow your progress and compete on leaderboards.',
    signedIn: 'You are signed in with your DevQuake account, so there is nothing else to set up.',
    previewTitle: 'A sample week',
    previewNote: 'Example data to show what is coming. Nothing is saved yet.',
    soonTitle: 'Coming soon',
    soon: {
      log: 'Log a workout set by set: exercise, repetitions and weight.',
      history: 'See your workout history and your personal records.',
      progress: 'Follow your progress for every exercise.',
      leaderboards: 'Compete with friends on leaderboards, if you want to.',
    },
  },
  sample: {
    workouts: { push: 'Push day', pull: 'Pull day', legs: 'Leg day' },
    exercises: {
      bench: 'Bench press',
      overhead: 'Overhead press',
      pullUps: 'Pull-ups',
      row: 'Barbell row',
      squat: 'Squat',
      deadlift: 'Deadlift',
    },
    sets: '{sets} × {reps} · {weight} kg',
    setsBodyweight: '{sets} × {reps} · body weight',
    volume: 'Volume: {weight} kg',
  },
};

export const screens = defineMessages(en, {
  de: {
    appName: 'Trainingstagebuch',
    meta: { home: 'Trainingstagebuch' },
    nav: { devquake: 'DevQuake', language: 'Sprache' },
    guard: {
      signInTitle: 'Melde dich an, um das Trainingstagebuch zu nutzen',
      signInBody:
        'Das Trainingstagebuch nutzt dein DevQuake-Konto. {link} und komm hierher zurück.',
      signInLink: 'Melde dich bei DevQuake an',
      unavailableTitle: 'Gerade nicht verfügbar',
      unavailableBody: 'Das Trainingstagebuch wird gerade eingerichtet. Bitte versuche es später.',
    },
    home: {
      greeting: 'Hallo {name}!',
      intro:
        'Das Trainingstagebuch ist unterwegs. Bald trägst du deine Trainings Satz für Satz ein, verfolgst deine Fortschritte und trittst in Bestenlisten an.',
      signedIn: 'Du bist mit deinem DevQuake-Konto angemeldet, du musst nichts weiter einrichten.',
      previewTitle: 'Eine Beispielwoche',
      previewNote: 'Beispieldaten, die zeigen, was kommt. Es wird noch nichts gespeichert.',
      soonTitle: 'Demnächst',
      soon: {
        log: 'Ein Training Satz für Satz eintragen: Übung, Wiederholungen und Gewicht.',
        history: 'Deine bisherigen Trainings und deine persönlichen Rekorde ansehen.',
        progress: 'Deine Fortschritte bei jeder Übung verfolgen.',
        leaderboards: 'Dich mit Freunden in Bestenlisten messen, wenn du möchtest.',
      },
    },
    sample: {
      workouts: { push: 'Drücktag', pull: 'Zugtag', legs: 'Beintag' },
      exercises: {
        bench: 'Bankdrücken',
        overhead: 'Schulterdrücken',
        pullUps: 'Klimmzüge',
        row: 'Langhantelrudern',
        squat: 'Kniebeugen',
        deadlift: 'Kreuzheben',
      },
      sets: '{sets} × {reps} · {weight} kg',
      setsBodyweight: '{sets} × {reps} · Körpergewicht',
      volume: 'Volumen: {weight} kg',
    },
  },
  ro: {
    appName: 'Jurnal de antrenament',
    meta: { home: 'Jurnal de antrenament' },
    nav: { devquake: 'DevQuake', language: 'Limba' },
    guard: {
      signInTitle: 'Autentifică-te ca să folosești jurnalul de antrenament',
      signInBody: 'Jurnalul de antrenament folosește contul tău DevQuake. {link} și revino aici.',
      signInLink: 'Autentifică-te pe DevQuake',
      unavailableTitle: 'Momentan indisponibil',
      unavailableBody:
        'Jurnalul de antrenament este în curs de configurare. Te rugăm să încerci mai târziu.',
    },
    home: {
      greeting: 'Salut, {name}!',
      intro:
        'Jurnalul de antrenament este pe drum. În curând îți vei nota antrenamentele serie cu serie, îți vei urmări progresul și vei concura în clasamente.',
      signedIn: 'Ești autentificat cu contul tău DevQuake, nu mai trebuie să configurezi nimic.',
      previewTitle: 'O săptămână de exemplu',
      previewNote: 'Date de exemplu care arată ce urmează. Încă nu se salvează nimic.',
      soonTitle: 'În curând',
      soon: {
        log: 'Notezi un antrenament serie cu serie: exercițiu, repetări și greutate.',
        history: 'Vezi istoricul antrenamentelor și recordurile tale personale.',
        progress: 'Îți urmărești progresul la fiecare exercițiu.',
        leaderboards: 'Concurezi cu prietenii în clasamente, dacă vrei.',
      },
    },
    sample: {
      workouts: { push: 'Ziua de împins', pull: 'Ziua de tras', legs: 'Ziua picioarelor' },
      exercises: {
        bench: 'Împins la piept',
        overhead: 'Împins deasupra capului',
        pullUps: 'Tracțiuni',
        row: 'Ramat cu haltera',
        squat: 'Genuflexiuni',
        deadlift: 'Îndreptări',
      },
      sets: '{sets} × {reps} · {weight} kg',
      setsBodyweight: '{sets} × {reps} · greutatea corpului',
      volume: 'Volum: {weight} kg',
    },
  },
  hu: {
    appName: 'Edzésnapló',
    meta: { home: 'Edzésnapló' },
    nav: { devquake: 'DevQuake', language: 'Nyelv' },
    guard: {
      signInTitle: 'Jelentkezz be az edzésnapló használatához',
      signInBody: 'Az edzésnapló a DevQuake-fiókodat használja. {link}, majd gyere vissza ide.',
      signInLink: 'Jelentkezz be a DevQuake-en',
      unavailableTitle: 'Jelenleg nem érhető el',
      unavailableBody: 'Az edzésnapló beállítása folyamatban van. Kérjük, próbáld újra később.',
    },
    home: {
      greeting: 'Szia, {name}!',
      intro:
        'Az edzésnapló hamarosan elkészül. Nemsokára sorozatonként rögzítheted az edzéseidet, követheted a fejlődésedet, és ranglistákon versenyezhetsz.',
      signedIn: 'A DevQuake-fiókoddal vagy bejelentkezve, mást nem kell beállítanod.',
      previewTitle: 'Egy mintahét',
      previewNote: 'Mintaadatok, amelyek megmutatják, mi várható. Még semmi sem mentődik.',
      soonTitle: 'Hamarosan',
      soon: {
        log: 'Edzés rögzítése sorozatonként: gyakorlat, ismétlésszám és súly.',
        history: 'Az edzéseid története és a személyes rekordjaid.',
        progress: 'A fejlődésed követése minden gyakorlatnál.',
        leaderboards: 'Verseny a barátaiddal ranglistákon, ha szeretnéd.',
      },
    },
    sample: {
      workouts: { push: 'Nyomónap', pull: 'Húzónap', legs: 'Lábnap' },
      exercises: {
        bench: 'Fekvenyomás',
        overhead: 'Vállból nyomás',
        pullUps: 'Húzódzkodás',
        row: 'Döntött törzsű evezés',
        squat: 'Guggolás',
        deadlift: 'Felhúzás',
      },
      sets: '{sets} × {reps} · {weight} kg',
      setsBodyweight: '{sets} × {reps} · testsúly',
      volume: 'Volumen: {weight} kg',
    },
  },
});
