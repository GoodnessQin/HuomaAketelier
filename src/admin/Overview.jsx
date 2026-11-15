import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase.js'
import { naira } from './parts.jsx'

const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days'], [365, '12 months']]

// Single-series bar chart (one hue, rounded data-ends, hover tooltip, table fallback via title)
function Bars({ data, value, fmt, label }) {
  const [hi, setHi] = useState(null)
  const max = Math.max(1, ...data.map(d => d[value]))
  const W = 640, H = 160, gap = 2, bw = Math.max(2, (W - gap * (data.length - 1)) / Math.max(1, data.length))
  const total = data.reduce((s, d) => s + d[value], 0)
  return (
    <figure className="ad-chart">
      <figcaption><span>{label}</span><b>{fmt(total)}</b></figcaption>
      <div className="ad-chart-wrap" onMouseLeave={() => setHi(null)}>
        <svg viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={`${label}: ${fmt(total)} in total`} preserveAspectRatio="none">
          <line x1="0" x2={W} y1={H} y2={H} className="base" />
          {data.map((d, i) => {
            const h = d[value] ? Math.max(3, (d[value] / max) * (H - 8)) : 0
            const x = i * (bw + gap)
            return (
              <g key={d.day} onMouseEnter={() => setHi(i)}>
                <rect x={x} y="0" width={bw + gap} height={H} fill="transparent" />
                {h > 0 && <path className={'bar' + (hi === i ? ' on' : '')} d={`M${x},${H} v${-(h - Math.min(4, bw / 2))} q0,-${Math.min(4, bw / 2)} ${Math.min(4, bw / 2)},-${Math.min(4, bw / 2)} h${bw - 2 * Math.min(4, bw / 2)} q${Math.min(4, bw / 2)},0 ${Math.min(4, bw / 2)},${Math.min(4, bw / 2)} v${h - Math.min(4, bw / 2)} z`} />}
              </g>
            )
          })}
        </svg>
        {hi !== null && data[hi] && (
          <div className="ad-tip" style={{ left: `${((hi + 0.5) / data.length) * 100}%` }}>
            <small>{new Date(data[hi].day).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</small><b>{fmt(data[hi][value])}</b>
          </div>
        )}
        <div className="ad-axis"><span>{data[0] && new Date(data[0].day).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</span><span>Today</span></div>
      </div>
    </figure>
  )
}

export default function Overview() {
  const [days, setDays] = useState(30)
  const [s, setS] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    setS(null)
    supabase.rpc('admin_stats', { p_days: days }).then(({ data, error }) => { if (error) setErr(error.message); else setS(data) })
  }, [days])
  if (err) return <div className="ad-page"><h1>Overview</h1><p className="ad-err">Could not load analytics: {err}. Have you run <code>supabase/store.sql</code>?</p></div>
  const f = s?.funnel || {}
  const steps = [['Viewed a piece', f.product_view], ['Added to bag', f.add_to_bag], ['Started checkout', f.begin_checkout], ['Paid', f.purchase]]
  const conv = s && s.visitors ? ((f.purchase || 0) / s.visitors * 100).toFixed(1) + '%' : '–'
  return (
    <div className="ad-page">
      <header className="ad-head">
        <h1>Overview</h1>
        <div className="ad-seg" role="radiogroup" aria-label="Date range">
          {RANGES.map(([d, l]) => <button key={d} role="radio" aria-checked={days === d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>{l}</button>)}
        </div>
      </header>
      {!s ? <p className="ad-muted">Loading…</p> : <>
        <div className="ad-kpis">
          <div><small>Revenue</small><b>{naira(s.revenue)}</b></div>
          <div><small>Paid orders</small><b>{s.orders}</b></div>
          <div><small>Average order</small><b>{naira(s.aov)}</b></div>
          <div><small>Visitors</small><b>{s.visitors}</b></div>
          <div><small>Conversion</small><b>{conv}</b></div>
          <Link to="/admin/orders" className="warn"><small>To fulfil</small><b>{s.to_fulfil}</b></Link>
        </div>
        <div className="ad-grid2">
          <Bars data={s.daily} value="revenue" fmt={naira} label="Revenue by day" />
          <Bars data={s.daily} value="visitors" fmt={n => n.toLocaleString()} label="Visitors by day" />
        </div>
        <div className="ad-grid3">
          <section className="ad-card">
            <h2>Shopping funnel</h2>
            <p className="ad-muted small">Unique visitors at each step</p>
            <ul className="ad-funnel">{steps.map(([l, n]) => (
              <li key={l}><span>{l}</span><b>{n || 0}</b><i style={{ width: `${steps[0][1] ? ((n || 0) / steps[0][1]) * 100 : 0}%` }} /></li>
            ))}</ul>
          </section>
          <section className="ad-card">
            <h2>Best sellers</h2>
            {s.top_products.length ? <ol className="ad-rank">{s.top_products.map(p => <li key={p.name}><span>{p.name}</span><em>{p.qty} sold</em><b>{naira(p.revenue)}</b></li>)}</ol> : <p className="ad-muted">No sales in this period yet.</p>}
            <h2 className="mt">Most viewed</h2>
            {s.most_viewed.length ? <ol className="ad-rank">{s.most_viewed.map(p => <li key={p.name}><span>{p.name}</span><b>{p.views} views</b></li>)}</ol> : <p className="ad-muted">No views yet.</p>}
          </section>
          <section className="ad-card">
            <h2>Studio</h2>
            <ul className="ad-facts">
              <li><Link to="/admin/waitlist">Waitlist reservations</Link><b>{s.waitlist_total}</b><em>+{s.waitlist_new} this period</em></li>
              <li><Link to="/admin/subscribers">Newsletter subscribers</Link><b>{s.subscribers}</b></li>
              <li><Link to="/admin/inquiries">New inquiries</Link><b>{s.inquiries_new}</b></li>
              <li><span>Page views</span><b>{s.page_views}</b></li>
            </ul>
            <h2 className="mt">Low stock</h2>
            {s.low_stock.length ? <ul className="ad-rank">{s.low_stock.map(p => <li key={p.name}><span>{p.name}</span><b className={p.stock ? '' : 'red'}>{p.stock ? `${p.stock} left` : 'Sold out'}</b></li>)}</ul> : <p className="ad-muted">Nothing running low.</p>}
          </section>
        </div>
      </>}
    </div>
  )
}
