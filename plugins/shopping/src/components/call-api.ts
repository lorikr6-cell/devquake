/** Calls the app's own API (same origin) and throws an Error with the server's message. */
export async function callApi<T = unknown>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<T | null> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  if (res.status === 204) return null;
  const data = (await res.json().catch(() => null)) as ({ error?: string } & T) | null;
  if (!res.ok) {
    throw Object.assign(new Error(data?.error ?? `Something went wrong (${res.status})`), {
      status: res.status,
    });
  }
  return data;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong';
}
