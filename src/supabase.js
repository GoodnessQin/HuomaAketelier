// =====================================================================================
// DEMO BACKEND. This file stands in for Supabase, Paystack and Resend so the whole site
// can be clicked through with no accounts or keys. Everything is saved in this browser
// only (localStorage). Nothing is sent anywhere, no real payments, no emails.
// In the real project this file is replaced by the Supabase client.
// =====================================================================================
import { DEMO_PRODUCTS, DEMO_COLLECTIONS, DEMO_DELIVERY } from './lib/defaults.js'
import './demo.css'

export const configured = true
export const DEMO = true
export const WA = `https://wa.me/${import.meta.env.VITE_BRAND_WHATSAPP || ''}`
export const IGBO = 'Ísī Ọ́dụ̀m'
export const PIECE = `Odogwu (ODG) aka ${IGBO}`
export const MEASURES = [
  ['chest', 'Chest'], ['shoulder', 'Shoulder'], ['sleeve', 'Sleeve length'],
  ['waist', 'Waist'], ['top', 'Top length'], ['trouser', 'Trouser length'],
]

const DB_KEY = 'huoma.demo.db.v4', SES_KEY = 'huoma.demo.session'
const wait = (ms = 350) => new Promise(r => setTimeout(r, ms))
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))
const clone = v => JSON.parse(JSON.stringify(v))
const now = () => new Date().toISOString()
const daysAgo = (d, h = 10) => { const t = new Date(Date.now() - d * 864e5); t.setHours(h, 0, 0, 0); return t.toISOString() }

// ---------- sample data ----------
function seed() {
  const products = DEMO_PRODUCTS.map((p, i) => ({ ...p, id: 'prod-' + (i + 1), status: 'active', created_at: daysAgo(40 - i) }))
  const P = Object.fromEntries(products.map(p => [p.slug, p]))
  const item = (p, extra = {}) => ({ id: uid(), product_id: p.id, name: p.name, collection: p.collection, image: p.images[0], unit_price: p.price, qty: 1, made_to_order: p.made_to_order, lead_time: p.lead_time, ...extra })
  const ord = (n, d, name, email, city, method, fee, status, items, extra = {}) => {
    const subtotal = items.reduce((s, i) => s + i.unit_price * i.qty, 0)
    const id = uid()
    return { id, code: 'HA-00' + n, reference: 'HADEMO' + n, email, whatsapp: '+2348012345' + String(n).slice(-3), full_name: name, country: 'Nigeria', state: city === 'Lekki' ? 'Lagos' : 'FCT', city, street: '12 Admiralty Way',
      delivery_method: method, delivery_name: DEMO_DELIVERY.find(x => x.id === method).name, delivery_fee: fee, subtotal, total: subtotal + fee, currency: 'NGN', channel: 'card', marketing: false,
      status, paid_at: status === 'pending' ? null : daysAgo(d), tracking: status === 'shipped' ? 'GIG Logistics 0042117' : null, admin_note: null, created_at: daysAgo(d), updated_at: daysAgo(d),
      _items: items.map(i => ({ ...i, order_id: id })), ...extra }
  }
  const orders = [
    ord(476, 21, 'Chioma Eze', 'chioma@example.com', 'Wuse', 'nigeria', 10000, 'delivered', [item(P['udo-woven-jacket'], { size: 'M', colour: 'Oxblood' })]),
    ord(477, 14, 'Tunde Bello', 'tunde@example.com', 'Lekki', 'lagos', 5000, 'shipped', [item(P['ugo-mesh-bag'], { colour: 'Gold' })]),
    ord(478, 6, 'Ada Okafor', 'ada@example.com', 'Lekki', 'lagos', 5000, 'in_production', [item(P['nne-column-dress'], { size: 'My measurement', colour: 'Ivory',
      measurements: { unit: 'cm', chest: '92', shoulder: '41', sleeve: '60', waist: '74', top: '70', trouser: '102', notes: 'Slightly loose at the waist' } })]),
    ord(479, 2, 'Emeka Nwosu', 'emeka@example.com', 'Wuse', 'nigeria', 10000, 'paid', [item(P['obi-agbada'], { size: 'L', colour: 'Royal blue' }), item(P['udo-woven-jacket'], { size: 'L', colour: 'Ink black' })]),
  ]
  const order_items = orders.flatMap(o => o._items); orders.forEach(o => delete o._items)
  const events = []
  for (let d = 29; d >= 0; d--) {
    const visitors = 18 + ((d * 37) % 40)
    for (let v = 0; v < visitors; v++) {
      const s = `seed-${d}-${v}`, t = daysAgo(d, 8 + (v % 12))
      events.push({ type: 'page_view', session: s, created_at: t })
      if (v % 3 === 0) events.push({ type: 'product_view', session: s, product_id: products[v % products.length].id, created_at: t })
      if (v % 9 === 0) events.push({ type: 'add_to_bag', session: s, created_at: t })
      if (v % 18 === 0) events.push({ type: 'begin_checkout', session: s, created_at: t })
    }
  }
  return {
    products, collections: clone(DEMO_COLLECTIONS), delivery_methods: DEMO_DELIVERY.map((d, i) => ({ ...d, active: true, sort: i + 1 })),
    orders, order_items, events,
    site_content: [{ key: 'settings', value: { mode: 'store' } }],
    inquiries: [{ id: 1, full_name: 'Ngozi Adeyemi', email: 'ngozi@example.com', piece: 'Wedding agbada', message: 'Hello, I would like a custom agbada for my wedding in March.\nCan we talk about colours?', status: 'new', created_at: daysAgo(1) }],
    subscribers: [{ email: 'ngozi@example.com', source: 'newsletter', subscribed: true, created_at: daysAgo(3) }],
    waitlist: [{ id: 17, piece: PIECE, colour: 'Ivory', lion_head_colour: 'Gold', size: 'L', measurements: null, full_name: 'Obinna K.', email: 'obinna@example.com', whatsapp: '+2348033333333', created_at: daysAgo(9) }],
    profiles: [], addresses: [], admins: [],
    _seq: { order: 480, waitlist: 18, inquiry: 2 },
  }
}

let db
try { db = JSON.parse(localStorage.getItem(DB_KEY)) } catch { /* ignore */ }
if (!db || !db.products) db = seed()
const save = () => {
  try { localStorage.setItem(DB_KEY, JSON.stringify(db)) }
  catch { alert('Demo storage is full (usually from many large photos). Use “Reset demo” in the demo bar.') }
}
save()
// Add ?reset-demo to any address to start fresh
if (new URLSearchParams(location.search).has('reset-demo')) { localStorage.removeItem(DB_KEY); localStorage.removeItem(SES_KEY); localStorage.removeItem('huoma.bag'); localStorage.removeItem('huoma.fav'); db = seed(); save(); history.replaceState(null, '', location.pathname) }
export function resetDemo() { localStorage.removeItem(DB_KEY); localStorage.removeItem(SES_KEY); localStorage.removeItem('huoma.bag'); localStorage.removeItem('huoma.fav'); location.href = '/' }

// ---------- auth ----------
let session = null
try { session = JSON.parse(localStorage.getItem(SES_KEY)) } catch { /* ignore */ }
const listeners = new Set()
const setSession = s => { session = s; s ? localStorage.setItem(SES_KEY, JSON.stringify(s)) : localStorage.removeItem(SES_KEY); listeners.forEach(f => f(s ? 'SIGNED_IN' : 'SIGNED_OUT', s)) }
const isAdmin = () => !!session?.admin
const myEmail = () => session?.user?.email?.toLowerCase()

// ---------- tiny query builder (enough of the Supabase API for this site) ----------
const KEYS = { site_content: 'key', profiles: 'user_id', subscribers: 'email', collections: 'slug', delivery_methods: 'id', admins: 'email' }
const PRIVATE = ['orders', 'order_items', 'inquiries', 'subscribers', 'waitlist', 'events', 'admins']

class Query {
  constructor(table) { this.t = table; this.f = []; this.s = []; this.n = null; this.op = 'select'; this.cols = '*' }
  select(cols = '*') { this.cols = cols; this.ret = true; return this }
  eq(c, v) { this.f.push(r => r[c] === v); return this }
  neq(c, v) { this.f.push(r => r[c] !== v); return this }
  in(c, v) { this.f.push(r => v.includes(r[c])); return this }
  ilike(c, v) { this.f.push(r => String(r[c]).toLowerCase() === String(v).toLowerCase()); return this }
  order(c, o = {}) { this.s.push([c, o.ascending !== false]); return this }
  limit(n) { this.n = n; return this }
  insert(v) { this.op = 'insert'; this.val = v; return this }
  update(v) { this.op = 'update'; this.val = v; return this }
  upsert(v) { this.op = 'upsert'; this.val = v; return this }
  delete() { this.op = 'delete'; return this }
  single() { this.one = 'single'; return this }
  maybeSingle() { this.one = 'maybe'; return this }
  then(ok, no) { return wait(120).then(() => this.run()).then(ok, no) }
  rows() {
    let r = db[this.t] || (db[this.t] = [])
    // the same privacy rules as the real database
    if (this.t === 'products' && !isAdmin()) r = r.filter(p => p.status === 'active')
    if (this.t === 'delivery_methods' && !isAdmin()) r = r.filter(d => d.active)
    if (this.t === 'orders' && !isAdmin()) r = r.filter(o => myEmail() && o.email.toLowerCase() === myEmail())
    if (['profiles', 'addresses'].includes(this.t) && !isAdmin()) r = r.filter(x => session && x.user_id === session.user.id)
    if (PRIVATE.includes(this.t) && this.t !== 'orders' && !isAdmin()) r = []
    return r.filter(x => this.f.every(fn => fn(x)))
  }
  shape(list) {
    let out = clone(list)
    for (let i = this.s.length - 1; i >= 0; i--) {
      const [c, asc] = this.s[i]
      out.sort((a, b) => (a[c] ?? '') < (b[c] ?? '') ? (asc ? -1 : 1) : (a[c] ?? '') > (b[c] ?? '') ? (asc ? 1 : -1) : 0)
    }
    if (this.n != null) out = out.slice(0, this.n)
    if (this.t === 'orders' && this.cols.includes('order_items')) out.forEach(o => { o.order_items = clone(db.order_items.filter(i => i.order_id === o.id)) })
    if (this.one) {
      if (this.one === 'single' && out.length !== 1) return { data: null, error: { message: 'Row not found' } }
      return { data: out[0] || null, error: null }
    }
    return { data: out, error: null }
  }
  run() {
    const T = db[this.t] || (db[this.t] = [])
    const key = KEYS[this.t] || 'id'
    if (this.op === 'select') return this.shape(this.rows())
    if (['products', 'collections', 'delivery_methods', 'site_content', 'inquiries', 'subscribers', 'waitlist', 'admins'].includes(this.t) && this.op !== 'select' && !isAdmin())
      return { data: null, error: { message: 'Not allowed (sign in to /admin first)' } }
    if (this.op === 'insert' || this.op === 'upsert') {
      const list = (Array.isArray(this.val) ? this.val : [this.val]).map(v => ({ ...v }))
      const done = []
      for (const v of list) {
        if (this.t === 'addresses' || this.t === 'profiles') v.user_id = v.user_id || session?.user?.id
        const existing = v[key] != null && T.find(r => r[key] === v[key])
        if (existing && this.op === 'upsert') { Object.assign(existing, v, { updated_at: now() }); done.push(existing); continue }
        if (existing) return { data: null, error: { message: 'Already exists' } }
        const row = { ...(key === 'id' && v.id == null ? { id: uid() } : {}), created_at: now(), ...v }
        T.push(row); done.push(row)
      }
      save()
      return this.ret ? this.shape(done) : { data: null, error: null }
    }
    const hit = this.rows()
    if (this.op === 'update') { hit.forEach(r => Object.assign(r, this.val, { updated_at: now() })); save(); return this.ret ? this.shape(hit) : { data: null, error: null } }
    if (this.op === 'delete') { db[this.t] = T.filter(r => !hit.includes(r)); save(); return { data: null, error: null } }
  }
}

// ---------- server functions ----------
const paidish = o => !['pending', 'failed', 'cancelled', 'refunded'].includes(o.status)
function markPaid(reference) {
  const o = db.orders.find(x => x.reference === reference)
  if (!o || !['pending', 'failed'].includes(o.status)) return
  o.status = 'paid'; o.paid_at = now()
  db.order_items.filter(i => i.order_id === o.id).forEach(i => {
    const p = db.products.find(x => x.id === i.product_id)
    if (p && p.stock !== null && !i.made_to_order) p.stock = Math.max(0, p.stock - i.qty)
  })
  if (o.marketing && !db.subscribers.some(s => s.email === o.email)) db.subscribers.push({ email: o.email, source: 'checkout', subscribed: true, created_at: now() })
  save()
}

function createOrder(b) {
  const lines = []
  for (const it of b.items || []) {
    const p = db.products.find(x => x.id === it.product_id && x.status === 'active')
    if (!p) return { error: 'A piece in your bag is no longer available. Please remove it and try again.' }
    if (!p.made_to_order && p.stock !== null && it.qty > p.stock) return { error: p.stock ? `Only ${p.stock} of ${p.name} left.` : `${p.name} is out of stock.` }
    lines.push({ product_id: p.id, name: p.name, collection: p.collection, image: p.images?.[0] || null, colour: it.colour, size: it.size === 'custom' ? 'My measurement' : it.size,
      measurements: it.size === 'custom' ? it.measurements : null, unit_price: p.price, qty: it.qty, made_to_order: p.made_to_order, lead_time: p.lead_time })
  }
  const m = db.delivery_methods.find(d => d.id === b.delivery_method && d.active)
  if (!m) return { error: 'Choose a delivery method.' }
  const inNigeria = /^nigeria$/i.test(b.address.country || '')
  if (m.international === inNigeria) return { error: inNigeria ? 'International delivery is for addresses outside Nigeria.' : 'Choose International delivery for addresses outside Nigeria.' }
  if (/lagos/i.test(m.name) && !/lagos/i.test(b.address.state || '')) return { error: `${m.name} delivery is only for Lagos addresses.` }
  const subtotal = lines.reduce((s, l) => s + l.unit_price * l.qty, 0)
  const id = uid(), reference = 'HA' + Date.now().toString(36).toUpperCase()
  const code = 'HA-' + String(++db._seq.order).padStart(5, '0')
  db.orders.push({ id, code, reference, email: b.contact.email.toLowerCase(), whatsapp: b.contact.whatsapp, full_name: b.address.full_name, country: b.address.country, state: b.address.state,
    city: b.address.city, street: b.address.street, delivery_method: m.id, delivery_name: m.name, delivery_fee: m.fee, subtotal, total: subtotal + m.fee, currency: 'NGN',
    channel: b.channel, marketing: !!b.marketing, status: 'pending', paid_at: null, tracking: null, admin_note: null, created_at: now(), updated_at: now() })
  lines.forEach(l => db.order_items.push({ id: uid(), order_id: id, ...l }))
  save()
  return { reference, code, access_code: reference, authorization_url: `/order/${reference}` }
}

const functions = {
  async invoke(name, { body } = {}) {
    await wait(700)
    if (name === 'create-order') return { data: createOrder(body), error: null }
    if (name === 'verify-payment') {
      const o = db.orders.find(x => x.reference === body.reference)
      if (!o) return { data: null, error: { message: 'not found' } }
      return { data: { code: o.code, status: o.status === 'pending' ? 'unpaid' : o.status, total: o.total }, error: null }
    }
    if (name === 'order-update') {
      if (!isAdmin()) return { data: { error: 'Not allowed' }, error: null }
      const o = db.orders.find(x => x.id === body.order_id)
      for (const k of ['status', 'tracking', 'admin_note']) if (body[k] !== undefined) o[k] = body[k]
      save()
      return { data: { ok: true, notified: !!body.notify && ['in_production', 'ready', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(o.status) }, error: null }
    }
    return { data: null, error: { message: 'Unknown function' } }
  },
}

function stats(days) {
  const since = Date.now() - days * 864e5
  const paid = db.orders.filter(o => paidish(o) && new Date(o.paid_at).getTime() >= since)
  const ev = db.events.filter(e => new Date(e.created_at).getTime() >= since)
  const uniq = t => new Set(ev.filter(e => e.type === t).map(e => e.session)).size
  const daily = []
  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10)
    const po = paid.filter(o => o.paid_at.slice(0, 10) === day)
    daily.push({ day, revenue: po.reduce((s, o) => s + o.total, 0), orders: po.length, visitors: new Set(ev.filter(e => e.type === 'page_view' && e.created_at.slice(0, 10) === day).map(e => e.session)).size })
  }
  const top = {}
  db.order_items.filter(i => paid.some(o => o.id === i.order_id)).forEach(i => { top[i.name] = top[i.name] || { name: i.name, qty: 0, revenue: 0 }; top[i.name].qty += i.qty; top[i.name].revenue += i.qty * i.unit_price })
  const views = {}
  ev.filter(e => e.type === 'product_view' && e.product_id).forEach(e => { const p = db.products.find(x => x.id === e.product_id); if (p) views[p.name] = (views[p.name] || 0) + 1 })
  const revenue = paid.reduce((s, o) => s + o.total, 0)
  return {
    revenue, orders: paid.length, aov: paid.length ? Math.round(revenue / paid.length) : 0,
    to_fulfil: db.orders.filter(o => ['paid', 'in_production', 'ready'].includes(o.status)).length,
    visitors: uniq('page_view'), page_views: ev.filter(e => e.type === 'page_view').length,
    funnel: { product_view: uniq('product_view'), add_to_bag: uniq('add_to_bag'), begin_checkout: uniq('begin_checkout'), purchase: Math.max(uniq('purchase'), paid.length) },
    daily, top_products: Object.values(top).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    most_viewed: Object.entries(views).map(([name, v]) => ({ name, views: v })).sort((a, b) => b.views - a.views).slice(0, 5),
    low_stock: db.products.filter(p => p.status === 'active' && !p.made_to_order && p.stock !== null && p.stock <= 3).map(p => ({ name: p.name, stock: p.stock })),
    waitlist_total: db.waitlist.length, waitlist_new: db.waitlist.filter(w => new Date(w.created_at).getTime() >= since).length,
    subscribers: db.subscribers.filter(s => s.subscribed).length, inquiries_new: db.inquiries.filter(i => i.status === 'new').length,
  }
}

async function rpc(name, a = {}) {
  await wait(150)
  const ok = data => ({ data, error: null })
  const sub = (email, source, on = true) => {
    const e = email.toLowerCase(), s = db.subscribers.find(x => x.email === e)
    s ? (s.subscribed = on) : db.subscribers.push({ email: e, source, subscribed: on, created_at: now() }); save()
  }
  switch (name) {
    case 'is_admin': return ok(isAdmin())
    case 'admin_stats': return isAdmin() ? ok(stats(a.p_days || 30)) : { data: null, error: { message: 'not allowed' } }
    case 'track': db.events.push({ type: a.p_type, path: a.p_path, product_id: a.p_product, session: a.p_session, created_at: now() }); if (db.events.length > 20000) db.events.splice(0, 5000); save(); return ok(null)
    case 'subscribe': sub(a.p_email, a.p_source); return ok(null)
    case 'set_marketing': {
      if (!session) return { data: null, error: { message: 'not signed in' } }
      let p = db.profiles.find(x => x.user_id === session.user.id); if (!p) db.profiles.push(p = { user_id: session.user.id })
      p.marketing = a.p_on; sub(session.user.email, 'account', a.p_on); return ok(null)
    }
    case 'send_inquiry': db.inquiries.push({ id: db._seq.inquiry++, full_name: a.p_name, email: a.p_email.toLowerCase(), piece: a.p_piece || null, message: a.p_message, status: 'new', created_at: now() }); save(); return ok(null)
    case 'reserve_place': {
      const id = db._seq.waitlist++
      db.waitlist.push({ id, piece: a.p_piece, colour: a.p_colour, lion_head_colour: a.p_lion_head_colour, size: a.p_size, measurements: a.p_measurements, full_name: a.p_name, email: a.p_email.toLowerCase(), whatsapp: a.p_whatsapp, created_at: now() })
      save(); return ok('HA-R' + String(id).padStart(3, '0'))
    }
  }
  return { data: null, error: { message: 'unknown rpc ' + name } }
}

const files = {}
export const supabase = {
  from: t => new Query(t),
  rpc,
  functions,
  auth: {
    getSession: async () => ({ data: { session } }),
    onAuthStateChange: fn => { listeners.add(fn); return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } } },
    signInWithOtp: async () => { await wait(600); return { error: null } },
    verifyOtp: async ({ email, token }) => {
      await wait(500)
      if (!/^\d{6}$/.test(token)) return { error: { message: 'bad code' } }
      setSession({ user: { id: 'cust-' + email.toLowerCase(), email: email.toLowerCase() }, admin: false }); return { error: null }
    },
    signInWithPassword: async ({ email, password }) => {
      await wait(500)
      if (!email || !password) return { error: { message: 'missing' } }
      if (!db.admins.some(a => a.email === email.toLowerCase())) { db.admins.push({ email: email.toLowerCase() }); save() }
      setSession({ user: { id: 'admin-' + email.toLowerCase(), email: email.toLowerCase() }, admin: true }); return { error: null }
    },
    signOut: async () => { setSession(null); return { error: null } },
  },
  storage: {
    from: () => ({
      upload: async (path, blob) => {
        const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob) })
        files[path] = url; return { error: null }
      },
      getPublicUrl: path => ({ data: { publicUrl: files[path] } }),
    }),
  },
}

export async function reserve(p) {
  const { data, error } = await rpc('reserve_place', p)
  return error ? { error } : { code: data }
}

// ---------- pretend Paystack window ----------
const naira = n => '₦' + Number(n || 0).toLocaleString('en-NG')
window.PaystackPop = class {
  resumeTransaction(reference, cb = {}) {
    const o = db.orders.find(x => x.reference === reference)
    const bank = o?.channel === 'bank_transfer'
    const el = document.createElement('div')
    el.className = 'demo-pay'
    el.innerHTML = `<div class="demo-pay-box" role="dialog" aria-modal="true" aria-label="Demo payment">
      <p class="demo-pay-tag">Paystack · DEMO (no real money)</p>
      <p class="demo-pay-mail">${o?.email || ''}</p>
      <p class="demo-pay-amt">Pay <b>${naira(o?.total)}</b></p>
      ${bank
        ? '<div class="demo-pay-bank"><small>Transfer to</small><b>Paystack-Titan · 9912345678</b><small>Account name: Huoma Akwetelier (demo)</small></div>'
        : '<div class="demo-pay-card"><span>4084 0840 8408 4081</span><span>12/30 · 408</span></div>'}
      <button class="demo-pay-go">${bank ? 'I’ve sent the money' : 'Pay ' + naira(o?.total)}</button>
      <button class="demo-pay-x">Cancel payment</button>
      <p class="demo-pay-note">In the real site this is Paystack’s secure window.</p></div>`
    document.body.appendChild(el)
    el.querySelector('.demo-pay-x').onclick = () => { el.remove(); cb.onCancel?.() }
    el.querySelector('.demo-pay-go').onclick = async e => {
      e.target.disabled = true; e.target.textContent = 'Processing…'
      await wait(1200); markPaid(reference); el.remove(); cb.onSuccess?.({ reference })
    }
  }
}
