import { Link } from 'react-router-dom'
import { useSite, naira, availability } from '../lib/site.jsx'
import { Header, Footer, SBtn, TrashIcon, Arrow, useTop, useTitle } from './ui.jsx'
import { Heart, imgOf } from './cards.jsx'

export function Bag() {
  useTop(); useTitle('Bag')
  const { bag, subtotal, collections, removeLine, setQty, user } = useSite()
  const colName = s => collections.find(c => c.slug === s)?.name || s
  return (
    <div className="store page">
      <Header />
      <section className="bagp">
        <h1 className="btitle">Bag</h1>
        <hr className="rule" />
        {bag.length ? <>
          <Nudge />
          <ul className="blist">
            {bag.map(l => {
              const p = l.product
              const stockCap = !p.made_to_order && p.stock !== null ? p.stock : 20
              return (
                <li key={l.key} className="bitem">
                  <Link to={`/piece/${p.slug}`} className="bimg" style={{ backgroundImage: `url(${imgOf(p)})` }} aria-label={p.name} />
                  <div className="binfo">
                    <small>{colName(p.collection)}</small>
                    <h2><Link to={`/piece/${p.slug}`}>{p.name}</Link></h2>
                    <p className="bmeta">{[l.size === 'custom' ? 'My measurement' : l.size && `Size ${l.size}`, l.colour].filter(Boolean).map((t, i) => <span key={i}>{t}</span>)}</p>
                    <b>{naira(p.price * l.qty)}</b>
                    {availability(p) === 'out' && <p className="err">This piece has just sold out. Please remove it.</p>}
                  </div>
                  <div className="bside">
                    <button className="btrash" onClick={() => removeLine(l.key)} aria-label={`Remove ${p.name}`}><TrashIcon /></button>
                    {!p.made_to_order && (
                      <div className="qty" aria-label="Quantity">
                        <button onClick={() => setQty(l.key, l.qty - 1)} disabled={l.qty <= 1} aria-label="One less">−</button>
                        <span>{l.qty}</span>
                        <button onClick={() => setQty(l.key, l.qty + 1)} disabled={l.qty >= stockCap} aria-label="One more">+</button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          <hr className="rule short" />
          <p className="bsub"><span>Subtotal</span><b>{naira(subtotal)}</b></p>
          <SBtn to="/checkout">Checkout</SBtn>
          <p className="bnote">Delivery is added at checkout.</p>
        </> : (
          <div className="bempty">
            <h2 className="stitle sm">Your bag is empty.</h2>
            <p>Pieces you add will wait for you here.</p>
            <SBtn to="/shop">Continue shopping</SBtn>
            {!user && <>
              <h3>Have an account?</h3>
              <p className="muted"><Link to="/sign-in">Log in</Link> to check out faster.</p>
            </>}
          </div>
        )}
        <hr className="rule short" />
      </section>
      <Footer />
    </div>
  )
}

// "Forgot something?" One parcel instead of two: less packaging. Shows a few pieces not yet in the bag.
function Nudge() {
  const { products, bag } = useSite()
  const inBag = new Set(bag.map(l => l.product_id))
  const picks = products.filter(p => !inBag.has(p.id) && availability(p) !== 'out').sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 3)
  return (
    <aside className="nudge" aria-label="Add more pieces">
      <div className="nudge-head">
        <span className="nudge-mark" aria-hidden="true" />
        <p><b>Forgot something?</b> Add it now and everything travels together in one parcel. Less packaging, less waste.</p>
      </div>
      {picks.length > 0 && (
        <ul className="nudge-list">
          {picks.map(p => (
            <li key={p.id}>
              <Link to={`/piece/${p.slug}`}>
                <span className="nudge-img" style={{ backgroundImage: `url(${imgOf(p)})` }} />
                <span className="nudge-name">{p.name}</span>
                <span className="nudge-price">{naira(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/shop" className="nudge-more">Keep shopping <Arrow size={18} /></Link>
    </aside>
  )
}

export function Favourites() {
  useTop(); useTitle('Favourites')
  const { favs, collections, count } = useSite()
  const colName = s => collections.find(c => c.slug === s)?.name || s
  return (
    <div className="store page">
      <Header />
      <section className="bagp">
        <h1 className="btitle">Favourite</h1>
        <hr className="rule" />
        {favs.length ? <>
          <ul className="blist">
            {favs.map(p => (
              <li key={p.id} className="bitem fav">
                <Link to={`/piece/${p.slug}`} className="bimg" style={{ backgroundImage: `url(${imgOf(p)})` }} aria-label={p.name} />
                <div className="binfo">
                  <small>{colName(p.collection)}</small>
                  <h2><Link to={`/piece/${p.slug}`}>{p.name}</Link></h2>
                  <b>{naira(p.price)}</b>
                  <Link to={`/piece/${p.slug}`} className="mini">View piece</Link>
                </div>
                <div className="bside"><Heart id={p.id} dark /></div>
              </li>
            ))}
          </ul>
          <hr className="rule short" />
          {count > 0 ? <SBtn to="/bag">Checkout</SBtn> : <SBtn to="/shop">Explore pieces</SBtn>}
        </> : (
          <div className="bempty">
            <h2 className="stitle sm">Nothing saved yet.</h2>
            <p>Keep the pieces that speak to you close by.</p>
            <SBtn to="/shop">Explore pieces</SBtn>
          </div>
        )}
        <hr className="rule short" />
      </section>
      <Footer />
    </div>
  )
}
