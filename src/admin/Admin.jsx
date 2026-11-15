import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, Link } from 'react-router-dom'
import { supabase, configured } from '../supabase.js'
import { Mark } from '../store/ui.jsx'
import { Toasts } from './parts.jsx'
import Overview from './Overview.jsx'
import Orders from './Orders.jsx'
import Products from './Products.jsx'
import { Collections, Delivery } from './Catalog.jsx'
import Content from './Content.jsx'
import { Inquiries, Subscribers, Waitlist } from './People.jsx'
import Settings from './Settings.jsx'
import '../admin.css'

const NAV = [
  ['', 'Overview'], ['orders', 'Orders'], ['products', 'Pieces'], ['collections', 'Collections'], ['delivery', 'Delivery & fees'],
  ['content', 'Page content'], ['inquiries', 'Inquiries'], ['subscribers', 'Subscribers'], ['waitlist', 'Waitlist'], ['settings', 'Settings'],
]

export default function Admin() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [ok, setOk] = useState(null)
  const [cred, setCred] = useState({ email: '', password: '' })
  const [msg, setMsg] = useState('')
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    document.title = 'Admin | Huoma Akwetelier'
    if (!configured) return setReady(true)
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (!session) return setOk(null)
    supabase.rpc('is_admin').then(({ data }) => setOk(!!data))
  }, [session])

  async function login(e) {
    e.preventDefault(); setMsg('')
    const { error } = await supabase.auth.signInWithPassword(cred)
    if (error) setMsg('Sign in failed. Check your email and password.')
  }

  if (!ready) return null
  if (!configured) return <main className="ad-gate"><Mark width={60} /><h1>Admin</h1><p>Add your Supabase keys to <code>.env</code> (or Vercel) to use the dashboard.</p><Link to="/">Back to the site</Link></main>
  if (!session) return (
    <main className="ad-gate">
      <Mark width={60} />
      <form onSubmit={login}>
        <h1>Studio admin</h1>
        <label className="ad-field"><span>Email</span><input type="email" value={cred.email} onChange={e => setCred({ ...cred, email: e.target.value })} autoComplete="username" required /></label>
        <label className="ad-field"><span>Password</span><input type="password" value={cred.password} onChange={e => setCred({ ...cred, password: e.target.value })} autoComplete="current-password" required /></label>
        {msg && <p className="ad-err">{msg}</p>}
        <button className="ad-btn dark wide">Sign in</button>
      </form>
    </main>
  )
  if (ok === null) return null
  if (!ok) return (
    <main className="ad-gate">
      <Mark width={60} /><h1>Not an admin</h1>
      <p>You are signed in as <b>{session.user.email}</b>, but this email is not in the admins list. Ask an existing admin to add it in Settings, or add it in Supabase (SQL Editor): <code>insert into public.admins values ('{session.user.email}');</code></p>
      <button className="ad-btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
    </main>
  )

  return (
    <div className={'ad' + (menu ? ' menu' : '')}>
      <aside className="ad-side">
        <Link to="/admin" className="ad-brand"><Mark width={34} /><span>Huoma<br /><b>Studio</b></span></Link>
        <nav onClick={() => setMenu(false)}>
          {NAV.map(([to, l]) => <NavLink key={to} to={to ? `/admin/${to}` : '/admin'} end={!to}>{l}</NavLink>)}
        </nav>
        <div className="ad-side-foot">
          <a href="/" target="_blank" rel="noreferrer">View site ↗</a>
          <small>{session.user.email}</small>
          <button onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </aside>
      <button className="ad-burger" onClick={() => setMenu(!menu)} aria-label="Menu">{menu ? '×' : '☰'}</button>
      <main className="ad-main">
        <Routes>
          <Route index element={<Overview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="collections" element={<Collections />} />
          <Route path="delivery" element={<Delivery />} />
          <Route path="content" element={<Content />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="subscribers" element={<Subscribers />} />
          <Route path="waitlist" element={<Waitlist />} />
          <Route path="settings" element={<Settings me={session.user.email} />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
      <Toasts />
    </div>
  )
}
