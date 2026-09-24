import { getSessionUser } from '@/lib/auth/session';
import { getAvatar } from '@/lib/avatars';

/** A user's profile picture: visible to that user and to admins only. */
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const id = Number((await params).userId);
  const viewer = await getSessionUser().catch(() => null);
  if (!viewer || !Number.isInteger(id) || (viewer.userId !== id && !viewer.isAdmin)) {
    return new Response('Not found', { status: 404 });
  }
  const avatar = await getAvatar(id);
  if (!avatar) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(avatar.data), {
    headers: {
      'Content-Type': avatar.mime,
      // Private (per user); the ?v=<updated_at> in the URL busts it after a change.
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
