import type { Locale } from '@devquake/ui';

// The user manual (/help) in every language (ADR 0011). Inline markup: **bold**; {host} is a
// link to devquake.com. Every language has the same sections and blocks (checked by a test).
// Button names in bold must match the screens (screens.ts, progress.ts).

export type ManualBlock =
  { p: string } | { steps: string[] } | { list: string[] } | { tip: string } | { h3: string };

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
  metaTitle: 'User manual · Workout tracker',
  metaDescription:
    'How to set up the workout tracker, follow a guided workout with the voice coach on your phone, and read your calendar, statistics and progress photos.',
  ogTitle: 'Workout tracker: user manual',
  cta: 'Want to try it? The workout tracker is free for DevQuake members. {link}, then subscribe to the app.',
  ctaLink: 'Create an account or sign in',
  kicker: 'Workout tracker · User manual',
  title: 'How to use the workout tracker',
  intro:
    'The workout tracker makes routines for you, guides you through every workout on your phone with a timer and a voice coach, and shows how you improve over weeks, months and years. This manual walks you through it step by step.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          p: 'The workout tracker is an app of DevQuake and uses your DevQuake account, so there is no separate sign-up.',
        },
        {
          steps: [
            'Sign in on {host} (or create an account and confirm your email).',
            'Open **Your account → Available projects** and **Subscribe** to “Workout tracker”.',
            'Click **Open Workout tracker**. You arrive here already signed in. If you open the app address directly while signed out, sign in once and you come right back.',
          ],
        },
        {
          tip: 'The app is made for your phone: open it there and add it to your home screen, so it is one tap away when you train.',
        },
      ],
    },
    {
      id: 'setup',
      title: '2. First setup',
      blocks: [
        {
          p: 'Your first visit opens a short setup. Tap **Next** after each step; **Back** returns to the step before.',
        },
        {
          steps: [
            '**About you**: your year of birth (only the year is stored), your height in cm or ft + in, and your body weight in kg or lb. The units you choose are used everywhere in the app, also for distances (km with cm, miles with feet).',
            '**Your training**: your experience (Beginner, Intermediate, Advanced), your goal (Get stronger, Build muscle, Endurance, Stay fit, Lose weight), how many workouts per week and how long each one may take. Tick **Prefer low-impact exercises** to leave out jumping and running.',
            '**Where do you train?**: pick one or more places: **Gym**, **Home** and **Outside**.',
            '**What do you have at home?** (only with Home): tick the equipment you own, such as dumbbells, a pull-up bar or a mat. Without equipment you get body-weight exercises.',
            '**Starting photo** (optional): take a photo with **Take photo** or pick one with **Choose photo**. The switch below it turns the **Monthly summary email** on or off.',
            'Tap **Create my routines** (or **Skip the photo and create my routines**). Your routines are ready in a moment.',
          ],
        },
        {
          tip: 'The suggestions are general guidance, not medical advice. If you have a health condition, ask your doctor before you start.',
        },
      ],
    },
    {
      id: 'screens',
      title: '3. The main screen',
      blocks: [
        {
          p: 'Below the toolbar there are four sections. On a phone, swipe the row sideways if you do not see them all.',
        },
        {
          list: [
            '**My routines** (opens first): your last 7 days (workouts, time and calories), your routines for each place, and your recent workouts.',
            '**Calendar**: every workout by day, month and year, with statistics.',
            '**Progress**: your progress photos and the before-and-after view.',
            '**Profile**: your details, places, equipment, starting photo and the monthly email.',
          ],
        },
        {
          p: 'The toolbar has **Manual** (this page), the language picker and, next to the sections, the voice coach: a speaker button to mute it and a button for the speech settings.',
        },
      ],
    },
    {
      id: 'routines',
      title: '4. Your routines',
      blocks: [
        {
          p: 'You get three routines for each place, for example **Full body**, **Upper body** and **Legs and core** at the gym and at home, and **Brisk walk**, **Intervals** and **Park workout** outside. Each routine card shows how many exercises it has, about how long it takes and about how many calories it burns.',
        },
        {
          list: [
            'Every routine starts with a short **Warm-up**.',
            'Tap **Details** to see all exercises, with their sets, repetitions or seconds and the rest after each set. Every exercise has a moving stick figure that shows how to do it.',
            'The suggested repetitions depend on how hard each exercise is: fewer for pull-ups, more for calf raises. They also follow your goal and experience.',
            'Tap **Start** on the card (or **Start workout** in the details) to begin.',
          ],
        },
        {
          tip: 'Changed your mind about your goal, your time or your equipment? Update your profile and tap **Create my routines again** (see “Profile and equipment”).',
        },
      ],
    },
    {
      id: 'workout',
      title: '5. During a workout',
      blocks: [
        {
          p: 'The workout fills the screen. At the top you see the total workout time, **Exercise 3 of 8** and the set you are on. Behind the controls a stick figure shows the movement; tap **How to do it** for a short description. The screen stays on while you train.',
        },
        {
          p: 'Before the first exercise the app counts down (**Get ready**). Tap **Start now** if you are ready sooner. Then it depends on the exercise:',
        },
        { h3: 'Repetitions' },
        {
          list: [
            'The suggested number is already filled in. Change it with **Less** and **More** (or type it) to what you really did.',
            'For exercises with weights, enter the weight in your unit too.',
            'Tap **Set done**.',
          ],
        },
        { h3: 'Holds and timed exercises' },
        {
          list: [
            'After a short countdown the timer runs down by itself. **Pause** and **Continue** stop and restart it.',
            'When the time is up, the set is done automatically. **Stop here** ends it early and keeps the seconds you did; **Skip** skips the set before you start.',
          ],
        },
        { h3: 'Walking, jogging and running' },
        {
          list: [
            'Tap **Start** to time yourself, and **Pause** if you stop.',
            'At the end, enter the distance you covered and tap **Done**.',
          ],
        },
        { h3: 'Rests' },
        {
          list: [
            'After each set a rest timer starts, with an encouraging line and what comes next.',
            '**+15 s** gives you a longer rest; **Go on** ends it at once.',
            'In the last three seconds the app counts down 3, 2, 1, and the next set begins. After the last set of an exercise it moves on to the next exercise by itself.',
          ],
        },
        {
          p: 'After the last set of the last exercise the timer stops and the summary opens.',
        },
      ],
    },
    {
      id: 'saving',
      title: '6. Saving, stopping and your connection',
      blocks: [
        {
          list: [
            '**Everything saves itself.** Each set is saved when you finish it, and a number you change is saved 10 seconds after you leave it untouched, also when you lock the phone or switch apps.',
            '**No connection?** The workout carries on. What you did stays on the phone (“No connection: saved on this phone for now”) and is sent as soon as you are back online.',
            '**You stay signed in** while a workout runs, even a long one. If your sign-in ends anyway, your workout stays on the phone: tap **Sign in again**, and it is saved when you come back.',
            '**Closed the app by mistake?** Open it again: **My routines** shows **Workout in progress**. Tap **Continue** to go on where you stopped, or **Discard** to delete it. Only one workout can run at a time.',
          ],
        },
        {
          p: 'To stop early, tap the close button at the top (**Stop the workout**) and choose:',
        },
        {
          list: [
            '**Finish now and keep what I did**: the workout ends with the sets you did; the rest counts as skipped.',
            '**Discard the workout**: everything from this workout is deleted.',
            '**Keep going**: back to your workout.',
          ],
        },
      ],
    },
    {
      id: 'voice',
      title: '7. The voice coach',
      blocks: [
        {
          p: 'During a workout your phone can speak to you, so you do not have to look at the screen. The voice uses your phone’s own speech, in the page language. It needs no downloads and works offline.',
        },
        {
          list: [
            'Before an exercise it says what comes next and counts down; at the end of every rest it counts 3, 2, 1, “go”.',
            'It tells you when a set is done, how long you rest and which exercise is next.',
            'It cheers you on: at your last set, halfway through a hold, with ten seconds left, when you beat the target, and when the workout is complete.',
          ],
        },
        {
          steps: [
            'Tap the **speaker** button in the toolbar or on the workout screen to mute the voice or turn it back on.',
            'Tap the **Speech settings** button next to it to choose a **Female** or **Male** voice and a style: **Calm**, **Normal** or **Motivational** (gym talk).',
            'Tap **Test the voice** to hear it, then **Done**.',
          ],
        },
        {
          tip: 'Phones only let a page speak after you tapped something on it. If you reopen a running workout, the voice starts after your first tap. The available voices depend on your phone; if it has no voice for your language, it uses its default voice. The settings are kept on each device.',
        },
      ],
    },
    {
      id: 'summary',
      title: '8. After the workout',
      blocks: [
        {
          p: 'The summary shows your total time, the calories you burned (an estimate from your body weight and the exercises) and every set you did. It also shows:',
        },
        {
          list: [
            '**What improved** since the last time you did each exercise, and your **Personal records**.',
            'A short feedback line about your day.',
            '**Next time**: the target for your next workout. When you reach the suggestion in every set, the next workout asks for one more repetition (or, at the top of the range, a little more weight). When a set was much too hard, it asks for a little less.',
          ],
        },
        {
          p: 'Tap **Back to my routines** to return. Your finished workouts are also listed under **Recent workouts** and in the calendar.',
        },
      ],
    },
    {
      id: 'calendar',
      title: '9. The calendar and your statistics',
      blocks: [
        {
          p: 'Open **Calendar**. Switch between **Day**, **Month** and **Year** at the top, and move with **Earlier**, **Later** and **Today**.',
        },
        {
          list: [
            '**Month**: days with a workout are coloured, darker for more minutes. Tap a day to open it. Below the calendar: workouts, active days, time, calories, sets, repetitions, weight moved and your longest streak, compared with the month before.',
            '**Day**: each workout of that day with what improved and your records. Tap **Details and sets** for the full summary.',
            '**Year**: all twelve months at a glance, the workouts per month and the year’s totals. Tap a month to open it.',
          ],
        },
        {
          p: 'The month and year views also have a spot for that month’s or that year’s progress photo.',
        },
      ],
    },
    {
      id: 'photos',
      title: '10. Progress photos',
      blocks: [
        {
          p: 'Photos help you see your transformation. They are all optional, and only you can see them.',
        },
        {
          list: [
            '**Starting photo**: added in the setup, or later under **Profile** (Photo and emails).',
            '**A photo for every month and year**: add it under **Progress**, or in the month or year view of the calendar.',
            'Use **Take photo** for the camera or **Choose photo** for a picture you already have. **Replace** swaps it; **Delete photo** removes it.',
            '**Before and after**: with at least two photos, drag the slider on the **Progress** page to compare them. **All photos** shows your timeline.',
          ],
        },
        {
          tip: 'Take every photo in the same place, light and pose, and they compare much better. Photos are made smaller on your phone before they are uploaded (JPEG, PNG or WebP).',
        },
      ],
    },
    {
      id: 'email',
      title: '11. The monthly email',
      blocks: [
        {
          p: 'On the 1st of every month you get a short email with last month’s numbers: workouts, active days, time and calories. Its **Open my calendar** button opens that month in the app, and it reminds you to add the month’s photo.',
        },
        {
          p: 'You do not want it? Turn off **Monthly summary email** under **Profile** and tap **Save**.',
        },
      ],
    },
    {
      id: 'profile',
      title: '12. Profile and equipment',
      blocks: [
        {
          p: 'Under **Profile** you can change everything from the setup at any time: your details and units, experience, goal, workouts per week, time per workout, low impact, your places and your equipment at home. Tap **Save**.',
        },
        {
          list: [
            'Saving keeps your routines as they are. To get new ones that match your changes, tap **Create my routines again**. It replaces the suggested routines of your places; your past workouts stay.',
            'Update your body weight from time to time: the calories and the suggested weights use it.',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: '13. Tips and questions',
      blocks: [
        {
          list: [
            '**An exercise hurts?** Stop it. Tap **Stop here** or enter what you managed; the app lowers the target next time.',
            '**Too easy or too hard overall?** Change your experience or goal in your profile and create your routines again.',
            '**Calories** are estimates for guidance, not a measurement.',
            '**Your data**: your workouts, profile and photos are only yours. When you unsubscribe from the app or delete your DevQuake account, all of it is deleted, photos included.',
          ],
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: '← Back to my routines',
};

const de: Manual = {
  metaTitle: 'Anleitung · Trainingstagebuch',
  metaDescription:
    'So richtest du das Trainingstagebuch ein, trainierst mit geführten Workouts und dem Sprachtrainer auf dem Handy und liest deinen Kalender, deine Statistiken und Fortschrittsfotos.',
  ogTitle: 'Trainingstagebuch: Anleitung',
  cta: 'Möchtest du es ausprobieren? Das Trainingstagebuch ist für DevQuake-Mitglieder kostenlos. {link} und abonniere dann die App.',
  ctaLink: 'Erstelle ein Konto oder melde dich an',
  kicker: 'Trainingstagebuch · Anleitung',
  title: 'So nutzt du das Trainingstagebuch',
  intro:
    'Das Trainingstagebuch erstellt Trainingspläne für dich, führt dich mit Timer und Sprachtrainer auf dem Handy durch jedes Training und zeigt, wie du dich über Wochen, Monate und Jahre verbesserst. Diese Anleitung erklärt alles Schritt für Schritt.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          p: 'Das Trainingstagebuch ist eine App von DevQuake und nutzt dein DevQuake-Konto, du musst dich also nicht extra registrieren.',
        },
        {
          steps: [
            'Melde dich bei {host} an (oder erstelle ein Konto und bestätige deine E-Mail-Adresse).',
            'Öffne **Dein Konto → Verfügbare Projekte** und **abonniere** „Trainingstagebuch“.',
            'Klicke auf **Trainingstagebuch öffnen**. Du kommst hier schon angemeldet an. Wenn du die Adresse der App abgemeldet direkt öffnest, meldest du dich einmal an und kommst gleich zurück.',
          ],
        },
        {
          tip: 'Die App ist für dein Handy gemacht: Öffne sie dort und lege sie auf den Startbildschirm, dann ist sie beim Training nur einen Tipp entfernt.',
        },
      ],
    },
    {
      id: 'setup',
      title: '2. Die Einrichtung',
      blocks: [
        {
          p: 'Beim ersten Besuch öffnet sich eine kurze Einrichtung. Tippe nach jedem Schritt auf **Weiter**; **Zurück** führt zum vorigen Schritt.',
        },
        {
          steps: [
            '**Über dich**: dein Geburtsjahr (nur das Jahr wird gespeichert), deine Größe in cm oder ft + in und dein Körpergewicht in kg oder lb. Die gewählten Einheiten gelten überall in der App, auch für Strecken (km zu cm, Meilen zu Fuß).',
            '**Dein Training**: deine Erfahrung (Anfänger, Fortgeschritten, Erfahren), dein Ziel (Stärker werden, Muskeln aufbauen, Ausdauer, Fit bleiben, Abnehmen), wie viele Trainings pro Woche und wie lange jedes dauern darf. Hake **Gelenkschonende Übungen bevorzugen** an, um Springen und Laufen wegzulassen.',
            '**Wo trainierst du?**: Wähle einen oder mehrere Orte: **Fitnessstudio**, **Zuhause** und **Draußen**.',
            '**Was hast du zu Hause?** (nur mit Zuhause): Hake die Ausstattung an, die du hast, etwa Kurzhanteln, eine Klimmzugstange oder eine Matte. Ohne Ausstattung bekommst du Übungen mit dem eigenen Körpergewicht.',
            '**Startfoto** (freiwillig): Mach mit **Foto aufnehmen** ein Foto oder wähle mit **Foto auswählen** eins aus. Der Schalter darunter schaltet die **Monatliche Übersicht per E-Mail** ein oder aus.',
            'Tippe auf **Meine Pläne erstellen** (oder **Ohne Foto weiter und Pläne erstellen**). Deine Pläne sind gleich fertig.',
          ],
        },
        {
          tip: 'Die Vorschläge sind allgemeine Empfehlungen, keine ärztliche Beratung. Wenn du gesundheitliche Beschwerden hast, frag vor dem Start deine Ärztin oder deinen Arzt.',
        },
      ],
    },
    {
      id: 'screens',
      title: '3. Der Hauptbildschirm',
      blocks: [
        {
          p: 'Unter der Symbolleiste gibt es vier Bereiche. Wenn du auf dem Handy nicht alle siehst, wische die Zeile zur Seite.',
        },
        {
          list: [
            '**Meine Pläne** (öffnet sich zuerst): deine letzten 7 Tage (Trainings, Zeit und Kalorien), deine Pläne für jeden Ort und deine letzten Trainings.',
            '**Kalender**: jedes Training nach Tag, Monat und Jahr, mit Statistiken.',
            '**Fortschritt**: deine Fortschrittsfotos und der Vorher-nachher-Vergleich.',
            '**Profil**: deine Angaben, Orte, Ausstattung, dein Startfoto und die monatliche E-Mail.',
          ],
        },
        {
          p: 'Die Symbolleiste hat **Anleitung** (diese Seite), die Sprachauswahl und, neben den Bereichen, den Sprachtrainer: einen Lautsprecher-Knopf zum Stummschalten und einen Knopf für die Spracheinstellungen.',
        },
      ],
    },
    {
      id: 'routines',
      title: '4. Deine Trainingspläne',
      blocks: [
        {
          p: 'Für jeden Ort bekommst du drei Pläne, zum Beispiel **Ganzkörper**, **Oberkörper** und **Beine und Rumpf** im Studio und zu Hause, und **Zügiges Gehen**, **Intervalle** und **Training im Park** draußen. Jede Karte zeigt, wie viele Übungen der Plan hat, wie lange er etwa dauert und wie viele Kalorien er etwa verbraucht.',
        },
        {
          list: [
            'Jeder Plan beginnt mit einem kurzen **Aufwärmen**.',
            'Tippe auf **Details**, um alle Übungen zu sehen, mit Sätzen, Wiederholungen oder Sekunden und der Pause nach jedem Satz. Zu jeder Übung zeigt ein bewegtes Strichmännchen, wie sie geht.',
            'Die vorgeschlagenen Wiederholungen hängen davon ab, wie schwer eine Übung ist: weniger bei Klimmzügen, mehr beim Wadenheben. Sie richten sich auch nach deinem Ziel und deiner Erfahrung.',
            'Tippe auf der Karte auf **Start** (oder in den Details auf **Training starten**), um loszulegen.',
          ],
        },
        {
          tip: 'Hast du dein Ziel, deine Zeit oder deine Ausstattung geändert? Passe dein Profil an und tippe auf **Meine Pläne neu erstellen** (siehe „Profil und Ausstattung“).',
        },
      ],
    },
    {
      id: 'workout',
      title: '5. Während des Trainings',
      blocks: [
        {
          p: 'Das Training füllt den ganzen Bildschirm. Oben siehst du die gesamte Trainingszeit, **Übung 3 von 8** und den aktuellen Satz. Hinter den Bedienelementen zeigt ein Strichmännchen die Bewegung; tippe auf **So geht’s** für eine kurze Beschreibung. Der Bildschirm bleibt während des Trainings an.',
        },
        {
          p: 'Vor der ersten Übung zählt die App herunter (**Mach dich bereit**). Tippe auf **Jetzt starten**, wenn du früher bereit bist. Danach kommt es auf die Übung an:',
        },
        { h3: 'Wiederholungen' },
        {
          list: [
            'Die vorgeschlagene Zahl ist schon eingetragen. Ändere sie mit **Weniger** und **Mehr** (oder tippe sie ein) auf das, was du wirklich geschafft hast.',
            'Bei Übungen mit Gewichten trägst du auch das Gewicht in deiner Einheit ein.',
            'Tippe auf **Satz geschafft**.',
          ],
        },
        { h3: 'Halteübungen und Übungen auf Zeit' },
        {
          list: [
            'Nach einem kurzen Countdown läuft der Timer von selbst herunter. **Pause** und **Weiter** halten ihn an und starten ihn wieder.',
            'Wenn die Zeit um ist, ist der Satz automatisch fertig. **Hier aufhören** beendet ihn früher und behält deine Sekunden; **Überspringen** überspringt den Satz, bevor du anfängst.',
          ],
        },
        { h3: 'Gehen, Joggen und Laufen' },
        {
          list: [
            'Tippe auf **Start**, um deine Zeit zu messen, und auf **Pause**, wenn du anhältst.',
            'Trage am Ende die zurückgelegte Strecke ein und tippe auf **Fertig**.',
          ],
        },
        { h3: 'Pausen' },
        {
          list: [
            'Nach jedem Satz startet ein Pausentimer, mit einem aufmunternden Satz und dem, was als Nächstes kommt.',
            '**+15 s** verlängert die Pause; **Weiter** beendet sie sofort.',
            'In den letzten drei Sekunden zählt die App 3, 2, 1, und der nächste Satz beginnt. Nach dem letzten Satz einer Übung geht es von selbst zur nächsten Übung.',
          ],
        },
        {
          p: 'Nach dem letzten Satz der letzten Übung stoppt der Timer und die Zusammenfassung öffnet sich.',
        },
      ],
    },
    {
      id: 'saving',
      title: '6. Speichern, Aufhören und deine Verbindung',
      blocks: [
        {
          list: [
            '**Alles speichert sich selbst.** Jeder Satz wird gespeichert, wenn du ihn beendest, und eine geänderte Zahl 10 Sekunden, nachdem du sie nicht mehr berührst, auch wenn du das Handy sperrst oder die App wechselst.',
            '**Keine Verbindung?** Das Training geht weiter. Was du geschafft hast, bleibt auf dem Handy („Keine Verbindung: vorerst auf diesem Handy gespeichert“) und wird gesendet, sobald du wieder online bist.',
            '**Du bleibst angemeldet**, solange ein Training läuft, auch ein langes. Endet deine Anmeldung trotzdem, bleibt dein Training auf dem Handy: Tippe auf **Erneut anmelden**, und es wird gespeichert, wenn du zurückkommst.',
            '**Die App aus Versehen geschlossen?** Öffne sie wieder: **Meine Pläne** zeigt **Laufendes Training**. Tippe auf **Fortsetzen**, um dort weiterzumachen, wo du aufgehört hast, oder auf **Verwerfen**, um es zu löschen. Es kann immer nur ein Training laufen.',
          ],
        },
        {
          p: 'Um früher aufzuhören, tippe oben auf den Schließen-Knopf (**Training beenden**) und wähle:',
        },
        {
          list: [
            '**Jetzt beenden und Geschafftes behalten**: Das Training endet mit deinen geschafften Sätzen; der Rest zählt als übersprungen.',
            '**Training verwerfen**: Alles aus diesem Training wird gelöscht.',
            '**Weitermachen**: zurück zu deinem Training.',
          ],
        },
      ],
    },
    {
      id: 'voice',
      title: '7. Der Sprachtrainer',
      blocks: [
        {
          p: 'Während des Trainings kann dein Handy mit dir sprechen, damit du nicht auf den Bildschirm schauen musst. Die Stimme nutzt die Sprachausgabe deines Handys in der Sprache der Seite. Sie braucht keine Downloads und funktioniert offline.',
        },
        {
          list: [
            'Vor einer Übung sagt sie, was kommt, und zählt herunter; am Ende jeder Pause zählt sie 3, 2, 1, „los“.',
            'Sie sagt dir, wann ein Satz geschafft ist, wie lange du Pause hast und welche Übung als Nächstes kommt.',
            'Sie feuert dich an: beim letzten Satz, zur Hälfte einer Halteübung, zehn Sekunden vor Schluss, wenn du das Ziel übertriffst und wenn das Training geschafft ist.',
          ],
        },
        {
          steps: [
            'Tippe in der Symbolleiste oder im Training auf den **Lautsprecher**-Knopf, um die Stimme stummzuschalten oder wieder einzuschalten.',
            'Tippe daneben auf den Knopf **Spracheinstellungen**, um eine **weibliche** oder **männliche** Stimme und einen Stil zu wählen: **Ruhig**, **Normal** oder **Motivierend** (Gym-Sprache).',
            'Tippe auf **Stimme testen**, um sie zu hören, und dann auf **Fertig**.',
          ],
        },
        {
          tip: 'Handys lassen eine Seite erst sprechen, nachdem du etwas darauf angetippt hast. Öffnest du ein laufendes Training erneut, spricht die Stimme nach deinem ersten Tippen. Welche Stimmen es gibt, hängt von deinem Handy ab; hat es keine Stimme für deine Sprache, nutzt es seine Standardstimme. Die Einstellungen gelten für jedes Gerät einzeln.',
        },
      ],
    },
    {
      id: 'summary',
      title: '8. Nach dem Training',
      blocks: [
        {
          p: 'Die Zusammenfassung zeigt deine Gesamtzeit, die verbrauchten Kalorien (eine Schätzung aus deinem Körpergewicht und den Übungen) und jeden Satz, den du gemacht hast. Außerdem zeigt sie:',
        },
        {
          list: [
            '**Was besser wurde** seit dem letzten Mal bei jeder Übung, und deine **persönlichen Rekorde**.',
            'Eine kurze Rückmeldung zu deinem Tag.',
            '**Nächstes Mal**: das Ziel für dein nächstes Training. Erreichst du den Vorschlag in jedem Satz, verlangt das nächste Training eine Wiederholung mehr (oder, am oberen Ende des Bereichs, etwas mehr Gewicht). War ein Satz viel zu schwer, verlangt es etwas weniger.',
          ],
        },
        {
          p: 'Tippe auf **Zurück zu meinen Plänen**, um zurückzukehren. Deine beendeten Trainings stehen auch unter **Letzte Trainings** und im Kalender.',
        },
      ],
    },
    {
      id: 'calendar',
      title: '9. Der Kalender und deine Statistiken',
      blocks: [
        {
          p: 'Öffne **Kalender**. Wechsle oben zwischen **Tag**, **Monat** und **Jahr** und blättere mit **Früher**, **Später** und **Heute**.',
        },
        {
          list: [
            '**Monat**: Tage mit Training sind eingefärbt, dunkler für mehr Minuten. Tippe auf einen Tag, um ihn zu öffnen. Unter dem Kalender: Trainings, aktive Tage, Zeit, Kalorien, Sätze, Wiederholungen, bewegtes Gewicht und deine längste Serie, im Vergleich zum Vormonat.',
            '**Tag**: jedes Training dieses Tages mit dem, was besser wurde, und deinen Rekorden. Tippe auf **Details und Sätze** für die ganze Zusammenfassung.',
            '**Jahr**: alle zwölf Monate auf einen Blick, die Trainings pro Monat und die Summen des Jahres. Tippe auf einen Monat, um ihn zu öffnen.',
          ],
        },
        {
          p: 'Die Monats- und Jahresansicht haben auch einen Platz für das Fortschrittsfoto dieses Monats oder Jahres.',
        },
      ],
    },
    {
      id: 'photos',
      title: '10. Fortschrittsfotos',
      blocks: [
        {
          p: 'Fotos helfen dir, deine Veränderung zu sehen. Sie sind alle freiwillig, und nur du kannst sie sehen.',
        },
        {
          list: [
            '**Startfoto**: bei der Einrichtung hinzugefügt oder später unter **Profil** (Foto und E-Mails).',
            '**Ein Foto für jeden Monat und jedes Jahr**: füge es unter **Fortschritt** hinzu oder in der Monats- oder Jahresansicht des Kalenders.',
            'Nutze **Foto aufnehmen** für die Kamera oder **Foto auswählen** für ein vorhandenes Bild. **Ersetzen** tauscht es aus; **Foto löschen** entfernt es.',
            '**Vorher und nachher**: Mit mindestens zwei Fotos ziehst du auf der Seite **Fortschritt** den Regler, um sie zu vergleichen. **Alle Fotos** zeigt deine Zeitleiste.',
          ],
        },
        {
          tip: 'Mach jedes Foto am selben Ort, im selben Licht und in derselben Haltung, dann lassen sie sich viel besser vergleichen. Fotos werden vor dem Hochladen auf deinem Handy verkleinert (JPEG, PNG oder WebP).',
        },
      ],
    },
    {
      id: 'email',
      title: '11. Die monatliche E-Mail',
      blocks: [
        {
          p: 'Am 1. jedes Monats bekommst du eine kurze E-Mail mit den Zahlen des letzten Monats: Trainings, aktive Tage, Zeit und Kalorien. Ihr Knopf **Meinen Kalender öffnen** öffnet diesen Monat in der App, und sie erinnert dich an das Foto des Monats.',
        },
        {
          p: 'Du möchtest sie nicht? Schalte unter **Profil** die **Monatliche Übersicht per E-Mail** aus und tippe auf **Speichern**.',
        },
      ],
    },
    {
      id: 'profile',
      title: '12. Profil und Ausstattung',
      blocks: [
        {
          p: 'Unter **Profil** kannst du alles aus der Einrichtung jederzeit ändern: deine Angaben und Einheiten, Erfahrung, Ziel, Trainings pro Woche, Zeit pro Training, gelenkschonend, deine Orte und deine Ausstattung zu Hause. Tippe auf **Speichern**.',
        },
        {
          list: [
            'Beim Speichern bleiben deine Pläne, wie sie sind. Für neue, passende Pläne tippe auf **Meine Pläne neu erstellen**. Das ersetzt die vorgeschlagenen Pläne deiner Orte; deine bisherigen Trainings bleiben.',
            'Aktualisiere ab und zu dein Körpergewicht: Die Kalorien und die vorgeschlagenen Gewichte hängen davon ab.',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: '13. Tipps und Fragen',
      blocks: [
        {
          list: [
            '**Eine Übung tut weh?** Hör auf. Tippe auf **Hier aufhören** oder trage ein, was du geschafft hast; die App senkt das Ziel beim nächsten Mal.',
            '**Insgesamt zu leicht oder zu schwer?** Ändere Erfahrung oder Ziel in deinem Profil und erstelle deine Pläne neu.',
            '**Kalorien** sind Schätzungen zur Orientierung, keine Messung.',
            '**Deine Daten**: Deine Trainings, dein Profil und deine Fotos gehören nur dir. Wenn du die App abbestellst oder dein DevQuake-Konto löschst, wird alles gelöscht, auch die Fotos.',
          ],
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: '← Zurück zu meinen Plänen',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Jurnal de antrenament',
  metaDescription:
    'Cum configurezi jurnalul de antrenament, cum urmezi un antrenament ghidat cu antrenorul vocal pe telefon și cum citești calendarul, statisticile și fotografiile de progres.',
  ogTitle: 'Jurnal de antrenament: manual de utilizare',
  cta: 'Vrei să încerci? Jurnalul de antrenament este gratuit pentru membrii DevQuake. {link}, apoi abonează-te la aplicație.',
  ctaLink: 'Creează un cont sau autentifică-te',
  kicker: 'Jurnal de antrenament · Manual de utilizare',
  title: 'Cum folosești jurnalul de antrenament',
  intro:
    'Jurnalul de antrenament îți creează programe, te ghidează prin fiecare antrenament pe telefon cu un cronometru și un antrenor vocal și îți arată cum progresezi de la o săptămână, lună și an la altul. Acest manual te ia pas cu pas.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          p: 'Jurnalul de antrenament este o aplicație DevQuake și folosește contul tău DevQuake, deci nu ai nevoie de o înregistrare separată.',
        },
        {
          steps: [
            'Autentifică-te pe {host} (sau creează un cont și confirmă-ți e-mailul).',
            'Deschide **Contul tău → Proiecte disponibile** și **abonează-te** la „Jurnal de antrenament”.',
            'Apasă **Deschide Jurnal de antrenament**. Ajungi aici deja autentificat. Dacă deschizi direct adresa aplicației fără să fii autentificat, te autentifici o dată și revii imediat.',
          ],
        },
        {
          tip: 'Aplicația e gândită pentru telefon: deschide-o acolo și adaug-o pe ecranul principal, ca să fie la o atingere distanță când te antrenezi.',
        },
      ],
    },
    {
      id: 'setup',
      title: '2. Prima configurare',
      blocks: [
        {
          p: 'La prima vizită se deschide o configurare scurtă. Apasă **Mai departe** după fiecare pas; **Înapoi** te duce la pasul anterior.',
        },
        {
          steps: [
            '**Despre tine**: anul nașterii (se păstrează doar anul), înălțimea în cm sau ft + in și greutatea în kg sau lb. Unitățile alese se folosesc peste tot în aplicație, și pentru distanțe (km cu cm, mile cu picioare).',
            '**Antrenamentul tău**: experiența (Începător, Intermediar, Avansat), obiectivul (Mai multă forță, Masă musculară, Rezistență, Să rămân în formă, Slăbire), câte antrenamente pe săptămână și cât poate dura fiecare. Bifează **Prefer exerciții cu impact redus** ca să lași deoparte săriturile și alergarea.',
            '**Unde te antrenezi?**: alege unul sau mai multe locuri: **Sală**, **Acasă** și **Afară**.',
            '**Ce ai acasă?** (doar cu Acasă): bifează echipamentul pe care îl ai, de exemplu gantere, o bară de tracțiuni sau o saltea. Fără echipament primești exerciții cu greutatea corpului.',
            '**Fotografia de început** (opțională): fă o fotografie cu **Fă o fotografie** sau alege una cu **Alege o fotografie**. Comutatorul de dedesubt pornește sau oprește **Rezumatul lunar pe e-mail**.',
            'Apasă **Creează-mi programele** (sau **Sari peste fotografie și creează-mi programele**). Programele tale sunt gata imediat.',
          ],
        },
        {
          tip: 'Sugestiile sunt recomandări generale, nu sfaturi medicale. Dacă ai o problemă de sănătate, întreabă-ți medicul înainte să începi.',
        },
      ],
    },
    {
      id: 'screens',
      title: '3. Ecranul principal',
      blocks: [
        {
          p: 'Sub bara de instrumente sunt patru secțiuni. Pe telefon, glisează rândul în lateral dacă nu le vezi pe toate.',
        },
        {
          list: [
            '**Programele mele** (se deschide primul): ultimele 7 zile (antrenamente, timp și calorii), programele pentru fiecare loc și antrenamentele recente.',
            '**Calendar**: fiecare antrenament pe zi, lună și an, cu statistici.',
            '**Progres**: fotografiile de progres și comparația înainte și după.',
            '**Profil**: datele tale, locurile, echipamentul, fotografia de început și e-mailul lunar.',
          ],
        },
        {
          p: 'Bara de instrumente are **Manual** (această pagină), alegerea limbii și, lângă secțiuni, antrenorul vocal: un buton cu difuzor pentru a opri vocea și un buton pentru setările de voce.',
        },
      ],
    },
    {
      id: 'routines',
      title: '4. Programele tale',
      blocks: [
        {
          p: 'Primești trei programe pentru fiecare loc, de exemplu **Tot corpul**, **Partea de sus** și **Picioare și abdomen** la sală și acasă, iar afară **Mers alert**, **Intervale** și **Antrenament în parc**. Fiecare card arată câte exerciții are programul, cam cât durează și cam câte calorii arde.',
        },
        {
          list: [
            'Fiecare program începe cu o scurtă **Încălzire**.',
            'Apasă **Detalii** ca să vezi toate exercițiile, cu seriile, repetările sau secundele și pauza după fiecare serie. Fiecare exercițiu are o figurină animată care arată cum se face.',
            'Repetările sugerate depind de cât de greu e fiecare exercițiu: mai puține la tracțiuni, mai multe la ridicările pe vârfuri. Țin cont și de obiectivul și experiența ta.',
            'Apasă **Start** pe card (sau **Începe antrenamentul** în detalii) ca să începi.',
          ],
        },
        {
          tip: 'Ți-ai schimbat obiectivul, timpul sau echipamentul? Actualizează-ți profilul și apasă **Creează-mi din nou programele** (vezi „Profil și echipament”).',
        },
      ],
    },
    {
      id: 'workout',
      title: '5. În timpul antrenamentului',
      blocks: [
        {
          p: 'Antrenamentul ocupă tot ecranul. Sus vezi durata totală, **Exercițiul 3 din 8** și seria la care ești. În spatele butoanelor, o figurină arată mișcarea; apasă **Cum se face** pentru o descriere scurtă. Ecranul rămâne aprins cât te antrenezi.',
        },
        {
          p: 'Înainte de primul exercițiu aplicația numără invers (**Pregătește-te**). Apasă **Începe acum** dacă ești gata mai devreme. Apoi depinde de exercițiu:',
        },
        { h3: 'Repetări' },
        {
          list: [
            'Numărul sugerat e deja completat. Schimbă-l cu **Mai puțin** și **Mai mult** (sau scrie-l) la cât ai făcut de fapt.',
            'La exercițiile cu greutăți introduci și greutatea, în unitatea ta.',
            'Apasă **Serie gata**.',
          ],
        },
        { h3: 'Menținere și exerciții pe timp' },
        {
          list: [
            'După o scurtă numărătoare, cronometrul merge singur în jos. **Pauză** și **Continuă** îl opresc și îl pornesc din nou.',
            'Când timpul s-a terminat, seria se încheie automat. **Mă opresc aici** o încheie mai devreme și păstrează secundele făcute; **Sari peste** sare peste serie înainte să începi.',
          ],
        },
        { h3: 'Mers, jogging și alergare' },
        {
          list: [
            'Apasă **Start** ca să-ți măsori timpul și **Pauză** dacă te oprești.',
            'La final, introdu distanța parcursă și apasă **Gata**.',
          ],
        },
        { h3: 'Pauze' },
        {
          list: [
            'După fiecare serie pornește un cronometru de pauză, cu un mesaj încurajator și ce urmează.',
            '**+15 s** îți lungește pauza; **Continuă** o încheie imediat.',
            'În ultimele trei secunde aplicația numără 3, 2, 1 și începe seria următoare. După ultima serie a unui exercițiu trece singură la exercițiul următor.',
          ],
        },
        {
          p: 'După ultima serie a ultimului exercițiu cronometrul se oprește și se deschide rezumatul.',
        },
      ],
    },
    {
      id: 'saving',
      title: '6. Salvare, oprire și conexiune',
      blocks: [
        {
          list: [
            '**Totul se salvează singur.** Fiecare serie se salvează când o termini, iar un număr schimbat se salvează la 10 secunde după ce nu-l mai atingi, și când blochezi telefonul sau treci în altă aplicație.',
            '**Fără conexiune?** Antrenamentul continuă. Ce ai făcut rămâne pe telefon („Fără conexiune: salvat deocamdată pe acest telefon”) și se trimite imediat ce revii online.',
            '**Rămâi autentificat** cât timp merge un antrenament, chiar și unul lung. Dacă sesiunea expiră totuși, antrenamentul rămâne pe telefon: apasă **Autentifică-te din nou** și se salvează când revii.',
            '**Ai închis aplicația din greșeală?** Deschide-o din nou: **Programele mele** arată **Antrenament în desfășurare**. Apasă **Continuă** ca să mergi mai departe de unde ai rămas sau **Renunță** ca să-l ștergi. Poate merge un singur antrenament odată.',
          ],
        },
        {
          p: 'Ca să te oprești mai devreme, apasă butonul de închidere de sus (**Oprește antrenamentul**) și alege:',
        },
        {
          list: [
            '**Închei acum și păstrez ce am făcut**: antrenamentul se încheie cu seriile făcute; restul contează ca sărite.',
            '**Renunț la antrenament**: tot ce ține de acest antrenament se șterge.',
            '**Continui**: înapoi la antrenament.',
          ],
        },
      ],
    },
    {
      id: 'voice',
      title: '7. Antrenorul vocal',
      blocks: [
        {
          p: 'În timpul antrenamentului telefonul îți poate vorbi, ca să nu fii nevoit să te uiți la ecran. Vocea folosește sinteza vocală a telefonului, în limba paginii. Nu are nevoie de descărcări și merge și offline.',
        },
        {
          list: [
            'Înainte de un exercițiu spune ce urmează și numără invers; la finalul fiecărei pauze numără 3, 2, 1, „start”.',
            'Îți spune când o serie e gata, cât durează pauza și ce exercițiu urmează.',
            'Te încurajează: la ultima serie, la jumătatea unei menținerii, cu zece secunde înainte de final, când depășești ținta și când termini antrenamentul.',
          ],
        },
        {
          steps: [
            'Apasă butonul cu **difuzor** din bara de instrumente sau din ecranul de antrenament ca să oprești vocea sau s-o pornești din nou.',
            'Apasă butonul **Setări de voce** de lângă el ca să alegi o voce **Feminină** sau **Masculină** și un stil: **Calm**, **Normal** sau **Motivant** (limbaj de sală).',
            'Apasă **Testează vocea** ca s-o auzi, apoi **Gata**.',
          ],
        },
        {
          tip: 'Telefoanele lasă o pagină să vorbească doar după ce ai atins ceva pe ea. Dacă redeschizi un antrenament în desfășurare, vocea pornește după prima atingere. Vocile disponibile depind de telefon; dacă nu are o voce pentru limba ta, folosește vocea implicită. Setările se păstrează pe fiecare dispozitiv.',
        },
      ],
    },
    {
      id: 'summary',
      title: '8. După antrenament',
      blocks: [
        {
          p: 'Rezumatul arată durata totală, caloriile arse (o estimare după greutatea ta și exerciții) și fiecare serie făcută. Mai arată:',
        },
        {
          list: [
            '**Ce s-a îmbunătățit** față de ultima dată la fiecare exercițiu și **recordurile personale**.',
            'Un scurt mesaj despre ziua ta.',
            '**Data viitoare**: ținta pentru antrenamentul următor. Când atingi sugestia la fiecare serie, antrenamentul următor cere o repetare în plus (sau, la capătul intervalului, puțin mai multă greutate). Când o serie a fost mult prea grea, cere puțin mai puțin.',
          ],
        },
        {
          p: 'Apasă **Înapoi la programele mele** ca să revii. Antrenamentele încheiate apar și la **Antrenamente recente** și în calendar.',
        },
      ],
    },
    {
      id: 'calendar',
      title: '9. Calendarul și statisticile',
      blocks: [
        {
          p: 'Deschide **Calendar**. Comută sus între **Zi**, **Lună** și **An** și navighează cu **Mai devreme**, **Mai târziu** și **Azi**.',
        },
        {
          list: [
            '**Lună**: zilele cu antrenament sunt colorate, mai închis pentru mai multe minute. Apasă o zi ca s-o deschizi. Sub calendar: antrenamente, zile active, timp, calorii, serii, repetări, greutate ridicată și cea mai lungă serie de zile, comparate cu luna trecută.',
            '**Zi**: fiecare antrenament din acea zi, cu ce s-a îmbunătățit și recordurile tale. Apasă **Detalii și serii** pentru rezumatul complet.',
            '**An**: toate cele douăsprezece luni dintr-o privire, antrenamentele pe lună și totalurile anului. Apasă o lună ca s-o deschizi.',
          ],
        },
        {
          p: 'Vederile de lună și an au și un loc pentru fotografia de progres a lunii sau a anului.',
        },
      ],
    },
    {
      id: 'photos',
      title: '10. Fotografii de progres',
      blocks: [
        {
          p: 'Fotografiile te ajută să-ți vezi transformarea. Toate sunt opționale și doar tu le poți vedea.',
        },
        {
          list: [
            '**Fotografia de început**: adăugată la configurare sau mai târziu la **Profil** (Fotografie și e-mailuri).',
            '**O fotografie pentru fiecare lună și an**: adaug-o la **Progres** sau în vederea de lună ori de an din calendar.',
            'Folosește **Fă o fotografie** pentru cameră sau **Alege o fotografie** pentru o imagine pe care o ai deja. **Înlocuiește** o schimbă; **Șterge fotografia** o elimină.',
            '**Înainte și după**: cu cel puțin două fotografii, trage glisorul pe pagina **Progres** ca să le compari. **Toate fotografiile** îți arată cronologia.',
          ],
        },
        {
          tip: 'Fă fiecare fotografie în același loc, cu aceeași lumină și în aceeași poziție, și se vor compara mult mai bine. Fotografiile se micșorează pe telefon înainte de încărcare (JPEG, PNG sau WebP).',
        },
      ],
    },
    {
      id: 'email',
      title: '11. E-mailul lunar',
      blocks: [
        {
          p: 'Pe 1 ale fiecărei luni primești un e-mail scurt cu cifrele lunii trecute: antrenamente, zile active, timp și calorii. Butonul **Deschide calendarul meu** deschide acea lună în aplicație, iar e-mailul îți amintește să adaugi fotografia lunii.',
        },
        {
          p: 'Nu-l vrei? Oprește **Rezumat lunar pe e-mail** la **Profil** și apasă **Salvează**.',
        },
      ],
    },
    {
      id: 'profile',
      title: '12. Profil și echipament',
      blocks: [
        {
          p: 'La **Profil** poți schimba oricând tot ce ai completat la configurare: datele și unitățile, experiența, obiectivul, antrenamentele pe săptămână, timpul pe antrenament, impactul redus, locurile și echipamentul de acasă. Apasă **Salvează**.',
        },
        {
          list: [
            'Salvarea îți păstrează programele așa cum sunt. Ca să primești altele noi, potrivite schimbărilor, apasă **Creează-mi din nou programele**. Acesta înlocuiește programele sugerate ale locurilor tale; antrenamentele trecute rămân.',
            'Actualizează-ți greutatea din când în când: caloriile și greutățile sugerate depind de ea.',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: '13. Sfaturi și întrebări',
      blocks: [
        {
          list: [
            '**Te doare la un exercițiu?** Oprește-te. Apasă **Mă opresc aici** sau introdu cât ai reușit; aplicația scade ținta data viitoare.',
            '**Per total prea ușor sau prea greu?** Schimbă experiența sau obiectivul în profil și creează-ți din nou programele.',
            '**Caloriile** sunt estimări orientative, nu o măsurătoare.',
            '**Datele tale**: antrenamentele, profilul și fotografiile sunt doar ale tale. Când te dezabonezi de la aplicație sau îți ștergi contul DevQuake, se șterg toate, inclusiv fotografiile.',
          ],
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie-ne la {email}.',
  back: '← Înapoi la programele mele',
};

const hu: Manual = {
  metaTitle: 'Útmutató · Edzésnapló',
  metaDescription:
    'Hogyan állítsd be az Edzésnaplót, hogyan kövess egy vezetett edzést a hangos edzővel a telefonodon, és hogyan olvasd a naptárat, a statisztikákat és a fejlődési fotókat.',
  ogTitle: 'Edzésnapló: útmutató',
  cta: 'Kipróbálnád? Az Edzésnapló ingyenes a DevQuake-tagoknak. {link}, majd iratkozz fel az alkalmazásra.',
  ctaLink: 'Hozz létre fiókot, vagy jelentkezz be',
  kicker: 'Edzésnapló · Útmutató',
  title: 'Így használd az Edzésnaplót',
  intro:
    'Az Edzésnapló edzésterveket készít neked, a telefonodon időzítővel és hangos edzővel végigvezet minden edzésen, és megmutatja, hogyan fejlődsz hétről hétre, hónapról hónapra és évről évre. Ez az útmutató lépésről lépésre végigvisz rajta.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Első lépések',
      blocks: [
        {
          p: 'Az Edzésnapló a DevQuake alkalmazása, és a DevQuake-fiókodat használja, így nincs külön regisztráció.',
        },
        {
          steps: [
            'Jelentkezz be itt: {host} (vagy hozz létre fiókot, és erősítsd meg az e-mail-címedet).',
            'Nyisd meg a **Fiókod → Elérhető projektek** részt, és **iratkozz fel** az „Edzésnapló” alkalmazásra.',
            'Kattints az **Edzésnapló megnyitása** gombra. Már bejelentkezve érkezel ide. Ha kijelentkezve nyitod meg közvetlenül az alkalmazás címét, egyszer bejelentkezel, és rögtön visszajutsz.',
          ],
        },
        {
          tip: 'Az alkalmazás telefonra készült: nyisd meg ott, és tedd ki a kezdőképernyőre, így edzéskor egy koppintásra van.',
        },
      ],
    },
    {
      id: 'setup',
      title: '2. Az első beállítás',
      blocks: [
        {
          p: 'Az első látogatáskor egy rövid beállítás nyílik meg. Minden lépés után koppints a **Tovább** gombra; a **Vissza** az előző lépésre visz.',
        },
        {
          steps: [
            '**Rólad**: a születési éved (csak az évet tároljuk), a magasságod cm-ben vagy ft + in-ben és a testsúlyod kg-ban vagy lb-ben. A választott mértékegységek az egész alkalmazásban érvényesek, a távolságokra is (cm mellé km, láb mellé mérföld).',
            '**Az edzésed**: a tapasztalatod (Kezdő, Haladó, Tapasztalt), a célod (Erősödés, Izomépítés, Állóképesség, Formában maradni, Fogyás), hány edzés legyen hetente, és mennyi ideig tarthat egy. Pipáld be az **Ízületkímélő gyakorlatokat kérek** lehetőséget, ha nem szeretnél ugrálást és futást.',
            '**Hol edzel?**: válassz egy vagy több helyet: **Edzőterem**, **Otthon** és **Szabadban**.',
            '**Mi van otthon?** (csak Otthon esetén): pipáld be a felszerelésedet, például kézisúlyzót, húzódzkodó rudat vagy matracot. Felszerelés nélkül saját testsúlyos gyakorlatokat kapsz.',
            '**Kezdő fotó** (nem kötelező): készíts fotót a **Fotó készítése** gombbal, vagy válassz egyet a **Fotó kiválasztása** gombbal. Az alatta lévő kapcsoló be- vagy kikapcsolja a **Havi összesítő e-mailben** lehetőséget.',
            'Koppints az **Edzésterveim elkészítése** gombra (vagy a **Fotó nélkül tovább, és edzéstervek elkészítése** gombra). Az edzésterveid pillanatok alatt elkészülnek.',
          ],
        },
        {
          tip: 'A javaslatok általános iránymutatások, nem orvosi tanácsok. Ha egészségügyi problémád van, kérdezd meg az orvosodat, mielőtt elkezded.',
        },
      ],
    },
    {
      id: 'screens',
      title: '3. A főképernyő',
      blocks: [
        {
          p: 'Az eszköztár alatt négy rész van. Telefonon húzd oldalra a sort, ha nem látod mindet.',
        },
        {
          list: [
            '**Edzésterveim** (ez nyílik meg először): az elmúlt 7 napod (edzések, idő és kalória), az edzésterveid helyenként és a legutóbbi edzéseid.',
            '**Naptár**: minden edzés napra, hónapra és évre bontva, statisztikákkal.',
            '**Fejlődés**: a fejlődési fotóid és az előtte-utána összehasonlítás.',
            '**Profil**: az adataid, a helyek, a felszerelés, a kezdő fotó és a havi e-mail.',
          ],
        },
        {
          p: 'Az eszköztárban található az **Útmutató** (ez az oldal), a nyelvválasztó, és a részek mellett a hangos edző: egy hangszóró gomb a némításhoz és egy gomb a beszédbeállításokhoz.',
        },
      ],
    },
    {
      id: 'routines',
      title: '4. Az edzésterveid',
      blocks: [
        {
          p: 'Minden helyhez három edzéstervet kapsz, például **Teljes test**, **Felsőtest** és **Láb és törzs** az edzőteremben és otthon, a szabadban pedig **Tempós séta**, **Intervallumok** és **Edzés a parkban**. Minden kártya megmutatja, hány gyakorlat van a tervben, nagyjából mennyi ideig tart, és nagyjából hány kalóriát éget.',
        },
        {
          list: [
            'Minden terv egy rövid **Bemelegítéssel** kezdődik.',
            'Koppints a **Részletek** gombra, hogy lásd az összes gyakorlatot a sorozatokkal, ismétlésekkel vagy másodpercekkel és a sorozatok utáni pihenővel. Minden gyakorlathoz egy mozgó pálcikaember mutatja, hogyan kell csinálni.',
            'A javasolt ismétlésszám attól függ, mennyire nehéz a gyakorlat: húzódzkodásból kevesebb, vádliemelésből több. A célodhoz és a tapasztalatodhoz is igazodik.',
            'Koppints a kártyán az **Indítás** gombra (vagy a részleteknél az **Edzés indítása** gombra) a kezdéshez.',
          ],
        },
        {
          tip: 'Megváltozott a célod, az időd vagy a felszerelésed? Frissítsd a profilodat, és koppints az **Edzésterveim újbóli elkészítése** gombra (lásd „Profil és felszerelés”).',
        },
      ],
    },
    {
      id: 'workout',
      title: '5. Edzés közben',
      blocks: [
        {
          p: 'Az edzés kitölti a képernyőt. Felül látod a teljes edzésidőt, a **3. gyakorlat / 8** kijelzést és az aktuális sorozatot. A gombok mögött egy pálcikaember mutatja a mozdulatot; koppints a **Hogyan csináld** gombra egy rövid leírásért. A képernyő edzés közben bekapcsolva marad.',
        },
        {
          p: 'Az első gyakorlat előtt az alkalmazás visszaszámol (**Készülj**). Koppints az **Indítás most** gombra, ha hamarabb készen állsz. Utána a gyakorlattól függ:',
        },
        { h3: 'Ismétlések' },
        {
          list: [
            'A javasolt szám már ki van töltve. Állítsd a **Kevesebb** és **Több** gombokkal (vagy írd be) arra, amennyit valóban megcsináltál.',
            'Súlyos gyakorlatoknál a súlyt is add meg a mértékegységedben.',
            'Koppints a **Sorozat kész** gombra.',
          ],
        },
        { h3: 'Tartások és időre végzett gyakorlatok' },
        {
          list: [
            'Egy rövid visszaszámlálás után az időzítő magától visszafelé számol. A **Szünet** és a **Folytatás** megállítja és újraindítja.',
            'Amikor lejár az idő, a sorozat magától kész. Az **Itt abbahagyom** korábban lezárja, és megtartja a megtett másodperceket; a **Kihagyás** kihagyja a sorozatot, mielőtt elkezdenéd.',
          ],
        },
        { h3: 'Séta, kocogás és futás' },
        {
          list: [
            'Koppints az **Indítás** gombra az idő méréséhez, és a **Szünet** gombra, ha megállsz.',
            'A végén add meg a megtett távot, és koppints a **Kész** gombra.',
          ],
        },
        { h3: 'Pihenők' },
        {
          list: [
            'Minden sorozat után elindul egy pihenőidőzítő, egy biztató mondattal és azzal, ami következik.',
            'A **+15 mp** meghosszabbítja a pihenőt; a **Tovább** azonnal befejezi.',
            'Az utolsó három másodpercben az alkalmazás visszaszámol: 3, 2, 1, és kezdődik a következő sorozat. Egy gyakorlat utolsó sorozata után magától továbblép a következő gyakorlatra.',
          ],
        },
        {
          p: 'Az utolsó gyakorlat utolsó sorozata után az időzítő megáll, és megnyílik az összesítő.',
        },
      ],
    },
    {
      id: 'saving',
      title: '6. Mentés, leállítás és a kapcsolat',
      blocks: [
        {
          list: [
            '**Minden magától mentődik.** Minden sorozat mentődik, amikor befejezed, a megváltoztatott szám pedig 10 másodperccel azután, hogy nem nyúlsz hozzá, akkor is, ha lezárod a telefont vagy másik alkalmazásra váltasz.',
            '**Nincs kapcsolat?** Az edzés folytatódik. Amit megcsináltál, a telefonon marad („Nincs kapcsolat: egyelőre ezen a telefonon mentve”), és elküldjük, amint újra online leszel.',
            '**Bejelentkezve maradsz**, amíg egy edzés fut, akkor is, ha hosszú. Ha a bejelentkezésed mégis lejár, az edzésed a telefonon marad: koppints a **Bejelentkezés újra** gombra, és visszatérés után mentődik.',
            '**Véletlenül bezártad az alkalmazást?** Nyisd meg újra: az **Edzésterveim** oldalon látod a **Folyamatban lévő edzés** részt. Koppints a **Folytatás** gombra, hogy ott folytasd, ahol abbahagytad, vagy az **Elvetés** gombra a törléséhez. Egyszerre csak egy edzés futhat.',
          ],
        },
        {
          p: 'Ha korábban abbahagynád, koppints felül a bezárás gombra (**Edzés leállítása**), és válassz:',
        },
        {
          list: [
            '**Befejezem most, és megtartom, amit csináltam**: az edzés a megcsinált sorozatokkal zárul; a többi kihagyottnak számít.',
            '**Edzés elvetése**: az edzés minden adata törlődik.',
            '**Folytatom**: vissza az edzéshez.',
          ],
        },
      ],
    },
    {
      id: 'voice',
      title: '7. A hangos edző',
      blocks: [
        {
          p: 'Edzés közben a telefonod beszélhet hozzád, így nem kell a képernyőt nézned. A hang a telefonod saját beszédfunkcióját használja az oldal nyelvén. Nem kell hozzá letöltés, és offline is működik.',
        },
        {
          list: [
            'Egy gyakorlat előtt elmondja, mi következik, és visszaszámol; minden pihenő végén 3, 2, 1, „rajta”.',
            'Szól, amikor egy sorozat kész, mennyi a pihenő, és melyik gyakorlat következik.',
            'Biztat: az utolsó sorozatnál, egy tartás felénél, tíz másodperccel a vége előtt, amikor túlszárnyalod a célt, és amikor kész az edzés.',
          ],
        },
        {
          steps: [
            'Koppints a **hangszóró** gombra az eszköztárban vagy az edzés képernyőjén a hang némításához vagy visszakapcsolásához.',
            'Koppints a mellette lévő **Beszédbeállítások** gombra, és válassz **Női** vagy **Férfi** hangot és egy stílust: **Nyugodt**, **Normál** vagy **Motiváló** (edzőtermi stílus).',
            'Koppints a **Hang kipróbálása** gombra, hogy meghallgasd, majd a **Kész** gombra.',
          ],
        },
        {
          tip: 'A telefonok csak azután engedik beszélni az oldalt, hogy megérintettél rajta valamit. Ha újra megnyitsz egy futó edzést, a hang az első koppintásod után indul. Az elérhető hangok a telefonodtól függenek; ha nincs hangja a nyelvedhez, az alapértelmezett hangját használja. A beállítások eszközönként külön tárolódnak.',
        },
      ],
    },
    {
      id: 'summary',
      title: '8. Edzés után',
      blocks: [
        {
          p: 'Az összesítő megmutatja a teljes időt, az elégetett kalóriát (becslés a testsúlyod és a gyakorlatok alapján) és minden elvégzett sorozatot. Ezenkívül megmutatja:',
        },
        {
          list: [
            '**Miben fejlődtél** az egyes gyakorlatoknál a legutóbbi alkalomhoz képest, és az **Egyéni csúcsaidat**.',
            'Egy rövid visszajelzést a napodról.',
            '**Legközelebb**: a következő edzés célját. Ha minden sorozatban eléred a javaslatot, a következő edzés eggyel több ismétlést kér (vagy a tartomány tetején egy kicsit több súlyt). Ha egy sorozat túl nehéz volt, kicsit kevesebbet kér.',
          ],
        },
        {
          p: 'Koppints a **Vissza az edzésterveimhez** gombra a visszatéréshez. A befejezett edzéseid a **Legutóbbi edzések** alatt és a naptárban is megtalálhatók.',
        },
      ],
    },
    {
      id: 'calendar',
      title: '9. A naptár és a statisztikáid',
      blocks: [
        {
          p: 'Nyisd meg a **Naptár** részt. Felül válts a **Nap**, **Hónap** és **Év** nézet között, és lapozz a **Korábban**, **Később** és **Ma** gombokkal.',
        },
        {
          list: [
            '**Hónap**: az edzésnapok színesek, több perc esetén sötétebbek. Koppints egy napra a megnyitásához. A naptár alatt: edzések, aktív napok, idő, kalória, sorozatok, ismétlések, megmozgatott súly és a leghosszabb sorozatod, az előző hónaphoz képest.',
            '**Nap**: az adott nap minden edzése azzal, miben fejlődtél, és az egyéni csúcsaiddal. Koppints a **Részletek és sorozatok** gombra a teljes összesítőért.',
            '**Év**: mind a tizenkét hónap egy pillantásra, a havi edzések és az év összesítése. Koppints egy hónapra a megnyitásához.',
          ],
        },
        {
          p: 'A havi és az éves nézetben helye van az adott hónap vagy év fejlődési fotójának is.',
        },
      ],
    },
    {
      id: 'photos',
      title: '10. Fejlődési fotók',
      blocks: [
        {
          p: 'A fotók segítenek látni a változásodat. Egyik sem kötelező, és csak te láthatod őket.',
        },
        {
          list: [
            '**Kezdő fotó**: a beállításkor adod hozzá, vagy később a **Profil** oldalon (Fotó és e-mailek).',
            '**Fotó minden hónapra és évre**: add hozzá a **Fejlődés** oldalon, vagy a naptár havi vagy éves nézetében.',
            'A **Fotó készítése** a kamerát nyitja meg, a **Fotó kiválasztása** egy meglévő képet. A **Csere** kicseréli, a **Fotó törlése** eltávolítja.',
            '**Előtte és utána**: legalább két fotóval a **Fejlődés** oldalon húzd a csúszkát az összehasonlításhoz. Az **Összes fotó** az idővonaladat mutatja.',
          ],
        },
        {
          tip: 'Minden fotót ugyanott, ugyanabban a fényben és ugyanabban a testtartásban készíts, így sokkal jobban összehasonlíthatók. A fotókat a telefonod feltöltés előtt kisebbre méretezi (JPEG, PNG vagy WebP).',
        },
      ],
    },
    {
      id: 'email',
      title: '11. A havi e-mail',
      blocks: [
        {
          p: 'Minden hónap 1-jén kapsz egy rövid e-mailt az előző hónap számaival: edzések, aktív napok, idő és kalória. Az e-mailben lévő **A naptáram megnyitása** gomb megnyitja azt a hónapot az alkalmazásban, és az e-mail emlékeztet a havi fotóra is.',
        },
        {
          p: 'Nem kéred? Kapcsold ki a **Havi összesítő e-mailben** lehetőséget a **Profil** oldalon, és koppints a **Mentés** gombra.',
        },
      ],
    },
    {
      id: 'profile',
      title: '12. Profil és felszerelés',
      blocks: [
        {
          p: 'A **Profil** oldalon bármikor módosíthatsz mindent, amit a beállításkor megadtál: az adataidat és a mértékegységeket, a tapasztalatot, a célt, a heti edzések számát, az edzésenkénti időt, az ízületkímélést, a helyeidet és az otthoni felszerelésedet. Koppints a **Mentés** gombra.',
        },
        {
          list: [
            'A mentés nem változtat az edzésterveiden. Ha a változásaidhoz illő új terveket szeretnél, koppints az **Edzésterveim újbóli elkészítése** gombra. Ez lecseréli a helyeid javasolt edzésterveit; a korábbi edzéseid megmaradnak.',
            'Időnként frissítsd a testsúlyodat: a kalória és a javasolt súlyok ettől függenek.',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: '13. Tippek és kérdések',
      blocks: [
        {
          list: [
            '**Fáj egy gyakorlat?** Hagyd abba. Koppints az **Itt abbahagyom** gombra, vagy írd be, amennyit sikerült; az alkalmazás legközelebb csökkenti a célt.',
            '**Összességében túl könnyű vagy túl nehéz?** Módosítsd a tapasztalatot vagy a célt a profilodban, és készíttesd el újra az edzésterveidet.',
            'A **kalória** tájékoztató becslés, nem mérés.',
            '**Az adataid**: az edzéseid, a profilod és a fotóid csak a tieid. Ha leiratkozol az alkalmazásról, vagy törlöd a DevQuake-fiókodat, minden törlődik, a fotók is.',
          ],
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj ide: {email}.',
  back: '← Vissza az edzésterveimhez',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu };
