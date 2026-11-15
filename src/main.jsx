import React, { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Landing, OurStory, Odogwu, Reserve, Confirmed } from './App.jsx'
import { SiteProvider, useSite } from './lib/site.jsx'
import { useReveal } from './lib/reveal.js'
import { Home, Shop, Story, Contact, Policy, NotFound, Loading } from './store/pages.jsx'
import { Piece, Confirm } from './store/piece.jsx'
import { Bag, Favourites } from './store/bag.jsx'
import { Checkout, Order } from './store/checkout.jsx'
import { SignIn, Account } from './store/account.jsx'
import './styles.css'
import './store.css'

const Admin = lazy(() => import('./admin/Admin.jsx'))

// The homepage and the story page follow the switch in /admin > Settings (waitlist or store)
function ByMode({ waitlist, store }) {
  const { content, loaded } = useSite()
  if (!loaded) return <Loading />
  return content.settings.mode === 'store' ? store : waitlist
}

function Reveal() { useReveal(); return null }

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <SiteProvider>
      <Reveal />
      <Routes>
        <Route path="/" element={<ByMode waitlist={<Landing />} store={<Home />} />} />
        <Route path="/story" element={<ByMode waitlist={<OurStory />} store={<Story />} />} />
        <Route path="/store" element={<Home />} />
        <Route path="/our-story" element={<Story />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/shop/:collection" element={<Shop />} />
        <Route path="/piece/:slug" element={<Piece />} />
        <Route path="/piece/:slug/confirm" element={<Confirm />} />
        <Route path="/bag" element={<Bag />} />
        <Route path="/favourites" element={<Favourites />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order/:reference" element={<Order />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/account" element={<Account />} />
        <Route path="/policies/:slug" element={<Policy />} />
        {/* Waitlist (kept working exactly as before) */}
        <Route path="/waitlist" element={<Landing />} />
        <Route path="/odogwu" element={<Odogwu />} />
        <Route path="/reserve" element={<Reserve />} />
        <Route path="/confirmed" element={<Confirmed />} />
        <Route path="/privacy" element={<Navigate to="/policies/privacy" replace />} />
        <Route path="/admin/*" element={<Suspense fallback={<Loading />}><Admin /></Suspense>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SiteProvider>
  </BrowserRouter>
)
