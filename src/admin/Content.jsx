import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { CONTENT, COLOUR_PRESETS } from '../lib/defaults.js'
import { Field, ImagePick, Swatches, Gallery, toast } from './parts.jsx'

// [key, label, type, hint]  type: text | area | image | gallery | swatches
const PAGES = {
  home: { name: 'Homepage', view: '/store', fields: [
    ['hero_image', 'Hero photo', 'image'], ['hero_eyebrow', 'Hero small label', 'text', 'above the title; leave empty to hide'], ['hero_title', 'Hero title'], ['hero_subtitle', 'Hero line'], ['hero_cta', 'Hero button'],
    ['waitlist_cta', 'Hero waitlist button', 'text', 'leave empty to hide it'], ['waitlist_link', 'Hero waitlist button link'],
    ['collections_eyebrow', 'Collections: small label'], ['collections_title', 'Collections: title'], ['cards', 'Collections carousel cards', 'cards'],
    ['featured_eyebrow', 'Featured: small label'], ['featured_title', 'Featured: title'],
    ['steps', 'Making steps', 'area', 'one per line'],
    ['house_image', 'The House: photo', 'image'], ['house_eyebrow', 'The House: small label'], ['house_title', 'The House: title', 'text', 'leave empty to hide the section'],
    ['house_text', 'The House: text', 'area'], ['house_cta', 'The House: button'],
    ['faq_title', 'FAQ: title'], ['faq_intro', 'FAQ: line under the title', 'area'], ['faq', 'FAQ: questions and answers', 'faq'],
    ['letters_eyebrow', 'Newsletter: small label'], ['letters_title', 'Newsletter: title'], ['letters_text', 'Newsletter: text', 'area']] },
  shop: { name: 'Shop', view: '/shop', fields: [['title', 'Title'], ['subtitle', 'Line under the title'], ['popular', 'Search: “Popular now”', 'area', 'one per line']] },
  story: { name: 'Our story', view: '/our-story', fields: [
    ['hero_image', 'Hero photo', 'image'], ['hero_title', 'Hero title'],
    ['s1_label', 'Section 1: big word'], ['s1_title', 'Section 1: title'], ['s1_text', 'Section 1: text', 'area'],
    ['s2_image', 'Section 2: photo', 'image'], ['s2_eyebrow', 'Section 2: small label'], ['s2_title', 'Section 2: title'], ['s2_text', 'Section 2: text', 'area', 'new line = new paragraph'], ['s2_cta', 'Section 2: button']] },
  contact: { name: 'Contact', view: '/contact', fields: [['title', 'Title'], ['subtitle', 'Line under the title', 'area'], ['inquiry_title', 'Form title'], ['success_title', 'After sending: title'], ['success_text', 'After sending: text']] },
  confirmed: { name: 'Order confirmed', view: null, fields: [['title', 'Title'], ['text', 'Thank-you text', 'area'], ['next_title', 'Box title'],
    ['step1_title', 'Step 1'], ['step1_text', 'Step 1 text'], ['step2_title', 'Step 2'], ['step2_text', 'Step 2 text'], ['step3_title', 'Step 3'], ['step3_text', 'Step 3 text']] },
  policies: { name: 'Policies', view: '/policies/refund', fields: [['refund', 'Refund Policy', 'area'], ['shipping', 'Shipping Policy', 'area'], ['privacy', 'Privacy', 'area'], ['terms', 'Terms of Service', 'area'], ['copyright', 'Copyright', 'area']] },
  waitlist: { name: 'Waitlist pages', view: '/waitlist', fields: [
    ['hero_title', 'Landing title'], ['hero_subtitle', 'Landing line'],
    ['piece_name', 'Piece name'], ['piece_copy', 'Piece description', 'area'], ['gallery', 'Piece photos', 'gallery'],
    ['colours', 'Fabric colours', 'swatches'], ['lion_heads', 'Lion head colours', 'swatches'],
    ['fabric_includes', 'Fabric: includes'], ['fabric_each', 'Fabric: each wrapper'], ['fabric_total', 'Fabric: total'],
    ['reserve_title', 'Reserve page: photo title'], ['reserve_lead', 'Reserve page: line', 'area'],
    ['confirmed_title', 'Confirmation: title'], ['confirmed_text', 'Confirmation: text', 'area']] },
}

export default function Content() {
  const [page, setPage] = useState('home')
  const [saved, setSaved] = useState({})
  const [v, setV] = useState(null)
  const [busy, setBusy] = useState(false)
  const [cols, setCols] = useState([])
  useEffect(() => { supabase.from('collections').select('slug,name,image_url,tagline').order('sort').then(({ data }) => setCols(data || [])) }, [])
  useEffect(() => { supabase.from('site_content').select('key,value').then(({ data }) => setSaved(Object.fromEntries((data || []).map(r => [r.key, r.value])))) }, [])
  useEffect(() => { setV({ ...CONTENT[page], ...(saved[page] || {}) }) }, [page, saved])
  if (!v) return null
  const P = PAGES[page]
  const dirty = JSON.stringify(v) !== JSON.stringify({ ...CONTENT[page], ...(saved[page] || {}) })

  async function save() {
    setBusy(true)
    const { error } = await supabase.from('site_content').upsert({ key: page, value: v })
    setBusy(false)
    if (error) return toast(error.message, true)
    setSaved(s => ({ ...s, [page]: v })); toast(`${P.name} saved. It is live now.`)
  }
  const reset = k => setV(x => ({ ...x, [k]: CONTENT[page][k] }))
  const set = (k, val) => setV(x => ({ ...x, [k]: val }))

  return (
    <div className="ad-page">
      <header className="ad-head"><h1>Page content</h1><p className="ad-muted">Change words and photos on the site. Saving publishes immediately.</p></header>
      <div className="ad-tabs">{Object.entries(PAGES).map(([k, p]) => <button key={k} className={page === k ? 'on' : ''} onClick={() => { if (!dirty || confirm('Leave without saving?')) setPage(k) }}>{p.name}</button>)}</div>
      <section className="ad-card ad-content">
        {P.fields.map(([k, label, type = 'text', hint]) => (
          <div key={k} className="ad-cf">
            {type === 'image' ? <ImagePick label={label} value={v[k]} onChange={val => set(k, val)} folder="content" />
              : type === 'faq' ? <FaqEditor value={v[k] || []} onChange={val => set(k, val)} />
              : type === 'cards' ? <CardsEditor value={v[k] || []} onChange={val => set(k, val)} cols={cols} />
              : type === 'gallery' ? <Gallery value={v[k] || []} onChange={val => set(k, val)} folder="waitlist" />
              : type === 'swatches' ? <Field label={label}><Swatches value={v[k] || []} onChange={val => set(k, val)} presets={k === 'colours' ? COLOUR_PRESETS : []} /></Field>
              : <Field label={label} hint={hint}>{type === 'area'
                ? <textarea rows={k.length < 10 && page === 'policies' ? 9 : 3} value={v[k] ?? ''} onChange={e => set(k, e.target.value)} />
                : <input value={v[k] ?? ''} onChange={e => set(k, e.target.value)} />}</Field>}
            {JSON.stringify(v[k]) !== JSON.stringify(CONTENT[page][k]) && <button className="ad-reset" onClick={() => reset(k)}>Reset to original</button>}
          </div>
        ))}
      </section>
      <footer className="ad-sticky">
        {P.view && <a className="ad-btn" href={P.view} target="_blank" rel="noreferrer">View page ↗</a>}
        <span className="ad-muted small">{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
        <button className="ad-btn dark" onClick={save} disabled={!dirty || busy}>{busy ? 'Saving…' : 'Save ' + P.name}</button>
      </footer>
    </div>
  )
}

// Homepage carousel: several cards can open the same collection, each with its own photo and line
function CardsEditor({ value, onChange, cols }) {
  const set = (i, patch) => onChange(value.map((c, j) => j === i ? { ...c, ...patch } : c))
  const move = (i, d) => { const v = [...value]; [v[i], v[i + d]] = [v[i + d], v[i]]; onChange(v) }
  const name = s => cols.find(c => c.slug === s)?.name
  return (
    <div className="ad-field">
      <span>Collections carousel cards <em>({value.length} cards · each opens a collection; empty photo or line uses the collection’s own)</em></span>
      <div className="ad-cards">
        {value.map((c, i) => (
          <div key={i} className={'ad-cardrow' + (name(c.collection) ? '' : ' warn')}>
            <span className="ad-cardnum">{i + 1}</span>
            <ImagePick label="Photo" value={c.image} onChange={image => set(i, { image })} folder="content" />
            <div className="ad-cardfields">
              <Field label="Opens collection">
                <select value={c.collection} onChange={e => set(i, { collection: e.target.value })}>
                  {!name(c.collection) && <option value={c.collection}>Missing: {c.collection}</option>}
                  {cols.map(o => <option key={o.slug} value={o.slug}>{o.name}</option>)}
                </select>
              </Field>
              <Field label="Line under the name" hint="(optional)"><input value={c.text || ''} onChange={e => set(i, { text: e.target.value })} placeholder={cols.find(o => o.slug === c.collection)?.tagline || ''} /></Field>
              <div className="ad-row">
                <button type="button" className="ad-btn sm" disabled={i === 0} onClick={() => move(i, -1)}>↑ Up</button>
                <button type="button" className="ad-btn sm" disabled={i === value.length - 1} onClick={() => move(i, 1)}>↓ Down</button>
                <button type="button" className="ad-btn sm danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="ad-btn" onClick={() => onChange([...value, { collection: cols[0]?.slug || 'bespoke', image: '', text: '' }])}>+ Add card</button>
      </div>
    </div>
  )
}

// FAQ: question + answer pairs, reorderable; empty list hides the section
function FaqEditor({ value, onChange }) {
  const set = (i, patch) => onChange(value.map((c, j) => j === i ? { ...c, ...patch } : c))
  const move = (i, d) => { const v = [...value]; [v[i], v[i + d]] = [v[i + d], v[i]]; onChange(v) }
  return (
    <div className="ad-field">
      <span>FAQ: questions and answers <em>({value.length} · remove them all to hide the FAQ)</em></span>
      <div className="ad-cards">
        {value.map((f, i) => (
          <div key={i} className="ad-cardrow faqrow">
            <span className="ad-cardnum">{i + 1}</span>
            <div className="ad-cardfields">
              <Field label="Question"><input value={f.q} onChange={e => set(i, { q: e.target.value })} /></Field>
              <Field label="Answer"><textarea rows={3} value={f.a} onChange={e => set(i, { a: e.target.value })} /></Field>
              <div className="ad-row">
                <button type="button" className="ad-btn sm" disabled={i === 0} onClick={() => move(i, -1)}>↑ Up</button>
                <button type="button" className="ad-btn sm" disabled={i === value.length - 1} onClick={() => move(i, 1)}>↓ Down</button>
                <button type="button" className="ad-btn sm danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>Remove</button>
              </div>
            </div>
          </div>
        ))}
        <button type="button" className="ad-btn" onClick={() => onChange([...value, { q: '', a: '' }])}>+ Add question</button>
      </div>
    </div>
  )
}
