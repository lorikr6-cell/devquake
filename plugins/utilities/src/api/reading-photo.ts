import { api, readBytes } from '../lib/api';
import { readReadingPhoto, saveReadingPhoto } from '../lib/data';
import { MAX_PHOTO_BYTES, sniffPhoto } from '../lib/files';
import { HttpError } from '../lib/http';
import { id } from '../lib/validate';

// GET /api/bills/:id/readings/:userId/photo[?v=...]: the meter photo (everyone on the utility,
// to check a reading). The address changes with every new photo (?v).
export const GET = api(async ({ request, params, db, user }) => {
  const photo = await readReadingPhoto(db, id(params.id), user.id, id(params.userId));
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

// PUT with the image as the body (JPEG, PNG or WebP, shrunk in the browser first).
export const PUT = api(async ({ request, params, db, user }) => {
  const bytes = await readBytes(request, MAX_PHOTO_BYTES, 'photoTooLarge');
  const mime = sniffPhoto(bytes);
  if (!mime) throw new HttpError(400, 'photoType');
  await saveReadingPhoto(db, id(params.id), user, id(params.userId), mime, bytes);
});
