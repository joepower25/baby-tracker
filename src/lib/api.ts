export async function api<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(
      (data && (data.error as string)) || `request_failed_${res.status}`,
    ) as Error & { status: number; data: unknown };
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data as T;
}
