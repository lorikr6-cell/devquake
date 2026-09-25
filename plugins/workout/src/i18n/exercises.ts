import { defineMessages } from './define';

// Names and how-to texts of the built-in exercises (exercises.<slug>), equipment and muscle
// groups (ADR 0011, ADR 0013). Keys follow src/lib/catalog.ts; catalog.test.ts checks that every
// slug has its texts.

const en = {
  exercises: {
    march_in_place: {
      name: 'March in place',
      howTo: 'Lift your knees in turn and swing your arms, at an easy pace.',
    },
    jumping_jacks: {
      name: 'Jumping jacks',
      howTo: 'Jump your feet apart while raising your arms overhead, then jump back.',
    },
    high_knees: {
      name: 'High knees',
      howTo: 'Run on the spot, bringing your knees up to hip height.',
    },
    arm_circles: {
      name: 'Arm circles',
      howTo: 'Hold your arms out to the sides and draw small circles, then larger ones.',
    },
    hip_circles: {
      name: 'Hip circles',
      howTo: 'Hands on your hips, circle your hips slowly in both directions.',
    },
    torso_twists: {
      name: 'Torso twists',
      howTo: 'Stand tall and turn your upper body from side to side, arms loose.',
    },
    leg_swings: {
      name: 'Leg swings',
      howTo: 'Hold on to a wall and swing one leg forward and back, then change legs.',
    },
    easy_walk: { name: 'Easy walk', howTo: 'Walk at a relaxed pace to warm up.' },
    push_up: {
      name: 'Push-up',
      howTo:
        'Hands under your shoulders, body straight: lower your chest to the floor and push back up.',
    },
    knee_push_up: {
      name: 'Knee push-up',
      howTo: 'Like a push-up, but with your knees on the floor.',
    },
    wall_push_up: {
      name: 'Wall push-up',
      howTo:
        'Hands on a wall at shoulder height: bend your elbows to bring your chest to the wall, then push away.',
    },
    diamond_push_up: {
      name: 'Diamond push-up',
      howTo: 'A push-up with your hands close together under your chest; it works the triceps.',
    },
    incline_push_up: {
      name: 'Incline push-up',
      howTo: 'A push-up with your hands on a bench; easier than on the floor.',
    },
    pike_push_up: {
      name: 'Pike push-up',
      howTo:
        'Hips high in an upside-down V: bend your elbows to lower your head towards the floor.',
    },
    air_squat: {
      name: 'Squat',
      howTo:
        'Feet shoulder-width apart: sit back and down until your thighs are level, then stand up.',
    },
    jump_squat: {
      name: 'Jump squat',
      howTo: 'Squat down, then jump up explosively and land softly.',
    },
    reverse_lunge: {
      name: 'Reverse lunge',
      howTo: 'Step back and lower your back knee towards the floor, then return. Change legs.',
    },
    glute_bridge: {
      name: 'Glute bridge',
      howTo:
        'Lie on your back, knees bent: lift your hips until your body is straight from shoulders to knees.',
    },
    wall_sit: {
      name: 'Wall sit',
      howTo: 'Back against a wall, slide down until your knees are at a right angle, and hold.',
    },
    calf_raise: {
      name: 'Calf raise',
      howTo: 'Rise onto your toes, pause, and lower your heels slowly.',
    },
    step_up: {
      name: 'Step-up',
      howTo: 'Step onto a box with one foot, stand up fully, step down. Change legs.',
    },
    burpee: {
      name: 'Burpee',
      howTo: 'Squat, jump your feet back into a plank, jump them in again and jump up.',
    },
    mountain_climber: {
      name: 'Mountain climbers',
      howTo: 'In a high plank, drive your knees towards your chest in turn, quickly.',
    },
    superman: {
      name: 'Superman',
      howTo: 'Lie face down and lift your arms, chest and legs off the floor; hold briefly.',
    },
    prone_y_raise: {
      name: 'Prone Y raise',
      howTo: 'Lie face down, arms overhead in a Y: lift your arms and hold briefly.',
    },
    reverse_snow_angel: {
      name: 'Reverse snow angel',
      howTo: 'Lie face down and sweep your arms from your sides to overhead, just above the floor.',
    },
    bench_dip: {
      name: 'Bench dip',
      howTo: 'Hands on a bench behind you: bend your elbows to lower your hips, then push up.',
    },
    plank: {
      name: 'Plank',
      howTo:
        'Forearms on the floor, body straight from head to heels: hold without letting your hips sag.',
    },
    side_plank: {
      name: 'Side plank',
      howTo: 'On one forearm, body straight and hips lifted: hold, then change sides.',
    },
    crunch: {
      name: 'Crunch',
      howTo:
        'Lie on your back, knees bent: lift your shoulders off the floor and lower them slowly.',
    },
    bicycle_crunch: {
      name: 'Bicycle crunch',
      howTo:
        'On your back, bring one knee in and turn the opposite elbow towards it; change sides.',
    },
    leg_raise: {
      name: 'Leg raise',
      howTo:
        'On your back, legs straight: lift them to vertical and lower them slowly without touching the floor.',
    },
    dead_bug: {
      name: 'Dead bug',
      howTo:
        'On your back, arms up and knees bent: stretch out one arm and the opposite leg, then change.',
    },
    russian_twist: {
      name: 'Russian twist',
      howTo: 'Sit leaning back a little and move your hands from side to side.',
    },
    hanging_knee_raise: {
      name: 'Hanging knee raise',
      howTo: 'Hang from the bar and pull your knees up towards your chest.',
    },
    pull_up: {
      name: 'Pull-up',
      howTo: 'Hang from the bar, palms facing away, and pull your chin over the bar.',
    },
    chin_up: {
      name: 'Chin-up',
      howTo: 'Hang from the bar, palms facing you, and pull your chin over the bar.',
    },
    db_bench_press: {
      name: 'Dumbbell bench press',
      howTo: 'Lie on a bench, press the dumbbells up over your chest and lower them with control.',
    },
    db_floor_press: {
      name: 'Dumbbell floor press',
      howTo: 'Lie on the floor and press the dumbbells up; your elbows stop on the floor.',
    },
    db_fly: {
      name: 'Dumbbell fly',
      howTo:
        'On a bench, arms slightly bent: open them wide, then bring the dumbbells together over your chest.',
    },
    db_shoulder_press: {
      name: 'Dumbbell shoulder press',
      howTo: 'Press the dumbbells from your shoulders to overhead.',
    },
    db_lateral_raise: {
      name: 'Lateral raise',
      howTo: 'Raise the dumbbells out to the sides up to shoulder height.',
    },
    db_row: {
      name: 'Dumbbell row',
      howTo: 'Lean forward with a flat back and pull the dumbbells to your hips.',
    },
    db_curl: {
      name: 'Dumbbell curl',
      howTo: 'Elbows by your sides, curl the dumbbells up to your shoulders.',
    },
    db_hammer_curl: { name: 'Hammer curl', howTo: 'A curl with your palms facing each other.' },
    db_overhead_triceps: {
      name: 'Overhead triceps extension',
      howTo: 'Hold a dumbbell overhead and lower it behind your head by bending your elbows.',
    },
    db_goblet_squat: { name: 'Goblet squat', howTo: 'Hold a dumbbell at your chest and squat.' },
    db_lunge: { name: 'Dumbbell lunge', howTo: 'A lunge with a dumbbell in each hand.' },
    db_romanian_deadlift: {
      name: 'Dumbbell Romanian deadlift',
      howTo:
        'Knees soft, push your hips back and lower the dumbbells along your legs, then stand up.',
    },
    kb_swing: {
      name: 'Kettlebell swing',
      howTo: 'Hinge at the hips and snap them forward to swing the kettlebell to chest height.',
    },
    kb_goblet_squat: {
      name: 'Kettlebell goblet squat',
      howTo: 'Hold the kettlebell at your chest and squat.',
    },
    kb_deadlift: {
      name: 'Kettlebell deadlift',
      howTo: 'Kettlebell between your feet: push your hips back, grip it and stand up tall.',
    },
    bb_back_squat: {
      name: 'Barbell back squat',
      howTo: 'Bar on your upper back: squat until your thighs are level, then stand up.',
    },
    bb_bench_press: {
      name: 'Barbell bench press',
      howTo: 'Lower the bar to your chest and press it back up. Use a spotter or safety bars.',
    },
    bb_deadlift: {
      name: 'Deadlift',
      howTo:
        'Bar over the middle of your feet, back flat: stand up with the bar and lower it with control.',
    },
    bb_overhead_press: {
      name: 'Overhead press',
      howTo: 'Press the bar from your shoulders to overhead, body tight.',
    },
    bb_row: {
      name: 'Barbell row',
      howTo: 'Lean forward with a flat back and pull the bar to your lower chest.',
    },
    bb_curl: {
      name: 'Barbell curl',
      howTo: 'Elbows by your sides, curl the bar up to your shoulders.',
    },
    bb_hip_thrust: {
      name: 'Hip thrust',
      howTo: 'Upper back on a bench, bar over your hips: drive your hips up.',
    },
    bb_romanian_deadlift: {
      name: 'Romanian deadlift',
      howTo: 'Knees soft, push your hips back and lower the bar along your legs, then stand up.',
    },
    band_row: {
      name: 'Band row',
      howTo: 'Loop the band around your feet and pull the ends to your waist.',
    },
    band_pull_apart: {
      name: 'Band pull-apart',
      howTo:
        'Hold the band in front of you and pull it apart until your arms are out to the sides.',
    },
    band_curl: {
      name: 'Band curl',
      howTo: 'Stand on the band and curl the handles up to your shoulders.',
    },
    band_chest_press: {
      name: 'Band chest press',
      howTo: 'Band behind your back: press your hands forward until your arms are straight.',
    },
    lat_pulldown: {
      name: 'Lat pulldown',
      howTo: 'Pull the bar down to your upper chest, elbows down and back.',
    },
    seated_cable_row: {
      name: 'Seated cable row',
      howTo: 'Sit tall and pull the handle to your waist, squeezing your shoulder blades.',
    },
    triceps_pushdown: {
      name: 'Triceps pushdown',
      howTo: 'Elbows by your sides, push the cable down until your arms are straight.',
    },
    face_pull: {
      name: 'Face pull',
      howTo: 'Pull the rope towards your face with your elbows high.',
    },
    leg_press: {
      name: 'Leg press',
      howTo: 'Push the platform away until your legs are almost straight, then bend them again.',
    },
    leg_curl: {
      name: 'Leg curl',
      howTo: 'Curl the pad towards your glutes, then lower it slowly.',
    },
    leg_extension: {
      name: 'Leg extension',
      howTo: 'Straighten your legs to lift the pad, then lower it slowly.',
    },
    machine_chest_press: {
      name: 'Machine chest press',
      howTo: 'Push the handles forward until your arms are straight, then return slowly.',
    },
    treadmill_run: {
      name: 'Treadmill run',
      howTo: 'Run at a pace where you can still say a few words.',
    },
    treadmill_walk: {
      name: 'Incline walk',
      howTo: 'Walk briskly on the treadmill with a slight incline.',
    },
    exercise_bike: {
      name: 'Exercise bike',
      howTo: 'Pedal at a steady pace that makes you breathe harder.',
    },
    rowing_machine: {
      name: 'Rowing machine',
      howTo: 'Push with your legs, then pull with your arms; return in the reverse order.',
    },
    jump_rope: { name: 'Jump rope', howTo: 'Small, light jumps on the balls of your feet.' },
    brisk_walk: {
      name: 'Brisk walk',
      howTo: 'Walk fast enough to breathe harder while still being able to talk.',
    },
    jog: { name: 'Jog', howTo: 'Run at an easy pace where you can talk.' },
    run: { name: 'Run', howTo: 'Run at a steady, challenging pace.' },
    run_walk_intervals: {
      name: 'Run/walk intervals',
      howTo: 'Run for 1 minute, walk for 2; repeat until the time is up.',
    },
    power_walk_intervals: {
      name: 'Power walk intervals',
      howTo: 'Walk fast for 2 minutes, then easy for 1; repeat until the time is up.',
    },
  },
  equipment: {
    dumbbells: 'Dumbbells',
    kettlebell: 'Kettlebell',
    barbell: 'Barbell and plates',
    squat_rack: 'Squat rack',
    bench: 'Bench',
    pull_up_bar: 'Pull-up bar',
    resistance_bands: 'Resistance bands',
    jump_rope: 'Jump rope',
    box: 'Step or box',
    treadmill: 'Treadmill',
    exercise_bike: 'Exercise bike',
    rowing_machine: 'Rowing machine',
    cable_machine: 'Cable machine',
    leg_press: 'Leg press',
    leg_machines: 'Leg curl and extension machines',
    chest_press_machine: 'Chest press machine',
  },
  muscles: {
    chest: 'Chest',
    back: 'Back',
    shoulders: 'Shoulders',
    biceps: 'Biceps',
    triceps: 'Triceps',
    core: 'Core',
    glutes: 'Glutes',
    quads: 'Front thighs',
    hamstrings: 'Back thighs',
    calves: 'Calves',
    full_body: 'Whole body',
  },
};

export const exerciseTexts = defineMessages(en, {
  de: {
    exercises: {
      march_in_place: {
        name: 'Marschieren auf der Stelle',
        howTo: 'Hebe abwechselnd die Knie und schwinge die Arme mit, in ruhigem Tempo.',
      },
      jumping_jacks: {
        name: 'Hampelmann',
        howTo:
          'Spring mit den Füßen auseinander und heb dabei die Arme über den Kopf, dann spring zurück.',
      },
      high_knees: {
        name: 'Kniehebelauf',
        howTo: 'Lauf auf der Stelle und zieh die Knie bis auf Hüfthöhe.',
      },
      arm_circles: {
        name: 'Armkreisen',
        howTo: 'Streck die Arme zur Seite und kreise sie erst klein, dann größer.',
      },
      hip_circles: {
        name: 'Hüftkreisen',
        howTo: 'Hände an die Hüften und die Hüfte langsam in beide Richtungen kreisen.',
      },
      torso_twists: {
        name: 'Rumpfdrehen',
        howTo: 'Steh aufrecht und dreh den Oberkörper von Seite zu Seite, die Arme locker.',
      },
      leg_swings: {
        name: 'Beinschwingen',
        howTo:
          'Halt dich an einer Wand fest und schwing ein Bein vor und zurück, dann Beinwechsel.',
      },
      easy_walk: { name: 'Lockeres Gehen', howTo: 'Geh zum Aufwärmen in entspanntem Tempo.' },
      push_up: {
        name: 'Liegestütz',
        howTo:
          'Hände unter den Schultern, Körper gerade: senk die Brust zum Boden und drück dich wieder hoch.',
      },
      knee_push_up: {
        name: 'Liegestütz auf den Knien',
        howTo: 'Wie ein Liegestütz, aber mit den Knien auf dem Boden.',
      },
      wall_push_up: {
        name: 'Liegestütz an der Wand',
        howTo:
          'Hände auf Schulterhöhe an der Wand: beug die Ellbogen, bis die Brust nah an der Wand ist, und drück dich weg.',
      },
      diamond_push_up: {
        name: 'Diamant-Liegestütz',
        howTo: 'Ein Liegestütz mit den Händen eng zusammen unter der Brust; trainiert den Trizeps.',
      },
      incline_push_up: {
        name: 'Schräger Liegestütz',
        howTo: 'Ein Liegestütz mit den Händen auf einer Bank; leichter als auf dem Boden.',
      },
      pike_push_up: {
        name: 'Pike-Liegestütz',
        howTo:
          'Hüfte hoch wie ein umgedrehtes V: beug die Ellbogen und senk den Kopf Richtung Boden.',
      },
      air_squat: {
        name: 'Kniebeuge',
        howTo:
          'Füße schulterbreit: setz dich nach hinten unten, bis die Oberschenkel waagerecht sind, und steh auf.',
      },
      jump_squat: {
        name: 'Sprungkniebeuge',
        howTo: 'Geh in die Kniebeuge, spring kraftvoll hoch und lande weich.',
      },
      reverse_lunge: {
        name: 'Ausfallschritt nach hinten',
        howTo:
          'Mach einen Schritt zurück und senk das hintere Knie Richtung Boden, dann zurück. Beinwechsel.',
      },
      glute_bridge: {
        name: 'Beckenheben',
        howTo:
          'Rückenlage, Knie gebeugt: heb die Hüfte, bis der Körper von den Schultern bis zu den Knien gerade ist.',
      },
      wall_sit: {
        name: 'Wandsitzen',
        howTo:
          'Rücken an die Wand, rutsch hinunter, bis die Knie im rechten Winkel sind, und halte.',
      },
      calf_raise: {
        name: 'Wadenheben',
        howTo: 'Geh auf die Zehenspitzen, halte kurz und senk die Fersen langsam.',
      },
      step_up: {
        name: 'Aufsteigen',
        howTo:
          'Steig mit einem Fuß auf eine Box, richte dich ganz auf und steig wieder ab. Beinwechsel.',
      },
      burpee: {
        name: 'Burpee',
        howTo:
          'Geh in die Hocke, spring mit den Füßen in den Liegestütz, wieder zurück und spring hoch.',
      },
      mountain_climber: {
        name: 'Bergsteiger',
        howTo: 'Im Liegestütz ziehst du die Knie schnell abwechselnd zur Brust.',
      },
      superman: {
        name: 'Superman',
        howTo: 'Bauchlage: heb Arme, Brust und Beine vom Boden ab und halte kurz.',
      },
      prone_y_raise: {
        name: 'Y-Heben in Bauchlage',
        howTo: 'Bauchlage, Arme in Y-Form über dem Kopf: heb die Arme an und halte kurz.',
      },
      reverse_snow_angel: {
        name: 'Umgekehrter Schneeengel',
        howTo: 'Bauchlage: führ die Arme knapp über dem Boden von der Seite bis über den Kopf.',
      },
      bench_dip: {
        name: 'Dips an der Bank',
        howTo:
          'Hände hinter dir auf einer Bank: beug die Ellbogen, senk die Hüfte und drück dich hoch.',
      },
      plank: {
        name: 'Unterarmstütz',
        howTo:
          'Unterarme am Boden, Körper gerade von Kopf bis Ferse: halten, ohne dass die Hüfte durchhängt.',
      },
      side_plank: {
        name: 'Seitstütz',
        howTo: 'Auf einem Unterarm, Körper gerade und Hüfte oben: halten, dann Seitenwechsel.',
      },
      crunch: {
        name: 'Crunch',
        howTo: 'Rückenlage, Knie gebeugt: heb die Schultern vom Boden und senk sie langsam.',
      },
      bicycle_crunch: {
        name: 'Fahrrad-Crunch',
        howTo:
          'Rückenlage: zieh ein Knie heran und dreh den gegenüberliegenden Ellbogen dazu; Seitenwechsel.',
      },
      leg_raise: {
        name: 'Beinheben',
        howTo:
          'Rückenlage, Beine gestreckt: heb sie bis zur Senkrechten und senk sie langsam, ohne den Boden zu berühren.',
      },
      dead_bug: {
        name: 'Dead Bug',
        howTo:
          'Rückenlage, Arme hoch, Knie gebeugt: streck einen Arm und das gegenüberliegende Bein aus, dann wechseln.',
      },
      russian_twist: {
        name: 'Russian Twist',
        howTo: 'Setz dich leicht nach hinten gelehnt hin und führ die Hände von Seite zu Seite.',
      },
      hanging_knee_raise: {
        name: 'Knieheben im Hang',
        howTo: 'Häng dich an die Stange und zieh die Knie zur Brust.',
      },
      pull_up: {
        name: 'Klimmzug',
        howTo:
          'Häng dich mit den Handflächen nach vorn an die Stange und zieh das Kinn über die Stange.',
      },
      chin_up: {
        name: 'Klimmzug im Untergriff',
        howTo:
          'Häng dich mit den Handflächen zu dir an die Stange und zieh das Kinn über die Stange.',
      },
      db_bench_press: {
        name: 'Bankdrücken mit Kurzhanteln',
        howTo:
          'Leg dich auf eine Bank, drück die Hanteln über der Brust nach oben und senk sie kontrolliert.',
      },
      db_floor_press: {
        name: 'Bodendrücken mit Kurzhanteln',
        howTo: 'Leg dich auf den Boden und drück die Hanteln hoch; die Ellbogen stoppen am Boden.',
      },
      db_fly: {
        name: 'Fliegende mit Kurzhanteln',
        howTo:
          'Auf der Bank, Arme leicht gebeugt: öffne sie weit und führ die Hanteln über der Brust zusammen.',
      },
      db_shoulder_press: {
        name: 'Schulterdrücken mit Kurzhanteln',
        howTo: 'Drück die Hanteln von den Schultern über den Kopf.',
      },
      db_lateral_raise: {
        name: 'Seitheben',
        howTo: 'Heb die Hanteln seitlich bis auf Schulterhöhe.',
      },
      db_row: {
        name: 'Rudern mit Kurzhanteln',
        howTo: 'Beug dich mit geradem Rücken vor und zieh die Hanteln zur Hüfte.',
      },
      db_curl: {
        name: 'Bizepscurl mit Kurzhanteln',
        howTo: 'Ellbogen am Körper: beug die Arme und führ die Hanteln zu den Schultern.',
      },
      db_hammer_curl: {
        name: 'Hammercurl',
        howTo: 'Ein Curl mit zueinander zeigenden Handflächen.',
      },
      db_overhead_triceps: {
        name: 'Trizepsdrücken über Kopf',
        howTo:
          'Halt eine Hantel über dem Kopf und senk sie durch Beugen der Ellbogen hinter den Kopf.',
      },
      db_goblet_squat: {
        name: 'Goblet-Kniebeuge',
        howTo: 'Halt eine Kurzhantel vor der Brust und geh in die Kniebeuge.',
      },
      db_lunge: {
        name: 'Ausfallschritt mit Kurzhanteln',
        howTo: 'Ein Ausfallschritt mit einer Hantel in jeder Hand.',
      },
      db_romanian_deadlift: {
        name: 'Rumänisches Kreuzheben mit Kurzhanteln',
        howTo:
          'Knie leicht gebeugt, Hüfte nach hinten, die Hanteln an den Beinen entlang senken, dann aufrichten.',
      },
      kb_swing: {
        name: 'Kettlebell-Swing',
        howTo:
          'Beug dich in der Hüfte und schieb sie kräftig nach vorn, damit die Kettlebell auf Brusthöhe schwingt.',
      },
      kb_goblet_squat: {
        name: 'Goblet-Kniebeuge mit Kettlebell',
        howTo: 'Halt die Kettlebell vor der Brust und geh in die Kniebeuge.',
      },
      kb_deadlift: {
        name: 'Kreuzheben mit Kettlebell',
        howTo: 'Kettlebell zwischen den Füßen: Hüfte nach hinten, greifen und aufrecht hinstellen.',
      },
      bb_back_squat: {
        name: 'Kniebeuge mit Langhantel',
        howTo:
          'Stange auf dem oberen Rücken: geh tief, bis die Oberschenkel waagerecht sind, und steh auf.',
      },
      bb_bench_press: {
        name: 'Bankdrücken mit Langhantel',
        howTo:
          'Senk die Stange zur Brust und drück sie wieder hoch. Mit Partner oder Sicherheitsablagen.',
      },
      bb_deadlift: {
        name: 'Kreuzheben',
        howTo:
          'Stange über der Fußmitte, Rücken gerade: mit der Stange aufrichten und kontrolliert absenken.',
      },
      bb_overhead_press: {
        name: 'Schulterdrücken mit Langhantel',
        howTo: 'Drück die Stange von den Schultern über den Kopf, Körper fest.',
      },
      bb_row: {
        name: 'Langhantelrudern',
        howTo: 'Beug dich mit geradem Rücken vor und zieh die Stange zur unteren Brust.',
      },
      bb_curl: {
        name: 'Langhantelcurl',
        howTo: 'Ellbogen am Körper: beug die Arme und führ die Stange zu den Schultern.',
      },
      bb_hip_thrust: {
        name: 'Hip Thrust',
        howTo: 'Oberer Rücken auf einer Bank, Stange über der Hüfte: drück die Hüfte nach oben.',
      },
      bb_romanian_deadlift: {
        name: 'Rumänisches Kreuzheben',
        howTo:
          'Knie leicht gebeugt, Hüfte nach hinten, die Stange an den Beinen entlang senken, dann aufrichten.',
      },
      band_row: {
        name: 'Rudern mit Band',
        howTo: 'Leg das Band um die Füße und zieh die Enden zur Taille.',
      },
      band_pull_apart: {
        name: 'Band auseinanderziehen',
        howTo:
          'Halt das Band vor dir und zieh es auseinander, bis die Arme seitlich gestreckt sind.',
      },
      band_curl: {
        name: 'Bizepscurl mit Band',
        howTo: 'Stell dich auf das Band und führ die Griffe zu den Schultern.',
      },
      band_chest_press: {
        name: 'Brustdrücken mit Band',
        howTo: 'Band hinter dem Rücken: drück die Hände nach vorn, bis die Arme gestreckt sind.',
      },
      lat_pulldown: {
        name: 'Latzug',
        howTo: 'Zieh die Stange zur oberen Brust, die Ellbogen nach unten und hinten.',
      },
      seated_cable_row: {
        name: 'Rudern am Kabelzug',
        howTo: 'Sitz aufrecht und zieh den Griff zur Taille, die Schulterblätter zusammen.',
      },
      triceps_pushdown: {
        name: 'Trizepsdrücken am Kabel',
        howTo: 'Ellbogen am Körper: drück das Kabel nach unten, bis die Arme gestreckt sind.',
      },
      face_pull: { name: 'Face Pull', howTo: 'Zieh das Seil mit hohen Ellbogen zum Gesicht.' },
      leg_press: {
        name: 'Beinpresse',
        howTo: 'Drück die Plattform weg, bis die Beine fast gestreckt sind, dann wieder beugen.',
      },
      leg_curl: { name: 'Beinbeuger', howTo: 'Zieh das Polster zum Gesäß und senk es langsam.' },
      leg_extension: {
        name: 'Beinstrecker',
        howTo: 'Streck die Beine, um das Polster zu heben, und senk es langsam.',
      },
      machine_chest_press: {
        name: 'Brustpresse',
        howTo:
          'Drück die Griffe nach vorn, bis die Arme gestreckt sind, und führ sie langsam zurück.',
      },
      treadmill_run: {
        name: 'Laufen auf dem Laufband',
        howTo: 'Lauf in einem Tempo, bei dem du noch ein paar Worte sagen kannst.',
      },
      treadmill_walk: {
        name: 'Gehen mit Steigung',
        howTo: 'Geh zügig auf dem Laufband mit leichter Steigung.',
      },
      exercise_bike: {
        name: 'Heimtrainer',
        howTo: 'Tritt gleichmäßig in einem Tempo, bei dem du schneller atmest.',
      },
      rowing_machine: {
        name: 'Rudergerät',
        howTo: 'Drück mit den Beinen, dann zieh mit den Armen; zurück in umgekehrter Reihenfolge.',
      },
      jump_rope: { name: 'Seilspringen', howTo: 'Kleine, leichte Sprünge auf den Fußballen.' },
      brisk_walk: {
        name: 'Zügiges Gehen',
        howTo: 'Geh so schnell, dass du schneller atmest, aber noch sprechen kannst.',
      },
      jog: { name: 'Joggen', howTo: 'Lauf in lockerem Tempo, bei dem du dich unterhalten kannst.' },
      run: { name: 'Laufen', howTo: 'Lauf in einem gleichmäßigen, fordernden Tempo.' },
      run_walk_intervals: {
        name: 'Lauf-Geh-Intervalle',
        howTo: 'Lauf 1 Minute, geh 2 Minuten; wiederhol das, bis die Zeit um ist.',
      },
      power_walk_intervals: {
        name: 'Walking-Intervalle',
        howTo: 'Geh 2 Minuten schnell, dann 1 Minute locker; wiederhol das, bis die Zeit um ist.',
      },
    },
    equipment: {
      dumbbells: 'Kurzhanteln',
      kettlebell: 'Kettlebell',
      barbell: 'Langhantel und Scheiben',
      squat_rack: 'Kniebeugenständer',
      bench: 'Bank',
      pull_up_bar: 'Klimmzugstange',
      resistance_bands: 'Widerstandsbänder',
      jump_rope: 'Springseil',
      box: 'Stepper oder Box',
      treadmill: 'Laufband',
      exercise_bike: 'Heimtrainer',
      rowing_machine: 'Rudergerät',
      cable_machine: 'Kabelzug',
      leg_press: 'Beinpresse',
      leg_machines: 'Beinbeuger- und Beinstreckermaschine',
      chest_press_machine: 'Brustpresse',
    },
    muscles: {
      chest: 'Brust',
      back: 'Rücken',
      shoulders: 'Schultern',
      biceps: 'Bizeps',
      triceps: 'Trizeps',
      core: 'Rumpf',
      glutes: 'Gesäß',
      quads: 'Oberschenkel vorn',
      hamstrings: 'Oberschenkel hinten',
      calves: 'Waden',
      full_body: 'Ganzer Körper',
    },
  },
  ro: {
    exercises: {
      march_in_place: {
        name: 'Mers pe loc',
        howTo: 'Ridică genunchii pe rând și balansează brațele, într-un ritm lejer.',
      },
      jumping_jacks: {
        name: 'Sărituri cu depărtare',
        howTo: 'Sari depărtând picioarele și ridicând brațele deasupra capului, apoi revino.',
      },
      high_knees: {
        name: 'Genunchii sus',
        howTo: 'Aleargă pe loc, ridicând genunchii până la nivelul șoldului.',
      },
      arm_circles: {
        name: 'Rotiri de brațe',
        howTo: 'Ține brațele întinse lateral și desenează cercuri mici, apoi mai mari.',
      },
      hip_circles: {
        name: 'Rotiri de șold',
        howTo: 'Cu mâinile pe șolduri, rotește șoldul încet în ambele sensuri.',
      },
      torso_twists: {
        name: 'Răsuciri ale trunchiului',
        howTo:
          'Stai drept și rotește partea de sus a corpului dintr-o parte în alta, cu brațele relaxate.',
      },
      leg_swings: {
        name: 'Balansări de picior',
        howTo:
          'Ține-te de un perete și balansează un picior înainte și înapoi, apoi schimbă piciorul.',
      },
      easy_walk: { name: 'Mers lejer', howTo: 'Mergi într-un ritm relaxat ca să te încălzești.' },
      push_up: {
        name: 'Flotare',
        howTo:
          'Mâinile sub umeri, corpul drept: coboară pieptul spre podea și împinge înapoi în sus.',
      },
      knee_push_up: {
        name: 'Flotare pe genunchi',
        howTo: 'Ca o flotare, dar cu genunchii pe podea.',
      },
      wall_push_up: {
        name: 'Flotare la perete',
        howTo:
          'Mâinile pe perete la înălțimea umerilor: îndoaie coatele ca să aduci pieptul spre perete, apoi împinge.',
      },
      diamond_push_up: {
        name: 'Flotare diamant',
        howTo: 'O flotare cu mâinile apropiate sub piept; lucrează tricepșii.',
      },
      incline_push_up: {
        name: 'Flotare înclinată',
        howTo: 'O flotare cu mâinile pe o bancă; mai ușoară decât pe podea.',
      },
      pike_push_up: {
        name: 'Flotare pike',
        howTo: 'Șoldurile sus, ca un V întors: îndoaie coatele și coboară capul spre podea.',
      },
      air_squat: {
        name: 'Genuflexiune',
        howTo:
          'Picioarele la lățimea umerilor: coboară în spate și în jos până când coapsele sunt orizontale, apoi ridică-te.',
      },
      jump_squat: {
        name: 'Genuflexiune cu săritură',
        howTo: 'Coboară în genuflexiune, apoi sari exploziv și aterizează ușor.',
      },
      reverse_lunge: {
        name: 'Fandare înapoi',
        howTo:
          'Fă un pas înapoi și coboară genunchiul din spate spre podea, apoi revino. Schimbă piciorul.',
      },
      glute_bridge: {
        name: 'Pod pentru fesieri',
        howTo:
          'Culcat pe spate, cu genunchii îndoiți: ridică șoldurile până când corpul e drept de la umeri la genunchi.',
      },
      wall_sit: {
        name: 'Scaunul la perete',
        howTo: 'Cu spatele la perete, coboară până când genunchii fac unghi drept și menține.',
      },
      calf_raise: {
        name: 'Ridicări pe vârfuri',
        howTo: 'Ridică-te pe vârfuri, fă o pauză și coboară încet călcâiele.',
      },
      step_up: {
        name: 'Urcări pe cutie',
        howTo: 'Urcă un picior pe o cutie, ridică-te complet și coboară. Schimbă piciorul.',
      },
      burpee: {
        name: 'Burpee',
        howTo:
          'Coboară în ghemuit, sari cu picioarele înapoi în planșă, adu-le înapoi și sari în sus.',
      },
      mountain_climber: {
        name: 'Alpinistul',
        howTo: 'În planșă pe palme, adu repede genunchii spre piept, pe rând.',
      },
      superman: {
        name: 'Superman',
        howTo: 'Culcat pe burtă, ridică brațele, pieptul și picioarele de pe podea; menține puțin.',
      },
      prone_y_raise: {
        name: 'Ridicări în Y pe burtă',
        howTo:
          'Culcat pe burtă, cu brațele deasupra capului în formă de Y: ridică brațele și menține puțin.',
      },
      reverse_snow_angel: {
        name: 'Înger de zăpadă inversat',
        howTo:
          'Culcat pe burtă, mută brațele de lângă corp până deasupra capului, chiar deasupra podelei.',
      },
      bench_dip: {
        name: 'Flotări la bancă pentru triceps',
        howTo:
          'Mâinile pe o bancă în spatele tău: îndoaie coatele ca să cobori șoldurile, apoi împinge în sus.',
      },
      plank: {
        name: 'Planșă',
        howTo:
          'Antebrațele pe podea, corpul drept de la cap la călcâie: menține fără să lași șoldurile să cadă.',
      },
      side_plank: {
        name: 'Planșă laterală',
        howTo:
          'Pe un antebraț, cu corpul drept și șoldurile ridicate: menține, apoi schimbă partea.',
      },
      crunch: {
        name: 'Abdomene scurte',
        howTo:
          'Culcat pe spate, cu genunchii îndoiți: ridică umerii de pe podea și coboară-i încet.',
      },
      bicycle_crunch: {
        name: 'Abdomene bicicletă',
        howTo: 'Pe spate, adu un genunchi spre tine și rotește cotul opus spre el; schimbă partea.',
      },
      leg_raise: {
        name: 'Ridicări de picioare',
        howTo:
          'Pe spate, cu picioarele întinse: ridică-le până la verticală și coboară-le încet fără să atingi podeaua.',
      },
      dead_bug: {
        name: 'Dead bug',
        howTo:
          'Pe spate, cu brațele sus și genunchii îndoiți: întinde un braț și piciorul opus, apoi schimbă.',
      },
      russian_twist: {
        name: 'Răsuciri rusești',
        howTo: 'Stai așezat, ușor lăsat pe spate, și mută mâinile dintr-o parte în alta.',
      },
      hanging_knee_raise: {
        name: 'Ridicări de genunchi la bară',
        howTo: 'Atârnă de bară și trage genunchii spre piept.',
      },
      pull_up: {
        name: 'Tracțiune',
        howTo: 'Atârnă de bară cu palmele spre înainte și trage-te până când bărbia trece de bară.',
      },
      chin_up: {
        name: 'Tracțiune cu priză supinată',
        howTo: 'Atârnă de bară cu palmele spre tine și trage-te până când bărbia trece de bară.',
      },
      db_bench_press: {
        name: 'Împins cu gantere pe bancă',
        howTo: 'Culcat pe bancă, împinge ganterele deasupra pieptului și coboară-le controlat.',
      },
      db_floor_press: {
        name: 'Împins cu gantere de pe podea',
        howTo: 'Culcat pe podea, împinge ganterele în sus; coatele se opresc pe podea.',
      },
      db_fly: {
        name: 'Fluturări cu gantere',
        howTo:
          'Pe bancă, cu brațele ușor îndoite: deschide-le larg, apoi adu ganterele împreună deasupra pieptului.',
      },
      db_shoulder_press: {
        name: 'Presă cu gantere pentru umeri',
        howTo: 'Împinge ganterele de la umeri deasupra capului.',
      },
      db_lateral_raise: {
        name: 'Ridicări laterale',
        howTo: 'Ridică ganterele lateral până la înălțimea umerilor.',
      },
      db_row: {
        name: 'Ramat cu gantere',
        howTo: 'Aplecat înainte, cu spatele drept, trage ganterele spre șolduri.',
      },
      db_curl: {
        name: 'Flexii cu gantere',
        howTo: 'Cu coatele lângă corp, adu ganterele spre umeri.',
      },
      db_hammer_curl: {
        name: 'Flexii ciocan',
        howTo: 'Flexii cu palmele orientate una spre cealaltă.',
      },
      db_overhead_triceps: {
        name: 'Extensii pentru triceps deasupra capului',
        howTo: 'Ține o ganteră deasupra capului și coboar-o în spatele capului îndoind coatele.',
      },
      db_goblet_squat: {
        name: 'Genuflexiune goblet',
        howTo: 'Ține o ganteră la piept și coboară în genuflexiune.',
      },
      db_lunge: {
        name: 'Fandări cu gantere',
        howTo: 'O fandare cu câte o ganteră în fiecare mână.',
      },
      db_romanian_deadlift: {
        name: 'Îndreptări românești cu gantere',
        howTo:
          'Cu genunchii ușor îndoiți, împinge șoldurile înapoi și coboară ganterele pe lângă picioare, apoi ridică-te.',
      },
      kb_swing: {
        name: 'Swing cu kettlebell',
        howTo:
          'Îndoaie-te din șolduri și împinge-le puternic înainte ca să balansezi kettlebell-ul până la piept.',
      },
      kb_goblet_squat: {
        name: 'Genuflexiune goblet cu kettlebell',
        howTo: 'Ține kettlebell-ul la piept și coboară în genuflexiune.',
      },
      kb_deadlift: {
        name: 'Îndreptări cu kettlebell',
        howTo:
          'Kettlebell-ul între picioare: împinge șoldurile înapoi, apucă-l și ridică-te drept.',
      },
      bb_back_squat: {
        name: 'Genuflexiune cu haltera',
        howTo:
          'Bara pe partea de sus a spatelui: coboară până când coapsele sunt orizontale și ridică-te.',
      },
      bb_bench_press: {
        name: 'Împins cu haltera pe bancă',
        howTo:
          'Coboară bara la piept și împinge-o înapoi. Folosește un partener sau suporturi de siguranță.',
      },
      bb_deadlift: {
        name: 'Îndreptări',
        howTo:
          'Bara deasupra mijlocului tălpilor, cu spatele drept: ridică-te cu bara și coboar-o controlat.',
      },
      bb_overhead_press: {
        name: 'Împins deasupra capului',
        howTo: 'Împinge bara de la umeri deasupra capului, cu corpul încordat.',
      },
      bb_row: {
        name: 'Ramat cu haltera',
        howTo: 'Aplecat înainte, cu spatele drept, trage bara spre partea de jos a pieptului.',
      },
      bb_curl: { name: 'Flexii cu haltera', howTo: 'Cu coatele lângă corp, adu bara spre umeri.' },
      bb_hip_thrust: {
        name: 'Hip thrust',
        howTo: 'Partea de sus a spatelui pe o bancă, bara peste șolduri: împinge șoldurile în sus.',
      },
      bb_romanian_deadlift: {
        name: 'Îndreptări românești',
        howTo:
          'Cu genunchii ușor îndoiți, împinge șoldurile înapoi și coboară bara pe lângă picioare, apoi ridică-te.',
      },
      band_row: {
        name: 'Ramat cu banda elastică',
        howTo: 'Trece banda pe după tălpi și trage capetele spre talie.',
      },
      band_pull_apart: {
        name: 'Întinderi de bandă',
        howTo: 'Ține banda în fața ta și întinde-o până când brațele ajung lateral.',
      },
      band_curl: {
        name: 'Flexii cu banda elastică',
        howTo: 'Calcă pe bandă și adu mânerele spre umeri.',
      },
      band_chest_press: {
        name: 'Împins cu banda elastică',
        howTo: 'Cu banda după spate, împinge mâinile înainte până când brațele sunt întinse.',
      },
      lat_pulldown: {
        name: 'Tras la helcometru',
        howTo: 'Trage bara spre partea de sus a pieptului, cu coatele în jos și înapoi.',
      },
      seated_cable_row: {
        name: 'Ramat la cablu din șezut',
        howTo: 'Stai drept și trage mânerul spre talie, strângând omoplații.',
      },
      triceps_pushdown: {
        name: 'Extensii la cablu pentru triceps',
        howTo: 'Cu coatele lângă corp, împinge cablul în jos până când brațele sunt întinse.',
      },
      face_pull: { name: 'Face pull', howTo: 'Trage frânghia spre față, cu coatele sus.' },
      leg_press: {
        name: 'Presă pentru picioare',
        howTo:
          'Împinge platforma până când picioarele sunt aproape întinse, apoi îndoaie-le din nou.',
      },
      leg_curl: {
        name: 'Flexii pentru femurali',
        howTo: 'Adu pernița spre fese, apoi coboar-o încet.',
      },
      leg_extension: {
        name: 'Extensii pentru cvadricepși',
        howTo: 'Întinde picioarele ca să ridici pernița, apoi coboar-o încet.',
      },
      machine_chest_press: {
        name: 'Presă pentru piept la aparat',
        howTo: 'Împinge mânerele înainte până când brațele sunt întinse, apoi revino încet.',
      },
      treadmill_run: {
        name: 'Alergare pe bandă',
        howTo: 'Aleargă într-un ritm în care încă poți spune câteva cuvinte.',
      },
      treadmill_walk: {
        name: 'Mers în pantă',
        howTo: 'Mergi alert pe banda de alergare, cu o pantă ușoară.',
      },
      exercise_bike: {
        name: 'Bicicletă fitness',
        howTo: 'Pedalează constant, într-un ritm care te face să respiri mai repede.',
      },
      rowing_machine: {
        name: 'Aparat de vâslit',
        howTo: 'Împinge cu picioarele, apoi trage cu brațele; revino în ordine inversă.',
      },
      jump_rope: {
        name: 'Sărituri cu coarda',
        howTo: 'Sărituri mici și ușoare pe vârfurile picioarelor.',
      },
      brisk_walk: {
        name: 'Mers alert',
        howTo: 'Mergi destul de repede ca să respiri mai greu, dar să poți încă vorbi.',
      },
      jog: { name: 'Alergare ușoară', howTo: 'Aleargă într-un ritm lejer, în care poți vorbi.' },
      run: { name: 'Alergare', howTo: 'Aleargă într-un ritm constant și solicitant.' },
      run_walk_intervals: {
        name: 'Intervale alergare-mers',
        howTo: 'Aleargă 1 minut, mergi 2 minute; repetă până expiră timpul.',
      },
      power_walk_intervals: {
        name: 'Intervale de mers alert',
        howTo: 'Mergi repede 2 minute, apoi lejer 1 minut; repetă până expiră timpul.',
      },
    },
    equipment: {
      dumbbells: 'Gantere',
      kettlebell: 'Kettlebell',
      barbell: 'Halteră și discuri',
      squat_rack: 'Rack pentru genuflexiuni',
      bench: 'Bancă',
      pull_up_bar: 'Bară de tracțiuni',
      resistance_bands: 'Benzi elastice',
      jump_rope: 'Coardă',
      box: 'Stepper sau cutie',
      treadmill: 'Bandă de alergare',
      exercise_bike: 'Bicicletă fitness',
      rowing_machine: 'Aparat de vâslit',
      cable_machine: 'Aparat cu cabluri',
      leg_press: 'Presă pentru picioare',
      leg_machines: 'Aparate pentru femurali și cvadricepși',
      chest_press_machine: 'Aparat pentru piept',
    },
    muscles: {
      chest: 'Piept',
      back: 'Spate',
      shoulders: 'Umeri',
      biceps: 'Biceps',
      triceps: 'Triceps',
      core: 'Abdomen',
      glutes: 'Fesieri',
      quads: 'Coapse (față)',
      hamstrings: 'Coapse (spate)',
      calves: 'Gambe',
      full_body: 'Tot corpul',
    },
  },
  hu: {
    exercises: {
      march_in_place: {
        name: 'Helyben járás',
        howTo: 'Emeld felváltva a térded, és lendítsd a karod, kényelmes tempóban.',
      },
      jumping_jacks: {
        name: 'Terpeszugrás',
        howTo: 'Ugorj terpeszbe, közben emeld a karod a fejed fölé, majd ugorj vissza.',
      },
      high_knees: {
        name: 'Magas térdemelés',
        howTo: 'Fuss helyben, a térdedet csípőmagasságig emelve.',
      },
      arm_circles: {
        name: 'Karkörzés',
        howTo: 'Tartsd oldalra a karod, és körözz vele előbb kicsiket, aztán nagyobbakat.',
      },
      hip_circles: {
        name: 'Csípőkörzés',
        howTo: 'Kezed a csípődön: körözz lassan a csípőddel mindkét irányba.',
      },
      torso_twists: {
        name: 'Törzsfordítás',
        howTo: 'Állj egyenesen, és fordítsd a felsőtested egyik oldalról a másikra, laza karral.',
      },
      leg_swings: {
        name: 'Láblendítés',
        howTo: 'Kapaszkodj egy falba, és lendítsd az egyik lábad előre-hátra, majd cserélj.',
      },
      easy_walk: { name: 'Könnyű séta', howTo: 'Sétálj nyugodt tempóban a bemelegítéshez.' },
      push_up: {
        name: 'Fekvőtámasz',
        howTo:
          'Kezed a vállad alatt, tested egyenes: engedd a mellkasod a padlóig, majd told fel magad.',
      },
      knee_push_up: {
        name: 'Térdelő fekvőtámasz',
        howTo: 'Mint a fekvőtámasz, de a térded a padlón van.',
      },
      wall_push_up: {
        name: 'Fali fekvőtámasz',
        howTo:
          'Kezed vállmagasságban a falon: hajlítsd a könyököd, amíg a mellkasod a falhoz ér, majd told el magad.',
      },
      diamond_push_up: {
        name: 'Gyémánt fekvőtámasz',
        howTo:
          'Fekvőtámasz a mellkasod alatt szorosan egymás mellé tett kézzel; a tricepszet dolgoztatja.',
      },
      incline_push_up: {
        name: 'Fekvőtámasz padon',
        howTo: 'Fekvőtámasz a kezeddel egy padon; könnyebb, mint a padlón.',
      },
      pike_push_up: {
        name: 'Pike fekvőtámasz',
        howTo:
          'Csípő magasan, fordított V alakban: hajlítsd a könyököd, és engedd a fejed a padló felé.',
      },
      air_squat: {
        name: 'Guggolás',
        howTo: 'Vállszélességű terpesz: ülj hátra és le, amíg a combod vízszintes, majd állj fel.',
      },
      jump_squat: {
        name: 'Guggolásból felugrás',
        howTo: 'Guggolj le, majd ugorj fel robbanékonyan, és érkezz puhán.',
      },
      reverse_lunge: {
        name: 'Hátralépéses kitörés',
        howTo:
          'Lépj hátra, és engedd a hátsó térded a padló felé, majd lépj vissza. Cserélj lábat.',
      },
      glute_bridge: {
        name: 'Csípőemelés',
        howTo:
          'Hanyatt fekve, behajlított térddel: emeld a csípőd, amíg a tested egyenes a vállad és a térded között.',
      },
      wall_sit: {
        name: 'Falnál ülés',
        howTo: 'Háttal a falnak csússz le, amíg a térded derékszögben van, és tartsd.',
      },
      calf_raise: {
        name: 'Vádliemelés',
        howTo: 'Emelkedj lábujjhegyre, tarts egy kicsit, és engedd le lassan a sarkad.',
      },
      step_up: {
        name: 'Fellépés',
        howTo:
          'Lépj fel az egyik lábaddal egy dobozra, egyenesedj ki teljesen, majd lépj le. Cserélj lábat.',
      },
      burpee: {
        name: 'Burpee',
        howTo: 'Guggolj le, ugorj hátra a lábaddal plankbe, ugorj vissza, és ugorj fel.',
      },
      mountain_climber: {
        name: 'Hegymászó',
        howTo: 'Nyújtott karú plankben húzd felváltva, gyorsan a térded a mellkasodhoz.',
      },
      superman: {
        name: 'Superman',
        howTo:
          'Hason fekve emeld fel a karod, a mellkasod és a lábad a padlóról; tartsd egy kicsit.',
      },
      prone_y_raise: {
        name: 'Y-emelés hason',
        howTo:
          'Hason fekve, a karod a fejed fölött Y alakban: emeld meg a karod, és tartsd egy kicsit.',
      },
      reverse_snow_angel: {
        name: 'Fordított hóangyal',
        howTo: 'Hason fekve vezesd a karod a tested mellől a fejed fölé, épp a padló fölött.',
      },
      bench_dip: {
        name: 'Tricepsz-tolódzkodás padon',
        howTo:
          'Kezed a mögötted lévő padon: hajlítsd a könyököd, engedd le a csípőd, majd told fel magad.',
      },
      plank: {
        name: 'Alkartámasz',
        howTo:
          'Alkarod a padlón, tested egyenes a fejedtől a sarkadig: tartsd, anélkül hogy a csípőd leereszkedne.',
      },
      side_plank: {
        name: 'Oldalsó alkartámasz',
        howTo:
          'Az egyik alkarodon, egyenes testtel, fent tartott csípővel: tartsd, majd cserélj oldalt.',
      },
      crunch: {
        name: 'Hasprés',
        howTo:
          'Hanyatt fekve, behajlított térddel: emeld el a vállad a padlótól, és engedd vissza lassan.',
      },
      bicycle_crunch: {
        name: 'Bicikli hasprés',
        howTo:
          'Hanyatt fekve húzd be az egyik térded, és fordítsd felé az ellentétes könyököd; cserélj oldalt.',
      },
      leg_raise: {
        name: 'Lábemelés',
        howTo:
          'Hanyatt fekve, nyújtott lábbal: emeld a lábad függőlegesig, és engedd le lassan, a padló érintése nélkül.',
      },
      dead_bug: {
        name: 'Dead bug',
        howTo:
          'Hanyatt fekve, a karod fent, a térded behajlítva: nyújtsd ki az egyik karod és az ellentétes lábad, majd cserélj.',
      },
      russian_twist: {
        name: 'Orosz csavar',
        howTo: 'Ülj kissé hátradőlve, és vidd a kezed egyik oldalról a másikra.',
      },
      hanging_knee_raise: {
        name: 'Függő térdemelés',
        howTo: 'Függeszkedj a rúdon, és húzd a térded a mellkasodhoz.',
      },
      pull_up: {
        name: 'Húzódzkodás',
        howTo:
          'Függeszkedj a rúdon, tenyérrel előre, és húzd fel magad, amíg az állad a rúd fölé ér.',
      },
      chin_up: {
        name: 'Húzódzkodás fordított fogással',
        howTo:
          'Függeszkedj a rúdon, tenyérrel magad felé, és húzd fel magad, amíg az állad a rúd fölé ér.',
      },
      db_bench_press: {
        name: 'Fekvenyomás kézisúlyzóval',
        howTo:
          'Feküdj egy padra, nyomd fel a súlyzókat a mellkasod fölé, és engedd le őket kontrolláltan.',
      },
      db_floor_press: {
        name: 'Földön nyomás kézisúlyzóval',
        howTo: 'Feküdj a padlóra, és nyomd fel a súlyzókat; a könyököd a padlón áll meg.',
      },
      db_fly: {
        name: 'Tárogatás kézisúlyzóval',
        howTo:
          'A padon, enyhén hajlított karral: nyisd szét a karod, majd vezesd össze a súlyzókat a mellkasod fölött.',
      },
      db_shoulder_press: {
        name: 'Vállból nyomás kézisúlyzóval',
        howTo: 'Nyomd a súlyzókat a vállad mellől a fejed fölé.',
      },
      db_lateral_raise: { name: 'Oldalemelés', howTo: 'Emeld oldalra a súlyzókat vállmagasságig.' },
      db_row: {
        name: 'Evezés kézisúlyzóval',
        howTo: 'Dőlj előre egyenes háttal, és húzd a súlyzókat a csípődhöz.',
      },
      db_curl: {
        name: 'Bicepszhajlítás kézisúlyzóval',
        howTo: 'Könyököd a tested mellett: hajlítsd fel a súlyzókat a vállad felé.',
      },
      db_hammer_curl: {
        name: 'Kalapácsbicepsz',
        howTo: 'Bicepszhajlítás egymás felé néző tenyérrel.',
      },
      db_overhead_triceps: {
        name: 'Tricepsznyújtás fej fölött',
        howTo:
          'Tarts egy súlyzót a fejed fölött, és a könyököd hajlításával engedd le a fejed mögé.',
      },
      db_goblet_squat: {
        name: 'Serleg guggolás',
        howTo: 'Tarts egy kézisúlyzót a mellkasod előtt, és guggolj.',
      },
      db_lunge: {
        name: 'Kitörés kézisúlyzóval',
        howTo: 'Kitörés, mindkét kezedben egy-egy súlyzóval.',
      },
      db_romanian_deadlift: {
        name: 'Román felhúzás kézisúlyzóval',
        howTo:
          'Térd lazán, told hátra a csípőd, engedd le a súlyzókat a lábad mentén, majd egyenesedj fel.',
      },
      kb_swing: {
        name: 'Kettlebell lendítés',
        howTo:
          'Hajolj előre csípőből, majd told előre erőteljesen, hogy a kettlebell mellmagasságig lendüljön.',
      },
      kb_goblet_squat: {
        name: 'Serleg guggolás kettlebell-lel',
        howTo: 'Tartsd a kettlebellt a mellkasod előtt, és guggolj.',
      },
      kb_deadlift: {
        name: 'Felhúzás kettlebell-lel',
        howTo: 'A kettlebell a lábad között: told hátra a csípőd, fogd meg, és állj fel egyenesen.',
      },
      bb_back_squat: {
        name: 'Guggolás rúddal',
        howTo: 'A rúd a hátad felső részén: guggolj le, amíg a combod vízszintes, és állj fel.',
      },
      bb_bench_press: {
        name: 'Fekvenyomás rúddal',
        howTo:
          'Engedd a rudat a mellkasodhoz, és nyomd vissza. Segítővel vagy biztonsági tartóval végezd.',
      },
      bb_deadlift: {
        name: 'Felhúzás',
        howTo:
          'A rúd a talpad közepe fölött, a hátad egyenes: állj fel a rúddal, és engedd le kontrolláltan.',
      },
      bb_overhead_press: {
        name: 'Vállból nyomás rúddal',
        howTo: 'Nyomd a rudat a vállad elől a fejed fölé, feszes testtel.',
      },
      bb_row: {
        name: 'Döntött törzsű evezés',
        howTo: 'Dőlj előre egyenes háttal, és húzd a rudat a mellkasod aljához.',
      },
      bb_curl: {
        name: 'Bicepszhajlítás rúddal',
        howTo: 'Könyököd a tested mellett: hajlítsd fel a rudat a vállad felé.',
      },
      bb_hip_thrust: {
        name: 'Csípőtolás',
        howTo: 'A hátad felső része egy padon, a rúd a csípődön: told fel a csípőd.',
      },
      bb_romanian_deadlift: {
        name: 'Román felhúzás',
        howTo:
          'Térd lazán, told hátra a csípőd, engedd le a rudat a lábad mentén, majd egyenesedj fel.',
      },
      band_row: {
        name: 'Evezés gumiszalaggal',
        howTo: 'Vezesd át a szalagot a talpadon, és húzd a végeit a derekadhoz.',
      },
      band_pull_apart: {
        name: 'Gumiszalag széthúzás',
        howTo: 'Tartsd magad előtt a szalagot, és húzd szét, amíg a karod oldalra nem ér.',
      },
      band_curl: {
        name: 'Bicepszhajlítás gumiszalaggal',
        howTo: 'Állj a szalagra, és hajlítsd fel a fogantyúkat a vállad felé.',
      },
      band_chest_press: {
        name: 'Mellnyomás gumiszalaggal',
        howTo: 'A szalag a hátad mögött: nyomd előre a kezed, amíg a karod nyújtott.',
      },
      lat_pulldown: {
        name: 'Mellhez húzás csigán',
        howTo: 'Húzd le a rudat a mellkasod felső részéhez, a könyököd le és hátra.',
      },
      seated_cable_row: {
        name: 'Ülő evezés csigán',
        howTo: 'Ülj egyenesen, és húzd a fogantyút a derekadhoz, összehúzva a lapockád.',
      },
      triceps_pushdown: {
        name: 'Tricepsz letolás csigán',
        howTo: 'Könyököd a tested mellett: told le a kábelt, amíg a karod nyújtott.',
      },
      face_pull: {
        name: 'Arc felé húzás',
        howTo: 'Húzd a kötelet az arcod felé, magasan tartott könyökkel.',
      },
      leg_press: {
        name: 'Lábtoló gép',
        howTo: 'Told el a platformot, amíg a lábad majdnem nyújtott, majd hajlítsd vissza.',
      },
      leg_curl: {
        name: 'Combhajlítás gépen',
        howTo: 'Húzd a párnát a feneked felé, majd engedd le lassan.',
      },
      leg_extension: {
        name: 'Combfeszítés gépen',
        howTo: 'Nyújtsd ki a lábad, hogy megemeld a párnát, majd engedd le lassan.',
      },
      machine_chest_press: {
        name: 'Mellnyomó gép',
        howTo: 'Nyomd előre a fogantyúkat, amíg a karod nyújtott, majd engedd vissza lassan.',
      },
      treadmill_run: {
        name: 'Futás futópadon',
        howTo: 'Olyan tempóban fuss, hogy még ki tudj mondani néhány szót.',
      },
      treadmill_walk: {
        name: 'Emelkedős gyaloglás',
        howTo: 'Gyalogolj tempósan a futópadon, enyhe emelkedővel.',
      },
      exercise_bike: {
        name: 'Szobakerékpár',
        howTo: 'Tekerj egyenletesen, olyan tempóban, hogy gyorsabban lélegezz.',
      },
      rowing_machine: {
        name: 'Evezőgép',
        howTo: 'Tolj a lábaddal, aztán húzz a karoddal; fordított sorrendben menj vissza.',
      },
      jump_rope: { name: 'Ugrókötelezés', howTo: 'Kicsi, könnyű ugrások a talpad elülső részén.' },
      brisk_walk: {
        name: 'Tempós séta',
        howTo: 'Gyalogolj olyan gyorsan, hogy nehezebben lélegezz, de még tudj beszélni.',
      },
      jog: { name: 'Kocogás', howTo: 'Fuss könnyű tempóban, amelyben tudsz beszélni.' },
      run: { name: 'Futás', howTo: 'Fuss egyenletes, megerőltető tempóban.' },
      run_walk_intervals: {
        name: 'Futás-séta intervallumok',
        howTo: 'Fuss 1 percet, gyalogolj 2 percet; ismételd, amíg le nem telik az idő.',
      },
      power_walk_intervals: {
        name: 'Tempós gyaloglás intervallumok',
        howTo:
          'Gyalogolj gyorsan 2 percet, aztán lazán 1 percet; ismételd, amíg le nem telik az idő.',
      },
    },
    equipment: {
      dumbbells: 'Kézisúlyzók',
      kettlebell: 'Kettlebell',
      barbell: 'Rúd és súlytárcsák',
      squat_rack: 'Guggolóállvány',
      bench: 'Pad',
      pull_up_bar: 'Húzódzkodó rúd',
      resistance_bands: 'Gumiszalagok',
      jump_rope: 'Ugrókötél',
      box: 'Lépcsőzsámoly vagy doboz',
      treadmill: 'Futópad',
      exercise_bike: 'Szobakerékpár',
      rowing_machine: 'Evezőgép',
      cable_machine: 'Kábeles csigagép',
      leg_press: 'Lábtoló gép',
      leg_machines: 'Combhajlító és -feszítő gép',
      chest_press_machine: 'Mellnyomó gép',
    },
    muscles: {
      chest: 'Mellkas',
      back: 'Hát',
      shoulders: 'Váll',
      biceps: 'Bicepsz',
      triceps: 'Tricepsz',
      core: 'Törzs',
      glutes: 'Farizom',
      quads: 'Comb (elöl)',
      hamstrings: 'Comb (hátul)',
      calves: 'Vádli',
      full_body: 'Egész test',
    },
  },
});
