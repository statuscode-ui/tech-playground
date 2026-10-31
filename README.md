# tech-playground

Serenity website playground.

## About

This is the **first project for Frank and Norbert**, a place to try out ideas, experiment with new tech and learn by building.

It's only the beginning. We hope many more projects follow. 🚀

## Authors

- Frank
- Norbert

---

# Serenity Haven Spa website

A mobile-first spa website with WhatsApp booking, a product catalogue, an AI chat assistant, and a secure admin dashboard. Built with **React + Vite + TypeScript + Tailwind CSS** on **Firebase** (Hosting, Firestore, Authentication, and optionally AI Logic, App Check and Storage).

## What's included

| Area | Details |
| --- | --- |
| Public pages | Home, Treatments (`/treatments`, `/treatments/:slug`), Products (`/products`, `/products/:slug`), FAQ, Contact, Privacy, Terms, 404 |
| Booking | Every treatment and product has a WhatsApp button that opens `https://wa.me/<number>?text=…` with the treatment/product, option, price, and prompts for date and time. Pages state that a booking is confirmed only once the spa replies. |
| Catalogue | Treatments with several duration/price options, offer prices, preparation and aftercare notes, and availability. Products with stock status, size, usage and ingredients, plus search, category filters and price sorting. |
| Admin (`/admin`) | Email/password sign-in. Manage treatments, products, promotions (with dates), FAQs, testimonials, enquiries and all business settings, including the single WhatsApp number used site-wide. Shows counts. Works on phones. |
| Assistant | Floating chat. With AI enabled, it uses **Firebase AI Logic (Gemini Developer API)**, grounded in the spa's currently published data. Without it, or if the AI call fails, it falls back to an automatic FAQ matcher, which is labelled as such. |
| Enquiries | Optional contact form. Validated in the browser and in security rules, with a honeypot and rate limit. Readable only by admins. |
| SEO | Per-page titles, descriptions, canonical links and Open Graph tags, plus `DaySpa` structured data, `sitemap.xml` and `robots.txt`. |

### Content status

The starter content comes only from Serenity Haven Spa's own flyers and Instagram posts: name, tagline, mission, story, phone `050 349 5079`, Oyarifa, Instagram, home-service note, and the photographed treatments (hot stone massage, facial, pedicure, waxing).

The following were **not** provided, so they are empty or marked as placeholders until the owner adds them in the dashboard:

- **Prices:** shown as "Price on request".
- **Opening hours:** the site tells visitors to check on WhatsApp.
- **Full address, Facebook and TikTok links.**
- **Products:** two placeholders, hidden when imported.
- **Testimonials:** sample reviews appear only in demo mode, clearly labelled, and are never imported.

> The price-list image supplied with the brief carries **another business's** branding and contact details ("Gracias Home Spa"), so its prices were not used.

## Costs: what stays free

Pricing changes, so check the [Firebase pricing page](https://firebase.google.com/pricing) before launch. As of this build:

| Service | Plan needed | Notes |
| --- | --- | --- |
| Hosting | Spark (free) | Free quota for storage and transfer; plenty for a small business site. |
| Cloud Firestore | Spark (free) | Free daily read/write quota. The site reads published content once per visit. |
| Authentication (email/password) | Spark (free) | |
| App Check (reCAPTCHA v3) | Spark (free) | reCAPTCHA v3 has its own free usage limits. |
| AI Logic + Gemini Developer API | Spark (free tier) | The free tier applies **only while the project is not linked to a billing account**. Rate limits apply; see the AI Logic quotas page in the console. If the project is ever upgraded to Blaze, Gemini usage becomes pay-as-you-go. |
| Cloud Storage | **Blaze (paid plan, needs a billing account)** | **Not used.** Dashboard photo uploads are stored in Firestore instead (see Photo uploads). |
| Cloud Functions | Blaze | **Not used.** |

**Trade-off:** a Cloud Function backend would allow true server-side rate limiting, but it requires Blaze. Instead, the AI runs through Firebase AI Logic, which proxies Gemini so **no Gemini API key ever reaches the browser**, and is protected by App Check and AI Logic's per-user rate limits. The browser also applies a courtesy limit (15 messages per 10 minutes), a 500-character input cap and a 400-token reply cap. These client-side checks can be bypassed by a determined attacker, so **enable App Check enforcement** before turning the AI on.

## Local development

```bash
npm install
npm run dev        # http://localhost:5173
```

Without a `.env.local`, the site runs in **demo mode** using the bundled starter content. This is useful for design work; the admin dashboard shows a "Firebase isn't connected" notice.

```bash
npm test           # unit tests (WhatsApp links, prices, promotions, FAQ matcher, validation…)
npm run test:rules # security-rules tests on the Firebase emulators (needs Java 11+)
npm run build      # typecheck + production build into dist/
```

## Firebase setup

1. **Create a project** at <https://console.firebase.google.com> (Analytics not required). Stay on the **Spark** plan.
2. **Add a Web app** (Project settings → Your apps → `</>`). Copy `.env.example` to `.env.local` and fill in the `VITE_FIREBASE_*` values. These identify the project and are not secrets; access is controlled by the rules.
3. **Firestore:** Build → Firestore Database → Create database (production mode, choose a region near Ghana such as `europe-west1`).
4. **Authentication:** Build → Authentication → Get started → enable **Email/Password** only.
5. **Install the CLI and deploy the rules:**
   ```bash
   npx firebase login
   cp .firebaserc.example .firebaserc   # then put your project id in it
   npx firebase deploy --only firestore:rules
   ```

### Create the first administrator securely

Nobody can become an admin from the website. The security rules refuse every client write to `admins/`.

1. Authentication → Users → **Add user**. Enter the owner's email and a strong password.
2. Copy the new user's **User UID**.
3. Firestore → Start collection **`admins`** → Document ID = **the UID** → add a field `email` (string). Save.
4. Visit `/admin`, sign in, and use **Add starter content** on the Overview page. Then fill in **Settings** (hours, address, prices) and press Save.

To remove an admin, delete their `admins/<uid>` document (and disable the user in Authentication).

Firebase's API still lets anyone create a sign-in account, but such an account has no admin document, so it can't read drafts or change anything. Visiting `/admin` shows "No admin access".

### App Check (strongly recommended)

1. Create a reCAPTCHA v3 key at <https://www.google.com/recaptcha/admin> for your domains (including `localhost` for testing).
2. App Check → Apps → register the web app with reCAPTCHA v3, then put the site key in `VITE_RECAPTCHA_SITE_KEY`.
3. After deploying and confirming the metrics show verified requests, turn on **Enforce** for Firestore and AI Logic.

### AI assistant (optional, free tier)

1. Console → **AI Logic** → Get started → choose **Gemini Developer API**. The console creates and stores the Gemini key on Google's side; it is never placed in this code.
2. Set the per-user rate limit in AI Logic settings, and enforce App Check (see above).
3. In `.env.local`, set `VITE_AI_ENABLED=true`. Check that `VITE_AI_MODEL` names a model the console lists as available.
4. Test it: ask "how much is a facial?". It should quote only published prices, or say the price is on request.

The assistant's instructions (`src/ai/assistant.ts`) forbid it from inventing prices, hours or policies, making or confirming bookings, diagnosing conditions, or asking for payment or personal details. Its knowledge is built from the **published** Firestore data on each page load, so editing an FAQ or a price in the dashboard updates it immediately.

### Photo uploads (free)

In the dashboard, **Upload photo** shrinks a photo in the browser (to at most 1200 px, usually 100–300 KB WebP) and stores it in the Firestore `media` collection. Treatments and products then reference it as `media:<id>`. This avoids Cloud Storage, which now requires the paid Blaze plan. The `media` rules allow public reads; only admins can add or remove photos, and only real images under about 900 KB. You can still paste an `https://` link, or use a file in `public/images/` (e.g. `/images/acrylic-nails.webp`).

## Deploy

```bash
npm run build
npx firebase deploy --only hosting,firestore
```

The site is served at `https://<project-id>.web.app`. `firebase.json` rewrites all routes to `index.html`, so deep links like `/treatments/facial` work. It also adds long-cache headers for built assets and basic security headers.

Before the first deploy, replace `serenity-haven-spa.web.app` in `public/robots.txt`, `public/sitemap.xml` and `VITE_SITE_URL` with your real URL.

### Alternative: set up and publish from a phone (Cloudflare Pages)

Firebase Hosting needs the CLI on a computer. To manage everything from a phone, host the site on **Cloudflare Pages** (free) and keep Firebase for the database and admin login. Cloudflare rebuilds the site automatically whenever `main` changes. `public/_headers` sets caching and security headers, and deep links work because the site has no `404.html`.

1. Do the Firebase setup steps above in the phone browser. In Chrome, turn on ⋮ → **Desktop site**.
2. **Security rules:** open [`firestore.rules`](firestore.rules) on GitHub, tap **Raw**, and copy everything. In Firebase, go to Firestore Database → **Rules**, replace the text, and tap **Publish**.
3. **Cloudflare:** at <https://dash.cloudflare.com> sign up, then go to **Workers & Pages → Create → Pages → Connect to Git**. Authorise GitHub and choose this repository. An owner of the `statuscode-ui` organisation may need to approve access.
   - Production branch: `main`. Framework preset: **None**. Build command: `npm run build`. Build output directory: `dist`.
   - If the dashboard only offers **Create application** (Workers), choose **Import a repository** instead. Use build command `npm run build` and deploy command `npx wrangler deploy`. `wrangler.jsonc` serves `dist/` with single-page-app routing, and the site is published at `https://tech-playground.<account>.workers.dev`.
4. Once it's live at `https://<name>.pages.dev` (or `….workers.dev`), go to Firebase → Authentication → Settings → **Authorized domains → Add domain** and add `<name>.pages.dev`. Without this, admin sign-in fails.
5. The Firebase web config comes from a committed `.env.production` file (the values are public identifiers, not secrets), so Cloudflare needs no environment variables.

### Custom domain

Hosting → **Add custom domain**, then add the DNS records it shows at your domain registrar. SSL is issued automatically. Afterwards, update `VITE_SITE_URL`, the sitemap, robots.txt, the reCAPTCHA allowed domains, and **Authentication → Settings → Authorized domains**.

## Testing the admin dashboard

1. Sign in at `/admin` with the admin account. A non-admin account should see "No admin access".
2. **Settings:** change the WhatsApp number (e.g. enter `0503495079`; it is saved as `233503495079`). Use "Test this WhatsApp number", then check that the floating button and booking buttons use the new number.
3. **Treatments:** add a price option (e.g. 60 min, 250), save, and confirm the public card and the WhatsApp message show it. Unpublish it and confirm it disappears from the site.
4. **Promotions:** create one dated today to next week, publish it, and confirm the banner appears. Set the end date to yesterday and it disappears.
5. **Enquiries:** submit the contact form while signed out, then see it under Enquiries.

## Project structure

```
src/
  admin/        dashboard (lazy-loaded): CollectionManager, field editors, settings, enquiries
  ai/           assistant prompt, knowledge builder, FAQ fallback matcher
  components/   layout, cards, chat widget, UI primitives
  data/         seed content, defaults, SiteData provider (Firestore or demo mode)
  lib/          firebase init, WhatsApp links, formatting, promotions, validation, SEO
  pages/        public pages
firestore.rules  storage.rules  firebase.json  tests/rules/
```

## Data model (Firestore)

| Collection | Public access | Purpose |
| --- | --- | --- |
| `settings/site` | read | Business profile: name, WhatsApp number, address, hours, socials, policies and assistant knowledge |
| `services` | read if `published` | Treatments with `options[]` (label, minutes, price, promoPrice) |
| `products` | read if `published` | Product catalogue |
| `faqs` | read if `published` | Approved Q&A, also used by the assistant |
| `promotions` | read if `published` | Shown only between `startDate` and `endDate` |
| `testimonials` | read if `published` | Genuine reviews only |
| `enquiries` | create only (validated) | Contact-form messages; admins read, mark handled, delete |
| `admins/{uid}` | owner read only | Admin allow-list; managed only in the console |

## Known limitations

- The sitemap lists the main pages only. Treatment and product pages are found by following links. Pages are rendered in the browser; Google indexes them, but some social networks' link previews only see the default title and image.
- One Storage-rules test (`only admins can upload images`) fails in our cloud test sandbox. There, the Storage emulator could not perform the cross-service `firestore.exists()` lookup even with Firestore fully open. All Firestore rules tests and the Storage denial tests pass. Run `npm run test:rules` on your own machine before enabling uploads.
- No online payments or calendar availability. Bookings are confirmed by the spa on WhatsApp.
