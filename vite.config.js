import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Link previews (WhatsApp, Instagram, X, Google) need the full web address of the share image.
// Set VITE_SITE_URL in Vercel (e.g. https://huoma.com). If it's missing, Vercel's own production address is used.
const site = () => {
  const u = process.env.VITE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : '')
  return u.replace(/\/$/, '')
}
const siteUrl = () => ({ name: 'site-url', transformIndexHtml: { order: 'pre', handler: html => html.replaceAll('%SITE%', site()) } })

// Accept Supabase's own variable names (NEXT_PUBLIC_...) as well as VITE_...
export default defineConfig({ plugins: [react(), siteUrl()], envPrefix: ['VITE_', 'NEXT_PUBLIC_'] })
