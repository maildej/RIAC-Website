# CLAUDE.md — nyriac.com

## About the owner

Dan runs this project. **Dan is not a developer** and knows little about web design or development. When helping him:

- Explain things in plain English; avoid jargon (or define it when unavoidable).
- Make edits for him rather than telling him how to code.
- Keep the site simple — resist adding frameworks, build tools, or JavaScript unless truly needed.
- When something requires action outside this folder (GitHub, Wix), give exact click-by-click steps.

## What this site is

Website for the **New York Regional Immigration Assistance Centers (RIAC)**. In Dan's words:

> We provide free expert legal advice and support on immigration consequences for all mandated providers in New York state — expert legal advice for public defenders and assigned counsel, analyzing the immigration consequences of the case they are representing someone in. The website is relatively basic: it primarily gives attorneys access to our contact details and downloadable practice advisories.

Audience: attorneys (public defenders, assigned counsel, mandated providers) — not the general public.

## Important constraints

- **Do not use the branding of, or link to, the NYS Office of Indigent Legal Services (ILS)** or its website (ils.ny.gov) anywhere on the site. Factual information (region/county assignments, the centers' own contact details) is fine; ILS names, logos, and links are not. Avoid external links generally.
- The six regions, their colors, and county assignments mirror the RIAC logo and are listed in `tools/build-map.py`. Region colors are defined once in `css/style.css` (`--r1`…`--r6`).

## Technical setup

- **Plain static HTML/CSS.** No build step, no JavaScript, no frameworks, no Jekyll (`.nojekyll` disables it). One external dependency: Google Fonts (Source Serif 4 + Inter) loaded via a `<link>` in each page's `<head>`.
- **Hosting:** GitHub Pages, deployed from the `main` branch of a GitHub repo.
- **Domain:** `nyriac.com`, registered at **Wix**. Wix does not allow domain transfers or nameserver changes, so DNS is managed inside Wix: A records point the apex domain to GitHub Pages' IPs, and a CNAME points `www` to the GitHub Pages address. The `CNAME` file in this folder tells GitHub Pages the custom domain. See `SETUP.md` for the exact records.

## File map

| File | Purpose |
|---|---|
| `index.html` | Landing page: hero with the **clickable region map** (inline SVG), what we do, who we serve |
| `advisories.html` | List of downloadable practice advisory PDFs |
| `contact.html` | Six region cards (`#region-1` … `#region-6`) with counties served and each center's contacts — the map links here |
| `intake.html` | Intake forms landing page: fill in online or download the PDF, for criminal and non-criminal cases |
| `intake-criminal.html` / `intake-non-criminal.html` | **Online intake forms** mirroring the PDF intake forms. A county picker routes each submission to the correct RIAC (see `js/intake-form.js`) |
| `js/intake-form.js` | Shared logic for both online intake forms: county→region map, per-region Formspree endpoints, inline thank-you telling the attorney where to email supporting documents. Region contact emails here mirror `contact.html` — keep in sync |
| `chief-defender-survey.html` | **Unlisted** survey for NY chief defenders (see "Chief Defender survey" below). `noindex`; not linked from any nav or footer — reachable only by direct URL |
| `js/chief-defender-survey.js` | Submits the survey to Formspree via `fetch` and shows an inline thank-you |
| `css/style.css` | All styling, shared by every page (brand + region colors at top in `:root`) |
| `images/riac-mark.svg` | Colored map mark used as the header logo on every page |
| `images/favicon.svg` | Browser tab icon (navy square + map) |
| `advisories/` | Drop advisory PDFs here; link them from `advisories.html`. `advisories/source/` holds internal Word (.docx) copies for editing — not linked publicly, kept out of search engines via `robots.txt` |
| `admin/` | **Secret admin page** (see "Admin CMS" below) — login-protected via GitHub, for uploading/managing advisory PDFs and Word source files |
| `tools/` | Map generator (`build-map.py` + county boundary data). **Dan can ignore this folder**; it's only needed if region/county assignments ever change. It regenerates `tools/map-inline.svg`, which is pasted into `index.html` and mirrored in `images/`. |
| `404.html` | Shown for broken links (uses absolute `/` paths) |
| `CNAME` | Custom domain for GitHub Pages — **do not delete or edit** |
| `.nojekyll` | Tells GitHub Pages to serve files as-is — **do not delete** |
| `SETUP.md` | One-time GitHub + Wix DNS setup instructions for Dan |
| `AIRTABLE.md` | Map of the RIAC case management database in Airtable — tables, interface pages, automations, and known gaps. Read this before doing any Airtable work |
| `AIRTABLE-TODO.md` | Dan's working checklist of Airtable interface jobs that only he can do (the API cannot edit interface layouts). Delete the file once empty |

## Forms (Formspree)

Two forms email their submissions through **Formspree** (formspree.io) — a free service that turns a plain HTML form into an email, so the static site needs no backend. Each form posts to a Formspree endpoint; the recipient email and reply settings live in the Formspree account, not in the site code. Submissions are sent in the background with a small `fetch` script so the visitor stays on the page and sees an inline confirmation.

| Form | Endpoint | Emails to | Subject | Handler |
|---|---|---|---|---|
| Advisory download request (`request.html`) | `formspree.io/f/mjgnrzpp` | (set in Formspree) | New RIAC advisory download request | `js/document-request.js` |
| Chief Defender survey (`chief-defender-survey.html`) | `formspree.io/f/mdaqzrpq` | RIAC2@ocbaacp.org | Chief Defender Referral Survey | `js/chief-defender-survey.js` |
| Online intake forms (`intake-criminal.html`, `intake-non-criminal.html`) | 7 endpoints, one per destination inbox — IDs live in `js/intake-form.js` | Each region's center (see SETUP.md Step 7) | "Criminal/Non-Criminal Case Intake — {County} County (Region N)", set by JS | `js/intake-form.js` |

Notes:
- The subject line and honeypot spam trap are set with hidden fields (`_subject`, `_gotcha`) in the form's HTML.
- Each Formspree form's **first** submission must be confirmed via a link Formspree emails to the recipient before later submissions are delivered.
- Free Formspree plans cap submissions at 50/month per form.

### Admin CMS (`admin/`)

An unlisted, `noindex` admin page at `admin/index.html` running **Decap CMS** (loaded from a CDN — the one exception to "no JavaScript/frameworks" in this project, isolated entirely to `/admin/`). It gives RIAC staff a real login (via GitHub — not just an unlisted-URL "secret") to upload and manage practice advisory PDFs and their internal Word source files, with built-in search across entries and a "copy URL" option on any uploaded file (for pasting into emails).

- Configuration: `admin/config.yml`. Backend is `github`, repo `maildej/nyriac.com`, branch `main`.
- Because GitHub Pages can't run server-side code, GitHub OAuth login is proxied through a **free Netlify site created only for this purpose** (Netlify doesn't host the actual site — nyriac.com stays on GitHub Pages). See `SETUP.md` for the one-time setup Dan needs to complete (registering a GitHub OAuth App, connecting Netlify, and adding `nyriac.com` as a domain on that Netlify site so its OAuth login recognizes requests from it), which fills in `site_domain` in `admin/config.yml`.
- Uploads land in `advisories/` (PDF) and `advisories/source/` (Word doc) and create a small metadata entry under `cms/advisories/` that Decap uses for its list/search — this metadata isn't read by the public site. **Uploading a file here does not automatically add it as a card on `advisories.html`** — that step (title, summary, card styling) is still a manual edit, same as any other advisories.html change.
- Only people with push access to the GitHub repo (or added as OAuth-approved users) can log in — that's the real access boundary, not the page's URL being unlisted.

### Chief Defender survey

An **unlisted** page (`chief-defender-survey.html`) sent to NY chief defenders, asking how their office identifies and refers non-U.S.-born clients to their RIAC. It is deliberately not linked anywhere on the site and carries `noindex, nofollow` — it's shared by direct link only. Question 1 is a searchable office picker whose ~130 options were generated from the NYSDA "Public Defense Services" Chief Defender list; if that list changes, update the `<datalist id="offices">` options in the page.

## Conventions

- Navigation (header) and footer are copied into each page — when editing them, update **all three pages** (`index.html`, `advisories.html`, `contact.html`) plus `404.html`'s header.
- Pages use relative links (`advisories.html`); only `404.html` uses absolute links (`/advisories.html`) because GitHub serves it from any URL.
- Placeholder content is marked with yellow `.notice` boxes and the word "placeholder" — real contact details and advisory PDFs still need to be filled in.
- To publish changes: commit and push to `main` (or upload the changed files via github.com); GitHub Pages redeploys automatically in ~1 minute.

## Working across two computers

Dan works from more than one desktop. Chats started in a **local terminal** are stored on
that machine only (`~/.claude/projects/<encoded-path>/*.jsonl`) and cannot be reached from
anywhere else — if that computer sleeps, the conversation is stranded. Chats started
**online** (claude.ai/code, or the desktop app's cloud option) run on Anthropic's servers
and are available from any computer.

Rule of thumb:

- **Website edits and Airtable work → start the chat online.** Neither needs anything on
  Dan's hard drive. Airtable is reached over the internet either way.
- **Practice advisory edits → local session.** These live in
  `C:\Users\dejac\OneDrive OCBA\RIAC - Documents\Admin\`, and an online session cannot see
  that folder. Word source copies are also kept in `advisories/source/` in this repo.

Because stranded chats are a recurring problem, **durable decisions belong in files, not
in conversation** — `AIRTABLE.md` for database work, this file for everything else. Write
the conclusion down as you go.

## Outstanding

- The online intake forms are built but **not live**: Dan must create the seven per-region Formspree forms and paste their IDs into `js/intake-form.js` (SETUP.md, Step 7). Until then the pages show a yellow notice and refuse submissions.

- Dan must verify the six centers' contact details in `contact.html` (compiled from public sources, July 2026), then remove the yellow notice box there.
- Add real advisory PDFs to `advisories/` and update `advisories.html`.
- Complete the one-time setup in `SETUP.md` (create repo, enable Pages, add DNS records in Wix).

### RIAC CMS (the Airtable pilot — nothing to do with this website)

Kept here because it is the one to-do list. The base is "RIAC CMS Pilot"; the catalogue-building scripts live in `OneDrive - OCBA/RIAC - Documents/Admin/Database Design`.

- **Two Penal Law sections have moved on since the catalogue was loaded (5 Aug 2026).** Sections **265.07** and **265.09** have gained lettered and numbered branches that did not exist then. The catalogue still holds the old, branch-less versions, so the next full run of `catalogue_penal_law.py` will *add* `265.07(1)`, `265.07(2)(a)`, `265.07(2)(b)` and `265.09(1)(a)` and leave the superseded rows sitting alongside them. Nothing breaks, but those two sections want a look afterwards and the stale rows deleting. Everything else in the catalogue still lines up exactly.
- **Never edit `Section` or `Subdivision` by hand in either offence catalogue** (NY Penal Law Offenses, NY VTL Offenses). Those two columns are how the loader scripts recognise a record they have seen before — the `Citation` on screen is a formula built on top of them, and a formula cannot be used for matching. Change one by hand and that record becomes invisible to the script: the next run will not update it, it will create a second copy alongside it. Treat those columns as belonging to the script, the same way `Classification` belongs to Dan — the script never overwrites his classifications, and nobody should overwrite its section numbers. Everything else on those records is safe to edit.
- Neither catalogue has been re-run since the scripts were repointed (10 Aug 2026), so the two points above are untested against a real load.
- The **Needs Review** interface page still needs rethinking — as structured it is not clear how it will work. Pending intakes are meant to be *pushed* into a case from there, never pulled from a case file.
- **Check the public intake form asks for first and last name in separate boxes.** The conflict check matches on **surname OR date of birth**, which is what lets it survive misspelt first names and initials — but it only works if a surname actually arrives. Its own description warns that if `Client Last Name` comes through empty, *every person on file* matches and the check becomes noise. Of the three intake submissions currently on file, **two have both name boxes empty** (the `Client Name` formula renders as a single space). That may just be how those test rows were made — the form could not be read from the API, because it is a view-based form rather than an interface form. Submit the live form once and confirm the surname lands in `Client Last Name`.
- **Review the two chaser systems running side by side** — `Send approved reminders` (the four-rung one behind the Reminder Queue page) and `Monthly reminders 1 and 2` (the batch one behind Monthly Reminders and Run Monthly Reminders). Both are deployed and both send real email. **This may well be deliberate** — Dan thinks a workflow was designed around it in another conversation — so do not retire either without checking. Worth confirming which does what, because they are started by different tick-boxes, and someone ticking the wrong one would chase the same attorneys twice.
- The crime viewer should show **both** jury-instruction links — the job is written up in `AIRTABLE-TODO.md` §5, and the fields themselves in `AIRTABLE.md` under "Jury instruction links".

**Where Airtable notes go:** `AIRTABLE.md` is the database map and `AIRTABLE-TODO.md` is Dan's interface checklist. Put new Airtable items there, not in this list. The catalogue-loader points above are still here only because they are not repeated in either file yet.
