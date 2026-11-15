import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, configured } from '../supabase.js'
import { useSite, naira } from '../lib/site.jsx'
import { Header, Footer, Mark, Arrow, SBtn, useTop, useTitle } from './ui.jsx'
import { Loading } from './pages.jsx'
import { CountryState, countryName } from './address.jsx'

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const STATUS = { pending: 'Awaiting payment', paid: 'Paid', in_production: 'On the loom', ready: 'Ready', shipped: 'On its way', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded', failed: 'Payment failed' }

/* Sign in: no password. We email a 6-digit code (Supabase Auth, sent through Resend). */
export function SignIn() {
  useTop(); useTitle('Sign in')
  const { user } = useSite()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')
  const [news, setNews] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const next = params.get('next') || '/account'
  if (user) return <Navigate to={next} replace />

  async function sendCode(e) {
    e?.preventDefault(); setMsg('')
    if (!EMAIL.test(email.trim())) return setMsg('Enter a valid email address')
    if (!configured) return setMsg('Preview mode: add your Supabase keys to sign in.')
    setBusy(true)
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
    setBusy(false)
    if (error) return setMsg(error.status === 429 ? 'Please wait a minute before asking for another code.' : 'We could not send a code. Please try again.')
    setStep('code')
  }
  async function verify(e) {
    e.preventDefault(); setMsg('')
    setBusy(true)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    if (error) { setBusy(false); return setMsg('That code is not right or has expired.') }
    if (news) await supabase.rpc('set_marketing', { p_on: true })
    nav(next, { replace: true })
  }

  return (
    <div className="store page signin">
      <section className="auth">
        <Link to="/" aria-label="Huoma Akwetelier home" className="auth-mark"><Mark width={110} /></Link>
        <h1>Sign in</h1>
        {step === 'email' ? <>
          <p className="muted">Sign in or create an account. No password needed.</p>
          <form onSubmit={sendCode} noValidate>
            <div className="auth-field">
              <input type="email" autoFocus autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" aria-label="Email" />
              <button disabled={busy} aria-label="Send code">{busy ? <span className="spin dark sm" /> : <Arrow size={20} />}</button>
            </div>
            <label className="check"><input type="checkbox" checked={news} onChange={e => setNews(e.target.checked)} /><i />Email me with news and offers</label>
          </form>
        </> : <>
          <p className="muted">Enter the 6-digit code we sent to <b>{email}</b>.</p>
          <form onSubmit={verify} noValidate>
            <div className="auth-field">
              <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" aria-label="Code" className="code" />
              <button disabled={busy || code.length < 6} aria-label="Sign in">{busy ? <span className="spin dark sm" /> : <Arrow size={20} />}</button>
            </div>
          </form>
          <p className="muted small"><button className="linkish" onClick={sendCode} disabled={busy}>Send a new code</button> · <button className="linkish" onClick={() => { setStep('email'); setCode('') }}>Use another email</button></p>
        </>}
        {msg && <p className="err" role="alert">{msg}</p>}
        <p className="auth-note">Orders you placed with this email appear in your account automatically.</p>
        <Link to="/policies/privacy" className="auth-privacy">Privacy policy</Link>
      </section>
    </div>
  )
}

export function Account() {
  useTop(); useTitle('Account')
  const { user } = useSite()
  const [ready, setReady] = useState(!configured)
  const [tab, setTab] = useState('orders')
  useEffect(() => { if (configured) supabase.auth.getSession().then(() => setReady(true)) }, [])
  if (!ready) return <Loading />
  if (!user) return <Navigate to="/sign-in?next=/account" replace />
  return (
    <div className="store page">
      <Header />
      <section className="acct">
        <nav className="acct-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'orders'} className={tab === 'orders' ? 'on' : ''} onClick={() => setTab('orders')}>Orders</button>
          <button role="tab" aria-selected={tab === 'profile'} className={tab === 'profile' ? 'on' : ''} onClick={() => setTab('profile')}>Profile</button>
        </nav>
        {tab === 'orders' ? <Orders /> : <Profile user={user} />}
      </section>
      <Footer />
    </div>
  )
}

function Orders() {
  const [rows, setRows] = useState(null)
  useEffect(() => {
    supabase.from('orders').select('*, order_items(*)').neq('status', 'failed').order('created_at', { ascending: false }).then(({ data }) => setRows(data || []))
  }, [])
  if (!rows) return <div className="verifying"><span className="spin dark" /></div>
  if (!rows.length) return (
    <div className="bempty">
      <h2 className="stitle sm">No orders yet.</h2>
      <p>When you place an order with this email, it will appear here.</p>
      <SBtn to="/shop">Explore pieces</SBtn>
    </div>
  )
  return (
    <ul className="olist">
      {rows.map(o => (
        <li key={o.id} className="ocard">
          <header><b>{o.code}</b><span className={'ostat ' + o.status}>{STATUS[o.status] || o.status}</span></header>
          <small>{new Date(o.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} · {o.delivery_name}</small>
          <ul>
            {o.order_items.map(i => (
              <li key={i.id}>
                <span className="oimg" style={{ backgroundImage: `url(${i.image || '/hero.png'})` }} />
                <span><b>{i.name}</b><em>{[i.size, i.colour, i.qty > 1 && `Qty ${i.qty}`].filter(Boolean).join(' · ')}</em></span>
                <span>{naira(i.unit_price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <footer><span>Total</span><b>{naira(o.total)}</b></footer>
          {o.tracking && <p className="otrack">Tracking: {o.tracking}</p>}
          {o.status === 'pending' && <Link className="linkish" to={`/order/${o.reference}`}>Check payment</Link>}
        </li>
      ))}
    </ul>
  )
}

const emptyA = { full_name: '', country: 'NG', state: '', city: '', street: '' }
function Profile({ user }) {
  const nav = useNavigate()
  const [p, setP] = useState({ full_name: '', whatsapp: '', marketing: false })
  const [edit, setEdit] = useState(false)
  const [addrs, setAddrs] = useState([])
  const [adding, setAdding] = useState(false)
  const [a, setA] = useState(emptyA)
  const [msg, setMsg] = useState('')
  const load = () => Promise.all([
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at'),
  ]).then(([pr, ad]) => { if (pr.data) setP(pr.data); setAddrs(ad.data || []) })
  useEffect(() => { load() }, []) // eslint-disable-line

  async function saveContact(e) {
    e.preventDefault()
    if (p.whatsapp && !/^\+[0-9]{7,15}$/.test(p.whatsapp.replace(/\s/g, ''))) return setMsg('WhatsApp should start with + and the country code, e.g. +2348012345678')
    const { error } = await supabase.from('profiles').upsert({ user_id: user.id, full_name: p.full_name, whatsapp: p.whatsapp.replace(/\s/g, '') || null })
    setMsg(error ? 'Could not save.' : ''); if (!error) setEdit(false)
  }
  async function addAddress(e) {
    e.preventDefault()
    if (a.full_name.trim().length < 2 || !a.state || a.street.trim().length < 3 || a.city.trim().length < 2) return setMsg('Fill in name, state, city and street.')
    const { error } = await supabase.from('addresses').insert({ ...a, country: countryName(a.country), user_id: user.id, is_default: !addrs.length })
    if (error) return setMsg('Could not save the address.')
    setMsg(''); setAdding(false); setA(emptyA); load()
  }
  const removeAddress = async id => { await supabase.from('addresses').delete().eq('id', id); load() }
  const makeDefault = async id => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
    await supabase.from('addresses').update({ is_default: true }).eq('id', id); load()
  }
  const toggleMarketing = async () => {
    const on = !p.marketing; setP({ ...p, marketing: on })
    const { error } = await supabase.rpc('set_marketing', { p_on: on }); if (error) setP({ ...p, marketing: !on })
  }
  const signOut = async scope => { await supabase.auth.signOut({ scope }); nav('/') }

  return (
    <div className="prof">
      <div className="prof-h"><h2>Contact</h2><button className="pbtn" onClick={() => setEdit(!edit)}>{edit ? 'Cancel' : 'Edit'}</button></div>
      {edit ? (
        <form className="pcardx form" onSubmit={saveContact}>
          <label className="f"><span>Full name</span><input value={p.full_name || ''} onChange={e => setP({ ...p, full_name: e.target.value })} placeholder="Your name" /></label>
          <label className="f"><span>WhatsApp</span><input value={p.whatsapp || ''} onChange={e => setP({ ...p, whatsapp: e.target.value })} placeholder="+2348012345678" inputMode="tel" /></label>
          <SBtn>Save</SBtn>
        </form>
      ) : (
        <div className="pcardx rows">
          <div><span>Email</span><b>{user.email}</b></div>
          {p.full_name && <div><span>Name</span><b>{p.full_name}</b></div>}
          {p.whatsapp && <div><span>WhatsApp</span><b>{p.whatsapp}</b></div>}
        </div>
      )}

      <div className="prof-h"><h2>Addresses</h2><button className="pbtn" onClick={() => setAdding(!adding)}>{adding ? 'Cancel' : 'Add'}</button></div>
      {adding && (
        <form className="pcardx form" onSubmit={addAddress}>
          <label className="f"><span>Full name</span><input value={a.full_name} onChange={e => setA({ ...a, full_name: e.target.value })} placeholder="Your name" /></label>
          <CountryState country={a.country} state={a.state} onCountry={v => setA(x => ({ ...x, country: v }))} onState={v => setA(x => ({ ...x, state: v }))} />
          {[['city', 'City', 'Delivery city'], ['street', 'Street address', 'Street']].map(([k, l, ph]) => (
            <label key={k} className="f"><span>{l}</span><input value={a[k]} onChange={e => setA({ ...a, [k]: e.target.value })} placeholder={ph} /></label>
          ))}
          <SBtn>Save address</SBtn>
        </form>
      )}
      {addrs.length ? addrs.map(x => (
        <div key={x.id} className="pcardx addr">
          <span className="pin" aria-hidden="true">⌖</span>
          <p><b>{x.full_name}</b>{x.is_default && <em> · Default</em>}<br />{[x.street, x.city, x.state, x.country].filter(Boolean).join(', ')}</p>
          <span className="addr-act">{!x.is_default && <button className="linkish" onClick={() => makeDefault(x.id)}>Make default</button>}<button className="linkish" onClick={() => removeAddress(x.id)}>Remove</button></span>
        </div>
      )) : !adding && <div className="pcardx addr"><span className="pin" aria-hidden="true">⌖</span><p className="muted">No addresses added</p></div>}

      <div className="prof-h"><h2>Marketing preferences</h2></div>
      <div className="pcardx rows">
        <div><span>Email</span><button role="switch" aria-checked={p.marketing} className={'switch' + (p.marketing ? ' on' : '')} onClick={toggleMarketing} aria-label="Email me with news and offers"><i /></button></div>
      </div>
      {msg && <p className="err" role="alert">{msg}</p>}
      <button className="sbtn ghost center" onClick={() => signOut('local')}>Sign out</button>
      <button className="linkish center-block" onClick={() => signOut('global')}>Sign out of all devices</button>
    </div>
  )
}
