import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { COLOUR_PRESETS, SIZE_PRESETS } from '../lib/defaults.js'
import { naira, slugify, Modal, Field, Toggle, Gallery, Swatches, toast } from './parts.jsx'

const blank = c => ({ name: '', slug: '', collection: c || 'bespoke', tagline: '', description: '', price: 0, made_to_order: true, stock: null, lead_time: '4 weeks',
  colours: [], sizes: [...SIZE_PRESETS], custom_measure: true, images: [], featured: false, status: 'draft', sort: 0 })
const STATUS = [['active', 'Live'], ['draft', 'Draft'], ['archived', 'Archived']]

export default function Products() {
  const [rows, setRows] = useState(null)
  const [cols, setCols] = useState([])
  const [edit, setEdit] = useState(null)
  const [filter, setFilter] = useState('')
  const [q, setQ] = useState('')
  const load = () => Promise.all([
    supabase.from('products').select('*').order('sort').order('created_at', { ascending: false }),
    supabase.from('collections').select('*').order('sort'),
  ]).then(([p, c]) => { if (p.error) toast(p.error.message, true); setRows(p.data || []); setCols(c.data || []) })
  useEffect(() => { load() }, [])

  const colName = s => cols.find(c => c.slug === s)?.name || s
  const shown = (rows || []).filter(p => (!filter || p.collection === filter || p.status === filter) && (!q || p.name.toLowerCase().includes(q.toLowerCase())))
  const quick = async (p, patch) => {
    const { error } = await supabase.from('products').update(patch).eq('id', p.id)
    if (error) return toast(error.message, true)
    setRows(r => r.map(x => x.id === p.id ? { ...x, ...patch } : x)); toast('Saved')
  }
  return (
    <div className="ad-page">
      <header className="ad-head">
        <h1>Pieces</h1>
        <input className="ad-search" placeholder="Search pieces…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="ad-select" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter">
          <option value="">All pieces</option>
          {cols.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button className="ad-btn dark" onClick={() => setEdit(blank(cols[0]?.slug))}>+ New piece</button>
      </header>
      {!rows ? <p className="ad-muted">Loading…</p> : shown.length ? (
        <div className="ad-plist">
          {shown.map(p => (
            <article key={p.id} className={'ad-pcard ' + p.status}>
              <button className="ad-pcard-img" style={{ backgroundImage: `url(${p.images?.[0] || '/hero.png'})` }} onClick={() => setEdit(p)} aria-label={`Edit ${p.name}`}>
                <span className={'ad-status ' + (p.status === 'active' ? 'paid' : p.status)}>{STATUS.find(s => s[0] === p.status)?.[1]}</span>
                {p.featured && <span className="ad-star" title="Featured on homepage">★</span>}
              </button>
              <div className="ad-pcard-body">
                <small>{colName(p.collection)}</small>
                <h3>{p.name}</h3>
                <p><b>{naira(p.price)}</b> · {p.made_to_order ? 'Made for you' : p.stock === null ? 'In stock' : p.stock ? `${p.stock} in stock` : <span className="red">Sold out</span>}</p>
                <div className="ad-row">
                  <button className="ad-btn sm" onClick={() => setEdit(p)}>Edit</button>
                  {p.status === 'active'
                    ? <button className="ad-btn sm" onClick={() => quick(p, { status: 'draft' })}>Unpublish</button>
                    : <button className="ad-btn sm dark" onClick={() => p.price > 0 ? quick(p, { status: 'active' }) : toast('Set a price before publishing', true)}>Publish</button>}
                  <a className="ad-btn sm" href={`/piece/${p.slug}`} target="_blank" rel="noreferrer">View ↗</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : <p className="ad-empty">No pieces yet. Press “New piece” to add your first.</p>}
      {edit && <Editor p={edit} cols={cols} all={rows || []} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load() }} />}
    </div>
  )
}

function Editor({ p: initial, cols, all, onClose, onSaved }) {
  const [p, setP] = useState(initial)
  const [slugTouched, setSlugTouched] = useState(!!initial.id)
  const [busy, setBusy] = useState(false)
  const set = patch => setP(x => ({ ...x, ...patch }))
  const unlimited = p.stock === null

  async function save(e) {
    e?.preventDefault()
    if (p.name.trim().length < 2) return toast('Give the piece a name', true)
    const slug = slugify(p.slug || p.name)
    if (all.some(x => x.slug === slug && x.id !== p.id)) return toast('Another piece already uses this link name. Change the name or link.', true)
    if (p.status === 'active' && !(p.price > 0)) return toast('Set a price before making the piece live', true)
    if (p.status === 'active' && !p.images.length) return toast('Add at least one photo before making the piece live', true)
    setBusy(true)
    const { id, created_at, updated_at, ...row } = p // eslint-disable-line no-unused-vars
    Object.assign(row, { slug, name: p.name.trim(), price: Math.round(Number(p.price) || 0), stock: p.made_to_order || unlimited ? null : Math.max(0, Math.round(Number(p.stock) || 0)), sort: Number(p.sort) || 0 })
    const { error } = id ? await supabase.from('products').update(row).eq('id', id) : await supabase.from('products').insert(row)
    setBusy(false)
    if (error) return toast(error.message, true)
    toast(id ? 'Piece saved' : 'Piece created'); onSaved()
  }
  async function remove() {
    if (!confirm(`Delete “${p.name}”? Orders that include it keep their details. To hide it instead, set it to Archived.`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    if (error) return toast(error.message, true)
    toast('Piece deleted'); onSaved()
  }
  const duplicate = () => { const { id, created_at, updated_at, ...rest } = p; setP({ ...rest, name: p.name + ' (copy)', slug: '', status: 'draft' }); setSlugTouched(false); toast('Copy ready: edit it and save') } // eslint-disable-line no-unused-vars

  return (
    <Modal title={p.id ? `Edit ${initial.name}` : 'New piece'} onClose={onClose} wide>
      <form className="ad-form" onSubmit={save}>
        <div className="ad-cols">
          <div>
            <Field label="Name"><input value={p.name} onChange={e => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} placeholder="Nne Column Dress" autoFocus /></Field>
            <Field label="Link" hint={`/piece/${slugify(p.slug || p.name) || '…'}`}><input value={p.slug} onChange={e => { setSlugTouched(true); set({ slug: e.target.value }) }} /></Field>
            <div className="ad-2">
              <Field label="Collection"><select value={p.collection} onChange={e => set({ collection: e.target.value })}>{cols.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></Field>
              <Field label="Price (₦)" hint="whole naira"><input type="number" min="0" step="500" value={p.price} onChange={e => set({ price: e.target.value })} /></Field>
            </div>
            <Field label="Short line" hint="(on shop cards)"><input value={p.tagline || ''} onChange={e => set({ tagline: e.target.value })} placeholder="One-of-one forms, made after your order is confirmed." /></Field>
            <Field label="Description"><textarea rows={4} value={p.description || ''} onChange={e => set({ description: e.target.value })} /></Field>
            <Gallery value={p.images} onChange={images => set({ images })} folder="products" />
          </div>
          <div>
            <Field label="How is it sold?">
              <div className="ad-seg">
                <button type="button" className={p.made_to_order ? 'on' : ''} onClick={() => set({ made_to_order: true, lead_time: p.lead_time || '4 weeks' })}>Made for you</button>
                <button type="button" className={!p.made_to_order ? 'on' : ''} onClick={() => set({ made_to_order: false, custom_measure: false, stock: p.stock ?? 1 })}>In stock</button>
              </div>
            </Field>
            {!p.made_to_order && (
              <div className="ad-2">
                <Field label="Stock"><input type="number" min="0" disabled={unlimited} value={unlimited ? '' : p.stock} onChange={e => set({ stock: e.target.value })} placeholder="∞" /></Field>
                <Field label=" "><Toggle on={unlimited} onChange={v => set({ stock: v ? null : 1 })} label="No stock limit" /></Field>
              </div>
            )}
            <Field label={p.made_to_order ? 'Lead time' : 'Dispatch time'}><input value={p.lead_time || ''} onChange={e => set({ lead_time: e.target.value })} placeholder={p.made_to_order ? '4 weeks' : '1–2 working days'} /></Field>
            <Field label="Colours"><Swatches value={p.colours} onChange={colours => set({ colours })} presets={COLOUR_PRESETS} /></Field>
            <Field label="Standard sizes">
              <div className="ad-sizes">
                {SIZE_PRESETS.map(z => <button type="button" key={z} className={p.sizes.includes(z) ? 'on' : ''} onClick={() => set({ sizes: p.sizes.includes(z) ? p.sizes.filter(x => x !== z) : SIZE_PRESETS.filter(x => x === z || p.sizes.includes(x)) })}>{z}</button>)}
              </div>
            </Field>
            <Toggle on={p.custom_measure} onChange={v => set({ custom_measure: v })} label="Offer “My measurement” (6 measurements)" />
            <Toggle on={p.featured} onChange={v => set({ featured: v })} label="Feature on the homepage (first 3 show)" />
            <div className="ad-2">
              <Field label="Status"><select value={p.status} onChange={e => set({ status: e.target.value })}>{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
              <Field label="Order" hint="(lower shows first)"><input type="number" value={p.sort} onChange={e => set({ sort: e.target.value })} /></Field>
            </div>
          </div>
        </div>
        <footer className="ad-form-foot">
          {p.id && <button type="button" className="ad-btn danger" onClick={remove}>Delete</button>}
          {p.id && <button type="button" className="ad-btn" onClick={duplicate}>Duplicate</button>}
          <span />
          <button type="button" className="ad-btn" onClick={onClose}>Cancel</button>
          <button className="ad-btn dark" disabled={busy}>{busy ? 'Saving…' : 'Save piece'}</button>
        </footer>
      </form>
    </Modal>
  )
}
