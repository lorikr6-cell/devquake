import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { deletePhoto, readPhoto, savePhoto } from '../lib/mutations';
import { MAX_PHOTO_BYTES } from '../lib/photos';
import { id } from '../lib/validate';

// GET /api/lists/:id/items/:itemId/photo[?v=...]: the product photo (list members only). The
// address changes with every new photo (?v), so browsers may keep it for a long time.
export const GET = api(async ({ request, params, db, user }) => {
  const photo = await readPhoto(db, id(params.id, 'list'), id(params.itemId, 'item'), user.id);
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

// PUT /api/lists/:id/items/:itemId/photo with the image as the request body (JPEG, PNG, WebP).
export const PUT = api(async ({ request, params, db, user }) => {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_PHOTO_BYTES) throw new HttpError(413, 'That photo is too large (max 2 MB)');
  const bytes = new Uint8Array(await request.arrayBuffer());
  await savePhoto(db, id(params.id, 'list'), id(params.itemId, 'item'), user, bytes);
});

export const DELETE = api(async ({ params, db, user }) => {
  await deletePhoto(db, id(params.id, 'list'), id(params.itemId, 'item'), user);
});
