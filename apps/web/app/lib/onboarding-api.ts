export type Choice = { id: string; name: string; slug: string; type?: string };
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    method,
    credentials: 'include',
    cache: 'no-store',
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new ApiError(
      `${typeof data?.message === 'string' ? data.message : response.status === 401 ? 'Please sign in to continue.' : 'Unable to save. Check your details and try again.'}${Array.isArray(data?.missing) ? `: ${data.missing.join(', ')}` : ''}`,
      response.status,
    );
  return data as T;
}
export async function catalog() {
  async function citiesUnder(parent: Choice): Promise<Choice[]> {
    if (parent.type === 'CITY') return [parent];
    if (parent.type === 'LOCALITY') return [];
    return (
      await Promise.all(
        (await request<Choice[]>(`/locations/${parent.id}/children`)).map(citiesUnder),
      )
    ).flat();
  }
  const [categories, countries] = await Promise.all([
    request<Choice[]>('/categories'),
    request<Choice[]>('/locations/countries'),
  ]);
  return { categories, cities: (await Promise.all(countries.map(citiesUnder))).flat() };
}
export async function ensureSession() {
  try {
    return await request<{ id: string }>('/auth/me');
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    await request('/auth/refresh', 'POST', { clientKind: 'web' });
    return request<{ id: string }>('/auth/me');
  }
}
