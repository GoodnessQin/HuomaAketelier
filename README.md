# Huoma Akwetelier: frontend demo (no backend)

This is the full site with a **pretend backend inside the browser**, so you can walk every user flow without Supabase, Paystack or Resend. Nothing leaves the browser: no real payments, no emails, no database. Each visitor's browser has its own separate copy of the demo data.

## Put it on Vercel (5 minutes)
1. Make a new GitHub repo (e.g. `huoma-demo`) and upload these files. Don't use your waitlist repo.
2. In Vercel: **Add New › Project**, import the repo and deploy. **No environment variables needed.**
3. You get an address like `huoma-demo.vercel.app`. Optional: Settings › Deployment Protection to keep it private.
4. Optional: add `VITE_SITE_URL` = your demo address, so WhatsApp/Instagram link previews show the share picture. (Vercel usually fills this in automatically.)

Run it on a computer instead: `npm install` then `npm run dev`.

## What to try
- **Shop:** home › Explore pieces › a piece › pick colour + size (or “My measurement”) › Start your order › Confirm › Bag › Checkout.
- **Payment:** a pretend Paystack window opens. Press Pay (or Cancel to see the retry message). Card vs Bank Transfer show different windows.
- **After paying:** Order confirmed page, the bag empties, stock goes down.
- **Sign in:** `/sign-in`, any email, then any 6 digits (e.g. `123456`). Orders placed with that email show under Account.
- **Admin:** `/admin`, any email and password. Orders, pieces (prices, photos, stock), page content, delivery fees, inquiries, waitlist, settings. Changes show on the site straight away.
- **Waitlist:** `/waitlist`, `/odogwu`, `/reserve`.
- To start fresh (clear demo orders, edits, bag and sign-in), add `?reset-demo` to the address, e.g. `huoma-demo.vercel.app/?reset-demo`.

## Differences from the real site
- The pretend Paystack window replaces Paystack's real secure window.
- Emails (order confirmation, shipping updates, contact replies) are not sent.
- Photos uploaded in admin are stored in the browser; very many large photos can fill it up (use Reset).
- Sample orders, messages, visitor numbers and the 10 collections are made up so nothing looks empty. Rename or delete collections in Admin › Collections.

The real, connected version is the separate `huoma-store.zip`.
