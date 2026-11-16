import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { supabase, configured } from '../supabase.js'
import { useSite, availability } from '../lib/site.jsx'
import { SIZE_PRESETS } from '../lib/defaults.js'
import { Header, Footer, Lattice, SBtn, Sheet, Diamonds, NE, FilterIcon, Paras, useTop, useTitle, Arrow } from './ui.jsx'
import { CollectionCard, PieceCard, FeaturedCard } from './cards.jsx'

const usePageView = () => { const { track } = useSite(); useEffect(() => { track('page_view') }, [track]) }
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/* ---------------- Home ---------------- */
export function Home() {
  useTop(); useTitle(); usePageView()
  const { content, collections, products } = useSite()
  const h = content.home
  const featured = products.filter(p => p.featured).slice(0, 4)
  const steps = String(h.steps || '').split('\n').map(s => s.trim()).filter(Boolean)
  return (
    <div className="store page home">
      <section className="shero2" style={{ '--img': `url(${h.hero_image})` }}>
        <Header overlay />
        <div className="shero2-copy">
          <div className="shero2-text">
            {h.hero_eyebrow && <small className="shero2-eyebrow">{h.hero_eyebrow}</small>}
            <h1>{h.hero_title}</h1>
            <p>{h.hero_subtitle}</p>
          </div>
          <div className="shero2-cta">
            <SBtn to="/shop" className="hbtn">{h.hero_cta}</SBtn>
            {h.waitlist_cta && <SBtn to={h.waitlist_link || '/odogwu'} className="hbtn outline">{h.waitlist_cta}</SBtn>}
          </div>
        </div>
      </section>

      <section className="sect">
        <small className="eyebrow">{h.collections_eyebrow}</small>
        <h2 className="stitle">{h.collections_title}</h2>
        {/* Desktop/tablet: carousel of all cards. Phone (as in the mobile design): one card per collection, stacked */}
        <Rail label="Collections">{homeCards(h.cards, collections).map((c, i) => <CollectionCard key={i} c={c} />)}</Rail>
        <div className="cstack">{uniqueBy(homeCards(h.cards, collections), 'slug').map(c => <CollectionCard key={c.slug} c={c} />)}</div>
      </section>

      {featured.length > 0 && (
        <section className="sect">
          <small className="eyebrow">{h.featured_eyebrow}</small>
          <h2 className="stitle sc">{h.featured_title}</h2>
          <div className="fgrid" style={{ '--n': featured.length }}>{featured.map(p => <FeaturedCard key={p.id} p={p} collection={collections.find(c => c.slug === p.collection)} />)}</div>
          <SBtn to="/shop" className="wide center">View all pieces</SBtn>
        </section>
      )}

      {steps.length > 0 && (
        <section className="steps" aria-label="How we make">
          <div className="marq">
            <div className="marq-track">
              {[0, 1, 2].map(k => (
                <p key={k} aria-hidden={k > 0 || undefined}>
                  {steps.map((s, i) => <span key={s}><b>{String(i + 1).padStart(2, '0')}.</b> {s}<i aria-hidden="true">◇</i></span>)}
                </p>
              ))}
            </div>
          </div>
          <Lattice />
        </section>
      )}

      {h.house_title && (
        <section className="house">
          <div className="house-img" style={{ backgroundImage: `url(${h.house_image})` }} role="img" aria-label="Weaving Akwete on the loom" />
          <div className="house-copy">
            <small className="eyebrow left">{h.house_eyebrow}</small>
            <h2 className="stitle">{h.house_title}</h2>
            <Paras text={h.house_text} />
            <SBtn to="/story">{h.house_cta}</SBtn>
          </div>
        </section>
      )}

      {(h.faq || []).length > 0 && <Faq h={h} />}

      <Newsletter h={h} />
      <div className="spacer" />
      <Footer />
    </div>
  )
}

// Homepage carousel cards: each card shows one collection with its own photo and line.
// Cards pointing to a collection that no longer exists are skipped. No cards set → one card per collection.
const homeCards = (cards, collections) => {
  const list = (cards || []).map(k => {
    const c = collections.find(x => x.slug === k.collection)
    return c && { ...c, image_url: k.image || c.image_url, tagline: k.text || c.tagline }
  }).filter(Boolean)
  return list.length ? list : collections
}

// Horizontal carousel with triangle arrows; also swipe / trackpad / drag friendly
const Tri = ({ left }) => <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><path d={left ? 'M0 8L14 0v16z' : 'M14 8L0 0v16z'} fill="currentColor" /></svg>
export function Rail({ children, label }) {
  const ref = useRef(null)
  const [edge, setEdge] = useState({ l: true, r: true })
  const update = useCallback(() => {
    const el = ref.current; if (!el) return
    setEdge({ l: el.scrollLeft < 4, r: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 })
  }, [])
  useEffect(() => { update(); addEventListener('resize', update); return () => removeEventListener('resize', update) }, [update, children])
  const go = d => {
    const el = ref.current, card = el.firstElementChild
    const step = card ? card.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 0) : el.clientWidth
    el.scrollBy({ left: d * step * (innerWidth > 820 ? 2 : 1), behavior: 'smooth' })
  }
  return (
    <div className="rail" role="region" aria-label={label}>
      <button className="rail-btn l" onClick={() => go(-1)} disabled={edge.l} aria-label="Scroll left"><Tri left /></button>
      <div className="rail-track" ref={ref} onScroll={update}>{children}</div>
      <button className="rail-btn r" onClick={() => go(1)} disabled={edge.r} aria-label="Scroll right"><Tri /></button>
    </div>
  )
}

const uniqueBy = (list, key) => list.filter((x, i) => list.findIndex(y => y[key] === x[key]) === i)

function Faq({ h }) {
  const [open, setOpen] = useState(0)
  return (
    <section className="faq" aria-labelledby="faq-title">
      <div className="faq-head"><h2 id="faq-title">{h.faq_title}</h2></div>
      {h.faq_intro && <p className="faq-intro">{h.faq_intro}</p>}
      <div className="faq-list">
        {h.faq.map((f, i) => (
          <div key={i} className={'faq-item' + (open === i ? ' open' : '')}>
            <button className="faq-q" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
              <span>{f.q}</span><i aria-hidden="true" />
            </button>
            <div className="faq-a" id={`faq-${i}`} role="region"><div><p>{f.a}</p></div></div>
          </div>
        ))}
        <Link to="/contact" className="faq-more">Still have a question? Contact the studio <Arrow size={18} /></Link>
      </div>
    </section>
  )
}

function Newsletter({ h }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('')
  async function submit(e) {
    e.preventDefault()
    if (!EMAIL.test(email.trim())) return setState('bad')
    setState('busy')
    const { error } = configured ? await supabase.rpc('subscribe', { p_email: email.trim(), p_source: 'newsletter' }) : {}
    setState(error ? 'fail' : 'ok')
  }
  return (
    <section className="letters">
      <small className="letters-eyebrow"><i aria-hidden="true">⟟</i>{h.letters_eyebrow}<i aria-hidden="true">⟟</i></small>
      <h2>{h.letters_title}</h2>
      <p>{h.letters_text}</p>
      {state === 'ok' ? <p className="letters-ok" role="status">Thank you. You will hear from the loom soon.</p> : (
        <form onSubmit={submit} noValidate>
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setState('') }} placeholder="Your email address" aria-label="Your email address" autoComplete="email" />
          {state === 'bad' && <p className="err" role="alert">Enter a valid email address</p>}
          {state === 'fail' && <p className="err" role="alert">Something went wrong. Please try again.</p>}
          <SBtn className="wide center" disabled={state === 'busy'}>Subscribe</SBtn>
        </form>
      )}
    </section>
  )
}

/* ---------------- Shop ---------------- */
// Shop tabs follow the design (All pieces + the collections ticked "Show as a shop tab" in admin).
// If a customer arrives from a carousel card for another collection, that one is shown as an extra tab.
const shopTabs = (all, current) => {
  let tabs = all.filter(c => c.shop_tab)
  if (!tabs.length) tabs = all.slice(0, 3)
  const cur = all.find(c => c.slug === current)
  return cur && !tabs.includes(cur) ? [...tabs, cur] : tabs
}
const SORTS = [['featured', 'Featured'], ['new', 'Newest'], ['low', 'Price: low to high'], ['high', 'Price: high to low']]
const emptyF = { avail: '', size: '', colour: '', sort: 'featured' }

export function Shop() {
  useTop(); usePageView()
  const { collection } = useParams()
  const [params, setParams] = useSearchParams()
  const { content, collections, products, loaded } = useSite()
  const s = content.shop
  const [f, setF] = useState(emptyF)
  const [sheet, setSheet] = useState(false)
  const q = (params.get('q') || '').trim().toLowerCase()
  const current = collections.find(c => c.slug === collection)
  useTitle(current?.name || 'Shop')

  const base = products.filter(p => !collection || p.collection === collection)
  const colours = useMemo(() => {
    const m = new Map(); products.forEach(p => (p.colours || []).forEach(c => m.has(c.name) || m.set(c.name, c.hex))); return [...m]
  }, [products])
  const sizes = SIZE_PRESETS.filter(z => products.some(p => (p.sizes || []).includes(z)))
  const colName = slug => collections.find(c => c.slug === slug)?.name || ''
  let list = base.filter(p =>
    (!q || [p.name, p.tagline, colName(p.collection), ...(p.colours || []).map(c => c.name)].join(' ').toLowerCase().includes(q)) &&
    (!f.avail || availability(p) === f.avail) &&
    (!f.size || (p.sizes || []).includes(f.size) || p.custom_measure) &&
    (!f.colour || (p.colours || []).some(c => c.name === f.colour)))
  if (f.sort === 'low') list = [...list].sort((a, b) => a.price - b.price)
  if (f.sort === 'high') list = [...list].sort((a, b) => b.price - a.price)
  if (f.sort === 'new') list = [...list].sort((a, b) => String(b.created_at || b.id).localeCompare(String(a.created_at || a.id)))
  const active = [f.avail, f.size, f.colour].filter(Boolean).length + (f.sort !== 'featured' ? 1 : 0)

  return (
    <div className="store page">
      <Header />
      <section className="phead">
        <h1 className="stitle">{s.title}</h1>
        <p>{s.subtitle}</p>
      </section>
      <Lattice />
      <div className="shopbar">
        <span>{list.length} {list.length === 1 ? 'piece' : 'pieces'}{q && <> for “{params.get('q')}” <button className="linkish" onClick={() => setParams({})}>Clear</button></>}</span>
        <button className="linkish" onClick={() => setSheet(true)}>Filter &amp; sort{active > 0 && ` (${active})`} <FilterIcon /></button>
      </div>
      <nav className="tabs" aria-label="Collections">
        <Link to="/shop" className={!collection ? 'on' : ''}>All pieces</Link>
        {shopTabs(collections, collection).map(c => <Link key={c.slug} to={`/shop/${c.slug}`} className={collection === c.slug ? 'on' : ''}>{c.name}</Link>)}
      </nav>
      {list.length ? <div className="pgrid">{list.map(p => <PieceCard key={p.id} p={p} collection={collections.find(c => c.slug === p.collection)} />)}</div> : (
        <div className="empty-s">
          <h2 className="stitle sm">{loaded ? 'No pieces here yet.' : 'Loading pieces…'}</h2>
          {loaded && (active > 0 || q) && <button className="linkish" onClick={() => { setF(emptyF); setParams({}) }}>Clear all filters</button>}
        </div>
      )}
      <Footer />
      {sheet && <FilterSheet f={f} base={base} colours={colours} sizes={sizes} onApply={v => { setF(v); setSheet(false) }} onClose={() => setSheet(false)} />}
    </div>
  )
}

function FilterSheet({ f, base, colours, sizes, onApply, onClose }) {
  const [v, setV] = useState(f)
  const n = a => base.filter(p => availability(p) === a).length
  const toggle = (k, val) => setV(x => ({ ...x, [k]: x[k] === val ? '' : val }))
  return (
    <Sheet onClose={onClose} label="Filter and sort" className="filter">
      <h2 className="sheet-title">Filter &amp; sort</h2>
      <div className="fs">
        <small>Availability</small>
        {[['stock', 'In stock'], ['made', 'Made for you'], ['out', 'Out of stock']].map(([k, l]) => (
          <label key={k} className="radio"><input type="radio" name="avail" checked={v.avail === k} onChange={() => {}} onClick={() => toggle('avail', k)} /><i />{l}<span>{n(k)}</span></label>
        ))}
      </div>
      {sizes.length > 0 && (
        <div className="fs"><small>Size</small>
          <div className="fsizes">{sizes.map(z => <button key={z} className={v.size === z ? 'on' : ''} aria-pressed={v.size === z} onClick={() => toggle('size', z)}>{z}</button>)}</div>
        </div>
      )}
      {colours.length > 0 && (
        <div className="fs"><small>Colour</small>
          <div className="fcols">{colours.map(([name, hex]) => (
            <button key={name} className={v.colour === name ? 'on' : ''} aria-pressed={v.colour === name} onClick={() => toggle('colour', name)}><span style={{ background: hex }} />{name}</button>
          ))}</div>
        </div>
      )}
      <div className="fs"><small>Sort</small>
        <div className="fsizes sort">{SORTS.map(([k, l]) => <button key={k} className={v.sort === k ? 'on' : ''} aria-pressed={v.sort === k} onClick={() => setV(x => ({ ...x, sort: k }))}>{l}</button>)}</div>
      </div>
      <div className="sheet-actions">
        <button className="sbtn center" onClick={() => onApply(v)}>Apply filters</button>
        <button className="sbtn ghost center" onClick={() => onApply(emptyF)}>Clear all filters</button>
      </div>
    </Sheet>
  )
}

/* ---------------- Our Story ---------------- */
export function Story() {
  useTop(); useTitle('Our story'); usePageView()
  const s = useSite().content.story
  return (
    <div className="store page">
      <section className="stoh" style={{ '--img': `url(${s.hero_image})` }}>
        <Header overlay />
        <h1>{s.hero_title}</h1>
      </section>
      <section className="stog">
        <div className="stog-a"><h2>{s.s1_label}</h2></div>
        <div className="stog-b"><h3>{s.s1_title}</h3><Paras text={s.s1_text} /></div>
        <div className="stog-c" style={{ backgroundImage: `url(${s.s2_image})` }} role="img" aria-label={s.s2_title} />
        <div className="stog-d">
          <small className="eyebrow left">{s.s2_eyebrow}</small>
          <h3>{s.s2_title}</h3>
          <Paras text={s.s2_text} />
          <SBtn to="/shop">{s.s2_cta}</SBtn>
        </div>
      </section>
      <Footer />
    </div>
  )
}

/* ---------------- Contact ---------------- */
export function Contact() {
  useTop(); useTitle('Contact'); usePageView()
  const { content } = useSite()
  const c = content.contact, st = content.settings
  const wa = (st.whatsapp || import.meta.env.VITE_BRAND_WHATSAPP || import.meta.env.NEXT_PUBLIC_BRAND_WHATSAPP || '').replace(/\D/g, '')
  const [f, setF] = useState({ name: '', email: '', piece: '', message: '' })
  const [seen, setSeen] = useState(false)
  const [state, setState] = useState('')
  const errs = { name: f.name.trim().length < 2 && 'Enter your full name', email: !EMAIL.test(f.email.trim()) && 'Enter a valid email address', message: f.message.trim().length < 2 && 'Share a few details' }
  const bind = k => ({ value: f[k], onChange: e => setF({ ...f, [k]: e.target.value }) })
  async function send(e) {
    e.preventDefault(); setSeen(true)
    if (Object.values(errs).some(Boolean)) return
    setState('busy')
    const { error } = configured ? await supabase.rpc('send_inquiry', { p_name: f.name, p_email: f.email, p_piece: f.piece, p_message: f.message }) : await new Promise(r => setTimeout(() => r({}), 600))
    setState(error ? 'fail' : 'ok')
  }
  const fmtWa = wa ? '+' + wa.replace(/^(\d{3})(\d{3})(\d{3})(\d+)$/, '$1 $2 $3 $4') : '+234 000 0000'
  return (
    <div className="store page">
      <Header />
      <section className="contact">
        <h1 className="stitle">{c.title}</h1>
        <p className="contact-sub">{c.subtitle}</p>
        <div className="clinks">
          <a href={wa ? `https://wa.me/${wa}` : '#'} target="_blank" rel="noreferrer"><b>WhatsApp</b><span>{fmtWa} <NE /></span></a>
          <a href={`mailto:${st.email}`}><b>Email</b><span>{st.email} <NE /></span></a>
          <a href={`https://instagram.com/${String(st.instagram).replace(/^@/, '')}`} target="_blank" rel="noreferrer"><b>Instagram</b><span>@{String(st.instagram).replace(/^@/, '')} <NE /></span></a>
        </div>
        <h2 className="stitle">{c.inquiry_title}</h2>
        {state === 'ok' ? (
          <div className="received" role="status">
            <Diamonds /><h3>{c.success_title}</h3><p>{c.success_text}</p>
            <SBtn to="/">Return home</SBtn>
          </div>
        ) : (
          <form className="sform" onSubmit={send} noValidate>
            <label className="f"><span>Full name</span><input {...bind('name')} placeholder="Your name" autoComplete="name" className={seen && errs.name ? 'bad' : ''} />{seen && errs.name && <p className="err">{errs.name}</p>}</label>
            <label className="f"><span>Email address</span><input {...bind('email')} type="email" placeholder="yourname@example.com" autoComplete="email" className={seen && errs.email ? 'bad' : ''} />{seen && errs.email && <p className="err">{errs.email}</p>}</label>
            <label className="f"><span>Piece or occasion</span><input {...bind('piece')} placeholder="What are you looking for?" /></label>
            <label className="f"><span>Message</span><textarea {...bind('message')} rows={3} placeholder="Share a few details" className={seen && errs.message ? 'bad' : ''} />{seen && errs.message && <p className="err">{errs.message}</p>}</label>
            {state === 'fail' && <p className="err" role="alert">Something went wrong. Please try again, or message us on WhatsApp.</p>}
            <SBtn disabled={state === 'busy'}>{state === 'busy' ? 'Sending…' : 'Send inquiry'}</SBtn>
          </form>
        )}
      </section>
      <Footer />
    </div>
  )
}

/* ---------------- Policies ---------------- */
const POLICY_TITLES = { refund: 'Refund Policy', shipping: 'Shipping Policy', privacy: 'Privacy', terms: 'Terms of Service', copyright: 'Copyright' }
export function Policy() {
  useTop()
  const { slug } = useParams()
  const text = useSite().content.policies[slug]
  useTitle(POLICY_TITLES[slug] || 'Not found')
  if (!POLICY_TITLES[slug]) return <NotFound />
  return (
    <div className="store page">
      <Header />
      <article className="policy">
        <h1 className="stitle">{POLICY_TITLES[slug]}</h1>
        <Paras text={text} />
        <SBtn to="/">Return to Homepage</SBtn>
      </article>
      <Footer />
    </div>
  )
}

export function NotFound() {
  useTitle('Not found')
  return (
    <div className="store page">
      <Header />
      <section className="empty-s tall">
        <h1 className="stitle">This thread ends here.</h1>
        <p>The page you were looking for has moved or never existed.</p>
        <SBtn to="/shop">Explore pieces</SBtn>
      </section>
      <Footer />
    </div>
  )
}

export function Loading() { return <div className="store loading-screen" aria-busy="true"><span className="spin dark" /></div> }
export { Arrow }
