'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import VendorWorkspace, { type Section } from './workspace';

const sections: Record<string, Section> = {
  dashboard: 'overview', leads: 'leads', profile: 'profile', portfolio: 'portfolio',
  packages: 'packages', reviews: 'reviews', analytics: 'analytics', billing: 'billing',
  notifications: 'notifications', support: 'support', settings: 'settings',
};

export default function VendorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const route = pathname.replace(/\/$/, '').split('/');
  const section = route.length === 3 ? sections[route[2] ?? ''] : undefined;
  // Layouts persist between tab navigations, retaining the authenticated workspace.
  return section ? <VendorWorkspace section={section} /> : children;
}
