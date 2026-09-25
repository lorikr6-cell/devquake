-- =============================================================================
-- workout 0003 — Built-in equipment and exercises (the plugin's OWN database)
--
-- GENERATED from src/lib/catalog.ts and src/illustrations/icons.ts by src/lib/seed-sql.ts.
-- Do not edit by hand: change the catalogue and run
--   UPDATE_SEED=1 pnpm --filter @devquake/plugin-workout test
--
-- Apply to the workout database: pnpm db:migrate --plugin workout, or phpMyAdmin → Import.
-- Exercise names and how-to texts are not stored here; they are in the app's translations.
-- Built-in exercises that leave the catalogue are retired (retired_at), never deleted, because
-- routines and past workouts point at them.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

INSERT INTO equipment (slug, sort_order, home, icon_svg) VALUES
  ('dumbbells', 1, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 12h11"/><rect x="3" y="8" width="3.5" height="8" rx="1"/><rect x="17.5" y="8" width="3.5" height="8" rx="1"/><path d="M1.5 10.5v3M22.5 10.5v3"/></svg>'),
  ('kettlebell', 2, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 9.5a3.5 3.5 0 1 1 7 0"/><path d="M7.2 10h9.6l1.2 1.8a7 7 0 1 1-12 0z"/></svg>'),
  ('barbell', 3, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1.5 12h21"/><rect x="4" y="6" width="3" height="12" rx="1"/><rect x="17" y="6" width="3" height="12" rx="1"/><path d="M7 9v6M17 9v6"/></svg>'),
  ('squat_rack', 4, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V3M19 21V3M3 21h4M17 21h4"/><path d="M5 9h2M19 9h-2"/><path d="M2 8h20"/></svg>'),
  ('bench', 5, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="3" rx="1"/><path d="M6 12v7M18 12v7M4 19h4M16 19h4"/></svg>'),
  ('pull_up_bar', 6, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18M5 5v2M19 5v2"/><circle cx="12" cy="9.5" r="1.8"/><path d="M9 5l2 3M15 5l-2 3M12 11.5v5M12 16.5l-2 4M12 16.5l2 4"/></svg>'),
  ('resistance_bands', 7, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7c4 5 10 5 14 0"/><path d="M5 17c4-5 10-5 14 0"/><rect x="2" y="5" width="3" height="14" rx="1.5"/><rect x="19" y="5" width="3" height="14" rx="1.5"/></svg>'),
  ('jump_rope', 8, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4v6M19 4v6"/><path d="M5 10c0 11 14 11 14 0"/><circle cx="5" cy="3.5" r="1.5"/><circle cx="19" cy="3.5" r="1.5"/></svg>'),
  ('box', 9, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9l8-4 8 4v9l-8 4-8-4z"/><path d="M4 9l8 4 8-4M12 13v9"/></svg>'),
  ('treadmill', 10, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 18h15l2-2"/><circle cx="4" cy="20" r="1"/><circle cx="15" cy="20" r="1"/><path d="M17 16l3-11h-4"/></svg>'),
  ('exercise_bike', 11, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="16" r="3"/><path d="M7 6h4M9 6l3 10M12 16l4-9h3"/><path d="M5 21h14"/></svg>'),
  ('rowing_machine', 12, 1, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 18h18"/><circle cx="20" cy="14" r="2.5"/><rect x="7" y="15" width="5" height="3" rx="1"/><path d="M15 18l2-5M5 18v3M20 18v3"/></svg>'),
  ('cable_machine', 13, 0, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="15" y="2" width="5" height="20" rx="1"/><circle cx="15" cy="6" r="1.5"/><path d="M13.6 6.5L6 14"/><path d="M4 14h4"/><path d="M16 14h3M16 17h3M16 20h3"/></svg>'),
  ('leg_press', 14, 0, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20L20 4"/><rect x="13" y="6" width="6" height="3" rx="1" transform="rotate(-43 16 7.5)"/><path d="M3 20h8l-3-5"/></svg>'),
  ('leg_machines', 15, 0, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="10" height="3" rx="1"/><path d="M5 14v7M11 14v7M13 12.5h5v7"/><circle cx="18" cy="20" r="1.5"/><path d="M5 11V4"/></svg>'),
  ('chest_press_machine', 16, 0, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21V5M4 13h6M4 9h3"/><path d="M10 13h10M17 10v6M20 10v6"/><path d="M2 21h6"/></svg>')
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order), home = VALUES(home),
  icon_svg = VALUES(icon_svg);

INSERT INTO exercises (slug, role, pattern, metric, places, muscles, difficulty, low_impact,
  weighted, seconds_per_rep, speed_mps, met, motion, prop, sort_order) VALUES
  ('march_in_place', 'warmup', 'warmup', 'time', 'gym,home,outside', 'full_body', 1, 1, 0, 3.0, 0.00, 3.5, 'march', NULL, 1),
  ('jumping_jacks', 'warmup', 'warmup', 'time', 'gym,home,outside', 'full_body', 1, 0, 0, 3.0, 0.00, 7.7, 'jumping_jack', NULL, 2),
  ('high_knees', 'warmup', 'warmup', 'time', 'gym,home,outside', 'quads,core', 2, 0, 0, 3.0, 0.00, 8.0, 'high_knees', NULL, 3),
  ('arm_circles', 'warmup', 'warmup', 'time', 'gym,home,outside', 'shoulders', 1, 1, 0, 3.0, 0.00, 3.0, 'arm_circles', NULL, 4),
  ('hip_circles', 'warmup', 'warmup', 'time', 'gym,home,outside', 'core,glutes', 1, 1, 0, 3.0, 0.00, 3.0, 'hip_circles', NULL, 5),
  ('torso_twists', 'warmup', 'warmup', 'time', 'gym,home,outside', 'core', 1, 1, 0, 3.0, 0.00, 3.0, 'torso_twist', NULL, 6),
  ('leg_swings', 'warmup', 'warmup', 'time', 'gym,home,outside', 'hamstrings,glutes', 1, 1, 0, 3.0, 0.00, 3.0, 'leg_swing', NULL, 7),
  ('easy_walk', 'warmup', 'warmup', 'time', 'outside', 'full_body', 1, 1, 0, 3.0, 1.20, 3.0, 'walk', NULL, 8),
  ('push_up', 'strength', 'push_h', 'reps', 'gym,home,outside', 'chest,triceps,shoulders', 2, 1, 0, 3.0, 0.00, 3.8, 'push_up', NULL, 9),
  ('knee_push_up', 'strength', 'push_h', 'reps', 'gym,home,outside', 'chest,triceps', 1, 1, 0, 3.0, 0.00, 3.8, 'knee_push_up', NULL, 10),
  ('wall_push_up', 'strength', 'push_h', 'reps', 'gym,home', 'chest,triceps', 1, 1, 0, 2.0, 0.00, 3.8, 'wall_push_up', NULL, 11),
  ('diamond_push_up', 'strength', 'triceps', 'reps', 'gym,home', 'triceps,chest', 2, 1, 0, 3.0, 0.00, 3.8, 'push_up', NULL, 12),
  ('incline_push_up', 'strength', 'push_h', 'reps', 'gym,home', 'chest,triceps', 1, 1, 0, 3.0, 0.00, 3.8, 'incline_push_up', NULL, 13),
  ('pike_push_up', 'strength', 'push_v', 'reps', 'gym,home', 'shoulders,triceps', 3, 1, 0, 3.0, 0.00, 3.8, 'pike_push_up', NULL, 14),
  ('air_squat', 'strength', 'squat', 'reps', 'gym,home,outside', 'quads,glutes', 1, 1, 0, 3.0, 0.00, 3.8, 'squat', NULL, 15),
  ('jump_squat', 'strength', 'squat', 'reps', 'gym,home,outside', 'quads,glutes,calves', 2, 0, 0, 3.0, 0.00, 8.0, 'jump_squat', NULL, 16),
  ('reverse_lunge', 'strength', 'lunge', 'reps', 'gym,home,outside', 'quads,glutes', 1, 1, 0, 4.0, 0.00, 3.8, 'lunge', NULL, 17),
  ('glute_bridge', 'strength', 'glute', 'reps', 'gym,home', 'glutes,hamstrings', 1, 1, 0, 3.0, 0.00, 3.8, 'bridge', NULL, 18),
  ('wall_sit', 'strength', 'quads', 'time', 'gym,home', 'quads', 1, 1, 0, 3.0, 0.00, 3.8, 'wall_sit', NULL, 19),
  ('calf_raise', 'strength', 'calves', 'reps', 'gym,home,outside', 'calves', 1, 1, 0, 2.0, 0.00, 3.8, 'calf_raise', NULL, 20),
  ('step_up', 'strength', 'lunge', 'reps', 'gym,home', 'quads,glutes', 1, 1, 0, 4.0, 0.00, 3.8, 'step_up', NULL, 21),
  ('burpee', 'strength', 'conditioning', 'reps', 'gym,home,outside', 'full_body', 3, 0, 0, 4.0, 0.00, 8.0, 'burpee', NULL, 22),
  ('mountain_climber', 'strength', 'conditioning', 'time', 'gym,home,outside', 'core,shoulders,quads', 2, 0, 0, 3.0, 0.00, 8.0, 'mountain_climber', NULL, 23),
  ('superman', 'strength', 'back', 'reps', 'gym,home', 'back,glutes', 1, 1, 0, 3.0, 0.00, 3.8, 'superman', NULL, 24),
  ('prone_y_raise', 'strength', 'shoulders', 'reps', 'gym,home', 'shoulders,back', 1, 1, 0, 3.0, 0.00, 3.8, 'superman', NULL, 25),
  ('reverse_snow_angel', 'strength', 'back', 'reps', 'gym,home', 'back,shoulders', 1, 1, 0, 3.0, 0.00, 3.8, 'snow_angel', NULL, 26),
  ('bench_dip', 'strength', 'triceps', 'reps', 'gym,home', 'triceps,chest', 2, 1, 0, 3.0, 0.00, 3.8, 'bench_dip', NULL, 27),
  ('plank', 'core', 'core', 'time', 'gym,home,outside', 'core', 1, 1, 0, 3.0, 0.00, 3.8, 'plank', NULL, 28),
  ('side_plank', 'core', 'core', 'time', 'gym,home,outside', 'core', 2, 1, 0, 3.0, 0.00, 3.8, 'side_plank', NULL, 29),
  ('crunch', 'core', 'core', 'reps', 'gym,home', 'core', 1, 1, 0, 2.0, 0.00, 3.8, 'crunch', NULL, 30),
  ('bicycle_crunch', 'core', 'core', 'reps', 'gym,home', 'core', 2, 1, 0, 2.0, 0.00, 3.8, 'bicycle_crunch', NULL, 31),
  ('leg_raise', 'core', 'core', 'reps', 'gym,home', 'core', 2, 1, 0, 3.0, 0.00, 3.8, 'leg_raise', NULL, 32),
  ('dead_bug', 'core', 'core', 'reps', 'gym,home', 'core', 1, 1, 0, 3.0, 0.00, 3.8, 'dead_bug', NULL, 33),
  ('russian_twist', 'core', 'core', 'reps', 'gym,home', 'core', 2, 1, 0, 2.0, 0.00, 3.8, 'russian_twist', NULL, 34),
  ('hanging_knee_raise', 'core', 'core', 'reps', 'gym,home', 'core', 3, 1, 0, 3.0, 0.00, 3.8, 'hanging_knee_raise', NULL, 35),
  ('pull_up', 'strength', 'pull_v', 'reps', 'gym,home', 'back,biceps', 3, 1, 0, 4.0, 0.00, 8.0, 'pull_up', NULL, 36),
  ('chin_up', 'strength', 'pull_v', 'reps', 'gym,home', 'back,biceps', 3, 1, 0, 4.0, 0.00, 8.0, 'pull_up', NULL, 37),
  ('db_bench_press', 'strength', 'push_h', 'reps', 'gym,home', 'chest,triceps,shoulders', 2, 1, 1, 3.0, 0.00, 5.0, 'bench_press', 'dumbbell', 38),
  ('db_floor_press', 'strength', 'push_h', 'reps', 'gym,home', 'chest,triceps', 1, 1, 1, 3.0, 0.00, 5.0, 'floor_press', 'dumbbell', 39),
  ('db_fly', 'strength', 'chest', 'reps', 'gym,home', 'chest', 2, 1, 1, 3.0, 0.00, 3.5, 'fly', 'dumbbell', 40),
  ('db_shoulder_press', 'strength', 'push_v', 'reps', 'gym,home', 'shoulders,triceps', 2, 1, 1, 3.0, 0.00, 5.0, 'overhead_press', 'dumbbell', 41),
  ('db_lateral_raise', 'strength', 'shoulders', 'reps', 'gym,home', 'shoulders', 1, 1, 1, 3.0, 0.00, 3.5, 'lateral_raise', 'dumbbell', 42),
  ('db_row', 'strength', 'pull_h', 'reps', 'gym,home', 'back,biceps', 1, 1, 1, 3.0, 0.00, 5.0, 'row', 'dumbbell', 43),
  ('db_curl', 'strength', 'biceps', 'reps', 'gym,home', 'biceps', 1, 1, 1, 3.0, 0.00, 3.5, 'curl', 'dumbbell', 44),
  ('db_hammer_curl', 'strength', 'biceps', 'reps', 'gym,home', 'biceps', 1, 1, 1, 3.0, 0.00, 3.5, 'curl', 'dumbbell', 45),
  ('db_overhead_triceps', 'strength', 'triceps', 'reps', 'gym,home', 'triceps', 1, 1, 1, 3.0, 0.00, 3.5, 'overhead_triceps', 'dumbbell', 46),
  ('db_goblet_squat', 'strength', 'squat', 'reps', 'gym,home', 'quads,glutes', 1, 1, 1, 3.0, 0.00, 5.0, 'goblet_squat', 'dumbbell', 47),
  ('db_lunge', 'strength', 'lunge', 'reps', 'gym,home', 'quads,glutes', 2, 1, 1, 4.0, 0.00, 5.0, 'lunge', 'dumbbell', 48),
  ('db_romanian_deadlift', 'strength', 'hinge', 'reps', 'gym,home', 'hamstrings,glutes,back', 2, 1, 1, 3.0, 0.00, 5.0, 'hinge', 'dumbbell', 49),
  ('kb_swing', 'strength', 'hinge', 'reps', 'gym,home', 'glutes,hamstrings,core', 2, 0, 1, 2.0, 0.00, 8.0, 'kb_swing', 'kettlebell', 50),
  ('kb_goblet_squat', 'strength', 'squat', 'reps', 'gym,home', 'quads,glutes', 1, 1, 1, 3.0, 0.00, 5.0, 'goblet_squat', 'kettlebell', 51),
  ('kb_deadlift', 'strength', 'hinge', 'reps', 'gym,home', 'hamstrings,glutes,back', 1, 1, 1, 3.0, 0.00, 5.0, 'hinge', 'kettlebell', 52),
  ('bb_back_squat', 'strength', 'squat', 'reps', 'gym,home', 'quads,glutes,core', 3, 1, 1, 4.0, 0.00, 6.0, 'back_squat', 'barbell', 53),
  ('bb_bench_press', 'strength', 'push_h', 'reps', 'gym,home', 'chest,triceps,shoulders', 3, 1, 1, 3.0, 0.00, 5.0, 'bench_press', 'barbell', 54),
  ('bb_deadlift', 'strength', 'hinge', 'reps', 'gym,home', 'hamstrings,glutes,back', 3, 1, 1, 4.0, 0.00, 6.0, 'hinge', 'barbell', 55),
  ('bb_overhead_press', 'strength', 'push_v', 'reps', 'gym,home', 'shoulders,triceps', 3, 1, 1, 3.0, 0.00, 5.0, 'overhead_press', 'barbell', 56),
  ('bb_row', 'strength', 'pull_h', 'reps', 'gym,home', 'back,biceps', 2, 1, 1, 3.0, 0.00, 5.0, 'row', 'barbell', 57),
  ('bb_curl', 'strength', 'biceps', 'reps', 'gym,home', 'biceps', 2, 1, 1, 3.0, 0.00, 3.5, 'curl', 'barbell', 58),
  ('bb_hip_thrust', 'strength', 'glute', 'reps', 'gym,home', 'glutes,hamstrings', 2, 1, 1, 3.0, 0.00, 5.0, 'bridge', 'barbell', 59),
  ('bb_romanian_deadlift', 'strength', 'hinge', 'reps', 'gym,home', 'hamstrings,glutes,back', 2, 1, 1, 3.0, 0.00, 5.0, 'hinge', 'barbell', 60),
  ('band_row', 'strength', 'pull_h', 'reps', 'gym,home', 'back,biceps', 1, 1, 0, 3.0, 0.00, 3.5, 'seated_row', NULL, 61),
  ('band_pull_apart', 'strength', 'shoulders', 'reps', 'gym,home', 'shoulders,back', 1, 1, 0, 2.0, 0.00, 3.5, 'pull_apart', NULL, 62),
  ('band_curl', 'strength', 'biceps', 'reps', 'gym,home', 'biceps', 1, 1, 0, 3.0, 0.00, 3.5, 'curl', NULL, 63),
  ('band_chest_press', 'strength', 'push_h', 'reps', 'gym,home', 'chest,triceps', 1, 1, 0, 3.0, 0.00, 3.5, 'press_forward', NULL, 64),
  ('lat_pulldown', 'strength', 'pull_v', 'reps', 'gym', 'back,biceps', 1, 1, 1, 3.0, 0.00, 5.0, 'lat_pulldown', NULL, 65),
  ('seated_cable_row', 'strength', 'pull_h', 'reps', 'gym', 'back,biceps', 1, 1, 1, 3.0, 0.00, 5.0, 'seated_row', NULL, 66),
  ('triceps_pushdown', 'strength', 'triceps', 'reps', 'gym', 'triceps', 1, 1, 1, 3.0, 0.00, 3.5, 'pushdown', NULL, 67),
  ('face_pull', 'strength', 'shoulders', 'reps', 'gym', 'shoulders,back', 2, 1, 1, 3.0, 0.00, 3.5, 'face_pull', NULL, 68),
  ('leg_press', 'strength', 'squat', 'reps', 'gym', 'quads,glutes', 1, 1, 1, 3.0, 0.00, 5.0, 'leg_press', NULL, 69),
  ('leg_curl', 'strength', 'hamstrings', 'reps', 'gym', 'hamstrings', 1, 1, 1, 3.0, 0.00, 3.5, 'leg_curl', NULL, 70),
  ('leg_extension', 'strength', 'quads', 'reps', 'gym', 'quads', 1, 1, 1, 3.0, 0.00, 3.5, 'leg_extension', NULL, 71),
  ('machine_chest_press', 'strength', 'push_h', 'reps', 'gym', 'chest,triceps', 1, 1, 1, 3.0, 0.00, 5.0, 'seated_press', NULL, 72),
  ('treadmill_run', 'cardio', 'cardio', 'time', 'gym,home', 'full_body', 2, 0, 0, 3.0, 0.00, 9.0, 'run', NULL, 73),
  ('treadmill_walk', 'cardio', 'cardio', 'time', 'gym,home', 'full_body', 1, 1, 0, 3.0, 0.00, 5.0, 'walk', NULL, 74),
  ('exercise_bike', 'cardio', 'cardio', 'time', 'gym,home', 'quads,full_body', 1, 1, 0, 3.0, 0.00, 6.8, 'cycle', NULL, 75),
  ('rowing_machine', 'cardio', 'cardio', 'time', 'gym,home', 'back,full_body', 2, 1, 0, 3.0, 0.00, 7.0, 'rowing', NULL, 76),
  ('jump_rope', 'cardio', 'cardio', 'time', 'gym,home', 'calves,full_body', 2, 0, 0, 3.0, 0.00, 10.0, 'jump_rope', NULL, 77),
  ('brisk_walk', 'cardio', 'cardio', 'distance', 'outside', 'full_body', 1, 1, 0, 3.0, 1.60, 4.3, 'walk', NULL, 78),
  ('jog', 'cardio', 'cardio', 'distance', 'outside', 'full_body', 2, 0, 0, 3.0, 2.40, 7.0, 'jog', NULL, 79),
  ('run', 'cardio', 'cardio', 'distance', 'outside', 'full_body', 3, 0, 0, 3.0, 3.00, 9.8, 'run', NULL, 80),
  ('run_walk_intervals', 'cardio', 'cardio', 'time', 'outside', 'full_body', 1, 0, 0, 3.0, 0.00, 6.0, 'jog', NULL, 81),
  ('power_walk_intervals', 'cardio', 'cardio', 'time', 'outside', 'full_body', 1, 1, 0, 3.0, 0.00, 5.0, 'walk', NULL, 82)
ON DUPLICATE KEY UPDATE role = VALUES(role), pattern = VALUES(pattern), metric = VALUES(metric),
  places = VALUES(places), muscles = VALUES(muscles), difficulty = VALUES(difficulty),
  low_impact = VALUES(low_impact), weighted = VALUES(weighted),
  seconds_per_rep = VALUES(seconds_per_rep), speed_mps = VALUES(speed_mps), met = VALUES(met),
  motion = VALUES(motion), prop = VALUES(prop), sort_order = VALUES(sort_order),
  retired_at = NULL;

UPDATE exercises SET retired_at = UTC_TIMESTAMP()
  WHERE user_id IS NULL AND retired_at IS NULL AND slug NOT IN ('march_in_place', 'jumping_jacks', 'high_knees', 'arm_circles', 'hip_circles', 'torso_twists', 'leg_swings', 'easy_walk', 'push_up', 'knee_push_up', 'wall_push_up', 'diamond_push_up', 'incline_push_up', 'pike_push_up', 'air_squat', 'jump_squat', 'reverse_lunge', 'glute_bridge', 'wall_sit', 'calf_raise', 'step_up', 'burpee', 'mountain_climber', 'superman', 'prone_y_raise', 'reverse_snow_angel', 'bench_dip', 'plank', 'side_plank', 'crunch', 'bicycle_crunch', 'leg_raise', 'dead_bug', 'russian_twist', 'hanging_knee_raise', 'pull_up', 'chin_up', 'db_bench_press', 'db_floor_press', 'db_fly', 'db_shoulder_press', 'db_lateral_raise', 'db_row', 'db_curl', 'db_hammer_curl', 'db_overhead_triceps', 'db_goblet_squat', 'db_lunge', 'db_romanian_deadlift', 'kb_swing', 'kb_goblet_squat', 'kb_deadlift', 'bb_back_squat', 'bb_bench_press', 'bb_deadlift', 'bb_overhead_press', 'bb_row', 'bb_curl', 'bb_hip_thrust', 'bb_romanian_deadlift', 'band_row', 'band_pull_apart', 'band_curl', 'band_chest_press', 'lat_pulldown', 'seated_cable_row', 'triceps_pushdown', 'face_pull', 'leg_press', 'leg_curl', 'leg_extension', 'machine_chest_press', 'treadmill_run', 'treadmill_walk', 'exercise_bike', 'rowing_machine', 'jump_rope', 'brisk_walk', 'jog', 'run', 'run_walk_intervals', 'power_walk_intervals');

DELETE ee FROM exercise_equipment ee
  JOIN exercises e ON e.id = ee.exercise_id
  WHERE e.user_id IS NULL;

INSERT INTO exercise_equipment (exercise_id, equipment_slug)
SELECT e.id, n.equipment FROM exercises e JOIN (
  SELECT 'incline_push_up' AS slug, 'bench' AS equipment
  UNION ALL SELECT 'step_up' AS slug, 'box' AS equipment
  UNION ALL SELECT 'bench_dip' AS slug, 'bench' AS equipment
  UNION ALL SELECT 'hanging_knee_raise' AS slug, 'pull_up_bar' AS equipment
  UNION ALL SELECT 'pull_up' AS slug, 'pull_up_bar' AS equipment
  UNION ALL SELECT 'chin_up' AS slug, 'pull_up_bar' AS equipment
  UNION ALL SELECT 'db_bench_press' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_bench_press' AS slug, 'bench' AS equipment
  UNION ALL SELECT 'db_floor_press' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_fly' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_fly' AS slug, 'bench' AS equipment
  UNION ALL SELECT 'db_shoulder_press' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_lateral_raise' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_row' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_curl' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_hammer_curl' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_overhead_triceps' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_goblet_squat' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_lunge' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'db_romanian_deadlift' AS slug, 'dumbbells' AS equipment
  UNION ALL SELECT 'kb_swing' AS slug, 'kettlebell' AS equipment
  UNION ALL SELECT 'kb_goblet_squat' AS slug, 'kettlebell' AS equipment
  UNION ALL SELECT 'kb_deadlift' AS slug, 'kettlebell' AS equipment
  UNION ALL SELECT 'bb_back_squat' AS slug, 'barbell' AS equipment
  UNION ALL SELECT 'bb_back_squat' AS slug, 'squat_rack' AS equipment
  UNION ALL SELECT 'bb_bench_press' AS slug, 'barbell' AS equipment
  UNION ALL SELECT 'bb_bench_press' AS slug, 'bench' AS equipment
  UNION ALL SELECT 'bb_bench_press' AS slug, 'squat_rack' AS equipment
  UNION ALL SELECT 'bb_deadlift' AS slug, 'barbell' AS equipment
  UNION ALL SELECT 'bb_overhead_press' AS slug, 'barbell' AS equipment
  UNION ALL SELECT 'bb_row' AS slug, 'barbell' AS equipment
  UNION ALL SELECT 'bb_curl' AS slug, 'barbell' AS equipment
  UNION ALL SELECT 'bb_hip_thrust' AS slug, 'barbell' AS equipment
  UNION ALL SELECT 'bb_hip_thrust' AS slug, 'bench' AS equipment
  UNION ALL SELECT 'bb_romanian_deadlift' AS slug, 'barbell' AS equipment
  UNION ALL SELECT 'band_row' AS slug, 'resistance_bands' AS equipment
  UNION ALL SELECT 'band_pull_apart' AS slug, 'resistance_bands' AS equipment
  UNION ALL SELECT 'band_curl' AS slug, 'resistance_bands' AS equipment
  UNION ALL SELECT 'band_chest_press' AS slug, 'resistance_bands' AS equipment
  UNION ALL SELECT 'lat_pulldown' AS slug, 'cable_machine' AS equipment
  UNION ALL SELECT 'seated_cable_row' AS slug, 'cable_machine' AS equipment
  UNION ALL SELECT 'triceps_pushdown' AS slug, 'cable_machine' AS equipment
  UNION ALL SELECT 'face_pull' AS slug, 'cable_machine' AS equipment
  UNION ALL SELECT 'leg_press' AS slug, 'leg_press' AS equipment
  UNION ALL SELECT 'leg_curl' AS slug, 'leg_machines' AS equipment
  UNION ALL SELECT 'leg_extension' AS slug, 'leg_machines' AS equipment
  UNION ALL SELECT 'machine_chest_press' AS slug, 'chest_press_machine' AS equipment
  UNION ALL SELECT 'treadmill_run' AS slug, 'treadmill' AS equipment
  UNION ALL SELECT 'treadmill_walk' AS slug, 'treadmill' AS equipment
  UNION ALL SELECT 'exercise_bike' AS slug, 'exercise_bike' AS equipment
  UNION ALL SELECT 'rowing_machine' AS slug, 'rowing_machine' AS equipment
  UNION ALL SELECT 'jump_rope' AS slug, 'jump_rope' AS equipment
) n ON n.slug = e.slug;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_workout_seed');
