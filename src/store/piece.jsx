import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSite, naira, availability } from '../lib/site.jsx'
import { MEASURES } from '../supabase.js'
import { Header, Footer, Arrow, SBtn, NE, HeartIcon, useTop, useTitle } from './ui.jsx'
import { NotFound, Loading } from './pages.jsx'

const emptyM = { unit: 'cm', chest: '', shoulder: '', sleeve: '', waist: '', top: '', trouser: '', notes: '' }
const filled = m => MEASURES.filter(([k]) => Number(m?.[k]) > 0).length
export const waLink = (settings, text) => {
  const n = (settings.whatsapp || import.meta.env.VITE_BRAND_WHATSAPP || import.meta.env.NEXT_PUBLIC_BRAND_WHATSAPP || '').replace(/\D/g, '')
  return `https://wa.me/${n}${text ? '?text=' + encodeURIComponent(text) : ''}`
}

export function Piece() {
  useTop()
  const { slug } = useParams()
  const nav = useNavigate()
  const { state } = useLocation()
  const { products, collections, loaded, content, isFav, toggleFav, track } = useSite()
  const p = products.find(x => x.slug === slug)
  useTitle(p?.name)
  const [colour, setColour] = useState(null)
  const [size, setSize] = useState(null)        // 'XS'..'XL' | 'custom'
  const [m, setM] = useState(emptyM)
  const [open, setOpen] = useState(false)
  const [mErr, setMErr] = useState(false)
  const [tried, setTried] = useState(0)
  const [slide, setSlide] = useState(0)
  const [x0, setX0] = useState(null)

  useEffect(() => { if (p) track('product_view', { product: /^d\d$/.test(p.id) ? null : p.id }) }, [p?.id]) // eslint-disable-line
  useEffect(() => { if (p) { setColour(p.colours?.length === 1 ? p.colours[0].name : null); setSize(null); setSlide(0) } }, [p?.id]) // eslint-disable-line
  useEffect(() => { if (state?.choose) setTimeout(() => document.getElementById('choose')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400) }, [state])
  useEffect(() => {
    if (!open) return
    const esc = e => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', esc); return () => document.removeEventListener('keydown', esc)
  }, [open])

  if (!p) return loaded ? <NotFound /> : <Loading />
  const col = collections.find(c => c.slug === p.collection)
  const index = products.filter(x => x.collection === p.collection).findIndex(x => x.id === p.id) + 1
  const slides = p.images?.length ? p.images : ['/hero.png']
  const go = i => setSlide((i + slides.length) % slides.length)
  const a = availability(p)
  const needColour = (p.colours || []).length > 0
  const needSize = (p.sizes || []).length > 0 || p.custom_measure
  const missing = [needColour && !colour && 'colour', needSize && !size && 'size'].filter(Boolean)
  const liked = isFav(p.id)

  const start = () => {
    if (a === 'out') return
    if (missing.length) { setTried(t => t + 1); document.getElementById('choose')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    nav(`/piece/${p.slug}/confirm`, { state: { colour, size, measurements: size === 'custom' ? m : null } })
  }

  return (
    <main className="split piece page store">
      <Header split />
      <div className="gallery" onTouchStart={e => setX0(e.touches[0].clientX)}
           onTouchEnd={e => { if (x0 !== null) { const d = e.changedTouches[0].clientX - x0; if (Math.abs(d) > 40) go(slide + (d < 0 ? 1 : -1)); setX0(null) } }}>
        <div className="track" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {slides.map((src, i) => <div key={i} className="slide" style={{ backgroundImage: `url(${src})` }} role="img" aria-label={`${p.name}, image ${i + 1} of ${slides.length}`} />)}
        </div>
        {slides.length > 1 && <div className="dots">
          <div>{slides.map((_, i) => <button key={i} className={i === slide ? 'on' : ''} onClick={() => go(i)} aria-label={`Image ${i + 1}`} />)}</div>
          <span>{slide + 1}/{slides.length}</span>
        </div>}
      </div>

      <section className="panel spanel">
        <button className="back" onClick={() => (history.length > 2 ? nav(-1) : nav('/shop'))}><Arrow back /> Back</button>
        <div className="titlerow">
          <div>
            <small>{col?.name || p.collection}/ {String(index || 1).padStart(2, '0')}</small>
            <h1 className="thin">{p.name}</h1>
          </div>
          <button className={'heart' + (liked ? ' on' : '')} onClick={() => toggleFav(p.id)} aria-pressed={liked} aria-label="Save piece"><HeartIcon on={liked} /></button>
        </div>
        <b className="pprice">{naira(p.price)}</b>
        <p className="copy">{p.description}</p>

        <div id="choose" key={tried} className={tried && missing.length ? 'shake' : ''}>
          {needColour && <>
            <small className="lab ruled">Select colour</small>
            <div className="swatches" role="radiogroup" aria-label="Colour">
              {p.colours.map(c => (
                <button key={c.name} role="radio" aria-checked={colour === c.name} className={colour === c.name ? 'on' : ''} onClick={() => setColour(c.name)}>
                  <span style={{ background: c.hex }} />{c.name}
                </button>
              ))}
            </div>
            <hr />
          </>}
          {needSize && <>
            <div className="sizerow">
              <small className="lab">Select size</small>
              <div className="sizes">
                {(p.sizes || []).length > 0 && (
                  <div className="std">
                    <span className="sl">Standard size</span>
                    <div className="cells" role="radiogroup" aria-label="Standard size" style={{ gridTemplateColumns: `repeat(${p.sizes.length},1fr)` }}>
                      {p.sizes.map(s => <button key={s} role="radio" aria-checked={size === s} className={size === s ? 'on' : ''} onClick={() => setSize(s)}>{s}</button>)}
                    </div>
                  </div>
                )}
                {p.custom_measure && (
                  <button className={'mm' + (size === 'custom' ? ' active' : '')} onClick={() => { setOpen(true); setMErr(false) }}>
                    <span><b>My measurement</b><em>{filled(m) === 6 ? `Saved · ${m.unit}` : 'Add 6 details'}</em></span><Arrow />
                  </button>
                )}
              </div>
            </div>
            <hr />
          </>}
        </div>
        {tried > 0 && missing.length > 0 && <p className="err pick" role="alert">Choose a {missing.join(' and ')} to continue.</p>}

        <p className="lead-note">{a === 'made' ? `Made after order confirmation · ${p.lead_time || '4 weeks'}` : a === 'stock' ? `In stock · dispatches in ${p.lead_time || '1–2 working days'}` : 'Out of stock · ask the studio about the next weave'}</p>
        {a === 'out'
          ? <a className="sbtn" href={waLink(content.settings, `Hello Huoma, is ${p.name} coming back?`)} target="_blank" rel="noreferrer"><span>Ask about this piece</span><Arrow /></a>
          : <SBtn onClick={start}>{a === 'made' ? 'Start your order' : 'Add to bag'}</SBtn>}
        <a className="wa" href={waLink(content.settings, `Hello Huoma, I have a question about ${p.name}.`)} target="_blank" rel="noreferrer">Ask the brand on WhatsApp <NE /></a>
      </section>

      {open && (
        <div className="scrim" onMouseDown={e => e.target === e.currentTarget && setOpen(false)}>
          <form className="drawer" role="dialog" aria-modal="true" aria-label="My measurement"
                onSubmit={e => { e.preventDefault(); if (filled(m) < 6) { setMErr(true); return } setSize('custom'); setOpen(false) }}>
            <div className="dh"><h2 className="thin">My measurement</h2><button type="button" className="x" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
            <div className="unit" role="radiogroup" aria-label="Unit">
              {['cm', 'in'].map(u => <button type="button" key={u} role="radio" aria-checked={m.unit === u} className={m.unit === u ? 'on' : ''} onClick={() => setM({ ...m, unit: u })}>{u === 'cm' ? 'Centimetres' : 'Inches'}</button>)}
            </div>
            <div className="mgrid">
              {MEASURES.map(([k, l]) => (
                <label key={k} className="f">{l} ({m.unit})
                  <input inputMode="decimal" value={m[k]} onChange={e => setM({ ...m, [k]: e.target.value.replace(/[^\d.]/g, '') })} placeholder="0" />
                </label>
              ))}
            </div>
            <label className="f">Notes<input value={m.notes} onChange={e => setM({ ...m, notes: e.target.value })} placeholder="Anything we should know" /></label>
            {mErr && filled(m) < 6 && <p className="err" role="alert">Please fill in all 6 measurements.</p>}
            <button className="btn">Save measurements</button>
          </form>
        </div>
      )}
    </main>
  )
}

export function Confirm() {
  useTop()
  const { slug } = useParams()
  const { state } = useLocation()
  const nav = useNavigate()
  const { products, loaded, addToBag } = useSite()
  const p = products.find(x => x.slug === slug)
  useTitle('Confirm')
  if (!p) return loaded ? <NotFound /> : <Loading />
  if (!state) return <Navigate to={`/piece/${slug}`} replace />
  const a = availability(p)
  const rows = [
    ['Piece', p.name],
    state.size && ['Size', state.size === 'custom' ? 'My measurement' : state.size],
    state.colour && ['Colour', state.colour],
    ['Price', naira(p.price)],
    ['Lead time', p.lead_time || (a === 'made' ? '4 weeks' : '1–2 working days')],
  ].filter(Boolean)
  const confirm = () => {
    addToBag({ product_id: p.id, slug: p.slug, colour: state.colour, size: state.size, measurements: state.measurements })
    nav('/bag')
  }
  return (
    <div className="store page">
      <Header />
      <section className="confirm">
        <Link to={`/piece/${slug}`} className="back center"><Arrow back /> Back</Link>
        <h1 className="stitle">{a === 'made' ? 'Made in your measure.' : 'In stock'}</h1>
        <h2 className="stitle sm">Confirm</h2>
        <dl className="ctable">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        {state.size === 'custom' && state.measurements && (
          <p className="cmeas">{MEASURES.map(([k, l]) => `${l} ${state.measurements[k]}`).join(' · ')} ({state.measurements.unit}){state.measurements.notes ? ` · ${state.measurements.notes}` : ''}</p>
        )}
        <SBtn onClick={confirm}>Confirm order</SBtn>
      </section>
    </div>
  )
}
