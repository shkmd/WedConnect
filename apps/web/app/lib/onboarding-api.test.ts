import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, catalog, ensureSession, request } from './onboarding-api';
afterEach(() => vi.unstubAllGlobals());
describe('onboarding API integration', () => {
  it('sends writes through the cookie-authenticated same-origin proxy', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ id: 'saved' }));
    vi.stubGlobal('fetch', fetch);
    await expect(
      request('/requirements', 'POST', { description: 'My actual wedding' }),
    ).resolves.toEqual({ id: 'saved' });
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/requirements',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ description: 'My actual wedding' }),
      }),
    );
  });
  it('retains server validation reasons instead of reporting success', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { message: 'Onboarding is incomplete', missing: ['services'] },
            { status: 400 },
          ),
        ),
    );
    await expect(request('/vendors/businesses/one/submit', 'POST')).rejects.toThrow(
      'Onboarding is incomplete: services',
    );
  });
  it('refreshes an expired session before confirming identity', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({}, { status: 401 }))
      .mockResolvedValueOnce(Response.json({}))
      .mockResolvedValueOnce(Response.json({ id: 'user' }));
    vi.stubGlobal('fetch', fetch);
    await expect(ensureSession()).resolves.toEqual({ id: 'user' });
    expect(fetch.mock.calls.map((c) => c[0])).toEqual([
      '/api/v1/auth/me',
      '/api/v1/auth/refresh',
      '/api/v1/auth/me',
    ]);
  });
  it('does not treat outages as expired sessions', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({}, { status: 503 }));
    vi.stubGlobal('fetch', fetch);
    await expect(ensureSession()).rejects.toBeInstanceOf(ApiError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('loads cities from the live country/state/district hierarchy', async () => {
    const routes: Record<string, unknown> = {
      '/api/v1/categories': [{ id: 'cat', name: 'Photography' }],
      '/api/v1/locations/countries': [{ id: 'country', type: 'COUNTRY' }],
      '/api/v1/locations/country/children': [{ id: 'state', type: 'STATE' }],
      '/api/v1/locations/state/children': [{ id: 'district', type: 'DISTRICT' }],
      '/api/v1/locations/district/children': [{ id: 'city', type: 'CITY', name: 'Actual city' }],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => Response.json(routes[url])),
    );
    expect(await catalog()).toEqual({
      categories: routes['/api/v1/categories'],
      cities: routes['/api/v1/locations/district/children'],
    });
  });
});
