'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import AccountNav from '../components/account-nav';
import VendorForm from './onboarding/vendor-form';
import { ApiError, ensureSession, request } from '../lib/onboarding-api';

export type Section =
  | 'overview'
  | 'leads'
  | 'profile'
  | 'portfolio'
  | 'packages'
  | 'reviews'
  | 'analytics'
  | 'billing'
  | 'notifications'
  | 'support'
  | 'settings';
const navigation: [Section, string, string][] = [
  ['overview', 'Overview', '/vendor/dashboard'],
  ['leads', 'Leads', '/vendor/leads'],
  ['profile', 'My profile', '/vendor/profile'],
  ['portfolio', 'Portfolio gallery', '/vendor/portfolio'],
  ['packages', 'Packages & pricing', '/vendor/packages'],
  ['reviews', 'Reviews', '/vendor/reviews'],
  ['analytics', 'Analytics', '/vendor/analytics'],
  ['billing', 'Subscription', '/vendor/billing'],
  ['notifications', 'Notifications', '/vendor/notifications'],
  ['support', 'Help & support', '/vendor/support'],
  ['settings', 'Settings', '/vendor/settings'],
];
const paths: Record<string, string> = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  leads:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 8v6 M17 11h6',
  profile: 'M20 21a8 8 0 0 0-16 0 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  portfolio: 'M3 6h4l2-3h6l2 3h4v15H3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  packages: 'M12 2v20 M17 5H9a4 4 0 0 0 0 8h6a4 4 0 0 1 0 8H6',
  reviews: 'm12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
  analytics: 'M4 3v18h18 M9 16v-5 M14 16V7 M19 16V4',
  billing: 'M3 5h18v14H3z M3 10h18',
  notifications: 'M5 17h14l-2-4V9a5 5 0 0 0-10 0v4z M10 21h4',
  support: 'M9 8a3 3 0 1 1 4 3l-1 2 M12 17h.01 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
  settings:
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
};
function Icon({ name }: { name: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.overview} />
    </svg>
  );
}
type Summary = {
  business: {
    id: string;
    name: string;
    slug: string;
    status: string;
    completionPercent: number;
    publicVisible: boolean;
  };
  metrics: {
    totalLeads: number;
    newLeads: number;
    responses: number;
    credits: number;
    portfolioPosts: number;
    reviews: number;
  };
  leads: { id: string; createdAt: string; city: string; category: string; status: string }[];
};
type Lead = {
  id: string;
  status: string;
  city: { name: string };
  category: { name: string };
  eventType: string;
  eventDate: string;
  budgetMin: string | null;
  budgetMax: string | null;
  descriptionPreview: string;
  responses: { message: string }[];
};
type Package = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  inclusions: string[];
};
type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  vendorReply: string | null;
  customer: { displayName: string | null };
};
type Prefs = {
  transactionalPush: boolean;
  transactionalEmail: boolean;
  transactionalSms: boolean;
  marketingPush: boolean;
  marketingEmail: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  digestMode: string;
};
const money = (value: string | number | null) =>
  value == null
    ? 'Not specified'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(Number(value));
function Empty({ icon, title, children }: { icon: string; title: string; children: ReactNode }) {
  return (
    <div className="vw-empty">
      <span>
        <Icon name={icon} />
      </span>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
function Metric({
  icon,
  label,
  value,
  note,
}: {
  icon: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="vw-card vw-metric">
      <span className="vw-icon">
        <Icon name={icon} />
      </span>
      <strong>{value}</strong>
      <p>{label}</p>
      <small>{note}</small>
    </article>
  );
}
export default function VendorWorkspace({ section }: { section: Section }) {
  const [summary, setSummary] = useState<Summary | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [missing, setMissing] = useState(false),
    [menu, setMenu] = useState(false);
  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(() => {
      if (!active) return;
      setError('The account service is taking too long to respond. Please try again.');
      setLoading(false);
      active = false;
    }, 20000);
    void (async () => {
      try {
        await ensureSession();
        const result = await request<Summary>('/dashboard/vendor');
        if (active) setSummary(result);
      } catch (e) {
        if (active) {
          if (e instanceof ApiError && e.status === 404) setMissing(true);
          else if (e instanceof ApiError && e.status >= 500) setError('The account service is unavailable. Please check that the backend is running, then retry.');
          else setError(e instanceof Error ? e.message : 'Unable to load dashboard');
        }
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoading(false);
      }
    })();
    return () => {
      window.clearTimeout(timeout);
      active = false;
    };
  }, []);
  const title = (
    {
      overview: 'Dashboard overview',
      leads: 'Leads management',
      profile: 'My profile',
      portfolio: 'Portfolio gallery',
      packages: 'Packages & pricing',
      reviews: 'Customer reviews',
      analytics: 'Performance analytics',
      billing: 'Subscription & billing',
      notifications: 'Notifications',
      support: 'Help & support',
      settings: 'Account settings',
    } as const
  )[section];
  return (
    <main className="vw-shell">
      <aside className={menu ? 'vw-sidebar open' : 'vw-sidebar'}>
        <Link href="/" className="vw-logo">
          <span>Wed</span>Connect
        </Link>
        <p className="vw-caption">VENDOR DASHBOARD</p>
        <nav aria-label="Vendor dashboard">
          {navigation.map(([key, label, href]) => (
            <Link
              onClick={() => setMenu(false)}
              aria-current={section === key ? 'page' : undefined}
              className={section === key ? 'active' : ''}
              href={href}
              key={key}
            >
              <Icon name={key} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="vw-identity">
          <span className="vw-avatar">
            {summary?.business.name.slice(0, 2).toUpperCase() ?? 'WC'}
          </span>
          <div>
            <strong>{summary?.business.name ?? 'Your business'}</strong>
            <Link href="/">Back to website ↗</Link>
          </div>
        </div>
      </aside>
      <div className="vw-main">
        <header className="vw-topbar">
          <button
            className="vw-menu"
            type="button"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            Menu
          </button>
          <strong>{summary?.business.name ?? 'Your vendor workspace'}</strong>
          <div>
            <Link
              className="vw-bell"
              aria-label="Notification preferences"
              href="/vendor/notifications"
            >
              <Icon name="notifications" />
            </Link>
            <AccountNav />
          </div>
        </header>
        <div className="vw-content">
          <div className="vw-heading">
            <div>
              <p className="vw-caption">YOUR BUSINESS, BEAUTIFULLY ORGANIZED</p>
              <h1>{title}</h1>
              <p>
                {section === 'overview'
                  ? 'A clear view of your enquiries, profile and next steps.'
                  : 'Manage your business with everything in one place.'}
              </p>
            </div>
            {section === 'overview' && (
              <Link className="vw-button" href="/vendor/profile">
                Edit profile ↗
              </Link>
            )}
          </div>
          {loading ? (
            <div className="vw-skeleton" role="status">
              Loading your workspace…
              <div />
              <div />
              <div />
            </div>
          ) : error ? (
            <Empty icon="support" title="We couldn’t load your account">
              <p role="alert">{error}</p>
              <button type="button" className="vw-button" onClick={() => window.location.reload()}>Retry loading</button>
              <Link href="/sign-in?role=VENDOR_OWNER" className="vw-button">
                Sign in
              </Link>
            </Empty>
          ) : section === 'profile' ? (
            <VendorForm />
          ) : section === 'support' ? (
            <Support />
          ) : section === 'notifications' || section === 'settings' ? (
            <Preferences settings={section === 'settings'} />
          ) : missing ? (
            <Empty icon="profile" title="Let’s introduce your business">
              <p>
                Create your business profile to start managing enquiries, packages and your
                portfolio.
              </p>
              <Link href="/vendor/profile" className="vw-button">
                Create business profile
              </Link>
            </Empty>
          ) : (
            summary && (
              <>
                {section === 'overview' || section === 'analytics' ? (
                  <Overview data={summary} analytics={section === 'analytics'} />
                ) : section === 'leads' ? (
                  <Leads businessId={summary.business.id} />
                ) : section === 'packages' ? (
                  <Packages businessId={summary.business.id} />
                ) : section === 'reviews' ? (
                  <Reviews data={summary} />
                ) : section === 'billing' ? (
                  <Billing businessId={summary.business.id} />
                ) : section === 'portfolio' ? (
                  <Portfolio data={summary} />
                ) : null}
              </>
            )
          )}
        </div>
      </div>
    </main>
  );
}
function Overview({ data, analytics }: { data: Summary; analytics: boolean }) {
  const m = data.metrics;
  return (
    <>
      <div className="vw-metrics">
        <Metric
          icon="leads"
          label="Total enquiries"
          value={String(m.totalLeads)}
          note={m.newLeads + ' awaiting a first response'}
        />
        <Metric
          icon="analytics"
          label="Responses"
          value={String(m.responses)}
          note="Enquiries you have replied to"
        />
        <Metric
          icon="profile"
          label="Profile completion"
          value={data.business.completionPercent + '%'}
          note={data.business.status.replaceAll('_', ' ')}
        />
        <Metric
          icon="portfolio"
          label="Portfolio posts"
          value={String(m.portfolioPosts)}
          note="Your portfolio collection"
        />
        <Metric
          icon="reviews"
          label="Reviews"
          value={String(m.reviews)}
          note="Reviews received, including moderation"
        />
        <Metric
          icon="billing"
          label="Lead credits"
          value={String(m.credits)}
          note="Available to respond to enquiries"
        />
      </div>
      <div className="vw-card vw-progress-card">
        <div>
          <h2>Your business profile</h2>
          <p>
            {data.business.publicVisible
              ? 'Your profile is visible to couples.'
              : 'Complete your details and submit your profile for review.'}
          </p>
        </div>
        <progress
          max="100"
          value={data.business.completionPercent}
          aria-label="Profile completion"
        />
        <Link href="/vendor/profile">Continue profile →</Link>
      </div>
      <section className="vw-card">
        <div className="vw-card-title">
          <div>
            <h2>{analytics ? 'Response performance' : 'Recent enquiries'}</h2>
            <p>
              {analytics
                ? 'Based on your total enquiries and responses.'
                : 'Your latest matching customer requirements.'}
            </p>
          </div>
          <Link href="/vendor/leads">View all →</Link>
        </div>
        {analytics ? (
          <>
            <Metric
              icon="analytics"
              label="Response rate"
              value={(m.totalLeads ? (100 * m.responses) / m.totalLeads : 0).toFixed(1) + '%'}
              note={m.responses + ' of ' + m.totalLeads + ' enquiries answered'}
            />
            <progress
              className="vw-wide-progress"
              max={Math.max(1, m.totalLeads)}
              value={m.responses}
              aria-label="Responded enquiries"
            />
          </>
        ) : data.leads.length ? (
          <div className="vw-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>City</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <Link href="/vendor/leads">{l.category}</Link>
                    </td>
                    <td>{l.city}</td>
                    <td>{new Date(l.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <span className="vw-badge">{l.status.replaceAll('_', ' ')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon="leads" title="Your next opportunity starts here">
            <p>Matching enquiries will appear here as couples contact your business.</p>
          </Empty>
        )}
      </section>
      <div className="vw-quick">
        {[
          ['leads', 'View new leads', 'Respond to couples', '/vendor/leads'],
          [
            'profile',
            'Update your profile',
            'Keep your business details current',
            '/vendor/profile',
          ],
          ['portfolio', 'Build your portfolio', 'Showcase your best work', '/vendor/portfolio'],
        ].map(([icon, label, note, href]) => (
          <Link href={href!} key={label}>
            <Icon name={icon!} />
            <h3>{label}</h3>
            <p>{note}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
function Leads({ businessId }: { businessId: string }) {
  const [items, setItems] = useState<Lead[]>([]),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(''),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('ALL'),
    [selected, setSelected] = useState<Lead | null>(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setItems(await request<Lead[]>('/vendors/businesses/' + businessId + '/leads'));
      setLoaded(true);
    } catch (e) {
      setError(String(e));
    }
  }
  useEffect(() => {
    void load();
  }, [businessId]);
  const visible = items.filter(
    (l) =>
      (filter === 'ALL' || l.status === filter) &&
      (l.city.name + ' ' + l.category.name + ' ' + l.eventType)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="vw-toolbar">
        <input
          aria-label="Search leads"
          placeholder="Search by city, category or event…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="vw-tabs">
          {['ALL', 'NEW', 'VIEWED', 'IN_DISCUSSION', 'CLOSED', 'NOT_INTERESTED'].map((s) => (
            <button
              type="button"
              aria-pressed={filter === s}
              className={filter === s ? 'active' : ''}
              key={s}
              onClick={() => setFilter(s)}
            >
              {s.replaceAll('_', ' ')}{' '}
              {s === 'ALL' ? '' : '(' + items.filter((l) => l.status === s).length + ')'}
            </button>
          ))}
        </div>
      </div>
      {error && <p role="alert">{error}</p>}
      <section className="vw-card">
        <div className="vw-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Enquiry</th>
                <th>Event date</th>
                <th>Budget</th>
                <th>City</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.category.name}
                    <small>{l.eventType}</small>
                  </td>
                  <td>{new Date(l.eventDate).toLocaleDateString('en-IN')}</td>
                  <td>
                    {money(l.budgetMin)} – {money(l.budgetMax)}
                  </td>
                  <td>{l.city.name}</td>
                  <td>
                    <span className="vw-badge">{l.status.replaceAll('_', ' ')}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(l);
                        setMessage('');
                      }}
                    >
                      Open enquiry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!visible.length && (
          <Empty
            icon="leads"
            title={loaded ? 'No enquiries match your filters' : 'Loading enquiries…'}
          >
            <p>{loaded ? 'New matching enquiries will appear here.' : 'Please wait.'}</p>
          </Empty>
        )}
      </section>
      {selected && (
        <section className="vw-card">
          <div className="vw-card-title">
            <h2>
              {selected.eventType} · {selected.city.name}
            </h2>
            <button onClick={() => setSelected(null)}>Close</button>
          </div>
          <p>{selected.descriptionPreview}</p>
          <p>Customer contact details are shared only with their permission.</p>
          {selected.responses.map((r, i) => (
            <blockquote key={i}>{r.message}</blockquote>
          ))}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError('');
              try {
                await request(
                  '/vendors/businesses/' + businessId + '/leads/' + selected.id + '/respond',
                  'POST',
                  { message },
                );
                setMessage('');
                setSelected(null);
                await load();
              } catch (err) {
                setError(String(err));
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Your response
              <textarea
                required
                minLength={20}
                maxLength={2000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <p>Your first response uses one lead credit. Further responses are free.</p>
            <button className="vw-button" disabled={busy}>
              {busy ? 'Sending…' : 'Send response'}
            </button>
          </form>
        </section>
      )}
    </>
  );
}
function Packages({ businessId }: { businessId: string }) {
  const [items, setItems] = useState<Package[]>([]),
    [open, setOpen] = useState(false),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false);
  async function load() {
    const data = await request<{ packages: Package[] }>(
      '/vendors/businesses/' + businessId + '/onboarding',
    );
    setItems(data.packages);
  }
  useEffect(() => {
    void load().catch((e) => setStatus(String(e)));
  }, [businessId]);
  return (
    <>
      <div className="vw-card-title">
        <h2>Your packages</h2>
        <button className="vw-button" onClick={() => setOpen(!open)}>
          {open ? 'Close form' : '+ Add package'}
        </button>
      </div>
      {status && <p role="status">{status}</p>}
      {open && (
        <form
          className="vw-card"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            try {
              await request('/vendors/businesses/' + businessId + '/packages', 'POST', {
                name: f.get('name'),
                price: Number(f.get('price')),
                description: f.get('description'),
                inclusions: String(f.get('inclusions'))
                  .split('\n')
                  .map((x) => x.trim())
                  .filter(Boolean),
              });
              await load();
              setOpen(false);
              setStatus('Package saved.');
            } catch (err) {
              setStatus(String(err));
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Create a package</h2>
          <div className="vw-fields">
            <label>
              Package name
              <input name="name" required minLength={2} maxLength={140} />
            </label>
            <label>
              Price (₹)
              <input name="price" type="number" min="0" step=".01" required />
            </label>
          </div>
          <label>
            Description
            <textarea name="description" maxLength={1200} />
          </label>
          <label>
            Included services · one per line
            <textarea
              name="inclusions"
              placeholder="Consultation&#10;Event coverage&#10;Final deliverables"
            />
          </label>
          <button className="vw-button" disabled={busy}>
            {busy ? 'Saving…' : 'Save package'}
          </button>
        </form>
      )}
      {items.length ? (
        <div className="vw-package-grid">
          {items.map((p) => (
            <article className="vw-card" key={p.id}>
              <Icon name="packages" />
              <h2>{p.name}</h2>
              <p>{p.description}</p>
              <strong className="vw-price">{money(p.price)}</strong>
              <ul>
                {p.inclusions.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : (
        <Empty icon="packages" title="Make your services easy to choose">
          <p>Create a package with a clear price and the services it includes.</p>
          <button className="vw-button" onClick={() => setOpen(true)}>
            + Create your first package
          </button>
        </Empty>
      )}
    </>
  );
}
function Reviews({ data }: { data: Summary }) {
  const [items, setItems] = useState<Review[]>([]),
    [error, setError] = useState(''),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void request<Review[]>('/vendors/' + data.business.slug + '/reviews')
      .then(setItems)
      .catch((e) => setError(String(e)))
      .finally(() => setLoaded(true));
  }, [data.business.slug]);
  return (
    <>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          <div className="vw-card vw-rating">
            <div>
              <strong>
                {items.length
                  ? (items.reduce((n, r) => n + r.rating, 0) / items.length).toFixed(1)
                  : '—'}
              </strong>
              <p>{items.length} published reviews</p>
            </div>
            <div>
              {[5, 4, 3, 2, 1].map((n) => (
                <div className="vw-rating-row" key={n}>
                  <span>{n} ★</span>
                  <progress
                    max={Math.max(1, items.length)}
                    value={items.filter((r) => r.rating === n).length}
                  />
                  <span>{items.filter((r) => r.rating === n).length}</span>
                </div>
              ))}
            </div>
          </div>
          {items.map((r) => (
            <article className="vw-card" key={r.id}>
              <span className="vw-badge">{r.rating} ★</span>
              <h2>{r.title}</h2>
              <p>{r.body}</p>
              <small>{r.customer.displayName ?? 'Customer'}</small>
              {r.vendorReply ? (
                <blockquote>{r.vendorReply}</blockquote>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const reply = String(new FormData(e.currentTarget).get('reply'));
                    try {
                      await request(
                        '/vendors/businesses/' + data.business.id + '/reviews/' + r.id + '/reply',
                        'POST',
                        { reply },
                      );
                      setItems(
                        items.map((x) => (x.id === r.id ? { ...x, vendorReply: reply } : x)),
                      );
                    } catch (err) {
                      setError(String(err));
                    }
                  }}
                >
                  <label>
                    Public reply
                      <textarea required minLength={10} maxLength={1200} name="reply" />
                  </label>
                  <button className="vw-button">Post reply</button>
                </form>
              )}
            </article>
          ))}
          {!items.length && (
            <Empty icon="reviews" title={loaded ? 'No published reviews yet' : 'Loading reviews…'}>
              <p>Approved customer reviews and your replies will appear here.</p>
            </Empty>
          )}
        </>
      )}
    </>
  );
}
type BillingData = {
  subscriptions: { id: string; status: string; plan: { name: string }; endsAt: string | null }[];
  orders: { id: string; amountPaise: number; status: string; createdAt: string }[];
};
function Billing({ businessId }: { businessId: string }) {
  const [data, setData] = useState<BillingData | null>(null),
    [plans, setPlans] = useState<{ id: string; name: string; monthlyPricePaise: number }[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    void Promise.all([
      request<BillingData>('/vendors/businesses/' + businessId + '/billing'),
      request<{ plans: { id: string; name: string; monthlyPricePaise: number }[] }>(
        '/billing/catalog',
      ),
    ])
      .then(([d, c]) => {
        setData(d);
        setPlans(c.plans);
      })
      .catch((e) => setError(String(e)));
  }, [businessId]);
  return (
    <>
      {error && <p role="alert">{error}</p>}
      <section className="vw-card">
        <p className="vw-caption">CURRENT SUBSCRIPTION</p>
        <h2>
          {data
            ? (data.subscriptions.find((s) => s.status === 'ACTIVE')?.plan.name ??
              'No active paid subscription')
            : 'Loading subscription…'}
        </h2>
        <p>Manage your enquiries and keep track of payments here.</p>
      </section>
      <h2>Available plans</h2>
      <div className="vw-package-grid">
        {plans.map((p) => (
          <article className="vw-card" key={p.id}>
            <h2>{p.name}</h2>
            <strong className="vw-price">
              {money(p.monthlyPricePaise / 100)}
              <small> / month</small>
            </strong>
            <Link href="/vendor/support" className="vw-button">
              Ask about this plan
            </Link>
          </article>
        ))}
      </div>
      <section className="vw-card">
        <h2>Payment history</h2>
        {data?.orders.length ? (
          <div className="vw-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((o) => (
                  <tr key={o.id}>
                    <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>{money(o.amountPaise / 100)}</td>
                    <td>{o.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{data ? 'No payment history yet.' : 'Loading payments…'}</p>
        )}
      </section>
    </>
  );
}
function Preferences({ settings }: { settings: boolean }) {
  const [prefs, setPrefs] = useState<Prefs | null>(null),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    void request<Prefs>('/notifications/preferences')
      .then(setPrefs)
      .catch((e) => setStatus(String(e)));
  }, []);
  return (
    <>
      {settings && (
        <section className="vw-card">
          <h2>Sign-in & profile security</h2>
          <p>Your account uses phone verification codes to sign in.</p>
          <Link href="/vendor/trust-center">Open trust centre →</Link>
          <p>Business verification is reviewed separately from phone sign-in.</p>
        </section>
      )}
      <form
        className="vw-card"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await request('/notifications/preferences', 'PUT', prefs);
            setStatus('Preferences saved.');
          } catch (err) {
            setStatus(String(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Notification channels</h2>
        <p>Choose how you receive account updates and marketing messages.</p>
        {prefs ? (
          (
            [
              'transactionalEmail',
              'transactionalSms',
              'transactionalPush',
              'marketingEmail',
              'marketingPush',
            ] as const
          ).map((key, i) => (
            <label className="vw-toggle" key={key}>
              <span>
                {
                  [
                    'Email account updates',
                    'SMS account updates',
                    'Mobile push updates',
                    'Marketing emails',
                    'Marketing push notifications',
                  ][i]
                }
              </span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
              />
            </label>
          ))
        ) : (
          <p>Loading preferences…</p>
        )}
        {prefs && (
          <label>
            Delivery preference
            <select
              value={prefs.digestMode}
              onChange={(e) => setPrefs({ ...prefs, digestMode: e.target.value })}
            >
              {['IMMEDIATE', 'DAILY', 'WEEKLY', 'OFF'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        )}
        <button disabled={!prefs || busy} className="vw-button">
          {busy ? 'Saving…' : 'Save preferences'}
        </button>
        <p role="status">{status}</p>
      </form>
    </>
  );
}
function Support() {
  const [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <>
      <section className="vw-card">
        <h2>A little guidance goes a long way</h2>
        {[
          [
            'How do I complete my profile?',
            'Add your business details, choose a category and service cities, add a service and accept the declaration before submitting for review.',
          ],
          [
            'How do lead credits work?',
            'Your first response to an enquiry uses one credit. Later responses to the same enquiry do not use another credit.',
          ],
          [
            'When will my portfolio appear?',
            'Your media must finish processing and moderation before a portfolio post can be published.',
          ],
          [
            'How does business verification work?',
            'Phone sign-in confirms access to your phone. Business verification is a separate review in the trust centre.',
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
      <form
        className="vw-card"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            f = new FormData(form);
          setBusy(true);
          try {
            await request('/trust/grievances', 'POST', {
              type: f.get('type'),
              subject: f.get('subject'),
              description: f.get('description'),
            });
            setStatus('Your support request has been submitted.');
            form.reset();
          } catch (err) {
            setStatus(String(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Raise a support request</h2>
        <label>
          Issue type
          <select name="type">
            {['SERVICE', 'VERIFICATION', 'MODERATION', 'PRIVACY', 'OTHER'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Subject
          <input name="subject" minLength={5} maxLength={160} required />
        </label>
        <label>
          Tell us what happened
          <textarea name="description" minLength={30} maxLength={4000} required />
        </label>
        <button className="vw-button" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit request'}
        </button>
        <p role="status">{status}</p>
      </form>
    </>
  );
}
type Post = {
  id: string;
  caption: string | null;
  publicationStatus: string;
  format: string;
  media: { url: string | null }[];
};
function Portfolio({ data }: { data: Summary }) {
  const [posts, setPosts] = useState<Post[]>([]),
    [tab, setTab] = useState('photos'),
    [status, setStatus] = useState(''),
    [busy, setBusy] = useState(false);
  async function load() {
    setPosts(await request<Post[]>('/vendors/businesses/' + data.business.id + '/portfolio'));
  }
  useEffect(() => {
    void load().catch((e) => setStatus(String(e)));
  }, [data.business.id]);
  return (
    <>
      <div className="vw-tabs">
        {['photos', 'videos'].map((t) => (
          <button
            type="button"
            key={t}
            className={tab === t ? 'active' : ''}
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
          >
            {t === 'photos' ? 'Photos' : 'Videos'}
          </button>
        ))}
      </div>
      <form
        className="vw-card"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            f = new FormData(form),
            file = f.get('media');
          if (!(file instanceof File) || !file.size) return;
          setBusy(true);
          setStatus('Uploading your media…');
          try {
            const profile = await request<{
              baseCityId: string | null;
              categories: { categoryId: string; isPrimary: boolean }[];
            }>('/vendors/businesses/' + data.business.id + '/onboarding');
            const categoryId = profile.categories.find((c) => c.isPrimary)?.categoryId;
            if (!profile.baseCityId || !categoryId)
              throw new Error('Set your base city and primary category in My profile first.');
            const base = '/vendors/businesses/' + data.business.id;
            const intent = await request<{ intentId: string; signedUrl: string }>(
              base + '/media/upload-intents',
              'POST',
              {
                filename: file.name,
                mediaType: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
                mimeType: file.type,
                byteSize: file.size,
                rightsDeclared: true,
              },
            );
            const upload = await fetch(intent.signedUrl, {
              method: 'PUT',
              headers: { 'Content-Type': file.type },
              body: file,
            });
            if (!upload.ok) throw new Error('Upload failed. Please retry.');
            const asset = await request<{ id: string }>(
              base + '/media/upload-intents/' + intent.intentId + '/complete',
              'POST',
            );
            await request(base + '/portfolio', 'POST', {
              categoryId,
              cityId: profile.baseCityId,
              format: file.type.startsWith('image/') ? 'SINGLE_IMAGE' : 'SHORT_VIDEO',
              caption: f.get('caption'),
              mediaIds: [asset.id],
              coverMediaId: asset.id,
            });
            setStatus('Upload saved. Processing and review are required before publishing.');
            form.reset();
            await load();
          } catch (err) {
            setStatus(String(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Showcase your work</h2>
        <p>Upload a photo or video, add a caption, then publish after review.</p>
        <label className="vw-upload">
          + Add {tab === 'photos' ? 'photo' : 'video'}
          <input
            name="media"
            type="file"
            required
            accept={tab === 'photos' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'}
          />
          <small>Photos up to 20 MB · Videos up to 50 MB</small>
        </label>
        <label>
          Caption
          <textarea name="caption" maxLength={2200} />
        </label>
        <label className="vw-toggle">
          <span>I have permission to upload and publish this media.</span>
          <input type="checkbox" required />
        </label>
        <button className="vw-button" disabled={busy}>
          {busy ? 'Uploading…' : 'Upload to portfolio'}
        </button>
        <p role="status">{status}</p>
      </form>
      <div className="vw-package-grid">
        {posts
          .filter((p) =>
            tab === 'photos'
              ? ['SINGLE_IMAGE', 'ALBUM'].includes(p.format)
              : ['SHORT_VIDEO', 'REEL'].includes(p.format),
          )
          .map((p) => (
            <article className="vw-card" key={p.id}>
              <Icon name="portfolio" />
              <h2>{p.caption || 'Portfolio post'}</h2>
              <p>{p.publicationStatus}</p>
              {p.media[0]?.url && (
                <a href={p.media[0].url} target="_blank" rel="noreferrer">
                  {tab === 'photos' && <img className="vw-media-preview" src={p.media[0].url} alt={p.caption || 'Your portfolio photo'} />}
                  Preview media ↗
                </a>
              )}
              {p.publicationStatus === 'DRAFT' && (
                <button
                  className="vw-button"
                  onClick={async () => {
                    try {
                      await request(
                        '/vendors/businesses/' +
                          data.business.id +
                          '/portfolio/' +
                          p.id +
                          '/publish',
                        'POST',
                      );
                      await load();
                      setStatus('Post published.');
                    } catch (err) {
                      setStatus(String(err));
                    }
                  }}
                >
                  Publish
                </button>
              )}
            </article>
          ))}
      </div>
    </>
  );
}
