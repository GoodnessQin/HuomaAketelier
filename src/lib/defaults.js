// Default words and pictures for every page. Anything saved in /admin > Content replaces these.
// Demo pieces are only used in preview mode (no Supabase keys), so the design can be checked locally.

export const COLOUR_PRESETS = [
  ['Ivory', '#EAE5D1'], ['Ink black', '#161616'], ['Oxblood', '#5C1A14'], ['Royal blue', '#1B4A9A'],
  ['Gold', '#B48A2A'], ['Forest green', '#2B4A36'], ['Navy blue', '#0E1531'],
]
export const SIZE_PRESETS = ['XS', 'S', 'M', 'L', 'XL']

export const CONTENT = {
  settings: {
    mode: 'waitlist', // 'waitlist' keeps the waitlist on the homepage; 'store' opens the shop
    whatsapp: '', email: 'studio@huoma.com', instagram: 'huoma.akwetelier',
  },
  home: {
    hero_image: '/seed/home-hero.jpg',
    hero_eyebrow: 'Handwoven Akwete · Southeastern Nigeria',
    hero_title: 'Timeless threads of Luxury Heritage',
    hero_subtitle: 'Contemporary Elegance born on the loom',
    hero_cta: 'Explore Pieces',
    waitlist_cta: 'Join the Odogwu (ODG) waitlist', // clear this in admin to hide the button
    waitlist_link: '/odogwu',
    collections_eyebrow: 'The collections',
    collections_title: 'Choose your way into the cloth.',
    // Carousel cards. Each one opens a collection; several cards can open the same collection.
    // Leave the photo or line empty to use the collection's own.
    cards: [
      { collection: 'bespoke', image: '/seed/loom.jpg', text: '' },
      { collection: 'ready-to-wear', image: '/seed/hat.jpg', text: '' },
      { collection: 'mesh-accessories', image: '/seed/mesh.jpg', text: '' },
      { collection: 'bespoke', image: '/seed/nne-full.jpg', text: 'Cut to your measure, from the weave you choose.' },
      { collection: 'ready-to-wear', image: '/seed/udo2.jpg', text: 'Handwoven Akwete you can wear this week.' },
      { collection: 'mesh-accessories', image: '/seed/mesh2.jpg', text: 'Woven details to finish the look.' },
      { collection: 'bespoke', image: '/seed/house.jpg', text: 'Woven by hand in Akwete, shaped for you alone.' },
      { collection: 'ready-to-wear', image: '/hero-wide.png', text: 'Akwete for every day, not only the big ones.' },
      { collection: 'mesh-accessories', image: '/seed/oma.jpg', text: 'Colour and texture you can carry.' },
      { collection: 'bespoke', image: '/seed/story-hero.jpg', text: 'For the occasions you will remember.' },
    ],
    featured_eyebrow: 'Featured pieces',
    featured_title: 'Made to hold your story.',
    steps: 'Loom\nWeave\nCut\nPiece',
    house_image: '/seed/house.jpg',
    house_eyebrow: 'The house',
    house_title: 'Material first. Always.',
    house_text: "Huoma Akwetelier is a contemporary fashion brand reimagining Nigeria's Akwete cloth through modern design and global storytelling. Each piece begins on a loom and ends in refined form, honouring the women who preserve this heritage while presenting it to the world as timeless luxury.",
    house_cta: 'Read our story',
    faq_title: 'FAQ',
    faq_intro: 'For pieces, press, partnerships and custom orders, we will be glad to hear from you.',
    faq: [
      { q: 'How long does a bespoke piece take?', a: 'Bespoke pieces are woven and cut after your order is confirmed, and usually take 4–6 weeks before dispatch. We send progress notes by WhatsApp along the way.' },
      { q: 'How do I give my measurements?', a: 'On the piece page, choose “My measurement” and enter six measurements in centimetres or inches. If you are unsure how to measure, message us on WhatsApp and we will guide you.' },
      { q: 'How much is delivery, and how long does it take?', a: 'Within Lagos: 2–3 working days. Within Nigeria: 3–6 working days. International: 6–10 working days after dispatch. The exact fee is shown at checkout before you pay.' },
      { q: 'Do you deliver outside Nigeria?', a: 'Yes. Choose your country at checkout and International delivery is applied. Any customs duties in your country are paid on arrival.' },
      { q: 'How can I pay?', a: 'By card or bank transfer, securely through Paystack. Your card details are entered on Paystack and never reach our site.' },
      { q: 'Can I return or exchange a piece?', a: 'Ready-to-wear and accessories can be returned within 7 days, unworn with tags. Bespoke pieces are made for you, so they can only be returned if they arrive damaged or differ from your order. See our Refund Policy for details.' },
      { q: 'How do I care for Akwete cloth?', a: 'Dry clean, or hand wash gently in cold water. Dry in the shade and iron on the reverse. Handwoven cloth softens beautifully with wear.' },
    ],
    letters_eyebrow: 'Letters from the loom',
    letters_title: 'Stay close to the cloth.',
    letters_text: 'New pieces, making notes and stories from Akwete, shared quietly.',
  },
  shop: {
    title: 'Pieces for the present.',
    subtitle: 'Contemporary silhouettes, grounded in the character of handwoven Akwete.',
    popular: 'Bespoke\nWoven jackets\nMesh & Accessories',
  },
  story: {
    hero_image: '/seed/story-hero.jpg',
    hero_title: 'A cloth that speaks.',
    s1_label: 'Inheritance',
    s1_title: 'Woven knowledge, carried forward.',
    s1_text: 'Akwete is a handwoven textile from southeastern Nigeria, traditionally woven by Akwete women. Known for its strength, symbolism and intricate patterns, it has been worn for generations and passed down as family heirlooms.',
    s2_image: '/seed/hands.jpg',
    s2_eyebrow: 'Honouring the hands',
    s2_title: 'The women at the loom',
    s2_text: 'For generations, Akwete women have held the knowledge of the loom, passing techniques, symbols and stories from mother to daughter.\nHuoma Akwetelier works from a place of respect: valuing handwork, naming provenance, and allowing the cloth to lead every silhouette.',
    s2_cta: 'See the pieces',
  },
  contact: {
    title: 'Begin a conversation',
    subtitle: 'For pieces, press, partnerships and custom orders, we will be glad to hear from you.',
    inquiry_title: 'Custom order inquiry',
    success_title: 'Message received',
    success_text: 'Our studio will reply soon',
  },
  confirmed: {
    title: 'The thread continues',
    text: 'Thank you. Your order has been received and a confirmation has been sent to your email and WhatsApp.',
    next_title: 'What happens next',
    step1_title: 'We confirm your cloth', step1_text: 'Our studio checks your selected weave and piece.',
    step2_title: 'Your piece is prepared', step2_text: 'Ready-to-wear dispatches within 1–2 working days. Bespoke pieces take 4–6 weeks.',
    step3_title: 'Your piece is on its way', step3_text: 'We send tracking and progress notes by WhatsApp.',
  },
  policies: {
    refund: 'Bespoke pieces are cut and woven for you after your order is confirmed, so they cannot be returned or exchanged unless they arrive damaged or differ from what you ordered.\n\nReady-to-wear and accessories can be returned within 7 days of delivery, unworn and with tags attached. Contact the studio first so we can arrange the return.\n\nApproved refunds are paid back through Paystack to the original payment method. Banks can take 5–10 working days to show the refund.',
    shipping: 'Within Lagos: 2–3 working days. Within Nigeria: 3–6 working days. International: 6–10 working days after dispatch.\n\nBespoke pieces are made after your order is confirmed and usually take 4–6 weeks before dispatch. Ready-to-wear dispatches within 1–2 working days.\n\nWe send tracking and progress notes by WhatsApp. International customers are responsible for any customs duties in their country.',
    privacy: 'We collect only what we need to serve you: your name, email address, WhatsApp number, delivery address and order details. We use them to confirm reservations and orders, to keep you updated, to deliver your piece and to answer your questions. With your consent, we may also send you news about new pieces.\n\nWe do not sell your information. We share it only with the services that help us run the store, such as payment providers (Paystack) and couriers. Card details are entered on Paystack and never reach our servers.\n\nYou can ask us to see, correct or delete your information at any time by emailing the studio.',
    terms: 'By placing an order you agree to these terms. Prices are shown in Nigerian naira and include the cost of the piece; delivery is added at checkout.\n\nAn order is confirmed once payment is received. Because Akwete is handwoven, small variations in pattern and colour are part of the cloth and are not defects.\n\nWe may cancel and fully refund an order if a piece becomes unavailable.',
    copyright: 'All designs, patterns, photographs and text on this site belong to Huoma Akwetelier. Our Akwete compositions are original and may not be copied, reproduced or sold without written permission.',
  },
  waitlist: {
    hero_title: 'Cloth with a memory.',
    hero_subtitle: 'Contemporary Nigerian form, beginning on the loom.',
    piece_name: 'Odogwu (ODG) aka Ísī Ọ́dụ̀m',
    piece_copy: 'Odogwu (ODG) is our first original design line, made for men. Akwete cloth marked with the lion head, a classic of Igbo menswear, composed in our own pattern and woven by hand in southeastern Nigeria. Choose your colour and hold your place.',
    gallery: ['/hero.png', '/hero.png', '/hero.png', '/hero.png'],
    colours: COLOUR_PRESETS.map(([name, hex]) => ({ name, hex })),
    lion_heads: [{ name: 'Gold', hex: '#D3AF37' }, { name: 'Silver', hex: '#B0AFAC' }, { name: 'Black', hex: '#000000' }],
    fabric_includes: '2 wrappers', fabric_each: '2.5 yards (trouser length)', fabric_total: '5 yards',
    reserve_title: 'Hold your place.',
    reserve_lead: "No payment today. We'll contact you before release with first access.",
    confirmed_title: "You're on the list.",
    confirmed_text: 'A confirmation email and WhatsApp message have been sent to you. The Huoma studio has also been notified of your reservation.',
  },
}

// The three collections. Add more in Admin > Collections when the range grows.
export const DEMO_COLLECTIONS = [
  ['bespoke', 'Bespoke', 'One-of-one forms, made after your order is confirmed.', 'Made for you', '/seed/loom.jpg'],
  ['ready-to-wear', 'Ready-to-Wear', 'Considered pieces available now for quick dispatch.', 'In stock', '/seed/hat.jpg'],
  ['mesh-accessories', 'Mesh & Accessories', 'Finishing pieces, ready for delivery without the wait.', 'In stock', '/seed/mesh.jpg'],
].map(([slug, name, tagline, badge, image_url], i) => ({ slug, name, tagline, badge, image_url, sort: i + 1, shop_tab: true }))
const ALL = COLOUR_PRESETS.map(([name, hex]) => ({ name, hex }))
export const DEMO_PRODUCTS = [
  { id: 'd1', slug: 'nne-column-dress', name: 'Nne Column Dress', collection: 'bespoke', tagline: 'One-of-one forms, made after your order is confirmed.', description: 'A softened column shape interrupted by a handwoven Akwete panel. Each pattern placement is singular to the cloth.', price: 285000, made_to_order: true, stock: null, lead_time: '4 weeks', colours: ALL, sizes: SIZE_PRESETS, custom_measure: true, images: ['/hero.png', '/seed/nne-full.jpg', '/seed/nne.jpg'], featured: true, sort: 1 },
  { id: 'd2', slug: 'udo-woven-jacket', name: 'Udo Woven Jacket', collection: 'ready-to-wear', tagline: 'Considered pieces available now for quick dispatch.', description: 'A cropped jacket cut from handwoven Akwete, lined and finished for everyday wear.', price: 165000, made_to_order: false, stock: 4, lead_time: '1–2 working days', colours: ALL.slice(1, 3), sizes: SIZE_PRESETS, custom_measure: false, images: ['/seed/hat.jpg', '/seed/udo2.jpg'], featured: true, sort: 2 },
  { id: 'd3', slug: 'oma-mesh-carryall', name: 'Oma Mesh Carryall', collection: 'mesh-accessories', tagline: 'Finishing pieces, ready for delivery without the wait.', description: 'A woven mesh accessory in carnival colour, finished by hand.', price: 48000, made_to_order: false, stock: 0, lead_time: '1–2 working days', colours: [], sizes: [], custom_measure: false, images: ['/seed/mesh2.jpg', '/seed/mesh.jpg'], featured: true, sort: 3 },
  { id: 'd4', slug: 'ada-wrap-gown', name: 'Ada Wrap Gown', collection: 'bespoke', tagline: 'One-of-one forms, made after your order is confirmed.', description: 'A wrap gown with an Akwete bodice, cut to your measure.', price: 320000, made_to_order: true, stock: null, lead_time: '5 weeks', colours: ALL, sizes: SIZE_PRESETS, custom_measure: true, images: ['/hero.png', '/seed/nne.jpg'], featured: true, sort: 4 },
  { id: 'd5', slug: 'obi-agbada', name: 'Obi Agbada', collection: 'bespoke', tagline: 'One-of-one forms, made after your order is confirmed.', description: 'A full agbada in handwoven Akwete, made after your order is confirmed.', price: 450000, made_to_order: true, stock: null, lead_time: '6 weeks', colours: ALL.slice(0, 4), sizes: SIZE_PRESETS, custom_measure: true, images: ['/seed/loom.jpg'], featured: false, sort: 5 },
  { id: 'd6', slug: 'ugo-mesh-bag', name: 'Ugo Mesh Bag', collection: 'mesh-accessories', tagline: 'Finishing pieces, ready for delivery without the wait.', description: 'A structured mesh bag with an Akwete strap.', price: 62000, made_to_order: false, stock: 6, lead_time: '1–2 working days', colours: ALL.slice(4, 6), sizes: [], custom_measure: false, images: ['/seed/oma.jpg'], featured: false, sort: 6 },
]
export const DEMO_DELIVERY = [
  { id: 'lagos', name: 'Within Lagos', description: '2-3 working days', fee: 5000, international: false },
  { id: 'nigeria', name: 'Within Nigeria', description: '3-6 working days', fee: 10000, international: false },
  { id: 'international', name: 'International', description: '6-10 working days', fee: 60000, international: true },
]
