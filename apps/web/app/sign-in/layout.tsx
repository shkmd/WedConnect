import { Suspense, type ReactNode } from 'react';
export default function SignInLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<main className="auth-loading">Preparing secure sign in…</main>}>{children}</Suspense>;
}
