import { Link, useNavigate } from 'react-router-dom'
import { useSite, naira, availability, BADGE } from '../lib/site.jsx'
import { Arrow, HeartIcon } from './ui.jsx'

export const imgOf = p => p?.images?.[0] || '/hero.png'

export function Heart({ id, dark }) {
  const { isFav, toggleFav } = useSite()
  const on = isFav(id)
  return (
    <button className={'fheart' + (dark ? ' dark' : '') + (on ? ' on' : '')} onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFav(id) }}
            aria-pressed={on} aria-label={on ? 'Remove from favourites' : 'Save to favourites'}>
      <HeartIcon on={on} size={16} />
    </button>
  )
}

// Photo that zooms gently on hover and, if the piece has a second photo, swaps to it (as Shopify themes do)
function Photo({ p, className = '' }) {
  const second = p.images?.[1] && p.images[1] !== p.images[0] ? p.images[1] : null
  return (
    <span className={'pimg ' + className + (second ? ' has2' : '')}>
      <span className="pimg-a" style={{ backgroundImage: `url(${imgOf(p)})` }} />
      {second && <span className="pimg-b" style={{ backgroundImage: `url(${second})` }} />}
    </span>
  )
}

// Homepage: "Choose your way into the cloth" (sits in the carousel)
export function CollectionCard({ c }) {
  return (
    <Link to={`/shop/${c.slug}`} className="ccard">
      <span className="ccard-bg" style={{ backgroundImage: `url(${c.image_url || '/seed/loom.jpg'})` }} />
      <div className="ccard-body">
        {c.badge && <small className="ccard-badge">{c.badge}</small>}
        <h3>{c.name}</h3>
        {c.tagline && <p>{c.tagline}</p>}
        <span className="chip">Shop <Arrow size={20} /></span>
      </div>
    </Link>
  )
}

// Shop grid: clean product card, photo on top, name and price below
export function PieceCard({ p, collection }) {
  const a = availability(p)
  return (
    <Link to={`/piece/${p.slug}`} className="pc">
      <span className="pc-img">
        <Photo p={p} />
        <small className={'tag ' + a}>{BADGE[a]}</small>
        <Heart id={p.id} />
        <span className="pc-view">View piece <Arrow size={18} /></span>
      </span>
      <span className="pc-info">
        {collection && <small>{collection.name}</small>}
        <b className="pc-name">{p.name}</b>
        <span className="pc-price">{naira(p.price)}</span>
      </span>
    </Link>
  )
}

// Homepage: "Made to hold your story"
export function FeaturedCard({ p, collection }) {
  const { addToBag } = useSite()
  const nav = useNavigate()
  const a = availability(p)
  // Pieces with options (colour / size) go to their page so the customer chooses; simple pieces go straight in the bag
  const simple = !(p.colours || []).length && !(p.sizes || []).length && !p.custom_measure
  const add = () => {
    if (a === 'out') return
    if (simple) { addToBag({ product_id: p.id, slug: p.slug, colour: null, size: null, measurements: null }); nav('/bag') }
    else nav(`/piece/${p.slug}`, { state: { choose: true } })
  }
  return (
    <article className="fcard">
      <Link to={`/piece/${p.slug}`} className="fcard-img" aria-label={p.name}>
        <Photo p={p} />
        <small className={'tag ' + a}>{BADGE[a]}</small>
      </Link>
      <Heart id={p.id} dark />
      <div className="fcard-body">
        <small>{collection?.name}</small>
        <h3><Link to={`/piece/${p.slug}`}>{p.name}</Link></h3>
        <b>{naira(p.price)}</b>
        <div className="fcard-btns">
          <button onClick={add} disabled={a === 'out'}>{a === 'out' ? 'Out of stock' : 'Add to bag'}</button>
          <Link to={`/piece/${p.slug}`}>View piece</Link>
        </div>
      </div>
    </article>
  )
}
