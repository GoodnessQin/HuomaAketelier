import { useEffect, useState } from 'react'
import { supabase, MEASURES } from '../supabase.js'
import { date, downloadCsv, toast } from './parts.jsx'

export function Inquiries() {
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('new')
  const load = () => supabase.from('inquiries').select('*').order('created_at', { ascending: false }).then(({ data, error }) => error ? toast(error.message, true) : setRows(data))
  useEffect(() => { load() }, [])
  const mark = async (r, status) => { const { error } = await supabase.from('inquiries').update({ status }).eq('id', r.id); if (error) return toast(error.message, true); setRows(x => x.map(y => y.id === r.id ? { ...y, status } : y)) }
  const shown = (rows || []).filter(r => tab === 'all' || r.status === tab)
  return (
    <div className="ad-page">
      <header className="ad-head"><h1>Inquiries</h1><p className="ad-muted">Messages from the Contact page.</p><button className="ad-btn" onClick={load}>Refresh</button></header>
      <div className="ad-tabs">{[['new', 'New'], ['replied', 'Replied'], ['closed', 'Closed'], ['all', 'All']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}<small>{(rows || []).filter(r => k === 'all' || r.status === k).length}</small></button>)}</div>
      {!rows ? <p className="ad-muted">Loading…</p> : shown.length ? <div className="ad-stack">{shown.map(r => (
        <article key={r.id} className="ad-card ad-msg">
          <header><b>{r.full_name}</b><small>{date(r.created_at)}</small></header>
          {r.piece && <p className="ad-muted small">Piece or occasion: {r.piece}</p>}
          <p className="pre">{r.message}</p>
          <div className="ad-row">
            <a className="ad-btn dark" href={`mailto:${r.email}?subject=${encodeURIComponent('Re: your Huoma inquiry' + (r.piece ? ' · ' + r.piece : ''))}`} onClick={() => r.status === 'new' && mark(r, 'replied')}>Reply by email</a>
            <span className="ad-muted small">{r.email}</span>
            {r.status !== 'closed' && <button className="ad-btn" onClick={() => mark(r, 'closed')}>Close</button>}
            {r.status !== 'new' && <button className="ad-btn" onClick={() => mark(r, 'new')}>Mark as new</button>}
          </div>
        </article>
      ))}</div> : <p className="ad-empty">Nothing here.</p>}
    </div>
  )
}

export function Subscribers() {
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const load = () => supabase.from('subscribers').select('*').order('created_at', { ascending: false }).then(({ data, error }) => error ? toast(error.message, true) : setRows(data))
  useEffect(() => { load() }, [])
  const shown = (rows || []).filter(r => r.email.includes(q.toLowerCase()))
  const flip = async r => { const { error } = await supabase.from('subscribers').update({ subscribed: !r.subscribed }).eq('email', r.email); if (error) return toast(error.message, true); load() }
  return (
    <div className="ad-page">
      <header className="ad-head"><h1>Subscribers</h1><p className="ad-muted">{(rows || []).filter(r => r.subscribed).length} subscribed (newsletter, checkout and account sign-ups).</p>
        <input className="ad-search" placeholder="Search email…" value={q} onChange={e => setQ(e.target.value)} />
        <button className="ad-btn dark" onClick={() => downloadCsv('huoma-subscribers.csv', ['Email', 'Source', 'Subscribed', 'Date'], (rows || []).filter(r => r.subscribed).map(r => [r.email, r.source, 'yes', r.created_at]))}>Export CSV</button></header>
      {!rows ? <p className="ad-muted">Loading…</p> : shown.length ? <div className="ad-scroll"><table className="ad-table">
        <thead><tr><th>Email</th><th>From</th><th>Date</th><th>Status</th><th /></tr></thead>
        <tbody>{shown.map(r => <tr key={r.email}><td>{r.email}</td><td>{r.source}</td><td>{date(r.created_at)}</td><td>{r.subscribed ? 'Subscribed' : <span className="ad-muted">Unsubscribed</span>}</td><td><button className="ad-btn sm" onClick={() => flip(r)}>{r.subscribed ? 'Unsubscribe' : 'Resubscribe'}</button></td></tr>)}</tbody>
      </table></div> : <p className="ad-empty">No subscribers yet.</p>}
    </div>
  )
}

/* The original waitlist list (moved here from the old admin page) */
const code = r => 'HA-R' + String(r.id).padStart(3, '0')
const meas = r => r.measurements ? MEASURES.filter(([k]) => r.measurements[k]).map(([k, l]) => `${l} ${r.measurements[k]}`).join(', ') + ` (${r.measurements.unit})` + (r.measurements.notes ? ` | ${r.measurements.notes}` : '') : ''
export function Waitlist() {
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const load = () => supabase.from('waitlist').select('*').order('created_at', { ascending: false }).then(({ data, error }) => error ? toast('Could not load the list: ' + error.message, true) : setRows(data))
  useEffect(() => { load() }, [])
  const shown = (rows || []).filter(r => (code(r) + ' ' + Object.values(r).join(' ') + meas(r)).toLowerCase().includes(q.toLowerCase()))
  const byColour = Object.entries((rows || []).reduce((m, r) => { const k = `${r.colour} / ${r.lion_head_colour || '–'}`; m[k] = (m[k] || 0) + 1; return m }, {})).sort((a, b) => b[1] - a[1])
  const csv = () => downloadCsv('huoma-waitlist.csv', ['Reservation', 'Date', 'Piece', 'Fabric colour', 'Lion head colour', 'Size', 'Measurements', 'Name', 'Email', 'WhatsApp'],
    shown.map(r => [code(r), r.created_at, r.piece, r.colour, r.lion_head_colour || '', r.size || '', meas(r), r.full_name, r.email, r.whatsapp]))
  return (
    <div className="ad-page">
      <header className="ad-head"><h1>Waitlist</h1><p className="ad-muted">{rows?.length ?? '…'} reservations</p>
        <input className="ad-search" placeholder="Search name, email, colour…" value={q} onChange={e => setQ(e.target.value)} />
        <button className="ad-btn" onClick={load}>Refresh</button><button className="ad-btn dark" onClick={csv}>Export CSV</button></header>
      {byColour.length > 0 && <div className="ad-chips">{byColour.map(([k, n]) => <span key={k}>{k} <b>{n}</b></span>)}</div>}
      {!rows ? <p className="ad-muted">Loading…</p> : <div className="ad-scroll"><table className="ad-table">
        <thead><tr><th>Reservation</th><th>Date</th><th>Piece</th><th>Fabric colour</th><th>Lion head</th><th>Size</th><th>Measurements</th><th>Name</th><th>Email</th><th>WhatsApp</th></tr></thead>
        <tbody>{shown.map(r => (
          <tr key={r.id}><td>{code(r)}</td><td>{date(r.created_at)}</td><td>{r.piece}</td><td>{r.colour}</td><td>{r.lion_head_colour || '–'}</td><td>{r.size || '–'}</td><td className="wrap">{meas(r) || '–'}</td><td>{r.full_name}</td>
            <td><a href={`mailto:${r.email}`}>{r.email}</a></td><td><a href={`https://wa.me/${r.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{r.whatsapp}</a></td></tr>
        ))}</tbody>
      </table>{!shown.length && <p className="ad-empty">No reservations yet.</p>}</div>}
    </div>
  )
}
