import { api } from '../lib/api';
import { deletePhoto, readPhoto } from '../lib/progress';
import { id } from '../lib/validate';

// GET /api/photos/:id[?v=...]: one of the person's own photos. Nobody else can load it. The
// address changes when the photo is replaced (?v), so the browser may keep it privately.
export const GET = api(async ({ request, params, db, user }) => {
  const photo = await readPhoto(db, user.id, id(params.id));
  const versioned = new URL(request.url).searchParams.has('v');
  return new Response(new Uint8Array(photo.data), {
    headers: {
      'Content-Type': photo.mime,
      'Cache-Control': versioned ? 'private, max-age=31536000, immutable' : 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
});

export const DELETE = api(async ({ params, db, user }) => {
  await deletePhoto(db, user.id, id(params.id));
});
