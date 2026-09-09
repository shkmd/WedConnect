import type { ReactNode } from 'react';

type Role = 'customer' | 'vendor' | 'admin';
const nav: Record<Role, Array<[string, string, string]>> = {
  customer: [['⌂','Overview','/dashboard'],['⌕','Discover','/coimbatore/photography'],['♡','Shortlists','/shortlists'],['✦','Requirements','/requirements/new'],['◌','Account','#account']],
  vendor: [['⌂','Overview','/vendor/dashboard'],['◎','Onboarding','/vendor/onboarding'],['↗','Leads','/vendor/leads'],['▧','Portfolio','/vendors/my-business/portfolio'],['☆','Reviews','/vendor/reviews'],['◇','Trust centre','/vendor/trust-center'],['₹','Billing','/vendor/billing']],
  admin: [['⌂','Overview','/admin/dashboard'],['◇','Trust queues','/admin/trust'],['◎','Vendor review','/admin/dashboard#vendors'],['⚑','Reports','/admin/dashboard#reports'],['◫','Analytics','/admin/dashboard#analytics'],['⚙','Settings','/admin/dashboard#settings']],
};
const labels = { customer: 'Customer workspace', vendor: 'Vendor workspace', admin: 'Operations console' };

export function DashboardShell({ role, active, title, eyebrow, actions, children }: { role: Role; active: string; title: string; eyebrow: string; actions?: ReactNode; children: ReactNode }) {
  return <main className={`dash-shell dash-${role}`}><aside className="dash-sidebar"><a className="dash-logo" href="/"><span>Wed</span>Connect</a><p className="workspace-label">{labels[role]}</p><nav aria-label={`${role} dashboard navigation`}>{nav[role].map(([icon,label,href])=><a className={label===active?'active':''} href={href} key={label}><i aria-hidden="true">{icon}</i><span>{label}</span>{label==='Leads'&&<b>3</b>}</a>)}</nav><div className="sidebar-help"><span>Need a hand?</span><p>Our support team is here for you.</p><a href="/support/grievance">Get support →</a></div><a className="back-home" href="/">← Back to website</a></aside><section className="dash-main"><header className="dash-topbar"><div><p>{eyebrow}</p><h1>{title}</h1></div><div className="dash-actions">{actions}<button className="notification" type="button" aria-label="Notifications">♢<b/></button><button className="avatar" type="button" aria-label="Account menu">{role==='admin'?'AD':role==='vendor'?'VS':'AS'}</button></div></header><div className="dash-content">{children}</div></section></main>;
}

export function MetricCard({ label, value, detail, tone='rose' }: { label: string; value: string; detail: string; tone?: string }) { return <article className={`metric-card tone-${tone}`}><div><span>{label}</span><strong>{value}</strong></div><i aria-hidden="true">↗</i><p>{detail}</p></article> }
