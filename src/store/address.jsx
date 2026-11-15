import { useEffect, useRef, useState } from 'react'
import { COUNTRIES, Flag } from '../CountryPicker.jsx'

// States / regions for the countries most Huoma customers order from.
// Any other country gets a plain "State / region" box.
const S = s => s.split(',')
export const REGIONS = {
  NG: S('Abia,Adamawa,Akwa Ibom,Anambra,Bauchi,Bayelsa,Benue,Borno,Cross River,Delta,Ebonyi,Edo,Ekiti,Enugu,FCT (Abuja),Gombe,Imo,Jigawa,Kaduna,Kano,Katsina,Kebbi,Kogi,Kwara,Lagos,Nasarawa,Niger,Ogun,Ondo,Osun,Oyo,Plateau,Rivers,Sokoto,Taraba,Yobe,Zamfara'),
  GH: S('Ahafo,Ashanti,Bono,Bono East,Central,Eastern,Greater Accra,North East,Northern,Oti,Savannah,Upper East,Upper West,Volta,Western,Western North'),
  GB: S('England,Scotland,Wales,Northern Ireland'),
  US: S('Alabama,Alaska,Arizona,Arkansas,California,Colorado,Connecticut,Delaware,District of Columbia,Florida,Georgia,Hawaii,Idaho,Illinois,Indiana,Iowa,Kansas,Kentucky,Louisiana,Maine,Maryland,Massachusetts,Michigan,Minnesota,Mississippi,Missouri,Montana,Nebraska,Nevada,New Hampshire,New Jersey,New Mexico,New York,North Carolina,North Dakota,Ohio,Oklahoma,Oregon,Pennsylvania,Rhode Island,South Carolina,South Dakota,Tennessee,Texas,Utah,Vermont,Virginia,Washington,West Virginia,Wisconsin,Wyoming'),
  CA: S('Alberta,British Columbia,Manitoba,New Brunswick,Newfoundland and Labrador,Northwest Territories,Nova Scotia,Nunavut,Ontario,Prince Edward Island,Quebec,Saskatchewan,Yukon'),
  ZA: S('Eastern Cape,Free State,Gauteng,KwaZulu-Natal,Limpopo,Mpumalanga,North West,Northern Cape,Western Cape'),
  AU: S('Australian Capital Territory,New South Wales,Northern Territory,Queensland,South Australia,Tasmania,Victoria,Western Australia'),
}
export const countryName = iso => COUNTRIES.find(c => c.iso === iso)?.name || ''
export const countryIso = name => COUNTRIES.find(c => c.name.toLowerCase() === String(name || '').trim().toLowerCase())?.iso || ''
// Nigeria first, then the diaspora favourites, then everyone else A–Z
const TOP = ['NG', 'GB', 'US', 'CA', 'GH', 'ZA', 'AU', 'IE', 'DE', 'FR', 'AE']
export const COUNTRY_OPTIONS = [
  ...TOP.map(iso => COUNTRIES.find(c => c.iso === iso)).filter(Boolean),
  ...COUNTRIES.filter(c => !TOP.includes(c.iso)).sort((a, b) => a.name.localeCompare(b.name)),
].map(c => ({ value: c.iso, label: c.name, flag: c.iso }))

// Searchable dropdown that looks like the site's underlined fields
export function Picker({ name, value, onChange, options, placeholder, search = 'Search', invalid, onBlur }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [hi, setHi] = useState(0)
  const box = useRef(null), input = useRef(null), listRef = useRef(null)
  const ql = q.trim().toLowerCase()
  const list = options.filter(o => !ql || o.label.toLowerCase().includes(ql))
  const cur = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const i = list.findIndex(o => o.value === value); setHi(i < 0 ? 0 : i)
    const away = e => { if (!box.current?.contains(e.target)) { setOpen(false); onBlur?.() } }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [open]) // eslint-disable-line
  useEffect(() => { if (open) setHi(0) }, [q]) // eslint-disable-line
  useEffect(() => { listRef.current?.children[hi]?.scrollIntoView({ block: 'nearest' }) }, [hi])

  const pick = o => { onChange(o.value); setOpen(false); setQ('') }
  const key = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h + 1, list.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (list[hi]) pick(list[hi]) }
    else if (e.key === 'Escape') { setOpen(false); onBlur?.() }
  }
  return (
    <div className="cp pick" ref={box}>
      <button type="button" name={name} className={'pick-btn' + (invalid ? ' bad' : '') + (cur ? ' set' : '')} onClick={() => setOpen(o => !o)}
              aria-haspopup="listbox" aria-expanded={open} aria-invalid={!!invalid}>
        {cur?.flag && <Flag iso={cur.flag} />}
        <span>{cur ? cur.label : placeholder}</span>
        <i className="caret" />
      </button>
      {open && (
        <div className="cp-menu pick-menu" onKeyDown={key}>
          <input ref={input} className="cp-search" value={q} onChange={e => setQ(e.target.value)} placeholder={search} aria-label={search} />
          <ul role="listbox" ref={listRef}>
            {list.map((o, i) => (
              <li key={o.value} role="option" aria-selected={o.value === value} className={i === hi ? 'hi' : ''}
                  onMouseEnter={() => setHi(i)} onMouseDown={e => { e.preventDefault(); pick(o) }}>
                {o.flag && <Flag iso={o.flag} />}<span className="nm">{o.label}</span>
              </li>
            ))}
            {!list.length && <li className="none">Nothing found</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

// Country + State pair. Country is an ISO code (e.g. NG); state is the name.
export function CountryState({ country, state, onCountry, onState, errCountry, errState, onBlurCountry, onBlurState }) {
  const regions = REGIONS[country]
  return (
    <>
      <div className="f"><span>Country</span>
        <Picker name="country" value={country} onChange={v => { onCountry(v); if (v !== country) onState('') }} options={COUNTRY_OPTIONS}
                placeholder="Select country" search="Search country" invalid={errCountry} onBlur={onBlurCountry} />
        {errCountry && <p className="err" role="alert">{errCountry}</p>}
      </div>
      <div className="f"><span>{country === 'NG' ? 'State' : 'State / region'}</span>
        {regions
          ? <Picker name="state" value={state} onChange={onState} options={regions.map(r => ({ value: r, label: r }))}
                    placeholder={country === 'NG' ? 'Select state' : 'Select state / region'} search="Search" invalid={errState} onBlur={onBlurState} />
          : <input name="state" autoComplete="address-level1" placeholder="State / region" value={state} onChange={e => onState(e.target.value)} onBlur={onBlurState} className={errState ? 'bad' : ''} />}
        {errState && <p className="err" role="alert">{errState}</p>}
      </div>
    </>
  )
}
