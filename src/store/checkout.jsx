import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { supabase, configured } from '../supabase.js'
import { useSite, naira } from '../lib/site.jsx'
import CountryPicker, { COUNTRIES, DEFAULT_COUNTRY } from '../CountryPicker.jsx'
import { Header, Footer, Lattice, Arrow, SBtn, Diamonds, useTop, useTitle } from './ui.jsx'
import { waLink } from './piece.jsx'
import { CountryState, countryName, countryIso } from './address.jsx'

// Delivery options follow the address: Nigeria shows the Nigerian options ("Lagos" ones only for Lagos),
// any other country shows the international ones.
const LAGOS = /lagos/i
export const deliveryFor = (all, iso, state) => all.filter(d => iso === 'NG' ? !d.international && (!LAGOS.test(d.name) || LAGOS.test(state || '')) : d.international)

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const PENDING = 'huoma.pending'

// Paystack's popup script is loaded only when someone reaches checkout
let paystackLoad
const loadPaystack = () => paystackLoad ||= new Promise((ok, fail) => {
  if (window.PaystackPop) return ok(window.PaystackPop)
  const s = document.createElement('script'); s.src = 'https://js.paystack.co/v2/inline.js'
  s.onload = () => ok(window.PaystackPop); s.onerror = () => { paystackLoad = null; fail(new Error('Paystack did not load')) }
  document.head.appendChild(s)
})

export function Checkout() {
  useTop(); useTitle('Checkout')
  const nav = useNavigate()
  const { bag, subtotal, delivery, user, track, content } = useSite()
  const [f, setF] = useState({ email: '', phone: '', name: '', country: 'NG', state: '', city: '', street: '' })
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [method, setMethod] = useState('')
  const [channel, setChannel] = useState('card')
  const [marketing, setMarketing] = useState(false)
  const [seen, setSeen] = useState({})
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState('')
  const started = useRef(false)

  useEffect(() => { if (!started.current && bag.length) { started.current = true; track('begin_checkout') } }, [bag.length, track])
  const options = deliveryFor(delivery, f.country, f.state)
  // Pick the right delivery option when the address changes (Lagos address → Within Lagos, abroad → International)
  useEffect(() => {
    const best = options.find(d => LAGOS.test(d.name)) || options[0]
    setMethod(best?.id || '')
  }, [f.country, f.state, delivery.length]) // eslint-disable-line
  // Signed-in customers: fill in what we already know
  useEffect(() => {
    if (!user || !configured) return
    setF(x => ({ ...x, email: x.email || user.email }))
    Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).limit(1),
    ]).then(([pr, ad]) => {
      const p = pr.data, a = ad.data?.[0]
      if (p?.whatsapp) {
        const c = [...COUNTRIES].sort((x, y) => y.dial.length - x.dial.length).find(c => p.whatsapp.startsWith(c.dial))
        if (c) { setCountry(c); setF(x => ({ ...x, phone: x.phone || p.whatsapp.slice(c.dial.length) })) }
      }
      if (p?.marketing) setMarketing(true)
      if (a) setF(x => ({ ...x, name: x.name || a.full_name, country: countryIso(a.country) || x.country, state: x.state || a.state || '', city: x.city || a.city || '', street: x.street || a.street }))
      else if (p?.full_name) setF(x => ({ ...x, name: x.name || p.full_name }))
    })
  }, [user])

  if (!bag.length) return <Navigate to="/bag" replace />
  const m = options.find(d => d.id === method)
  const fee = m?.fee || 0
  const total = subtotal + fee
  const rules = {
    email: v => !EMAIL.test(v.trim()) && 'Enter a valid email address',
    phone: v => { const d = v.replace(/\D/g, '').replace(/^0/, ''); return (d.length < 6 || d.length > 14) && 'Enter a valid WhatsApp number' },
    name: v => v.trim().length < 2 && 'Enter your full name',
    country: v => !v && 'Select your country',
    state: v => v.trim().length < 2 && (f.country === 'NG' ? 'Select your state' : 'Enter your state or region'),
    city: v => v.trim().length < 2 && 'Enter your city',
    street: v => v.trim().length < 3 && 'Enter your street address',
  }
  const err = k => seen[k] && rules[k](f[k])
  const bind = k => ({ value: f[k], onChange: e => setF({ ...f, [k]: e.target.value }), onBlur: () => setSeen(s => ({ ...s, [k]: true })), className: err(k) ? 'bad' : '', 'aria-invalid': !!err(k) })

  async function pay(e) {
    e.preventDefault()
    setSeen(Object.fromEntries(Object.keys(rules).map(k => [k, 1])))
    const bad = Object.keys(rules).find(k => rules[k](f[k]))
    if (bad) { document.querySelector(`[name=${bad}]`)?.focus(); return }
    if (!m) return setFail(options.length ? 'Choose a delivery method.' : 'We don’t deliver to this country online yet. Please message us on WhatsApp.')
    setBusy(true); setFail('')
    if (!configured) { setBusy(false); return setFail('Preview mode: add your Supabase keys and deploy the Edge Functions to take real payments.') }
    const body = {
      items: bag.map(l => ({ product_id: l.product_id, qty: l.qty, colour: l.colour, size: l.size, measurements: l.measurements })),
      contact: { email: f.email.trim(), whatsapp: country.dial + f.phone.replace(/\D/g, '').replace(/^0/, '') },
      address: { full_name: f.name.trim(), country: countryName(f.country), state: f.state, city: f.city, street: f.street },
      delivery_method: m.id, channel, marketing,
    }
    const { data, error } = await supabase.functions.invoke('create-order', { body })
    let msg = data?.error
    if (error) { try { msg = (await error.context.json()).error } catch { msg = 'We could not start your payment. Please try again.' } }
    if (msg || !data?.access_code) { setBusy(false); return setFail(msg || 'We could not start your payment. Please try again.') }
    localStorage.setItem(PENDING, data.reference)
    try {
      const Pop = await loadPaystack()
      new Pop().resumeTransaction(data.access_code, {
        onSuccess: () => nav(`/order/${data.reference}`),
        onCancel: () => { setBusy(false); setFail('Payment was not completed. You can try again.') },
        onError: () => { window.location.href = data.authorization_url },
      })
    } catch {
      window.location.href = data.authorization_url // fall back to Paystack's hosted page
    }
  }

  return (
    <div className="store page">
      <Header />
      <section className="co">
        <Link to="/bag" className="back center"><Arrow back /> Back to bag</Link>
        <h1 className="stitle sm">Order summary</h1>
        <dl className="osum">
          <div><dt>Subtotal</dt><dd>{naira(subtotal)}</dd></div>
          <div><dt>Delivery Fee</dt><dd>{naira(fee)}</dd></div>
          <div><dt>Total</dt><dd>{naira(total)}</dd></div>
        </dl>
      </section>
      <Lattice />
      <form className="co co-form" onSubmit={pay} noValidate>
        <small className="eyebrow">Secure checkout</small>
        <h2 className="stitle">Complete your order</h2>

        <h3 className="step"><small>01.</small> Contact</h3>
        <label className="f"><span>Email address</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" {...bind('email')} />{err('email') && <p className="err" role="alert">{err('email')}</p>}</label>
        <label className="check"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} /><i />Email me with news and offers</label>
        <div className="f phonef"><span id="wl">WhatsApp number</span>
          <div className={'phone' + (err('phone') ? ' bad' : '')}>
            <CountryPicker value={country} onChange={setCountry} />
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="Your WhatsApp number" aria-labelledby="wl" {...bind('phone')} className="" />
          </div>
          {err('phone') && <p className="err" role="alert">{err('phone')}</p>}
        </div>

        <h3 className="step"><small>02.</small> Delivery address</h3>
        <label className="f"><span>Full name</span><input name="name" autoComplete="name" placeholder="Your name" {...bind('name')} />{err('name') && <p className="err" role="alert">{err('name')}</p>}</label>
        <CountryState country={f.country} state={f.state}
          onCountry={v => { setF(x => ({ ...x, country: v })); const c = COUNTRIES.find(c => c.iso === v); if (c && !f.phone) setCountry(c) }}
          onState={v => setF(x => ({ ...x, state: v }))}
          errCountry={err('country')} errState={err('state')}
          onBlurCountry={() => setSeen(s => ({ ...s, country: true }))} onBlurState={() => setSeen(s => ({ ...s, state: true }))} />
        <label className="f"><span>City</span><input name="city" autoComplete="address-level2" placeholder="Delivery city" {...bind('city')} />{err('city') && <p className="err" role="alert">{err('city')}</p>}</label>
        <label className="f"><span>Street address</span><input name="street" autoComplete="street-address" placeholder="Street" {...bind('street')} />{err('street') && <p className="err" role="alert">{err('street')}</p>}</label>

        <h3 className="step"><small>03.</small> Delivery method</h3>
        <div className="dmethods" role="radiogroup" aria-label="Delivery method">
          {!options.length && <p className="paynote">We don’t deliver to this country online yet. <a href={waLink(content.settings, 'Hello Huoma, can you deliver to ' + countryName(f.country) + '?')} target="_blank" rel="noreferrer">Message us on WhatsApp</a> and we’ll arrange it.</p>}
          {options.map(d => (
            <label key={d.id} className={'dm' + (method === d.id ? ' on' : '')}>
              <input type="radio" name="delivery" checked={method === d.id} onChange={() => setMethod(d.id)} /><i />
              <span><b>{d.name}</b><em>{d.description}</em></span>
              <strong>{naira(d.fee)}</strong>
            </label>
          ))}
        </div>

        <h3 className="step"><small>04.</small> Payment</h3>
        <div className="paytabs" role="radiogroup" aria-label="Payment method">
          {[['card', 'Card'], ['bank_transfer', 'Bank Transfer']].map(([k, l]) => (
            <button type="button" key={k} role="radio" aria-checked={channel === k} className={channel === k ? 'on' : ''} onClick={() => setChannel(k)}>{l}</button>
          ))}
        </div>
        <p className="paynote">
          {channel === 'card'
            ? 'You will enter your card details in Paystack’s secure window. Your card number never touches our site.'
            : 'Paystack will show you a one-time account number. Transfer the exact amount and your order confirms automatically.'}
        </p>
        {fail && <p className="err" role="alert">{fail}</p>}
        <SBtn disabled={busy}>{busy ? 'Opening Paystack…' : `Pay ${naira(total)}`}</SBtn>
        <p className="fine">By paying, you agree to our <Link to="/policies/terms">Terms</Link>, <Link to="/policies/refund">Refund Policy</Link> and <Link to="/policies/privacy">Privacy</Link>. Payments are processed by Paystack.</p>
      </form>
    </div>
  )
}

export function Order() {
  useTop(); useTitle('Order')
  const { reference } = useParams()
  const { content, clearBag, track } = useSite()
  const c = content.confirmed
  const [o, setO] = useState(null)
  const [state, setState] = useState('checking')
  const tries = useRef(0)

  useEffect(() => {
    let stop = false
    async function check() {
      if (!configured) { setO({ code: 'HA-00482', status: 'paid' }); return setState('paid') }
      const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference } })
      if (stop) return
      if (error || !data) return setState('missing')
      setO(data)
      if (!['pending', 'unpaid', 'failed'].includes(data.status)) {
        setState('paid')
        if (localStorage.getItem(PENDING) === reference) { localStorage.removeItem(PENDING); clearBag(); track('purchase') }
      } else if (tries.current++ < 6) { setState('checking'); setTimeout(check, 4000) } // bank transfers can take a moment
      else setState('unpaid')
    }
    check(); return () => { stop = true }
  }, [reference]) // eslint-disable-line

  return (
    <div className="store page">
      <Header />
      <section className="done2">
        {state === 'checking' && <div className="verifying" role="status"><span className="spin dark" /><p>Confirming your payment with Paystack…</p></div>}
        {state === 'missing' && <><h1 className="stitle">Order not found</h1><p>Check the link in your email, or message the studio.</p><SBtn to="/shop">Explore pieces</SBtn></>}
        {state === 'unpaid' && <>
          <h1 className="stitle">Payment not completed</h1>
          <p className="done2-text">We have not received payment for order {o?.code}. If money left your account, message the studio and we will sort it out quickly.</p>
          <SBtn to="/checkout">Return to checkout</SBtn>
          <a className="wa center" href={waLink(content.settings, `Hello Huoma, my payment for order ${o?.code} did not complete.`)} target="_blank" rel="noreferrer">Ask the brand on WhatsApp</a>
        </>}
        {state === 'paid' && <>
          <Diamonds />
          <small className="oc">Order confirmed · {o?.code}</small>
          <h1 className="done2-title">{c.title}</h1>
          <p className="done2-text">{c.text}</p>
          <div className="next">
            <h2>{c.next_title}</h2>
            <ol>
              {[1, 2, 3].map(i => <li key={i}><b>{c[`step${i}_title`]}</b><p>{c[`step${i}_text`]}</p></li>)}
            </ol>
          </div>
          <SBtn to="/shop">Explore pieces</SBtn>
        </>}
      </section>
      <Footer />
    </div>
  )
}
