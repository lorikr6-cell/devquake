import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { MAX_PHOTO_BYTES, photoPeriod } from '../lib/photos';
import { savePhoto } from '../lib/progress';

// PUT /api/photos/:kind/:period with the image as the body (JPEG, PNG or WebP):
//   /photos/start/current, /photos/month/2026-09, /photos/year/2026
// Replaces the photo of that period (the starting photo: the previous starting photo).
export const PUT = api(async ({ request, params, db, user }) => {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_PHOTO_BYTES) throw new HttpError(413, 'photoTooLarge');
  const today = new Date().toISOString().slice(0, 10);
  const { kind, period } = photoPeriod(params.kind ?? '', params.period ?? '', today);
  const bytes = new Uint8Array(await request.arrayBuffer());
  return { id: await savePhoto(db, user.id, kind, period, bytes) };
});
