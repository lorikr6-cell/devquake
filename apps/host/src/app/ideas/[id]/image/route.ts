import { getSessionUser } from '@/lib/auth/session';
import { readIdeaImage, viewerOf } from '@/lib/community-ideas';

/** The picture of a community idea, for viewers who may see the idea (else 404). */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser().catch(() => null);
  const image = await readIdeaImage(Number(id), viewerOf(user));
  if (!image) return new Response('Not found', { status: 404 });
  const versioned = new URL(request.url).searchParams.has('v');
  return new Response(new Uint8Array(image.data), {
    headers: {
      'Content-Type': image.mime,
      'Cache-Control': versioned ? 'private, max-age=31536000, immutable' : 'private, no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
    },
  });
}
