import { useEffect, useState } from 'react'
import { supabase } from '../supabase.js'
import { CONTENT } from '../lib/defaults.js'
import { Field, toast } from './parts.jsx'

export default function Settings({ me }) {
  const [s, setS] = useState(null)
  const [admins, setAdmins] = useState([])
  const [email, setEmail] = useState('')
  const loadAdmins = () => supabase.from('admins').select('email').then(({ data }) => setAdmins((data || []).map(r => r.email)))
  useEffect(() => {
    supabase.from('site_content').select('value').eq('key', 'settings').maybeSingle().then(({ data }) => setS({ ...CONTENT.settings, ...(data?.value || {}) }))
    loadAdmins()
  }, [])
  if (!s) return null
  async function save(next = s) {
    const { error } = await supabase.from('site_content').upsert({ key: 'settings', value: next })
    if (error) return toast(error.message, true)
    setS(next); toast('Settings saved')
  }
  const switchMode = mode => {
    const msg = mode === 'store'
      ? 'Open the shop? Your homepage will show the store instead of the waitlist. Make sure your pieces are published and Paystack is in live mode.'
      : 'Put the waitlist back on the homepage? The shop pages stay reachable by link.'
    if (confirm(msg)) save({ ...s, mode })
  }
  async function addAdmin(e) {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return toast('Enter a valid email', true)
    const { error } = await supabase.from('admins').insert({ email: v })
    if (error) return toast(error.message, true)
    setEmail(''); loadAdmins(); toast('Admin added. Now create their login in Supabase > Authentication > Users.')
  }
  async function removeAdmin(a) {
    if (a.toLowerCase() === me.toLowerCase()) return toast('You cannot remove yourself', true)
    if (!confirm(`Remove ${a} as admin?`)) return
    const { error } = await supabase.from('admins').delete().eq('email', a)
    if (error) return toast(error.message, true); loadAdmins()
  }
  return (
    <div className="ad-page">
      <header className="ad-head"><h1>Settings</h1></header>
      <section className="ad-card">
        <h2>Homepage</h2>
        <p className="ad-muted">Right now the homepage shows the <b>{s.mode === 'store' ? 'store' : 'waitlist'}</b>. The waitlist stays at /waitlist and the store at /store either way.</p>
        <div className="ad-seg big">
          <button className={s.mode !== 'store' ? 'on' : ''} onClick={() => s.mode === 'store' && switchMode('waitlist')}>Waitlist</button>
          <button className={s.mode === 'store' ? 'on' : ''} onClick={() => s.mode !== 'store' && switchMode('store')}>Store (open the shop)</button>
        </div>
      </section>
      <section className="ad-card">
        <h2>Contact details</h2>
        <p className="ad-muted">Used on the Contact page, the WhatsApp buttons and emails.</p>
        <div className="ad-3">
          <Field label="WhatsApp number" hint="digits with country code, e.g. 2348012345678"><input value={s.whatsapp} onChange={e => setS({ ...s, whatsapp: e.target.value.replace(/[^\d]/g, '') })} /></Field>
          <Field label="Studio email"><input type="email" value={s.email} onChange={e => setS({ ...s, email: e.target.value })} /></Field>
          <Field label="Instagram handle"><input value={s.instagram} onChange={e => setS({ ...s, instagram: e.target.value.replace(/^@/, '') })} /></Field>
        </div>
        <button className="ad-btn dark" onClick={() => save()}>Save contact details</button>
      </section>
      <section className="ad-card">
        <h2>Admins</h2>
        <p className="ad-muted">People who can open this dashboard. Each also needs a login: Supabase &gt; Authentication &gt; Users &gt; Add user (with a password).</p>
        <ul className="ad-admins">{admins.map(a => <li key={a}>{a}{a.toLowerCase() === me.toLowerCase() ? <em> (you)</em> : <button className="ad-btn sm" onClick={() => removeAdmin(a)}>Remove</button>}</li>)}</ul>
        <form className="ad-row" onSubmit={addAdmin}><input className="ad-search" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="new.admin@email.com" /><button className="ad-btn dark">Add admin</button></form>
      </section>
    </div>
  )
}
