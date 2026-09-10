'use client';

import { useEffect, useState } from 'react';

type Account = { roles: Array<{ role: { code: string } }> };

export default function AccountNav({ workspace = false }: { workspace?: boolean }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        let response = await fetch('/api/v1/auth/me', { cache: 'no-store', credentials: 'include' });
        if (response.status === 401) {
          const refreshed = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientKind: 'web' }) });
          if (refreshed.ok) {
            if (workspace) { window.location.reload(); return; }
            response = await fetch('/api/v1/auth/me', { cache: 'no-store', credentials: 'include' });
          }
        }
        if (response.ok) { const data = await response.json() as Account; if (active) setAccount(data); }
        else if (response.status !== 401 && active) setError('Account temporarily unavailable.');
      } catch { if (active) setError('Unable to check your account.'); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [workspace]);

  async function logout() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
      if (!response.ok) throw new Error('Logout failed. Please try again.');
      window.location.assign('/');
    } catch { setError('Logout failed. Please try again.'); setBusy(false); }
  }

  if (loading) return <span role="status">Checking account…</span>;
  if (!account) return <>{error ? <span role="status">{error}</span> : <><a className="login-link" href="/sign-in">Sign in</a>{!workspace && <a className="nav-cta" href="/sign-in?role=VENDOR_OWNER">List your business</a>}</>}</>;
  const codes = account.roles.map(({ role }) => role.code);
  const dashboard = codes.some(code => code.startsWith('ADMIN')) ? '/admin/dashboard' : codes.includes('VENDOR_OWNER') ? '/vendor/dashboard' : '/dashboard';
  return <><a className="nav-cta" href={dashboard}>My dashboard</a><button className="dash-secondary" type="button" onClick={logout} disabled={busy}>{busy ? 'Logging out…' : 'Log out'}</button>{error && <span role="alert">{error}</span>}</>;
}
