import type { Metadata } from 'next';
const api = 'http://localhost:4000/api/v1';
type VendorProfile = {name:string;slug:string;description:string|null;verified:boolean;rating:number;reviewCount:number;yearsExperience:number|null;responseRate:number;languages:string[];services:Array<{id:string;name:string;price:string|null}>;serviceAreas:Array<{location:{id:string;name:string}}>};
async function vendor(city: string, category: string, slug: string):Promise<VendorProfile|null> {
  try {
    const r = await fetch(`${api}/discovery/${city}/${category}/${slug}`, { cache: 'no-store' });
    return r.ok ? await r.json() as VendorProfile : null;
  } catch {
    return null;
  }
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string; category: string; vendor: string }>;
}): Promise<Metadata> {
  const p = await params,
    v = await vendor(p.city, p.category, p.vendor);
  return {
    title: v ? `${v.name} | WedConnect` : 'Vendor | WedConnect',
    description: v?.description ?? 'Approved wedding professional profile',
    alternates: { canonical: `/${p.city}/${p.category}/${p.vendor}` },
  };
}
export default async function VendorPage({
  params,
}: {
  params: Promise<{ city: string; category: string; vendor: string }>;
}) {
  const p = await params,
    v = await vendor(p.city, p.category, p.vendor);
  if (!v)
    return (
      <main className="portfolio-page">
        <section className="empty-portfolio">
          <h1>Profile unavailable</h1>
          <p>This profile is not public or does not serve the selected city.</p>
        </section>
      </main>
    );
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: v.name,
    description: v.description,
    areaServed: v.serviceAreas.map(x => x.location.name),
    aggregateRating: v.reviewCount
      ? { '@type': 'AggregateRating', ratingValue: v.rating, reviewCount: v.reviewCount }
      : undefined,
  };
  return (
    <main className="public-profile">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }}
      />
      <header className="portfolio-header">
        <a className="brand" href="/">
          WedConnect
        </a>
        <a href={`/${p.city}/${p.category}`}>Back to results</a>
      </header>
      <section className="profile-hero">
        <p className="eyebrow">{v.verified ? 'Verified professional' : 'Approved professional'}</p>
        <h1>{v.name}</h1>
        <p>{v.description}</p>
        <div className="profile-stats">
          <span>
            ★ {v.rating.toFixed(1)} · {v.reviewCount} reviews
          </span>
          <span>{v.yearsExperience ?? 0}+ years</span>
          <span>{v.responseRate}% response rate</span>
        </div>
        <a className="primary-link" href={`/vendors/${v.slug}/portfolio`}>
          View portfolio
        </a>
      </section>
      <section className="profile-details">
        <article>
          <h2>Services</h2>
          {v.services.map(s => (
            <div className="service-row" key={s.id}>
              <span>{s.name}</span>
              <strong>
                {s.price ? `₹${Number(s.price).toLocaleString('en-IN')}` : 'Custom quote'}
              </strong>
            </div>
          ))}
        </article>
        <article>
          <h2>Service areas</h2>
          <div className="chip-grid">
            {v.serviceAreas.map(a => (
              <span className="area-chip" key={a.location.id}>
                <span>{a.location.name}</span>
              </span>
            ))}
          </div>
          <h2>Languages</h2>
          <p>{v.languages.join(', ') || 'Contact vendor for details'}</p>
        </article>
      </section>
    </main>
  );
}
