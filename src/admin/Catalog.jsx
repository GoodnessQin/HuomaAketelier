import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { naira, slugify, Field, Toggle, ImagePick, toast } from './parts.jsx'

export function Collections() {
  const [rows, setRows] = useState(null)
  const [counts, setCounts] = useState({})
  const load = () => Promise.all([supabase.from('collections').select('*').order('sort'), supabase.from('products').select('collection')])
    .then(([c, p]) => { setRows(c.data || []); const n = {}; (p.data || []).forEach(x => { n[x.collection] = (n[x.collection] || 0) + 1 }); setCounts(n) })
  useEffect(() => { load() }, [])
  const set = (i, patch) => setRows(r => r.map((x, j) => j === i ? { ...x, ...patch, _dirty: true } : x))
  async function save(c) {
    const { _dirty, _new, ...row } = c // eslint-disable-line no-unused-vars
    if (!row.name?.trim()) return toast('Add a name', true)
    if (_new) row.slug = slugify(row.slug || row.name)
    const { error } = _new ? await supabase.from('collections').insert(row) : await supabase.from('collections').update(row).eq('slug', c.slug)
    if (error) return toast(error.message, true)
    toast('Collection saved'); load()
  }
  async function remove(c) {
    if (counts[c.slug]) return toast('Move or delete the pieces in this collection first', true)
    if (!confirm(`Delete the collection “${c.name}”?`)) return
    const { error } = await supabase.from('collections').delete().eq('slug', c.slug)
    if (error) return toast(error.message, true); load()
  }
  return (
    <div className="ad-page">
      <header className="ad-head"><h1>Collections</h1><p className="ad-muted">Cards in the homepage carousel. Tick “Show as a tab” for the ones that appear as tabs in the shop (the design has three).</p>
        <button className="ad-btn dark" onClick={() => setRows(r => [...r, { slug: '', name: '', tagline: '', badge: '', image_url: '', sort: r.length + 1, shop_tab: false, _new: true, _dirty: true }])}>+ New collection</button></header>
      {!rows ? <p className="ad-muted">Loading…</p> : <div className="ad-stack">{rows.map((c, i) => (
        <section key={c.slug || 'new' + i} className="ad-card ad-cols">
          <div>
            <div className="ad-2">
              <Field label="Name"><input value={c.name} onChange={e => set(i, { name: e.target.value })} /></Field>
              <Field label="Badge" hint="e.g. Made for you"><input value={c.badge || ''} onChange={e => set(i, { badge: e.target.value })} /></Field>
            </div>
            <Field label="Line under the name"><input value={c.tagline || ''} onChange={e => set(i, { tagline: e.target.value })} /></Field>
            <div className="ad-2">
              <Field label="Order"><input type="number" value={c.sort} onChange={e => set(i, { sort: Number(e.target.value) })} /></Field>
              <Field label="Link">{c._new ? <input value={c.slug} placeholder={slugify(c.name)} onChange={e => set(i, { slug: e.target.value })} /> : <input value={`/shop/${c.slug}`} disabled />}</Field>
            </div>
            <Toggle on={!!c.shop_tab} onChange={v => set(i, { shop_tab: v })} label="Show as a tab on the Shop page" />
            <p className="ad-muted small">{counts[c.slug] || 0} pieces · always shown in the homepage carousel</p>
            <div className="ad-row"><button className="ad-btn dark" disabled={!c._dirty} onClick={() => save(c)}>Save</button>{!c._new && <button className="ad-btn danger" onClick={() => remove(c)}>Delete</button>}</div>
          </div>
          <ImagePick value={c.image_url} onChange={v => set(i, { image_url: v })} folder="collections" label="Card image" />
        </section>
      ))}</div>}
    </div>
  )
}

export function Delivery() {
  const [rows, setRows] = useState(null)
  const load = () => supabase.from('delivery_methods').select('*').order('sort').then(({ data }) => setRows(data || []))
  useEffect(() => { load() }, [])
  const set = (i, patch) => setRows(r => r.map((x, j) => j === i ? { ...x, ...patch, _dirty: true } : x))
  async function save(d) {
    const { _dirty, _new, ...row } = d // eslint-disable-line no-unused-vars
    if (!row.name?.trim()) return toast('Add a name', true)
    row.fee = Math.max(0, Math.round(Number(row.fee) || 0))
    if (_new) row.id = slugify(row.name)
    const { error } = _new ? await supabase.from('delivery_methods').insert(row) : await supabase.from('delivery_methods').update(row).eq('id', d.id)
    if (error) return toast(error.message, true); toast('Delivery option saved'); load()
  }
  return (
    <div className="ad-page">
      <header className="ad-head"><h1>Delivery &amp; fees</h1><p className="ad-muted">Shown at checkout. Fees are charged through Paystack with the order.</p>
        <button className="ad-btn dark" onClick={() => setRows(r => [...r, { name: '', description: '', fee: 0, international: false, active: true, sort: r.length + 1, _new: true, _dirty: true }])}>+ New option</button></header>
      {!rows ? <p className="ad-muted">Loading…</p> : <div className="ad-stack">{rows.map((d, i) => (
        <section key={d.id || 'n' + i} className="ad-card">
          <div className="ad-4">
            <Field label="Name"><input value={d.name} onChange={e => set(i, { name: e.target.value })} /></Field>
            <Field label="Time"><input value={d.description || ''} onChange={e => set(i, { description: e.target.value })} placeholder="2-3 working days" /></Field>
            <Field label="Fee (₦)"><input type="number" min="0" step="500" value={d.fee} onChange={e => set(i, { fee: e.target.value })} /></Field>
            <Field label="Order"><input type="number" value={d.sort} onChange={e => set(i, { sort: Number(e.target.value) })} /></Field>
          </div>
          <div className="ad-row">
            <Toggle on={d.international} onChange={v => set(i, { international: v })} label="International (asks for country)" />
            <Toggle on={d.active} onChange={v => set(i, { active: v })} label="Show at checkout" />
            <span className="ad-muted small">Customer pays {naira(d.fee)}</span>
            <button className="ad-btn dark" disabled={!d._dirty} onClick={() => save(d)}>Save</button>
          </div>
        </section>
      ))}</div>}
    </div>
  )
}
