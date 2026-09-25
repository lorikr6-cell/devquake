import { api } from '../lib/api';
import { getSetup, listEquipment, saveSetup } from '../lib/data';
import { profileInput, readBody } from '../lib/validate';

// GET /api/profile: the profile, places and home equipment (null before the first setup), and
// the equipment list with icons.
export const GET = api(async ({ db, user }) => ({
  setup: await getSetup(db, user.id),
  equipment: await listEquipment(db),
}));

// PUT /api/profile { birthYear, heightCm, weightKg, weightUnit, heightUnit, experience, goal,
// daysPerWeek, sessionMinutes, lowImpact, locations[], equipment[], regenerate? }
// Creates the routines of places that have none yet; all of them again with regenerate.
export const PUT = api(async ({ request, db, user }) => {
  const year = new Date().getUTCFullYear();
  const input = profileInput(await readBody(request), year);
  const known = new Set((await listEquipment(db)).map((e) => e.slug));
  await saveSetup(
    db,
    user.id,
    {
      profile: input.profile,
      locations: input.locations,
      equipment: input.equipment.filter((e) => known.has(e)),
      monthlyEmail: input.monthlyEmail,
    },
    input.regenerate,
    year,
  );
});
