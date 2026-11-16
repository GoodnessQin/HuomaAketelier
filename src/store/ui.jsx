import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSite } from '../lib/site.jsx'

export const useTop = () => { const { pathname } = useLocation(); useEffect(() => { window.scrollTo(0, 0) }, [pathname]) }
export const useTitle = t => useEffect(() => { document.title = t ? `${t} | Huoma Akwetelier` : 'Huoma Akwetelier | Timeless threads of luxury heritage' }, [t])

export const Arrow = ({ back, size = 26 }) => (
  <svg className={'arrow' + (back ? ' back' : '')} width={size} height={size * 14 / 26} viewBox="0 0 26 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M0 7h24M18 1l6 6-6 6" />
  </svg>
)
export const NE = () => <svg className="nea" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true"><path d="M2 8L8 2M3 2h5v5" /></svg>

// The Huoma mark, drawn from the brand SVG so it takes any colour (currentColor)
export const Mark = ({ className = '', width = 46 }) => (
  <svg className={'mark ' + className} width={width} viewBox="0 0 244 290" fill="none" aria-hidden="true">
    <path stroke="currentColor" strokeWidth="5" d="M122.601 61.0962H180.548L195.083 27.3668L146.703 45.7081M122.131 21.7268L146.703 45.7081L180.548 61.0962M122.601 61.0962H62.7057L48.1706 27.3668L95.2541 45.7081M122.131 21.7268L95.2541 45.7081L62.7057 61.0962M87.215 192.254V279.604L98.5029 285.59H53.1604M170.578 184.623L153.915 195.568L122.601 219.127L87.215 192.254M87.215 192.254L54.7775 224.761M87.215 192.254L100.425 178.32M87.215 168.325L87.3716 93.7197L98.5029 82.4397H52.4951M190.879 82.4397H144.27L154.541 93.7197L153.915 166.376L122.601 125.68L87.215 168.325L69.6687 184.623L18.9492 231.734M18.9492 117.732L52.4951 142.594L87.215 168.325M153.915 195.568L154.541 279.604L144.27 285.59H189.222M224.529 258.595L189.222 224.761L153.915 195.568M18.9492 117.732V93.7197L6.4873 82.4397H52.4951M18.9492 117.732L17.8532 117.011M18.9492 117.732V148.461M122.131 21.7268L112.798 13.4327L122.601 3.59033L131.898 13.4327L122.131 21.7268ZM122.601 61.0962L100.425 49.8162M122.601 61.0962L142.949 49.8162M225.379 117.732L225.782 93.7197L237.487 82.4397H190.879M224.529 231.734V228.289V195.568V168.325L225.065 148.461L225.379 117.732M225.379 117.732L190.879 142.369M18.9492 148.461V168.325V195.568V231.734M18.9492 148.461L69.6687 184.623M18.9492 231.734V258.595M144.27 178.32L122.601 195.568L100.425 178.32M144.27 178.32L122.601 152L100.425 178.32M144.27 178.32L168.781 159.63L190.879 142.369M18.9492 258.595V279.604L6.4873 285.59H52.4951H53.1604M18.9492 258.595L54.7775 224.761M225.065 148.461L170.578 184.623M170.578 184.623L224.529 231.734M224.529 231.734V258.595M224.529 258.595V279.604L237.487 285.59H189.222M52.4951 82.4397V142.594M54.7775 224.761L53.1604 285.59M190.879 82.4397V142.369M189.222 224.761V285.59" />
    <path fill="currentColor" d="M196.284 188.825L222.592 207.501V170.15L196.284 188.825Z" />
    <path fill="currentColor" d="M47.0889 188.825L20.7815 207.501L20.7815 170.15L47.0889 188.825Z" />
    <rect fill="currentColor" x="61.9834" y="66.6255" width="117.002" height="4.20235" />
  </svg>
)

const I = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, 'aria-hidden': true }
export const SearchIcon = () => <svg {...I}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
export const HeartIcon = ({ on, size = 18 }) => <svg {...I} width={size} height={size} fill={on ? 'currentColor' : 'none'}><path d="M12 20.5S2.5 14.6 2.5 8.2A4.9 4.9 0 0 1 12 5.9a4.9 4.9 0 0 1 9.5 2.3c0 6.4-9.5 12.3-9.5 12.3Z" /></svg>
export const UserIcon = () => <svg {...I}><circle cx="12" cy="8.5" r="4" /><path d="M4 21c1.4-4 4.4-6 8-6s6.6 2 8 6" /></svg>
export const TrashIcon = () => <svg {...I} width="20" height="20"><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" /></svg>
export const FilterIcon = () => <svg {...I} width="14" height="14"><path d="M3 4h18l-7 8.5V20l-4-2v-5.5L3 4Z" /></svg>

export const Lattice = ({ className = '' }) => <div className={'lattice ' + className} aria-hidden="true" />
export const Diamonds = () => <div className="sdiamonds" aria-hidden="true"><i /><i className="fill" /><i /></div>

export function SBtn({ to, children, className = '', back, ...rest }) {
  const inner = <>{back && <Arrow back />}<span>{children}</span>{!back && <Arrow />}</>
  return to
    ? <Link to={to} className={'sbtn ' + className} {...rest}>{inner}</Link>
    : <button className={'sbtn ' + className} {...rest}>{inner}</button>
}

export function Header({ overlay = false, split = false, onSearch }) {
  const { count, favs, collections } = useSite()
  const menuCollections = collections.filter(c => c.shop_tab).length ? collections.filter(c => c.shop_tab) : collections.slice(0, 3)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(false)
  const loc = useLocation()
  const [stuck, setStuck] = useState(false)
  useEffect(() => { setOpen(false); setSearch(false); setStuck(false) }, [loc.pathname, loc.search])
  // Header stays with you: see-through over the hero, then a translucent cream bar once you scroll.
  // (On the desktop piece page the photo column has its own layout, so it stays as it is.)
  useEffect(() => {
    const on = () => setStuck(scrollY > 40 && !(split && innerWidth > 820))
    on(); addEventListener('scroll', on, { passive: true }); addEventListener('resize', on)
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on) }
  }, [split])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])
  const openSearch = () => (onSearch ? onSearch() : setSearch(true))
  return (
    <>
      <header className={'hdr' + (overlay ? ' over' : '') + (split ? ' onsplit' : '') + (open ? ' open' : '') + (stuck && !open ? ' stuck' : '')}>
        <Link to="/" className="hdr-logo" aria-label="Huoma Akwetelier home"><Mark width={46} /></Link>
        <nav className="hdr-nav" aria-label="Main">
          <NavLink to="/shop" end>Shop</NavLink>
          <NavLink to="/shop/bespoke">Bespoke</NavLink>
          <NavLink to="/story">Our story</NavLink>
          <NavLink to="/contact">Contact</NavLink>
        </nav>
        <div className="hdr-icons">
          <button onClick={openSearch} aria-label="Search"><SearchIcon /></button>
          <Link to="/favourites" aria-label={`Favourites (${favs.length})`} className="hdr-fav"><HeartIcon />{favs.length > 0 && <sup>{favs.length}</sup>}</Link>
          <Link to="/account" aria-label="Account" className="hdr-acc"><UserIcon /></Link>
          <Link to="/bag" className="hdr-bag">Bag{count > 0 && <span>&nbsp;({count})</span>}</Link>
          <button className="hdr-burger" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}><i /><i /><i /></button>
        </div>
      </header>
      {open && createPortal(
        <div className="mmenu" role="dialog" aria-modal="true" aria-label="Menu" onClick={e => e.target === e.currentTarget && setOpen(false)}>
          <div className="mmenu-panel">
            <div className="mmenu-top">
              <button className="mmenu-x" onClick={() => setOpen(false)} aria-label="Close menu"><i /><i /></button>
              <Link to="/" className="mmenu-logo" aria-label="Huoma Akwetelier home"><Mark width={34} /></Link>
              <div className="mmenu-icons">
                <button onClick={() => { setOpen(false); openSearch() }} aria-label="Search"><SearchIcon /></button>
                <Link to="/bag" className="hdr-bag">Bag{count > 0 && <span>&nbsp;({count})</span>}</Link>
              </div>
            </div>
            <nav className="mmenu-main">
              <NavLink to="/shop" end>Shop all</NavLink>
              {menuCollections.map(c => <NavLink key={c.slug} to={`/shop/${c.slug}`}>{c.name}</NavLink>)}
              <NavLink to="/story">Our story</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </nav>
            <nav className="mmenu-sub">
              <Link to="/account"><UserIcon /> Account</Link>
              <Link to="/favourites"><HeartIcon /> Favourites{favs.length > 0 && ` (${favs.length})`}</Link>
            </nav>
          </div>
        </div>, document.body
      )}
      {search && <SearchSheet onClose={() => setSearch(false)} />}
    </>
  )
}

export function Footer() {
  return (
    <footer className="ftr">
      <div className="ftr-top"><Link to="/shop">Shop</Link><Link to="/contact">Contact</Link><Link to="/story">Our Story</Link></div>
      <Link to="/" className="ftr-brand" aria-label="Huoma Akwetelier home">
        <Mark width={86} /><b>Huoma</b><strong>Akwetelier</strong>
      </Link>
      <p className="ftr-tag">Handwoven in southeastern Nigeria. Formed for the world.</p>
      <div className="ftr-legal">
        <Link to="/policies/copyright">Copyright</Link><Link to="/policies/refund">Refund Policy</Link>
        <Link to="/policies/shipping">Shipping Policy</Link><Link to="/policies/privacy">Privacy</Link><Link to="/policies/terms">Terms of Service</Link>
      </div>
      <p className="ftr-copy">© {new Date().getFullYear()} Huoma Akwetelier</p>
    </footer>
  )
}

// Sheet: drops below the page title on desktop, slides up from the bottom on phones (as in the design's handle bar)
export function Sheet({ onClose, children, label, className = '' }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', esc); document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = '' }
  }, [onClose])
  return createPortal(
    <div className="sscrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={'sheet ' + className} role="dialog" aria-modal="true" aria-label={label}>
        <button className="sheet-handle" onClick={onClose} aria-label="Close" />
        {children}
      </div>
    </div>,
    document.body
  )
}

export function SearchSheet({ onClose }) {
  const { products, content, collections, track } = useSite()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const ql = q.trim().toLowerCase()
  const colName = s => collections.find(c => c.slug === s)?.name || s
  const hits = ql ? products.filter(p => [p.name, p.tagline, colName(p.collection), ...(p.colours || []).map(c => c.name)].join(' ').toLowerCase().includes(ql)).slice(0, 6) : []
  const go = term => { track('search'); onClose(); nav('/shop?q=' + encodeURIComponent(term)) }
  const popular = String(content.shop.popular || '').split('\n').map(s => s.trim()).filter(Boolean)
  return (
    <Sheet onClose={onClose} label="Search" className="search">
      <form className="sq" onSubmit={e => { e.preventDefault(); if (ql) go(q.trim()) }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Type a piece or colour" aria-label="Search pieces" />
        <button aria-label="Search"><SearchIcon /></button>
        <button type="button" className="sq-close" onClick={onClose}>Close</button>
      </form>
      {ql ? (
        <>
          <small className="sq-lab">{hits.length ? 'Pieces' : 'No pieces found'}</small>
          <ul className="sq-list">
            {hits.map(p => (
              <li key={p.id}><Link to={`/piece/${p.slug}`} onClick={onClose} className="sq-hit">
                <img src={p.images?.[0] || '/hero.png'} alt="" /><span>{p.name}<em>{colName(p.collection)}</em></span>
              </Link></li>
            ))}
            {hits.length > 0 && <li><button className="sq-all" onClick={() => go(q.trim())}>See all results for “{q.trim()}” <Arrow size={20} /></button></li>}
          </ul>
        </>
      ) : (
        <>
          <small className="sq-lab">Popular now</small>
          <ul className="sq-list">{popular.map(t => <li key={t}><button onClick={() => go(t)}>{t}</button></li>)}</ul>
        </>
      )}
    </Sheet>
  )
}

export const Paras = ({ text, className }) => String(text || '').split(/\n+/).filter(Boolean).map((t, i) => <p key={i} className={className}>{t}</p>)
