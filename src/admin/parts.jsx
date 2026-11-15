import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase.js'

export const naira = n => '₦' + Number(n || 0).toLocaleString('en-NG')
export const date = d => d ? new Date(d).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–'
export const slugify = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

export function downloadCsv(name, head, rows) {
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const blob = new Blob(['﻿' + [head.map(cell).join(','), ...rows.map(r => r.map(cell).join(','))].join('\n')], { type: 'text/csv' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click()
}

// Toasts
let push = () => {}
export const toast = (text, bad) => push({ text, bad, id: Math.random() })
export function Toasts() {
  const [list, setList] = useState([])
  useEffect(() => { push = t => { setList(l => [...l, t]); setTimeout(() => setList(l => l.filter(x => x.id !== t.id)), 3800) } }, [])
  return <div className="ad-toasts" aria-live="polite">{list.map(t => <p key={t.id} className={t.bad ? 'bad' : ''}>{t.text}</p>)}</div>
}

// Shrinks big phone photos before upload (max 1800px, WebP) so pages stay fast
async function shrink(file, max = 1800) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file
  const bmp = await createImageBitmap(file)
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return await new Promise(r => c.toBlob(b => r(b || file), 'image/webp', 0.86))
}
export async function upload(file, folder = 'uploads') {
  const blob = await shrink(file)
  const ext = blob.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: blob.type || file.type, cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
}

export function ImagePick({ value, onChange, folder, label = 'Image' }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const pick = async e => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setBusy(true)
    try { onChange(await upload(f, folder)); toast('Image uploaded') } catch (err) { toast('Upload failed: ' + err.message, true) }
    setBusy(false)
  }
  return (
    <div className="ad-field">
      <span>{label}</span>
      <div className="ad-img1">
        <div className="ad-thumb" style={{ backgroundImage: value ? `url(${value})` : 'none' }}>{!value && 'No image'}</div>
        <div className="ad-img1-act">
          <button type="button" className="ad-btn" onClick={() => ref.current.click()} disabled={busy}>{busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}</button>
          <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder="or paste an image link" />
        </div>
        <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
      </div>
    </div>
  )
}

export function Gallery({ value = [], onChange, folder }) {
  const ref = useRef(null)
  const [busy, setBusy] = useState(0)
  const add = async e => {
    const files = [...(e.target.files || [])]; e.target.value = ''
    setBusy(files.length)
    const urls = []
    for (const f of files) { try { urls.push(await upload(f, folder)) } catch (err) { toast('Upload failed: ' + err.message, true) } setBusy(n => n - 1) }
    if (urls.length) { onChange([...value, ...urls]); toast(`${urls.length} image${urls.length > 1 ? 's' : ''} added`) }
  }
  const move = (i, d) => { const v = [...value]; [v[i], v[i + d]] = [v[i + d], v[i]]; onChange(v) }
  return (
    <div className="ad-field">
      <span>Photos <em>(the first photo is the cover)</em></span>
      <div className="ad-gal">
        {value.map((src, i) => (
          <figure key={src + i} style={{ backgroundImage: `url(${src})` }}>
            {i === 0 && <b>Cover</b>}
            <figcaption>
              <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move left">←</button>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
              <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label="Move right">→</button>
            </figcaption>
          </figure>
        ))}
        <button type="button" className="ad-gal-add" onClick={() => ref.current.click()} disabled={busy > 0}>{busy ? `Uploading ${busy}…` : '+ Add photos'}</button>
        <input ref={ref} type="file" accept="image/*" multiple hidden onChange={add} />
      </div>
    </div>
  )
}

export const Field = ({ label, hint, children }) => <label className="ad-field"><span>{label}{hint && <em> {hint}</em>}</span>{children}</label>
export const Toggle = ({ on, onChange, label }) => (
  <button type="button" role="switch" aria-checked={!!on} className={'ad-toggle' + (on ? ' on' : '')} onClick={() => onChange(!on)}><i />{label}</button>
)
export function Modal({ title, onClose, children, wide }) {
  useEffect(() => { const k = e => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k) }, [onClose])
  return (
    <div className="ad-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={'ad-modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button onClick={onClose} aria-label="Close">×</button></header>
        <div className="ad-modal-body">{children}</div>
      </div>
    </div>
  )
}

// Colour list editor used by products and the waitlist piece
export function Swatches({ value = [], onChange, presets = [] }) {
  const [name, setName] = useState(''); const [hex, setHex] = useState('#000000')
  const has = n => value.some(c => c.name.toLowerCase() === n.toLowerCase())
  return (
    <div className="ad-sw">
      <div className="ad-sw-list">
        {value.map((c, i) => (
          <span key={c.name} className="ad-sw-chip">
            <i style={{ background: c.hex }} />
            <input value={c.name} onChange={e => onChange(value.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} aria-label="Colour name" />
            <input type="color" value={c.hex} onChange={e => onChange(value.map((x, j) => j === i ? { ...x, hex: e.target.value } : x))} aria-label="Colour" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Remove ${c.name}`}>✕</button>
          </span>
        ))}
        {!value.length && <em className="ad-muted">No colours: the customer won’t be asked to choose one.</em>}
      </div>
      <div className="ad-sw-add">
        {presets.filter(([n]) => !has(n)).map(([n, h]) => <button type="button" key={n} onClick={() => onChange([...value, { name: n, hex: h }])}><i style={{ background: h }} />{n}</button>)}
        <span className="ad-sw-new">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="New colour name" />
          <input type="color" value={hex} onChange={e => setHex(e.target.value)} aria-label="New colour" />
          <button type="button" className="ad-btn" disabled={!name.trim() || has(name.trim())} onClick={() => { onChange([...value, { name: name.trim(), hex }]); setName('') }}>Add</button>
        </span>
      </div>
    </div>
  )
}
