import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetDemo } from './supabase.js'

// Only in the demo build: a small tab with tips for walking through the site
export default function DemoBar() {
  const [open, setOpen] = useState(() => !sessionStorage.getItem('huoma.demo.seen'))
  const close = () => { sessionStorage.setItem('huoma.demo.seen', '1'); setOpen(false) }
  if (!open) return <button className="demo-tab" onClick={() => setOpen(true)}>Demo</button>
  return (
    <aside className="demo-panel" aria-label="Demo notes">
      <header><b>Demo mode</b><button onClick={close} aria-label="Close">×</button></header>
      <p>No backend: everything saves in this browser only. No real payments, no emails.</p>
      <ul>
        <li><b>Shop:</b> <Link to="/shop" onClick={close}>browse pieces</Link>, add to bag, check out.</li>
        <li><b>Payment:</b> a pretend Paystack window appears. Press Pay.</li>
        <li><b>Sign in:</b> any email, then any 6 digits (e.g. 123456).</li>
        <li><b>Admin:</b> <Link to="/admin" onClick={close}>/admin</Link> with any email and password.</li>
        <li><b>Waitlist:</b> <Link to="/waitlist" onClick={close}>/waitlist</Link> and <Link to="/odogwu" onClick={close}>/odogwu</Link>.</li>
      </ul>
      <button className="demo-reset" onClick={() => confirm('Clear all demo orders, edits, bag and sign-in?') && resetDemo()}>Reset demo data</button>
    </aside>
  )
}
