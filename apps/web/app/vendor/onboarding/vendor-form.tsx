'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, catalog, ensureSession, request, type Choice } from '../../lib/onboarding-api';
import AccountNav from '../../components/account-nav';
type Business = {
  id: string;
  name: string;
  slug: string;
  professionalType: string;
  description: string | null;
  baseCityId: string | null;
  outstationAvailable: boolean;
  status: string;
  completionPercent: number;
  categories: { categoryId: string; isPrimary: boolean }[];
  serviceAreas: { locationId: string }[];
  services: { id: string; name: string; price: string | null }[];
  packages: { id: string; name: string; price: string }[];
  terms: { version: string }[];
};
const declaration =
  'I confirm that I am authorised to represent this business, that the submitted information is accurate, and that I have permission to publish any supplied content. I understand that my profile requires review before publication and that customers and vendors contract directly with each other.';
const version = 'vendor-onboarding-v1';
export default function VendorForm() {
  const idRef = useRef('');
  const [business, setBusiness] = useState<Business | null>(null);
  const [states, setStates] = useState<{ state: Choice; cities: Choice[] }[]>([]),
    [categories, setCategories] = useState<Choice[]>([]);
  const [name, setName] = useState(''),
    [slug, setSlug] = useState(''),
    [professionalType, setType] = useState('');
  const [description, setDescription] = useState(''),
    [cityId, setCity] = useState(''),
    [categoryId, setCategory] = useState('');
  const [stateId, setState] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [areas, setAreas] = useState<string[]>([]),
    [outstation, setOutstation] = useState(false);
  const availableCities = states.find((entry) => entry.state.id === stateId)?.cities ?? [];
  const selectedCities = states.flatMap((entry) => entry.cities).filter((city) => areas.includes(city.id));
  const filteredCities = availableCities.filter((city) => `${city.name} ${city.district ?? ''}`.toLowerCase().includes(citySearch.trim().toLowerCase()));
  const [serviceName, setServiceName] = useState(''),
    [price, setPrice] = useState(''),
    [pricing, setPricing] = useState('STARTING_FROM');
  const [packageName, setPackageName] = useState(''),
    [packagePrice, setPackagePrice] = useState('');
  const [accepted, setAccepted] = useState(false),
    [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(''),
    [failed, setFailed] = useState(false),
    [login, setLogin] = useState(false);
  const editable =
    !business || ['DRAFT', 'CHANGES_REQUESTED', 'REJECTED'].includes(business.status);
  function hydrate(b: Business) {
    idRef.current = b.id;
    setBusiness(b);
    setName(b.name);
    setSlug(b.slug);
    setType(b.professionalType);
    setDescription(b.description ?? '');
    setCity(b.baseCityId ?? '');
    setOutstation(b.outstationAvailable);
    setCategory(b.categories.find((c) => c.isPrimary)?.categoryId ?? '');
    setAreas(b.serviceAreas.map((a) => a.locationId));
    setAccepted(b.terms.some((t) => t.version === version));
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await ensureSession();
        const options = await catalog();
        let existing: Business | null = null;
        let businessId: string | null = null;
        try {
          businessId = (await request<{ business: { id: string } }>('/dashboard/vendor')).business
            .id;
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 404) throw error;
        }
        if (businessId)
          existing = await request<Business>(`/vendors/businesses/${businessId}/onboarding`);
        if (active) {
          setStates(options.states);
          if (existing?.baseCityId) setState(options.states.find((entry) => entry.cities.some((city) => city.id === existing.baseCityId))?.state.id ?? '');
          setCategories(options.categories);
          if (existing) hydrate(existing);
          setReady(true);
        }
      } catch (error) {
        if (active) {
          setFailed(true);
          setMessage(error instanceof Error ? error.message : 'Unable to load.');
          setLogin(error instanceof ApiError && error.status === 401);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  async function act(action: 'save' | 'service' | 'package' | 'submit', event: FormEvent) {
    event.preventDefault();
    if (busy || !editable) return;
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      await ensureSession();
      if (!name.trim() || !professionalType)
        throw new Error('Enter your business name and professional type.');
      if (!categoryId && business?.categories.some((c) => c.isPrimary))
        throw new Error('Choose a primary category.');
      if (
        action === 'service' &&
        (!categoryId ||
          serviceName.trim().length < 2 ||
          (pricing !== 'CUSTOM_QUOTE' && (price === '' || Number(price) < 0)))
      )
        throw new Error('Choose a category and enter a service name and valid price.');
      if (action === 'submit' && !accepted)
        throw new Error('Accept the declaration before submitting.');
      if (!areas.length && business?.serviceAreas.length)
        throw new Error('Select at least one service city.');
      const payload = {
        name: name.trim(),
        professionalType,
        description: description.trim() || null,
        baseCityId: cityId || null,
        outstationAvailable: outstation,
      };
      if (!idRef.current) {
        const created = await request<{ id: string }>('/vendors/businesses', 'POST', {
          ...payload,
          slug: slug.trim(),
        });
        idRef.current = created.id;
      } else await request(`/vendors/businesses/${idRef.current}`, 'PATCH', payload);
      const base = `/vendors/businesses/${idRef.current}`;
      if (categoryId)
        await request(`${base}/categories`, 'PUT', {
          primaryCategoryId: categoryId,
          secondaryCategoryIds:
            business?.categories
              .filter((c) => !c.isPrimary && c.categoryId !== categoryId)
              .map((c) => c.categoryId) ?? [],
        });
      if (areas.length) await request(`${base}/service-areas`, 'PUT', { locationIds: areas });
      if (action === 'service') {
        await request(`${base}/services`, 'POST', {
          categoryId,
          name: serviceName.trim(),
          pricingType: pricing,
          price: pricing === 'CUSTOM_QUOTE' ? null : Number(price),
        });
        setServiceName('');
        setPrice('');
      }
      if (action === 'package') {
        await request(`${base}/packages`, 'POST', {
          name: packageName.trim(),
          price: Number(packagePrice),
        });
        setPackageName('');
        setPackagePrice('');
      }
      if (action === 'submit') {
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(declaration));
        await request(`${base}/terms`, 'POST', {
          version,
          termsHash: Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join(
            '',
          ),
        });
        await request(`${base}/submit`, 'POST');
      }
      hydrate(await request<Business>(`${base}/onboarding`));
      setMessage(
        action === 'submit'
          ? 'Submitted for review. Your profile becomes public after approval.'
          : 'Saved successfully. Return any time to continue your profile.',
      );
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="real-onboarding vendor-onboarding">
      <header>
        <a className="market-logo" href="/">
          <span>Wed</span>Connect
        </a>
        <AccountNav />
        <a className="onboarding-back" href="/vendor/dashboard">← Dashboard</a>
      </header>
      <div className="onboarding-intro">
        <p className="onboarding-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
        <h1>Bring your business to WedConnect.</h1>
        <p>Tell couples what makes your work special. Build your profile, add your services and get ready to be discovered.</p>
      </div>
      {ready && <nav className="onboarding-sections" aria-label="Onboarding sections">
        <a href="#business-details"><span>01</span> Business details</a>
        <a href="#business-services"><span>02</span> Services</a>
        <a href="#business-packages"><span>03</span> Packages</a>
        <a href="#business-review"><span>04</span> Review</a>
      </nav>}
      {message && (
        <p className={failed ? 'form-error' : 'form-success'} role={failed ? 'alert' : 'status'}>
          {message}
        </p>
      )}
      {login && <a href="/sign-in?role=VENDOR_OWNER">Sign in as a vendor</a>}
      {!ready ? (
        <section className="onboarding-loading" role="status" aria-live="polite" aria-busy={!message}>
          <div className="onboarding-loading-inner">
            <div className="onboarding-loading-mark" aria-hidden="true">◇</div>
            <h2>{message ? 'We could not load your profile' : 'Preparing your workspace'}</h2>
            <p>{message ? 'Reload this page to try again.' : 'Checking your account and loading your saved business details…'}</p>
            {!message && <div className="onboarding-loading-bar" aria-hidden="true" />}
          </div>
        </section>
      ) : (
        <>
          <p>
            {business
              ? `${business.status.replaceAll('_', ' ')} · ${business.completionPercent}% complete`
              : 'New profile · Nothing saved yet'}
          </p>
          {!editable && (
            <p>
              Your profile is {business?.status.toLowerCase().replaceAll('_', ' ')}. Editing is
              currently unavailable.
            </p>
          )}
          <form id="business-details" onSubmit={(e) => void act('save', e)}>
            <fieldset disabled={busy || !editable}>
              <legend>Business details</legend>
              <div className="field-grid">
                <label>
                  Business name
                  <input
                    required
                    minLength={2}
                    maxLength={160}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  Profile URL name
                  <input
                    required
                    disabled={Boolean(idRef.current)}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    minLength={2}
                    maxLength={180}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="your-business-name"
                  />
                </label>
                <label>
                  Professional type
                  <select
                    required
                    value={professionalType}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="">Choose type</option>
                    {[
                      'FREELANCER',
                      'SOLE_PROPRIETOR',
                      'STUDIO',
                      'AGENCY',
                      'REGISTERED_COMPANY',
                      'VENUE_PROPERTY',
                      'PERFORMER',
                      'BOUTIQUE_RENTAL',
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t.toLowerCase().replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  State
                  <select value={stateId} onChange={(e) => { setState(e.target.value); setCity(''); setCitySearch(''); }}>
                    <option value="">Choose state</option>
                    {states.map((entry) => <option key={entry.state.id} value={entry.state.id}>{entry.state.name}</option>)}
                  </select>
                </label>
                <label>
                  Base city
                  <select disabled={!stateId} value={cityId} onChange={(e) => setCity(e.target.value)}>
                    <option value="">{stateId ? 'Choose city' : 'Select a state first'}</option>
                    {(states.find((entry) => entry.state.id === stateId)?.cities ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.district ? ` · ${c.district}` : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Primary category
                  <select value={categoryId} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Choose category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                About your business
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={outstation}
                  onChange={(e) => setOutstation(e.target.checked)}
                />
                Available for outstation events
              </label>
              <section className="service-city-picker" aria-label="Service cities">
              <div className="city-picker-heading"><div><h2>Where do you work?</h2><p>Select the cities you serve. Search by city or district.</p></div><span className="city-count" aria-live="polite">{areas.length} / 100 selected</span></div>
              <label className="city-search">Search service cities
                <input type="search" value={citySearch} disabled={!stateId} onChange={(e) => setCitySearch(e.target.value)} placeholder="Try Chennai, Pollachi or a district…" />
              </label>
              {selectedCities.length > 0 && <div className="selected-city-chips" aria-label="Selected cities">{selectedCities.map((city) => <button type="button" key={city.id} onClick={() => setAreas(areas.filter((id) => id !== city.id))} aria-label={`Remove ${city.name}${city.district ? `, ${city.district}` : ''}`}>{city.name}{city.district ? ` · ${city.district}` : ''} <span aria-hidden="true">×</span></button>)}</div>}
              <div className="choice-list city-results">
                {filteredCities.map((c) => (
                  <label key={c.id}>
                    <input
                      type="checkbox"
                      checked={areas.includes(c.id)}
                      disabled={!areas.includes(c.id) && areas.length >= 100}
                      onChange={(e) =>
                        setAreas(
                          e.target.checked ? [...areas, c.id] : areas.filter((id) => id !== c.id),
                        )
                      }
                    />
                    <span>{c.name}{c.district && <small>{c.district}</small>}</span>
                  </label>
                ))}
              </div>
              {!filteredCities.length && <p className="city-empty">{!stateId ? 'Choose a state above to explore its cities.' : 'No cities match your search. Try another name.'}</p>}
              <p className="city-picker-hint">You can switch states to add more cities. Your selections stay saved in this form until you press Save business details.</p>
              </section>
              <button>Save business details</button>
            </fieldset>
          </form>
          <form id="business-services" onSubmit={(e) => void act('service', e)}>
            <fieldset disabled={busy || !editable || !business}>
              <legend>Services</legend>
              <ul>
                {business?.services.map((s) => (
                  <li key={s.id}>
                    {s.name} —{' '}
                    {s.price === null
                      ? 'Custom quote'
                      : `₹${Number(s.price).toLocaleString('en-IN')}`}
                  </li>
                ))}
              </ul>
              {!business && <p>Save your business details first.</p>}
              <div className="field-grid">
                <label>
                  Service name
                  <input
                    required
                    minLength={2}
                    maxLength={140}
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                  />
                </label>
                <label>
                  Pricing
                  <select value={pricing} onChange={(e) => setPricing(e.target.value)}>
                    <option value="STARTING_FROM">Starting from</option>
                    <option value="FIXED">Fixed price</option>
                    <option value="CUSTOM_QUOTE">Custom quote</option>
                  </select>
                </label>
                {pricing !== 'CUSTOM_QUOTE' && (
                  <label>
                    Price (₹)
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </label>
                )}
              </div>
              <button>Add service</button>
            </fieldset>
          </form>
          <form id="business-packages" onSubmit={(e) => void act('package', e)}>
            <fieldset disabled={busy || !editable || !business}>
              <legend>Packages (optional)</legend>
              <ul>
                {business?.packages.map((p) => (
                  <li key={p.id}>
                    {p.name} — ₹{Number(p.price).toLocaleString('en-IN')}
                  </li>
                ))}
              </ul>
              <div className="field-grid">
                <label>
                  Package name
                  <input
                    required
                    minLength={2}
                    maxLength={140}
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                  />
                </label>
                <label>
                  Price (₹)
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={packagePrice}
                    onChange={(e) => setPackagePrice(e.target.value)}
                  />
                </label>
              </div>
              <button>Add package</button>
            </fieldset>
          </form>
          <form id="business-review" onSubmit={(e) => void act('submit', e)}>
            <fieldset disabled={busy || !editable || !business}>
              <legend>Review and submit</legend>
              <p>
                A description, base city, primary category, service area and at least one service
                are required.
              </p>
              <label className="check-label">
                <input
                  required
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                {declaration}
              </label>
              <button>Submit for review</button>
            </fieldset>
          </form>
        </>
      )}
    </div>
  );
}
