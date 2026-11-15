import { useEffect } from 'react'

// Shopify-style "slide in on scroll": sections and cards rise and fade in as they enter the screen.
// Siblings are staggered slightly. Turned off for people who ask their device for reduced motion.
const SEL = [
  '.sect>.eyebrow', '.sect>.stitle', '.rail', '.fcard', '.sect>.sbtn', '.pc', '.phead>*', '.shopbar', '.tabs',
  '.letters>*', '.stog>div', '.contact>.stitle', '.contact-sub', '.clinks a', '.sform', '.policy>*',
  '.nudge', '.ocard', '.ftr-brand', '.ftr-tag', '.confirm>.stitle', '.ctable', '.empty-s>*', '.bempty>*',
].join(',')

export function useReveal() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 })
    const scan = () => document.querySelectorAll(SEL).forEach(el => {
      if (el.dataset.rv || el.closest('.ad,.sheet,.mmenu')) return
      el.dataset.rv = '1'
      const sibs = [...el.parentElement.children].filter(c => c.matches(SEL))
      el.style.setProperty('--rv', Math.min(sibs.indexOf(el), 5) * 90 + 'ms')
      el.classList.add('rv'); io.observe(el)
    })
    scan()
    let t; const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 30) })
    mo.observe(document.getElementById('root'), { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect(); clearTimeout(t) }
  }, [])
}
