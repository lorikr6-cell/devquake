import { api } from '../lib/api';
import { listPhotos } from '../lib/progress';

// GET /api/photos: the person's progress photos (without the images).
export const GET = api(async ({ db, user }) => ({ photos: await listPhotos(db, user.id) }));
