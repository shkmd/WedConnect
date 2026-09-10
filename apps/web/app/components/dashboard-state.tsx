export function DashboardState({ title, message, role, action }: { title: string; message: string; role: 'CUSTOMER' | 'VENDOR_OWNER' | 'ADMIN'; action?: { href: string; label: string } | undefined }) {
  return <section className="dashboard-state"><span aria-hidden="true">◇</span><h2>{title}</h2><p>{message}</p>{action ? <a className="dash-primary" href={action.href}>{action.label}</a> : role==='ADMIN'?<a className="dash-primary" href="/">Return home</a>:<a className="dash-primary" href={`/sign-in?role=${role}`}>Sign in securely</a>}</section>;
}
