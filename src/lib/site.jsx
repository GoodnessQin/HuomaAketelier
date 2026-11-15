import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, configured } from '../supabase.js'
import { CONTENT, DEMO_COLLECTIONS, DEMO_DELIVERY, DEMO_PRODUCTS } from './defaults.js'

const Ctx = createContext(null)
export const useSite = () => useContext(Ctx)
export const useContent = key => useSite().content[key]

const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } }
const sid = () => { let s = read('huoma.sid', null); if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); write('huoma.sid', s) } return s }

export const naira = n => '₦' + Number(n || 0).toLocaleString('en-NG')
export const lineKey = l => [l.product_id, l.colour || '', l.size || '', l.size === 'custom' ? JSON.stringify(l.measurements) : ''].join('|')
export const availability = p => p.made_to_order ? 'made' : (p.stock === null || p.stock > 0) ? 'stock' : 'out'
export const BADGE = { made: 'Made for you', stock: 'In stock', out: 'Out of stock' }

function merge(rows) {
  const c = structuredClone(CONTENT)
  for (const r of rows || []) c[r.key] = { ...(c[r.key] || {}), ...(r.value || {}) }
  return c
}

export function SiteProvider({ children }) {
  const [content, setContent] = useState(() => {
    const c = structuredClone(CONTENT)
    if (!configured) c.settings.mode = 'store' // preview on your computer shows the shop
    return c
  })
  const [collections, setCollections] = useState(configured ? [] : DEMO_COLLECTIONS)
  const [products, setProducts] = useState(configured ? [] : DEMO_PRODUCTS)
  const [delivery, setDelivery] = useState(configured ? [] : DEMO_DELIVERY)
  const [loaded, setLoaded] = useState(!configured)
  const [bag, setBag] = useState(() => read('huoma.bag', []))
  const [favs, setFavs] = useState(() => read('huoma.fav', []))
  const [user, setUser] = useState(null)

  const load = useCallback(async () => {
    if (!configured) return
    const [c, col, p, d] = await Promise.all([
      supabase.from('site_content').select('key,value'),
      supabase.from('collections').select('*').order('sort'),
      supabase.from('products').select('*').eq('status', 'active').order('sort').order('created_at', { ascending: false }),
      supabase.from('delivery_methods').select('*').eq('active', true).order('sort'),
    ])
    setContent(merge(c.data))
    setCollections(col.data || [])
    setProducts(p.data || [])
    setDelivery(d.data || [])
    setLoaded(true)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!configured) return
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => write('huoma.bag', bag), [bag])
  useEffect(() => write('huoma.fav', favs), [favs])

  const track = useCallback((type, extra = {}) => {
    if (!configured) return
    supabase.rpc('track', { p_type: type, p_path: location.pathname, p_product: extra.product || null, p_session: sid() }).then(() => {}, () => {})
  }, [])

  const byId = useMemo(() => Object.fromEntries(products.map(p => [p.id, p])), [products])
  // Bag lines always use today's price and name from the catalogue
  const lines = useMemo(() => bag.map(l => ({ ...l, product: byId[l.product_id] })).filter(l => l.product), [bag, byId])
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0)
  const count = lines.reduce((s, l) => s + l.qty, 0)

  const api = {
    content, collections, products, delivery, loaded, reload: load, user, track,
    bag: lines, subtotal, count,
    addToBag(line) {
      const key = lineKey(line)
      setBag(b => b.some(x => x.key === key) ? b.map(x => x.key === key ? { ...x, qty: Math.min(20, x.qty + (line.qty || 1)) } : x) : [...b, { ...line, key, qty: line.qty || 1 }])
      track('add_to_bag', { product: configured ? line.product_id : null })
    },
    setQty: (key, qty) => setBag(b => b.map(x => x.key === key ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x)),
    removeLine: key => setBag(b => b.filter(x => x.key !== key)),
    clearBag: () => setBag([]),
    favs: favs.map(id => byId[id]).filter(Boolean),
    isFav: id => favs.includes(id),
    toggleFav(id) { setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]); if (!favs.includes(id)) track('favourite', { product: configured ? id : null }) },
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
