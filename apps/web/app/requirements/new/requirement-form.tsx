'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, catalog, ensureSession, request, type Choice } from '../../lib/onboarding-api';
import AccountNav from '../../components/account-nav';
export default function RequirementForm() {
  const [cities, setCities] = useState<Choice[]>([]),
    [categories, setCategories] = useState<Choice[]>([]);
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [login, setLogin] = useState(false);
  const [message, setMessage] = useState(''),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await ensureSession();
        const data = await catalog();
        if (active) {
          setCities(data.cities);
          setCategories(data.categories);
          setReady(true);
        }
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : 'Unable to load.');
          setLogin(error instanceof ApiError && error.status === 401);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || saved) return;
    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? '').trim();
    const number = (key: string) => (text(key) === '' ? null : Number(text(key)));
    const min = number('budgetMin'),
      max = number('budgetMax');
    if (min !== null && max !== null && min > max) {
      setMessage('Maximum budget must be at least the minimum budget.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      await ensureSession();
      await request('/requirements', 'POST', {
        eventType: text('eventType'),
        cityId: text('cityId'),
        categoryId: text('categoryId'),
        eventDate: text('eventDate'),
        guestCount: number('guestCount'),
        budgetMin: min,
        budgetMax: max,
        description: text('description'),
        preferredContact: text('preferredContact'),
      });
      setSaved(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit your requirement.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="real-onboarding">
      <header>
        <a className="market-logo" href="/">
          <span>Wed</span>Connect
        </a>
        <AccountNav />
        <a href="/dashboard">Customer dashboard</a>
      </header>
      <h1>Plan your celebration</h1>
      <p>
        Create your first requirement. Matching professionals receive a preview; contact details are
        shared only with your consent.
      </p>
      {message && (
        <p role="alert" className="form-error">
          {message}
        </p>
      )}
      {login && <a href="/sign-in">Sign in to continue</a>}
      {saved ? (
        <section className="form-success" role="status">
          <h2>Your requirement is saved</h2>
          <p>
            It is available in your dashboard. Matching depends on approved vendors serving your
            selected city and category.
          </p>
          <a href="/dashboard">View my dashboard</a>
        </section>
      ) : !ready ? (
        <p>
          {message
            ? 'Reload this page to try again.'
            : 'Loading your account and available services…'}
        </p>
      ) : (
        <form onSubmit={(e) => void submit(e)}>
          <fieldset disabled={busy}>
            <legend>Wedding requirement</legend>
            <div className="field-grid">
              <label>
                Event type
                <select name="eventType" required defaultValue="">
                  <option value="">Choose event</option>
                  {['Wedding', 'Reception', 'Engagement', 'Other celebration'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Service category
                <select name="categoryId" required defaultValue="">
                  <option value="">Choose category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Event city
                <select name="cityId" required defaultValue="">
                  <option value="">Choose city</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Event date
                <input
                  name="eventDate"
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                />
              </label>
              <label>
                Guest count (optional)
                <input name="guestCount" type="number" min="1" max="100000" step="1" />
              </label>
              <label>
                Minimum budget (₹, optional)
                <input name="budgetMin" type="number" min="0" step="0.01" />
              </label>
              <label>
                Maximum budget (₹, optional)
                <input name="budgetMax" type="number" min="0" step="0.01" />
              </label>
              <label>
                Preferred contact
                <select name="preferredContact" defaultValue="IN_APP">
                  <option value="IN_APP">In-app first</option>
                  <option value="PHONE">Phone after consent</option>
                  <option value="WHATSAPP">WhatsApp after consent</option>
                  <option value="EMAIL">Email after consent</option>
                </select>
              </label>
            </div>
            <label>
              What do you need?
              <textarea
                name="description"
                rows={5}
                minLength={30}
                maxLength={4000}
                required
                placeholder="Describe your needs in at least 30 characters. Leave out phone numbers and exact addresses."
              />
            </label>
            <p>This submits a real requirement. Contact details are not shared by this form.</p>
            <button>{busy ? 'Submitting…' : 'Submit requirement'}</button>
          </fieldset>
        </form>
      )}
    </main>
  );
}
