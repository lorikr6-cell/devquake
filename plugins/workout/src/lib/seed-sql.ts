import { EQUIPMENT, EXERCISES } from './catalog';
import { equipmentIcon } from '../illustrations/icons';

/**
 * Writes the seed migration from the catalogue (ADR 0013): equipment with its icon, and the
 * built-in exercises. seed.test.ts fails when db/migrations/<SEED_MIGRATION>.sql differs; run
 * `UPDATE_SEED=1 pnpm --filter @devquake/plugin-workout test` to rewrite it. When the catalogue
 * changes after a release, add a NEW migration file and point SEED_MIGRATION at it: a database
 * only runs each file once.
 */

export const SEED_MIGRATION = '0003_workout_seed';

const text = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
const flag = (value: boolean) => (value ? '1' : '0');

export function seedSql(): string {
  const equipment = EQUIPMENT.map(
    (e, i) => `  (${text(e.slug)}, ${i + 1}, ${flag(e.home)}, ${text(equipmentIcon(e.slug))})`,
  ).join(',\n');

  const exercises = EXERCISES.map((e, i) =>
    [
      text(e.slug),
      text(e.role),
      text(e.pattern),
      text(e.metric),
      text(e.places.join(',')),
      text(e.muscles.join(',')),
      e.difficulty,
      flag(e.lowImpact),
      flag(e.weighted),
      e.secondsPerRep.toFixed(1),
      e.speed.toFixed(2),
      e.met.toFixed(1),
      text(e.motion),
      e.prop ? text(e.prop) : 'NULL',
      i + 1,
    ].join(', '),
  )
    .map((row) => `  (${row})`)
    .join(',\n');

  const needs = EXERCISES.flatMap((e) =>
    e.equipment.map((q) => `SELECT ${text(e.slug)} AS slug, ${text(q)} AS equipment`),
  ).join('\n  UNION ALL ');

  const slugs = EXERCISES.map((e) => text(e.slug)).join(', ');

  return `-- =============================================================================
-- workout ${SEED_MIGRATION.slice(0, 4)} — Built-in equipment and exercises (the plugin's OWN database)
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
${equipment}
ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order), home = VALUES(home),
  icon_svg = VALUES(icon_svg);

INSERT INTO exercises (slug, role, pattern, metric, places, muscles, difficulty, low_impact,
  weighted, seconds_per_rep, speed_mps, met, motion, prop, sort_order) VALUES
${exercises}
ON DUPLICATE KEY UPDATE role = VALUES(role), pattern = VALUES(pattern), metric = VALUES(metric),
  places = VALUES(places), muscles = VALUES(muscles), difficulty = VALUES(difficulty),
  low_impact = VALUES(low_impact), weighted = VALUES(weighted),
  seconds_per_rep = VALUES(seconds_per_rep), speed_mps = VALUES(speed_mps), met = VALUES(met),
  motion = VALUES(motion), prop = VALUES(prop), sort_order = VALUES(sort_order),
  retired_at = NULL;

UPDATE exercises SET retired_at = UTC_TIMESTAMP()
  WHERE user_id IS NULL AND retired_at IS NULL AND slug NOT IN (${slugs});

DELETE ee FROM exercise_equipment ee
  JOIN exercises e ON e.id = ee.exercise_id
  WHERE e.user_id IS NULL;

INSERT INTO exercise_equipment (exercise_id, equipment_slug)
SELECT e.id, n.equipment FROM exercises e JOIN (
  ${needs}
) n ON n.slug = e.slug;

INSERT IGNORE INTO schema_migrations (version) VALUES ('${SEED_MIGRATION}');
`;
}
