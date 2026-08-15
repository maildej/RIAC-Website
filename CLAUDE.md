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

- **Anything referring to the NYS Office of Indigent Legal Services (ILS) must be approved by
  ILS before it goes on the site.** Do not add, reword or remove an ILS reference on your own
  initiative, and **flag any you notice for scrutiny** — Dan, 13 August 2026.
  - The funder ribbon in every page's header — *"Funded by the New York State Office of
    Indigent Legal Services"* — **is ILS-approved and ILS-requested wording. Leave it alone.**
  - Still do not use ILS logos, or link to ils.ny.gov. Avoid external links generally.
  - Factual information (region/county assignments, the centers' own contact details) is fine.
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
| `intake.html` | Intake forms landing page: download the criminal or non-criminal PDF intake form. **Deliberately still PDF-only** — the online route is being tested at the unlisted address below first |
| `p9vt3xk6qz1md7bw/` | **Unlisted test page** for the online intake route (`nyriac.com/p9vt3xk6qz1md7bw/`). `noindex`, linked from nowhere, and carries a visible "do not submit a real client's details" notice. Links out to the **Airtable intake form**. **Never replace that link with a form hosted here** — the conflict check is bound to the Airtable form and silently stops running on anything else. When testing is done this content moves into `intake.html` and the folder is deleted |
| `chief-defender-survey.html` | **Unlisted** survey for NY chief defenders (see "Chief Defender survey" below). `noindex`; not linked from any nav or footer — reachable only by direct URL |
| `js/chief-defender-survey.js` | Submits the survey to Formspree via `fetch` and shows an inline thank-you |
| `css/style.css` | All styling, shared by every page (brand + region colors at top in `:root`) |
| `images/riac-mark.svg` | Colored map mark used as the header logo on every page |
| `images/favicon.svg` | Browser tab icon (navy square + map) |
| `advisories/` | Drop advisory PDFs here; link them from `advisories.html`. `advisories/source/` holds internal Word (.docx) copies for editing — not linked publicly, kept out of search engines via `robots.txt` |
| `admin/` | **Secret admin page** (see "Admin CMS" below) — login-protected via GitHub, for uploading/managing advisory PDFs and Word source files |
| `email-signatures/` | **Unlisted** copy-and-paste page for staff Outlook signatures (see "Email signatures" below). `noindex`, not linked from any nav or footer |
| `tools/` | Map generator (`build-map.py` + county boundary data). **Dan can ignore this folder**; it's only needed if region/county assignments ever change. It regenerates `tools/map-inline.svg`, which is pasted into `index.html` and mirrored in `images/`. |
| `404.html` | Shown for broken links (uses absolute `/` paths) |
| `CNAME` | Custom domain for GitHub Pages — **do not delete or edit** |
| `.nojekyll` | Tells GitHub Pages to serve files as-is — **do not delete** |
| `SETUP.md` | One-time GitHub + Wix DNS setup instructions for Dan |
| `NOTES.md` | Pointer file. `AIRTABLE.md` and `AIRTABLE-TODO.md` **moved to the private repo `maildej/riac-notes`** on 13 Aug 2026, because this repository is public |

## Unlisted pages, and what "unlisted" is actually worth

Two pages are deliberately not linked from anywhere: `chief-defender-survey.html` and the
intake test folder. Both carry `noindex, nofollow`.

⚠️ **Neither is secret, and nothing should be built assuming otherwise.** This repository is
**public** — GitHub Pages requires it on a free plan — so **every path in it is discoverable by
browsing the file tree on github.com.** A hard-to-guess folder name does not change that.

**Dan's position, 13 August 2026, and it is the right one:** *"I am not super concerned if the
draft intake form URL has been exposed — as long as it is not broadcast, nobody will be using
it."* Nobody finds these by accident, and the intake test page says on its face not to submit a
real client's details.

So the protection that actually works is the combination of: **`noindex`**, **not being linked
from any page**, and **the page saying what it is**. Not the address.

**Do not propose renaming a folder as a security measure.** It was done once, on 13 August, and
it is housekeeping — the old address remains in this repository's public git history regardless,
and the new one is just as visible in the tree. The old intake test address
(`k3n7qv92xr5t8m4w`) is dead and now 404s.

**If a page ever genuinely must not be found**, the answer is not a clever URL — it is a private
repository with paid Pages hosting, or somewhere other than this site.

## Forms (Formspree)

Two forms email their submissions through **Formspree** (formspree.io) — a free service that turns a plain HTML form into an email, so the static site needs no backend. Each form posts to a Formspree endpoint; the recipient email and reply settings live in the Formspree account, not in the site code. Submissions are sent in the background with a small `fetch` script so the visitor stays on the page and sees an inline confirmation.

| Form | Endpoint | Emails to | Subject | Handler |
|---|---|---|---|---|
| Advisory download request (`request.html`) | `formspree.io/f/mjgnrzpp` | (set in Formspree) | New RIAC advisory download request | `js/document-request.js` |
| Chief Defender survey (`chief-defender-survey.html`) | `formspree.io/f/mdaqzrpq` | RIAC2@ocbaacp.org | Chief Defender Referral Survey | `js/chief-defender-survey.js` |

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

### Email signatures

`email-signatures/index.html` — an unlisted page holding the staff Outlook signature, ready to
select and copy. Built 14 August 2026 to fix a real complaint: recipients were seeing a broken
image box instead of the RIAC logo.

**The cause, and the rule that follows from it.** The old signature did not contain the logo — it
contained an `<img>` pointing at `https://nyriac.com/images/riac-email-logo.png`. Mail clients
block remotely-loaded images by default from senders not already trusted, so **first-time
recipients — most of the attorneys RIAC writes to — saw an empty box with the alt text in blue.**
It looked like "the logo breaks on replies" because a reply from an untrusted sender blocks
downloads across the whole message, quoted signature included, while the sender's own copy always
looked fine.

⚠️ **Never put a website-hosted image in an email signature.** The picture has to travel inside
the message. On this page the logo is a **base64 `data:` URI**, so copying the rendered block out
of a browser hands Outlook the actual bitmap and it embeds its own copy — nothing left to block.
Base64 in a `data:` URI works *for this purpose only*; classic Outlook desktop will not render a
`data:` URI in a received email, which is fine here because the URI never reaches the email.

Other notes:

- The page is generated, not hand-written — the generator lives in the session scratchpad, not
  the repo. To change the design, edit `email-signatures/index.html` directly; it is plain
  inline-styled tables (the only thing email clients render reliably — no CSS classes, no flexbox).
- Signature markup is **inline styles on nested `<table>`s** on purpose. Do not "tidy" it into
  modern CSS; Outlook renders mail through Word's engine and will drop it.
- Contains a worked example (Sharon Ames), a blank template, and a table of all six centres'
  phone/email taken from `contact.html` — if contact details change, change both.
- **Outlook has two signature dropdowns**, one for new messages and one for replies/forwards.
  A blank second dropdown is the other reason a signature "doesn't show on replies".
- Not added to `robots.txt`: a `Disallow` there would stop crawlers from ever reading the page's
  `noindex`, which is the stronger instruction. Same reasoning applies to any future noindex page.

## The `***Publish` command

When Dan writes **`***Publish`** (any capitalisation; the three asterisks are what make it a
command rather than the word appearing in a sentence), do all of this without being asked
again:

1. **Write everything down.** Every decision, finding, correction and open question from the
   conversation goes into the right file — `AIRTABLE.md` for how the database works,
   `AIRTABLE-TODO.md` for what is still outstanding, this file for anything else. Nothing of
   substance should exist only in the chat.
   ⚠️ **The first two are in the private repo `maildej/riac-notes`**, so a `***Publish` means
   committing and pushing **both repositories**, not just this one. If that repo has not been
   added to the session, say so rather than writing database notes into this public one.
2. **Commit and push to GitHub**, so the files are safe and readable from any computer.
3. **Report back plainly**: what was written down, what was pushed, and — separately —
   **anything left that only Dan can do**, such as hand-work in the Airtable interface
   designer, turning an automation on, or a decision still outstanding.
4. **Ask, if anything is genuinely unclear** — but only about real forks in the road, not to
   confirm the obvious.

**Explain in plain English when asking.** Dan uses "publish", "push" and "pull" narratively
and does not claim to know the technical distinctions. So if a question has to be asked about
one, say what the thing actually does rather than naming it — "save these notes to GitHub so
they're on your other computer too" rather than "push to origin".

The point of the command is that a chat can be closed at any moment without losing anything.

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
in conversation** — `AIRTABLE.md` (in `maildej/riac-notes`) for database work, this file for
everything else. Write the conclusion down as you go.

## Outstanding

**Website:**

- **Point `intake.html` at the Airtable intake form.** The online intake forms that used to
  be planned here (`intake-criminal.html`, `intake-non-criminal.html`, `js/intake-form.js`,
  and SETUP.md's Formspree Step 7) were **deleted on 10 August 2026** — the Airtable intake
  form supersedes them. They were never committed, so they never reached the live site.
  **Do not rebuild them, and do not build any website form that posts into Airtable** — the
  conflict check is bound to Airtable's own form by internal ID and silently stops running
  on anything else. Link out to the Airtable form instead. See `AIRTABLE-TODO.md`.
- **[Dan] Confirm the new signature actually renders.** `nyriac.com` is blocked to Claude, and no
  session can see a real Outlook. Dan must send a test to an address that has never received mail
  from the sender before, and report back.

**Done — do not re-raise these (confirmed 12 August 2026):**

- ~~Region 6 (Long Island): Nassau and Suffolk headings swapped in `contact.html`~~ — **fixed
  15 August 2026, confirmed by Dan.** Each block's details were right; the two headings were on
  the wrong blocks. **Nassau County** is now Hempstead / 516-560-6474 / `SuffolkLIRIAC@nclas.org`,
  and **Suffolk County** is Central Islip / 631-853-7807 / `LIRIAC@sclas.org`. Note the Nassau
  mailbox really is named `SuffolkLIRIAC@` — odd, but it is a Nassau (`nclas.org`) address and
  Dan confirmed the details are correct, so leave it. Mirrored in `email-signatures/index.html`.

- ~~Verify the six centers' contact details in `contact.html` and remove the yellow notice
  box~~ — done. No notice box remains in the file.
- ~~Add real advisory PDFs~~ — done. 15 PDFs are in `advisories/`.
- ~~Complete the one-time setup in `SETUP.md`~~ — done. **The site is live at nyriac.com**,
  contact page included. Repo, Pages and the Wix DNS records are all in place.

⚠️ **`nyriac.com` is blocked to Claude by the network proxy**, so the live site cannot be
checked from a session — only the files in this repo can. Ask Dan rather than assuming the
site is behind what is in the folder.

### RIAC CMS (the Airtable pilot — nothing to do with this website)

The base is "RIAC CMS Pilot", and it has its own two files. ⚠️ **Both now live in the private
repository `maildej/riac-notes`, not here** — ask for that repo to be added to the session
before doing any database work, or you will be working blind:

- **`AIRTABLE.md`** — the database map: tables, interface pages, automations, the reminder ladder and how a case gets chased and closed, the offence catalogues and their loader scripts, and everything currently unfinished. Read it before doing any Airtable work.
- **`AIRTABLE-TODO.md`** — **the Airtable to-do list.** Everything still outstanding on the database, not only the parts Dan has to do himself. If he asks "what's on my to-do list for the Airtable?", read it and offer him a couple of items; most are big enough to want a chat each. Every item is tagged **[Claude]**, **[Dan]**, **[Both]** or **[Decide]**, so it is clear up front what can be done in the session and what needs his hands in the interface designer.

**Put Airtable items in those two files, not in the list above.** Nothing about the database is tracked here any more.
