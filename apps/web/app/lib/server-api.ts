import { cookies } from 'next/headers';

const apiBase = process.env.API_SERVER_URL ?? 'http://localhost:4000/api/v1';
export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

export async function apiGet<T>(path: string): Promise<ApiResult<T>> {
  const jar = await cookies();
  const cookie = ['wc_access_token', 'wc_refresh_token'].map((name) => jar.get(name)).filter(Boolean).map((item) => `${item!.name}=${item!.value}`).join('; ');
  try {
    const response = await fetch(`${apiBase}${path}`, { cache: 'no-store', headers: cookie ? { cookie } : {} });
    if (!response.ok) return { ok: false, status: response.status, message: response.status === 401 ? 'Sign in to open this workspace.' : response.status === 403 ? 'This account does not have access to this workspace.' : 'Live dashboard data is temporarily unavailable.' };
    return { ok: true, data: await response.json() as T };
  } catch { return { ok: false, status: 503, message: 'The API is not reachable. Start the API and refresh this page.' }; }
}
