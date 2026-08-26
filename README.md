# VIINA — Setup Guide (Supabase + Netlify)

This project is a Vite + React storefront with a Super Admin panel.
Everything an admin edits (products, theme, banners, pages, bundles,
FAQs, etc.) is stored in a Supabase database, so changes are visible
to every visitor and survive across sessions — not just saved in one
browser's local state anymore.

Follow the sections in order: **1) Supabase → 2) local dev → 3) Netlify.**

---

## What's in this version

- **Real client-side routing** via `react-router-dom` — dedicated URLs
  for the home page (`/`), each product (`/product/:id`, with
  Specifications / Reviews / Related-products tabs), each category
  (`/category/:slug`), and each custom page (`/page/:slug`). The
  header and footer are part of every one of these (rendered once by
  `<Storefront>`, which every route shares), so they stay identical
  and persistent no matter which page you're on.
- **Product image upload** — the Admin Panel's image fields upload
  directly to a Supabase Storage bucket called `products` and save
  the resulting public HTTPS URL, instead of a local, this-tab-only
  blob URL or (in an earlier version of this file) just the bare
  filename. Covered by `supabase/schema.sql`.
- **Crash protection** — every content list the app renders (products,
  categories, reviews, FAQs, etc.) is guarded against Supabase
  returning something unexpected (missing, null, or malformed data),
  and a top-level error boundary shows a recoverable "something went
  wrong" screen instead of a blank page if anything still slips
  through.
- Because routing is now real paths instead of `#hash` fragments, the
  Netlify redirect in `netlify.toml` (`/* → /index.html`) is **required**
  — without it, refreshing a page like `/product/3` would 404.

---

## 1. Create your free Supabase project

1. Go to **[supabase.com](https://supabase.com)** and sign up (free tier is enough).
2. Click **New project**.
   - Give it a name (e.g. `viina-skincare`).
   - Set a database password (save it somewhere — you won't need it
     day-to-day, but keep it safe).
   - Pick the region closest to your customers.
   - Click **Create new project** and wait ~1–2 minutes for it to spin up.

### 1a. Run the database schema

1. In your new project, open the left sidebar → **SQL Editor**.
2. Click **New query**.
3. Open `supabase/schema.sql` from this project, copy its entire
   contents, and paste it into the SQL editor.
4. Click **Run**. You should see "Success. No rows returned."

This creates one table, `site_content`, with security rules so:
- **Anyone** can read the site's content (needed for the public
  storefront to load).
- **Only a signed-in admin** can write to it (this is what makes the
  admin panel actually secure, instead of a password check anyone
  could bypass in their browser's dev tools).

### 1b. Create your admin login

The admin panel now signs in with **real Supabase Auth**, not a
hardcoded password in the code.

1. In Supabase, go to **Authentication → Users**.
2. Click **Add user → Create new user**.
3. Enter the email and password you want to use to log into
   `#/viina-admin-portal`, and click **Create user**.
   - Tip: turn **Auto Confirm User** on (or confirm it manually
     afterwards) so you don't need to click an email confirmation
     link before your first login.
4. That's it — this email + password is now your admin login.

To add a second admin later, repeat this step with another email.
To change a password later, you can do it right from **Settings →
تغییر رمز عبور مدیریت** inside the admin panel once logged in.

### 1c. Get your API keys

1. In Supabase, go to **Settings → API**.
2. You'll need two values from this page:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon / public** key (under "Project API keys") → this is
     `VITE_SUPABASE_ANON_KEY`

Keep this tab open — you'll paste these into two places next.

> The `anon` key is safe to expose in client-side code (that's what
> it's for) — it's the RLS policies from step 1a that actually decide
> what it's allowed to read or write, not secrecy of the key itself.
> Never use the **service_role** key in this front-end project.

---

## 2. Run it locally

```bash
npm install
cp .env.example .env
```

Open the new `.env` file and paste in your two values from step 1c:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Then start the dev server:

```bash
npm run dev
```

Open the printed local URL. The storefront should load (empty at
first — no products yet). Go to `#/viina-admin-portal` in the URL bar,
sign in with the email/password from step 1b, and start adding
products, categories, and content. Everything you save now writes to
your Supabase database — refresh the page, or open the site in a
different browser entirely, and your changes are still there.

---

## 3. Deploy to Netlify

1. Push this project to a GitHub (or GitLab/Bitbucket) repository.
2. In Netlify: **Add new site → Import an existing project**, and
   connect that repository.
3. Netlify should auto-detect the build settings from `netlify.toml`
   (`npm run build`, publish directory `dist`) — confirm and deploy.
4. **Add the environment variables** (this is the step people most
   often miss): in your Netlify site, go to
   **Site configuration → Environment variables → Add a variable**,
   and add both:

   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | the Project URL from step 1c |
   | `VITE_SUPABASE_ANON_KEY` | the anon public key from step 1c |

5. Trigger a new deploy (**Deploys → Trigger deploy → Deploy site**) —
   environment variables only take effect on the *next* build, not
   retroactively on the current one.

Once deployed, visit `https://<your-site>.netlify.app/#/viina-admin-portal`
to log in and manage the live site. Any visitor to your Netlify URL
now sees the same content your admin panel saved to Supabase.

---

## Troubleshooting: "my admin changes don't save / the site doesn't change"

If you followed steps 1–3 and edits in the admin panel don't stick,
**log into the admin panel and look at the top bar** — as of this
version, it actively tells you what's wrong:

- A small **"در حال ذخیره…" / "ذخیره شد"** indicator appears next to
  the bell icon every time something saves.
- If saving is actually failing, a **red banner** appears right below
  the top bar with the exact error message from Supabase, plus the
  most common causes. This is the single most useful thing to check
  first — the message tells you exactly which of the causes below it is.

Walk through these in order — in practice it is almost always #1 or #2:

1. **You added the Netlify environment variables but never redeployed.**
   Environment variables only take effect on the *next* build, not the
   one that's currently live. After adding/editing them: Netlify →
   **Deploys → Trigger deploy → Deploy site**. This is the single most
   common cause of "everything looks right but nothing saves."

2. **`supabase/schema.sql` was never run** (or was run against a
   different Supabase project than the one your env vars point to).
   Without it, the `site_content` table doesn't exist and every save
   fails. Go to Supabase → **SQL Editor** and confirm you ran it —
   error message would mention `relation "site_content" does not exist`.

3. **Wrong values in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.**
   Double-check both against Supabase → **Settings → API** — a typo'd
   URL or key produces errors like `Failed to fetch` or `Invalid API key`.
   Also confirm there's no extra space or quote mark pasted in by
   accident, and that you used the **anon / public** key, not
   `service_role`.

4. **You're not actually signed in as an admin**, or your Supabase
   Auth user was never created / isn't confirmed. Writes require an
   `authenticated` session (see the RLS policy in `schema.sql`) — if
   login itself silently fails, so will every save afterward. Go to
   Supabase → **Authentication → Users** and confirm your user exists
   and **Email Confirmed** is checked (or re-create it with **Auto
   Confirm User** turned on).

5. **The RLS policies weren't created**, or were edited/removed after
   running the schema. In Supabase, go to **Table Editor → site_content
   → RLS policies** and confirm both `"Public can read site content"`
   and `"Only signed-in admins can write site content"` are listed and
   enabled. The error message for this case specifically says
   `new row violates row-level security policy`.

6. **You're looking at a cached page.** After confirming a save
   succeeded (green "ذخیره شد"), do a hard refresh (Ctrl/Cmd+Shift+R)
   on the storefront tab, since some browsers aggressively cache a
   single-page app's JS bundle.

If the red banner shows an error message not covered above, that exact
message is the fastest way to search Supabase's docs/Discord for the
specific fix.

## How content sync works (for reference)

- Every admin-editable section (products, categories, theme, header,
  footer, banner, hero, FAQs, custom pages, routine bundles, quiz
  builder, rewards, etc.) is stored as **one row per section** in the
  `site_content` table, as `{ id: '<section name>', data: <JSON> }`.
- On load, the app fetches every row in a single query and uses it to
  fill in each section's starting state — so there's no flash of
  empty/default content before the real data arrives.
- Every time an admin changes something, that section's row is saved
  back to Supabase automatically (with a short debounce so fast
  typing doesn't fire a save per keystroke). There's no separate
  "Publish" button to remember to click.
- The shopping cart and the currently-logged-in customer are **not**
  synced this way — those are per-visitor session state, not site
  content, and stay local to each browser as before.

## Known limitations / good next steps

- **No image uploads yet.** Product/banner images are still entered
  as URLs (e.g. paste a link to an image hosted elsewhere). Adding
  real file uploads would mean wiring up **Supabase Storage** — a
  reasonable next step, but a separate piece of work from the content
  database covered here.
- **Single shared admin database.** All admins share one
  `site_content` table with full read/write access to everything —
  there's no per-user permission granularity (e.g. "this admin can
  only edit products, not payments"). Fine for a small team; would
  need its own design for a larger one.
- **No server-side rendering.** This is a client-rendered single-page
  app, so a search engine or link-preview bot that doesn't execute
  JavaScript will only see the static `index.html` shell, not the
  dynamic SEO tags the app sets after it loads. The existing dynamic
  `<title>`/meta-tag/JSON-LD logic still helps real browsers, social
  previews that do render JS, and any crawler that executes
  JavaScript (which most major ones now do) — but true SSR (e.g.
  migrating to Next.js) would close this gap completely if search
  ranking becomes a priority.
