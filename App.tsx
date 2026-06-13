// Window Cleaning Pro — desktop web app, wired to the live API.
// Single-file on purpose at this stage: auth, shell, and six screens.
// The old mobile mockup screens live in /screens (unreferenced) as a
// design reference for the future native app.
import React, { useCallback, useEffect, useMemo, useState } from 'react';

// ----------------------------------------------------------------- api ----

const SESSION_KEY = 'wcp_session';

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function api(method: string, path: string, body?: unknown) {
  const token = localStorage.getItem(SESSION_KEY);
  const res = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `HTTP ${res.status}`);
  return data;
}

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;
const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

// -------------------------------------------------------------- helpers ---

function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const reload = useCallback(() => {
    fn().then(setData).catch((e) => setError(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload };
}

const Card: React.FC<{ title?: string; children: React.ReactNode; className?: string }> =
  ({ title, children, className = '' }) => (
  <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-5 ${className}`}>
    {title && <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">{title}</h3>}
    {children}
  </div>
);

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { kind?: 'primary' | 'ghost' }> =
  ({ kind = 'primary', className = '', ...props }) => {
  const styles = {
    primary: 'bg-gradient-to-r from-primary to-accent text-white hover:brightness-105 shadow-sm',
    ghost: 'border border-slate-300 text-navy hover:bg-slate-50',
  }[kind];
  return <button {...props} className={`px-4 py-2 rounded-full text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`} />;
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${props.className || ''}`} />
);

const Err: React.FC<{ msg: string }> = ({ msg }) =>
  msg ? <p className="text-sm text-red-600 mt-2">{msg}</p> : null;

// ----------------------------------------------------------------- auth ---

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ business: '', name: '', email: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (mode === 'signup') await api('POST', '/api/auth/signup', form);
      else await api('POST', '/api/auth/login', { email: form.email });
      setSent(true);
    } catch (err: any) { setError(err.message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary to-accent" />
          <h1 className="text-2xl font-extrabold text-navy">Window Cleaning Pro</h1>
        </div>
        <Card>
          {sent ? (
            <div className="text-center py-6">
              <p className="text-3xl mb-3">📬</p>
              <h2 className="font-bold text-navy mb-1">Check your email</h2>
              <p className="text-sm text-slate-500">If that account exists, a one-tap sign-in link is on its way. It expires in 15 minutes.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              {mode === 'signup' && (<>
                <Input placeholder="Business name (e.g. Chester Window Cleaner)" value={form.business}
                       onChange={(e) => setForm({ ...form, business: e.target.value })} required />
                <Input placeholder="Your name" value={form.name}
                       onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </>)}
              <Input type="email" placeholder="Email address" value={form.email}
                     onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              <Btn type="submit" disabled={busy} className="w-full">
                {busy ? 'Sending…' : mode === 'signup' ? 'Create my account' : 'Email me a sign-in link'}
              </Btn>
              <Err msg={error} />
              <p className="text-center text-sm text-slate-500 pt-1">
                {mode === 'login' ? (
                  <>New here? <button type="button" className="text-primary font-semibold" onClick={() => setMode('signup')}>Create an account</button></>
                ) : (
                  <>Already set up? <button type="button" className="text-primary font-semibold" onClick={() => setMode('login')}>Sign in</button></>
                )}
              </p>
            </form>
          )}
        </Card>
        <p className="text-center text-xs text-slate-400 mt-4">No passwords — we email you a sign-in link.</p>
      </div>
    </div>
  );
};

// ------------------------------------------------------------- dashboard --

const Dashboard: React.FC = () => {
  const { data, error } = useLoad(() => api('GET', '/api/dashboard'));
  if (error) return <Err msg={error} />;
  if (!data) return <p className="text-slate-400">Loading…</p>;
  const stats = [
    { label: "Today's jobs", value: `${data.today.done ?? 0} / ${data.today.total ?? 0} done` },
    { label: 'Unpaid invoices', value: `${data.unpaid.count} · ${money(data.unpaid.total_pence)}` },
    { label: 'Active customers', value: data.customers.count },
    { label: 'Revenue (30 days)', value: money(data.revenue_30d.total_pence) },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} title={s.label}>
          <p className="text-2xl font-extrabold text-navy">{s.value}</p>
        </Card>
      ))}
    </div>
  );
};

// ----------------------------------------------------------------- today --

const Today: React.FC = () => {
  const [date, setDate] = useState(today());
  const [msg, setMsg] = useState('');
  const jobs = useLoad(() => api('GET', `/api/jobs?date=${date}`), [date]);
  const texts = useLoad(() => api('GET', `/api/jobs/tonight-texts?date=${tomorrow()}`));

  const act = async (fn: () => Promise<any>, success: (r: any) => string) => {
    setMsg('');
    try { const r = await fn(); setMsg(success(r)); jobs.reload(); }
    catch (e: any) { setMsg(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
               className="border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        <Btn onClick={() => act(() => api('POST', '/api/jobs/generate', { date }),
                                (r) => `${r.created} job${r.created === 1 ? '' : 's'} added to ${r.date}`)}>
          Generate due jobs
        </Btn>
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>

      <Card title={`Jobs — ${date}`}>
        {!jobs.data ? <p className="text-slate-400">Loading…</p> :
         jobs.data.jobs.length === 0 ? (
          <p className="text-slate-400 text-sm">Nothing scheduled. "Generate due jobs" pulls in every property whose cycle is due.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 pr-3">Customer</th><th className="pr-3">Address</th>
              <th className="pr-3">Price</th><th className="pr-3">Status</th><th /></tr></thead>
            <tbody>
              {jobs.data.jobs.map((j: any) => (
                <tr key={j.id} className="border-b border-slate-50">
                  <td className="py-2.5 pr-3 font-semibold text-navy">{j.customer_name}</td>
                  <td className="pr-3 text-slate-600">{j.address}{j.access_notes ? <span className="block text-xs text-amber-600">{j.access_notes}</span> : null}</td>
                  <td className="pr-3">{money(j.price_pence)}</td>
                  <td className="pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      j.status === 'done' ? 'bg-emerald-50 text-emerald-700' :
                      j.status === 'skipped' ? 'bg-slate-100 text-slate-500' :
                      'bg-sky-50 text-sky-700'}`}>{j.status}</span>
                  </td>
                  <td className="text-right space-x-2 whitespace-nowrap">
                    {j.status === 'scheduled' && (<>
                      <Btn onClick={() => act(() => api('POST', `/api/jobs/${j.id}/complete`, {}),
                                              (r) => `Done — invoice ${r.invoice_number} raised`)}>Done</Btn>
                      <Btn kind="ghost" onClick={() => act(() => api('POST', `/api/jobs/${j.id}/skip`, {}),
                                                           () => 'Skipped')}>Skip</Btn>
                    </>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title={`Tonight's texts — customers due tomorrow (${tomorrow()})`}>
        {!texts.data ? <p className="text-slate-400">Loading…</p> :
         texts.data.texts.length === 0 ? <p className="text-slate-400 text-sm">No jobs scheduled for tomorrow yet.</p> : (
          <ul className="text-sm space-y-1.5">
            {texts.data.texts.map((t: any, i: number) => (
              <li key={i} className="flex gap-3">
                <span className="font-semibold text-navy">{t.name}</span>
                <a className="text-primary" href={`sms:${t.phone}`}>{t.phone}</a>
                <span className="text-slate-500">{t.address}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

// ------------------------------------------------------------- map + form -

// Small Leaflet map showing a single pin. Leaflet is loaded from CDN in
// index.html, so we reach it via window.L.
const MiniMap: React.FC<{ lat: number; lng: number; label?: string }> = ({ lat, lng, label }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<any>(null);
  const marker = React.useRef<any>(null);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !ref.current) return;
    if (!map.current) {
      map.current = L.map(ref.current, { attributionControl: true, zoomControl: true })
        .setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© OpenStreetMap',
      }).addTo(map.current);
      marker.current = L.marker([lat, lng]).addTo(map.current);
    } else {
      map.current.setView([lat, lng], 16);
      marker.current.setLatLng([lat, lng]);
    }
    if (label) marker.current.bindPopup(label);
    // Leaflet needs a nudge when rendered inside a freshly-shown container.
    setTimeout(() => map.current && map.current.invalidateSize(), 0);
  }, [lat, lng, label]);

  useEffect(() => () => { if (map.current) { map.current.remove(); map.current = null; } }, []);

  return <div ref={ref} className="h-48 w-full rounded-lg border border-slate-200 overflow-hidden z-0" />;
};

const PropertyForm: React.FC<{ customerId: number; rounds: any[]; onSaved: () => void }> =
  ({ customerId, rounds, onSaved }) => {
  const [f, setF] = useState({ address: '', postcode: '', price: '', frequency_weeks: '6', round_id: '' });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [lookupMsg, setLookupMsg] = useState('');
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState('');

  const findAddresses = async () => {
    setLooking(true); setLookupMsg(''); setAddresses([]);
    try {
      const r = await api('GET', `/api/address/lookup?postcode=${encodeURIComponent(f.postcode)}`);
      if (!r.valid) { setLookupMsg("That postcode doesn't look right."); setLooking(false); return; }
      if (r.lat != null) setCoords({ lat: r.lat, lng: r.lng });
      setAddresses(r.addresses || []);
      if (!r.addresses?.length) {
        setLookupMsg(r.lat != null
          ? 'Map pinned. (Add a getAddress.io key in Settings for the house-by-house list — type the address below for now.)'
          : 'Postcode not found.');
      }
    } catch (err: any) { setLookupMsg(err.message); }
    setLooking(false);
  };

  const pick = (idx: string) => {
    const a = addresses[Number(idx)];
    if (a) setF((s) => ({ ...s, address: a.formatted }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api('POST', '/api/properties', {
        customer_id: customerId,
        address: f.address, postcode: f.postcode,
        price_pence: Math.round(parseFloat(f.price || '0') * 100),
        frequency_weeks: parseInt(f.frequency_weeks, 10),
        round_id: f.round_id ? parseInt(f.round_id, 10) : null,
        latitude: coords?.lat ?? null, longitude: coords?.lng ?? null,
      });
      onSaved();
    } catch (err: any) { setError(err.message); }
  };

  return (
    <form onSubmit={submit} className="mt-3 bg-slate-50 rounded-lg p-3 space-y-2">
      <div className="flex gap-2">
        <Input placeholder="Postcode" value={f.postcode}
               onChange={(e) => setF({ ...f, postcode: e.target.value })} className="max-w-[10rem]" />
        <Btn type="button" kind="ghost" onClick={findAddresses} disabled={looking || !f.postcode}>
          {looking ? 'Finding…' : 'Find address'}
        </Btn>
        {lookupMsg && <span className="text-xs text-slate-500 self-center">{lookupMsg}</span>}
      </div>

      {addresses.length > 0 && (
        <select defaultValue="" onChange={(e) => pick(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2 py-2 text-sm">
          <option value="" disabled>Pick the address… ({addresses.length} found)</option>
          {addresses.map((a, i) => <option key={i} value={i}>{a.formatted}</option>)}
        </select>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-2">
        <Input placeholder="Address *" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} required className="xl:col-span-2" />
        <Input placeholder="Price £ *" type="number" step="0.01" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required />
        <select value={f.frequency_weeks} onChange={(e) => setF({ ...f, frequency_weeks: e.target.value })}
                className="border border-slate-300 rounded-lg px-2 py-2 text-sm">
          {[4, 5, 6, 7, 8].map((w) => <option key={w} value={w}>Every {w} weeks</option>)}
          <option value="0">Ad hoc only</option>
        </select>
        <select value={f.round_id} onChange={(e) => setF({ ...f, round_id: e.target.value })}
                className="border border-slate-300 rounded-lg px-2 py-2 text-sm">
          <option value="">No round</option>
          {rounds.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <Btn type="submit">Save</Btn>
      </div>

      {coords && <MiniMap lat={coords.lat} lng={coords.lng} label={f.address || f.postcode} />}
      <Err msg={error} />
    </form>
  );
};

// ------------------------------------------------------------- customers --

const Customers: React.FC = () => {
  const customers = useLoad(() => api('GET', '/api/customers'));
  const rounds = useLoad(() => api('GET', '/api/rounds'));
  const properties = useLoad(() => api('GET', '/api/properties'));
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [propFor, setPropFor] = useState<number | null>(null);

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try {
      await api('POST', '/api/customers', form);
      setForm({ name: '', email: '', phone: '', notes: '' });
      customers.reload();
    } catch (err: any) { setError(err.message); }
  };

  const propsByCustomer = useMemo(() => {
    const map: Record<number, any[]> = {};
    (properties.data?.properties || []).forEach((p: any) => {
      (map[p.customer_id] ||= []).push(p);
    });
    return map;
  }, [properties.data]);

  return (
    <div className="space-y-6">
      <Card title="Add a customer">
        <form onSubmit={addCustomer} className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <Input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input placeholder="Notes (gate code, dog…)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Btn type="submit">Add customer</Btn>
        </form>
        <Err msg={error} />
      </Card>

      <Card title={`Customers (${customers.data?.customers.length ?? '…'})`}>
        {!customers.data ? <p className="text-slate-400">Loading…</p> : (
          <div className="divide-y divide-slate-100">
            {customers.data.customers.map((c: any) => (
              <div key={c.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-navy">{c.name}</span>
                  {c.phone && <span className="text-sm text-slate-500">{c.phone}</span>}
                  {c.email && <span className="text-sm text-slate-500">{c.email}</span>}
                  {c.notes && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">{c.notes}</span>}
                  <Btn kind="ghost" className="ml-auto" onClick={() => setPropFor(propFor === c.id ? null : c.id)}>
                    + Property
                  </Btn>
                </div>
                {(propsByCustomer[c.id] || []).map((p: any) => (
                  <p key={p.id} className="text-sm text-slate-600 mt-1.5 ml-1">
                    🏠 {p.address}{p.postcode ? `, ${p.postcode}` : ''} — {money(p.price_pence)} every {p.frequency_weeks} weeks
                  </p>
                ))}
                {propFor === c.id && (
                  <PropertyForm customerId={c.id} rounds={rounds.data?.rounds || []}
                                onSaved={() => { setPropFor(null); properties.reload(); }} />
                )}
              </div>
            ))}
            {customers.data.customers.length === 0 &&
              <p className="text-slate-400 text-sm py-2">No customers yet — add your first above.</p>}
          </div>
        )}
      </Card>
    </div>
  );
};

// ---------------------------------------------------------------- rounds --

const Rounds: React.FC = () => {
  const rounds = useLoad(() => api('GET', '/api/rounds'));
  const properties = useLoad(() => api('GET', '/api/properties'));
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    try { await api('POST', '/api/rounds', { name }); setName(''); rounds.reload(); }
    catch (err: any) { setError(err.message); }
  };

  const countFor = (rid: number) =>
    (properties.data?.properties || []).filter((p: any) => p.round_id === rid).length;

  return (
    <div className="space-y-6">
      <Card title="Add a round (a named patch you work through — e.g. Hoole, CH4 Saltney)">
        <form onSubmit={add} className="flex gap-3 max-w-md">
          <Input placeholder="Round name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Btn type="submit">Add</Btn>
        </form>
        <Err msg={error} />
      </Card>
      <Card title="Rounds">
        {!rounds.data ? <p className="text-slate-400">Loading…</p> :
         rounds.data.rounds.length === 0 ? <p className="text-slate-400 text-sm">No rounds yet.</p> : (
          <ul className="text-sm space-y-2">
            {rounds.data.rounds.map((r: any) => (
              <li key={r.id} className="flex gap-3">
                <span className="font-semibold text-navy">{r.name}</span>
                <span className="text-slate-500">{countFor(r.id)} properties</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

// -------------------------------------------------------------- invoices --

const Invoices: React.FC = () => {
  const [status, setStatus] = useState('unpaid');
  const invoices = useLoad(() => api('GET', `/api/invoices${status ? `?status=${status}` : ''}`), [status]);
  const [msg, setMsg] = useState('');

  const act = async (fn: () => Promise<any>, success: (r: any) => string) => {
    setMsg('');
    try { const r = await fn(); setMsg(success(r)); invoices.reload(); }
    catch (e: any) { setMsg(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {['unpaid', 'paid', ''].map((s) => (
          <button key={s} onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${status === s ? 'bg-navy text-white' : 'bg-white border border-slate-300 text-slate-600'}`}>
            {s || 'all'}
          </button>
        ))}
        {msg && <span className="text-sm text-slate-500">{msg}</span>}
      </div>
      <Card>
        {!invoices.data ? <p className="text-slate-400">Loading…</p> :
         invoices.data.invoices.length === 0 ? <p className="text-slate-400 text-sm">Nothing here.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2 pr-3">Number</th><th className="pr-3">Customer</th>
              <th className="pr-3">Amount</th><th className="pr-3">Status</th><th /></tr></thead>
            <tbody>
              {invoices.data.invoices.map((i: any) => (
                <tr key={i.id} className="border-b border-slate-50">
                  <td className="py-2.5 pr-3 font-mono text-xs">{i.number}</td>
                  <td className="pr-3 font-semibold text-navy">{i.customer_name}</td>
                  <td className="pr-3">{money(i.amount_pence)}</td>
                  <td className="pr-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${i.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {i.status}{i.method ? ` · ${i.method.replace('_', ' ')}` : ''}
                    </span>
                  </td>
                  <td className="text-right space-x-2 whitespace-nowrap">
                    {i.status === 'unpaid' && (<>
                      <Btn kind="ghost" onClick={() => act(() => api('POST', `/api/invoices/${i.id}/mark-paid`, { method: 'transfer' }), () => 'Marked paid (transfer)')}>Paid · transfer</Btn>
                      <Btn kind="ghost" onClick={() => act(() => api('POST', `/api/invoices/${i.id}/mark-paid`, { method: 'sumup_reader' }), () => 'Marked paid (reader)')}>Paid · reader</Btn>
                      <Btn onClick={() => act(async () => {
                        const r = await api('POST', `/api/invoices/${i.id}/checkout`);
                        await navigator.clipboard.writeText(r.url);
                        return r;
                      }, () => 'Pay-online link copied to clipboard')}>Pay link</Btn>
                    </>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
};

// -------------------------------------------------------------- settings --

const Settings: React.FC<{ me: any; refreshMe: () => void }> = ({ me, refreshMe }) => {
  const [key, setKey] = useState('');
  const [msg, setMsg] = useState('');
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(''); setOk(false);
    try {
      const r = await api('POST', '/api/sumup/connect', { api_key: key });
      setMsg(`Connected — merchant ${r.merchant_code}`); setOk(true);
      setKey(''); refreshMe();
    } catch (err: any) { setMsg(err.message); }
    setBusy(false);
  };

  const sync = async () => {
    setBusy(true); setMsg(''); setOk(false);
    try {
      const r = await api('POST', '/api/sumup/sync');
      setMsg(r.paid.length ? `Marked paid: ${r.paid.join(', ')}` : 'No new SumUp payments found');
      setOk(true);
    } catch (err: any) { setMsg(err.message); }
    setBusy(false);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <Card title="Business">
        <p className="text-sm text-slate-600">{me.tenant.name} · {me.user.email} · {me.tenant.currency}</p>
      </Card>
      <Card title="SumUp">
        {me.tenant.sumup_connected ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-700 font-semibold">✓ SumUp connected</p>
            <p className="text-sm text-slate-500">Unpaid invoices get a "Pay link" button; tap-to-pay on your reader is recorded with "Paid · reader". Sync checks SumUp for completed online payments.</p>
            <Btn onClick={sync} disabled={busy}>{busy ? 'Syncing…' : 'Sync payments now'}</Btn>
          </div>
        ) : (
          <form onSubmit={connect} className="space-y-3">
            <p className="text-sm text-slate-500">Paste your SumUp <strong>secret API key</strong> (SumUp dashboard → Developers → API keys). It's validated before saving.</p>
            <Input placeholder="sk_live_…" value={key} onChange={(e) => setKey(e.target.value)} required />
            <Btn type="submit" disabled={busy}>{busy ? 'Checking…' : 'Connect SumUp'}</Btn>
          </form>
        )}
        {msg && <p className={`text-sm mt-2 ${ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg}</p>}
      </Card>
    </div>
  );
};

// ----------------------------------------------------------------- shell --

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'today', label: "Today's round", icon: '☀' },
  { key: 'customers', label: 'Customers', icon: '👤' },
  { key: 'rounds', label: 'Rounds', icon: '🗺' },
  { key: 'invoices', label: 'Invoices', icon: '£' },
  { key: 'settings', label: 'Settings', icon: '⚙' },
] as const;
type NavKey = typeof NAV[number]['key'];

const App: React.FC = () => {
  const [me, setMe] = useState<any>(null);
  const [checked, setChecked] = useState(false);
  const [screen, setScreen] = useState<NavKey>('dashboard');
  const [authError, setAuthError] = useState('');

  const refreshMe = useCallback(() => {
    api('GET', '/api/me').then(setMe).catch(() => setMe(null)).finally(() => setChecked(true));
  }, []);

  useEffect(() => {
    // Magic-link landing: /#/auth/<token>
    const m = window.location.hash.match(/^#\/auth\/(.+)$/);
    if (m) {
      api('POST', '/api/auth/verify', { token: m[1] })
        .then((r) => {
          localStorage.setItem(SESSION_KEY, r.session);
          window.location.hash = '';
          refreshMe();
        })
        .catch((e) => { setAuthError(e.message); setChecked(true); });
    } else if (localStorage.getItem(SESSION_KEY)) {
      refreshMe();
    } else {
      setChecked(true);
    }
  }, [refreshMe]);

  if (!checked) return <div className="min-h-screen bg-slate-50" />;
  if (!me) return (
    <>
      {authError && <p className="bg-amber-50 text-amber-800 text-sm text-center py-2">{authError}</p>}
      <Login />
    </>
  );

  const screenEl = {
    dashboard: <Dashboard />, today: <Today />, customers: <Customers />,
    rounds: <Rounds />, invoices: <Invoices />,
    settings: <Settings me={me} refreshMe={refreshMe} />,
  }[screen];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 shrink-0 bg-navy text-white flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2.5 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-accent" />
          <div>
            <p className="font-extrabold leading-tight">Window Cleaning Pro</p>
            <p className="text-xs text-white/50 leading-tight">{me.tenant.name}</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setScreen(n.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-3 transition ${
                      screen === n.key ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'}`}>
              <span className="w-5 text-center">{n.icon}</span>{n.label}
            </button>
          ))}
        </nav>
        <button onClick={() => { localStorage.removeItem(SESSION_KEY); setMe(null); }}
                className="px-5 py-4 text-left text-sm text-white/50 hover:text-white border-t border-white/10">
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <h2 className="text-xl font-extrabold text-navy mb-6">{NAV.find((n) => n.key === screen)?.label}</h2>
        {screenEl}
      </main>
    </div>
  );
};

export default App;
