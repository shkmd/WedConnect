import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './styles.css';
import './home.css';
import './home-images.css';
import './dashboard.css';
import './wiring.css';
import './discovery-v2.css';
import './typography.css';
import './theme.css';
import './onboarding.css';
import './vendor-workspace.css';
import ThemeSwitcher from './theme-switcher';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'),
  title: { default: 'WedConnect — Wedding professionals', template: '%s · WedConnect' },
  description: 'Discover and connect with independent wedding professionals.',
  openGraph: { type: 'website', siteName: 'WedConnect' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en" data-theme="maroon"><body><div>{children}</div><ThemeSwitcher /></body></html>;
}
