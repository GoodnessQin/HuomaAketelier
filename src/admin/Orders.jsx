import { useEffect, useState } from 'react'
import { supabase, MEASURES } from '../supabase.js'
import { naira, date, downloadCsv, Modal, Field, toast } from './parts.jsx'

export const STATUS = [
  ['pending', 'Awaiting payment'], ['paid', 'Paid'], ['in_production', 'On the loom'], ['ready', 'Ready'],
  ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['cancelled', 'Cancelled'], ['refunded', 'Refunded'], ['failed', 'Payment failed'],
]
const label = s => STATUS.find(x => x[0] === s)?.[1] || s
const TABS = [['open', 'To fulfil', ['paid', 'in_production', 'ready']], ['shipped', 'Shipped', ['shipped']], ['done', 'Completed', ['delivered']],
  ['pending', 'Unpaid', ['pending', 'failed']], ['closed', 'Cancelled', ['cancelled', 'refunded']], ['all', 'All', null]]
const meas = m => m ? MEASURES.filter(([k]) => m[k]).map(([k, l]) => `${l} ${m[k]}`).join(', ') + ` (${m.unit})` + (m.notes ? ` · ${m.notes}` : '') : ''

export default function Orders() {
  const [rows, setRows] = useState(null)
  const [tab, setTab] = useState('open')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(null)
  const load = () => supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(1000)
    .then(({ data, error }) => error ? toast(error.message, true) : setRows(data))
  useEffect(() => { load() }, [])

  const t = TABS.find(x => x[0] === tab)
  const shown = (rows || []).filter(o => (!t[2] || t[2].includes(o.status)) &&
    (!q || [o.code, o.full_name, o.email, o.whatsapp, o.city, ...o.order_items.map(i => i.name)].join(' ').toLowerCase().includes(q.toLowerCase())))
  const csv = () => downloadCsv('huoma-orders.csv',
    ['Order', 'Date', 'Status', 'Name', 'Email', 'WhatsApp', 'Address', 'Delivery', 'Items', 'Subtotal', 'Delivery fee', 'Total', 'Payment', 'Tracking'],
    shown.map(o => [o.code, o.created_at, label(o.status), o.full_name, o.email, o.whatsapp, [o.street, o.city, o.state, o.country].join(', '), o.delivery_name,
      o.order_items.map(i => `${i.qty}× ${i.name} (${[i.size, i.colour].filter(Boolean).join(', ')}${i.measurements ? '; ' + meas(i.measurements) : ''})`).join(' | '),
      o.subtotal, o.delivery_fee, o.total, o.channel, o.tracking]))

  return (
    <div className="ad-page">
      <header className="ad-head">
        <h1>Orders</h1>
        <input className="ad-search" placeholder="Search order, name, email, piece…" value={q} onChange={e => setQ(e.target.value)} />
        <button className="ad-btn" onClick={load}>Refresh</button>
        <button className="ad-btn dark" onClick={csv} disabled={!shown.length}>Export CSV</button>
      </header>
      <div className="ad-tabs">{TABS.map(([k, l, st]) => (
        <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}<small>{(rows || []).filter(o => !st || st.includes(o.status)).length}</small></button>
      ))}</div>
      {!rows ? <p className="ad-muted">Loading…</p> : shown.length ? (
        <div className="ad-scroll"><table className="ad-table">
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Pieces</th><th>Delivery</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>{shown.map(o => (
            <tr key={o.id} onClick={() => setOpen(o)} className="click">
              <td><b>{o.code}</b></td><td>{date(o.created_at)}</td><td>{o.full_name}<br /><small>{o.email}</small></td>
              <td>{o.order_items.map(i => <div key={i.id}>{i.qty}× {i.name}{i.made_to_order && <em className="ad-pill">bespoke</em>}</div>)}</td>
              <td>{o.delivery_name}<br /><small>{o.city}</small></td><td>{naira(o.total)}</td>
              <td><span className={'ad-status ' + o.status}>{label(o.status)}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : <p className="ad-empty">No orders here.</p>}
      {open && <OrderDetail o={open} onClose={() => setOpen(null)} onSaved={o => { setOpen(null); setRows(r => r.map(x => x.id === o.id ? { ...x, ...o } : x)); load() }} />}
    </div>
  )
}

function OrderDetail({ o, onClose, onSaved }) {
  const [status, setStatus] = useState(o.status)
  const [tracking, setTracking] = useState(o.tracking || '')
  const [note, setNote] = useState(o.admin_note || '')
  const [busy, setBusy] = useState(false)
  async function save(notify) {
    setBusy(true)
    const { data, error } = await supabase.functions.invoke('order-update', { body: { order_id: o.id, status, tracking, admin_note: note, notify } })
    setBusy(false)
    if (error || data?.error) {
      // Fallback if the Edge Function is not deployed yet: save directly (no email)
      const { error: e2 } = await supabase.from('orders').update({ status, tracking, admin_note: note }).eq('id', o.id)
      if (e2) return toast('Could not save: ' + e2.message, true)
      toast(notify ? 'Saved, but the email was not sent (deploy the order-update function).' : 'Saved', notify)
    } else toast(notify ? (data.notified ? 'Saved. Demo: no email is sent; the live site emails the customer here.' : 'Saved. No email for this status.') : 'Saved')
    onSaved({ ...o, status, tracking, admin_note: note })
  }
  const wa = o.whatsapp.replace(/\D/g, '')
  return (
    <Modal title={`Order ${o.code}`} onClose={onClose} wide>
      <div className="ad-od">
        <section>
          <h3>Pieces</h3>
          {o.order_items.map(i => (
            <div key={i.id} className="ad-od-item">
              <span className="ad-thumb sm" style={{ backgroundImage: `url(${i.image || '/hero.png'})` }} />
              <div><b>{i.name}</b> × {i.qty}<br /><small>{[i.size, i.colour, i.made_to_order && `Made to order · ${i.lead_time || ''}`].filter(Boolean).join(' · ')}</small>
                {i.measurements && <p className="ad-meas">{meas(i.measurements)}</p>}</div>
              <span>{naira(i.unit_price * i.qty)}</span>
            </div>
          ))}
          <dl className="ad-dl">
            <div><dt>Subtotal</dt><dd>{naira(o.subtotal)}</dd></div>
            <div><dt>Delivery · {o.delivery_name}</dt><dd>{naira(o.delivery_fee)}</dd></div>
            <div className="tot"><dt>Total</dt><dd>{naira(o.total)}</dd></div>
            <div><dt>Payment</dt><dd>{o.paid_at ? `${o.channel === 'bank_transfer' ? 'Bank transfer' : 'Card'} · ${date(o.paid_at)}` : 'Not paid'}</dd></div>
            <div><dt>Paystack reference</dt><dd><code>{o.reference}</code></dd></div>
          </dl>
        </section>
        <section>
          <h3>Customer</h3>
          <p>{o.full_name}<br /><a href={`mailto:${o.email}?subject=Your Huoma order ${o.code}`}>{o.email}</a><br />
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hello ${o.full_name.split(' ')[0]}, this is Huoma Akwetelier about your order ${o.code}.`)}`} target="_blank" rel="noreferrer">WhatsApp {o.whatsapp} ↗</a></p>
          <h3>Deliver to</h3>
          <p>{o.street}<br />{o.city}, {o.state}<br />{o.country}</p>
          {o.marketing && <p className="ad-muted small">Opted in to news and offers</p>}
          <h3>Update</h3>
          <Field label="Status"><select value={status} onChange={e => setStatus(e.target.value)}>{STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Tracking / courier note"><input value={tracking} onChange={e => setTracking(e.target.value)} placeholder="e.g. GIG Logistics 12345" /></Field>
          <Field label="Private note"><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Only admins see this" /></Field>
          <div className="ad-row">
            <button className="ad-btn" disabled={busy} onClick={() => save(false)}>Save</button>
            <button className="ad-btn dark" disabled={busy} onClick={() => save(true)}>Save &amp; email customer</button>
          </div>
        </section>
      </div>
    </Modal>
  )
}
