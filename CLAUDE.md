# CLAUDE.md — nyriac.com

## About the owner

The owner of this project is not a developer and knows little about web design or development. When helping them:

- Explain things in plain English; avoid jargon (or define it when unavoidable).
- Make edits for them rather than telling them how to code.
- Keep the site simple — resist adding frameworks, build tools, or JavaScript unless truly needed.
- When something requires action outside this folder (GitHub, Wix), give exact click-by-click steps.
- **Show a mockup before building anything visible**, with the options side by side and a
  recommendation, and offer improvements as suggestions. Build only once the owner has chosen;
  publishing to `main` then waits for a separate yes. A proposal copy of the site outside the
  repository, served on its own local port beside the current site, works well.
- When the owner follows a session from their phone (Remote Control), local preview links do not
  reach them: send screenshots into the chat, at phone width and full size.

## What this site is

Website for the **New York Regional Immigration Assistance Centers (RIAC)**. In the owner's words:

> We provide free expert legal advice and support on immigration consequences for all mandated providers in New York state — expert legal advice for public defenders and assigned counsel, analyzing the immigration consequences of the case they are representing someone in. The website is relatively basic: it primarily gives attorneys access to our contact details and downloadable practice advisories.

Audience: attorneys (public defenders, assigned counsel, mandated providers) — not the general public.

## Important constraints

- **Anything referring to the NYS Office of Indigent Legal Services (ILS) must be approved by
  ILS before it goes on the site.** Do not add, reword or remove an ILS reference on your own
  initiative, and **flag any you notice for scrutiny.**
  - The funder ribbon in every page's header — *"Funded by the New York State Office of
    Indigent Legal Services"* — **is ILS-approved and ILS-requested wording. Leave it alone.**
  - Still do not use ILS logos, or link to ils.ny.gov. Avoid external links generally.
  - Factual information (region/county assignments, the centers' own contact details) is fine.
- The six regions, their colors, and county assignments mirror the RIAC logo and are listed in `tools/build-map.py`. Region colors are defined once in `css/style.css` (`--r1`…`--r6`).

## Technical setup

- **Plain static HTML/CSS.** No build step, no frameworks, no Jekyll (`.nojekyll` disables it). JavaScript is limited to a few small plain scripts in `js/` (the advisory search, the map tooltips, the download-request form). One external dependency: Google Fonts (Source Serif 4 + Inter) loaded via a `<link>` in each page's `<head>`.
- **Hosting:** GitHub Pages, deployed from the `main` branch of a GitHub repo.
- **Domain:** `nyriac.com`, registered at **Wix**. Wix does not allow domain transfers or nameserver changes, so DNS is managed inside Wix: A records point the apex domain to GitHub Pages' IPs, and a CNAME points `www` to the GitHub Pages address. The `CNAME` file in this folder tells GitHub Pages the custom domain. See `SETUP.md` for the exact records.

## File map

| File | Purpose |
|---|---|
| `index.html` | Landing page: hero with the **clickable region map** (inline SVG), what we do, who we serve |
| `advisories.html` | List of downloadable practice advisory PDFs |
| `contact.html` | Six region cards (`#region-1` … `#region-6`) with counties served and each center's contacts — the map links here |
| `intake.html` | Intake forms landing page: download the criminal or non-criminal PDF intake form. **Deliberately still PDF-only** until the referral form goes live (see "The referral form and the attorney portal") |
| `p9vt3xk6qz1md7bw/` | **Unlisted test pages** for the online intake route (`nyriac.com/p9vt3xk6qz1md7bw/`). All `noindex` and linked from nowhere. `index.html` is the front door (two cards: start a new case / add to an existing case); `new-case.html` embeds the **Airtable form** in the page; `new-case-handoff.html` is the same page but sends the attorney to airtable.com — the two exist to be compared, then one is deleted; `supplemental.html` is a placeholder until that form is published. Currently points at **Region 2's** form only. ⚠️ **Superseded:** Airtable's form has been closed to the public since 15 October 2026, so these pages no longer work. RIAC's own referral pages replace them (see "The referral form and the attorney portal" below), and this folder is deleted when those go live |
| `css/style.css` | All styling, shared by every page. At the top in `:root`: the brand and region colors, and the type scale (`--fs-*`) — see "Design rules" below |
| `images/symbols.svg` | The symbols on the advisory, intake and home-page cards, one `<symbol id="i-…">` each — see "Design rules" below |
| `images/riac-mark.svg` | Colored map mark used as the header logo on every page |
| `images/favicon.svg` | Browser tab icon (navy square + map) |
| `advisories/` | Drop advisory PDFs here; link them from `advisories.html`. `advisories/source/` holds internal Word (.docx) copies for editing — not linked publicly, kept out of search engines via `robots.txt` |
| `admin/` | **Secret admin page** (see "Admin CMS" below) — login-protected via GitHub, for uploading/managing advisory PDFs and Word source files |
| `tools/` | Map generator (`build-map.py` + county boundary data). **The owner can ignore this folder**; it's only needed if region/county assignments ever change. It regenerates `tools/map-inline.svg`, which is pasted into `index.html` and mirrored in `images/`. |
| `404.html` | Shown for broken links (uses absolute `/` paths) |
| `CNAME` | Custom domain for GitHub Pages — **do not delete or edit** |
| `.nojekyll` | Tells GitHub Pages to serve files as-is — **do not delete** |
| `SETUP.md` | One-time GitHub + Wix DNS setup instructions |
| `NOTES.md` | Pointer file. `AIRTABLE.md` and `AIRTABLE-TODO.md` **live in the private repo `maildej/RIAC-Airtable`**, because this repository is public |

## Unlisted pages, and what "unlisted" is actually worth

The intake test folder is deliberately not linked from anywhere, and its pages carry
`noindex, nofollow`.

⚠️ **It is not secret, and nothing should be built assuming otherwise.** This repository is
**public** — GitHub Pages requires it on a free plan — so **every path in it is discoverable by
browsing the file tree on github.com.** A hard-to-guess folder name does not change that.

**The accepted position:** exposure of the draft intake address is not a concern as long as it is
not broadcast. Nobody finds these by accident, and the intake test page says on its face not to
submit a real client's details.

So the protection that actually works is the combination of: **`noindex`**, **not being linked
from any page**, and **the page saying what it is**. Not the address.

**Do not propose renaming a folder as a security measure.** It is housekeeping at best — the old
address remains in this repository's public git history regardless, and the new one is just as
visible in the tree. An earlier intake test address (`k3n7qv92xr5t8m4w`) is dead and 404s.

**If a page ever genuinely must not be found**, the answer is not a clever URL — it is a private
repository with paid Pages hosting, or somewhere other than this site.

## Forms (Formspree)

One form emails its submissions through **Formspree** (formspree.io) — a free service that turns a plain HTML form into an email, so the static site needs no backend. The form posts to a Formspree endpoint; the recipient email and reply settings live in the Formspree account, not in the site code. Submissions are sent in the background with a small `fetch` script so the visitor stays on the page and sees an inline confirmation.

| Form | Endpoint | Emails to | Subject | Handler |
|---|---|---|---|---|
| Advisory download request (`request.html`) | `formspree.io/f/mjgnrzpp` | (set in Formspree) | New RIAC advisory download request | `js/document-request.js` |

Notes:
- The subject line and honeypot spam trap are set with hidden fields (`_subject`, `_gotcha`) in the form's HTML.
- Each Formspree form's **first** submission must be confirmed via a link Formspree emails to the recipient before later submissions are delivered.
- Free Formspree plans cap submissions at 50/month per form.

### Admin CMS (`admin/`)

An unlisted, `noindex` admin page at `admin/index.html` running **Decap CMS** (loaded from a CDN — the one exception to "no JavaScript/frameworks" in this project, isolated entirely to `/admin/`). It gives RIAC staff a real login (via GitHub — not just an unlisted-URL "secret") to upload and manage practice advisory PDFs and their internal Word source files, with built-in search across entries and a "copy URL" option on any uploaded file (for pasting into emails).

- Configuration: `admin/config.yml`. Backend is `github`, repo `maildej/RIAC-Website`, branch `main`.
- Because GitHub Pages can't run server-side code, GitHub OAuth login is proxied through a **free Netlify site created only for this purpose** (Netlify doesn't host the actual site — nyriac.com stays on GitHub Pages). See `SETUP.md` for the one-time setup the owner needs to complete (registering a GitHub OAuth App, connecting Netlify, and adding `nyriac.com` as a domain on that Netlify site so its OAuth login recognizes requests from it), which fills in `site_domain` in `admin/config.yml`.
- Uploads land in `advisories/` (PDF) and `advisories/source/` (Word doc) and create a small metadata entry under `cms/advisories/` that Decap uses for its list/search — this metadata isn't read by the public site. **Uploading a file here does not automatically add it as a card on `advisories.html`** — that step (title, summary, card styling) is still a manual edit, same as any other advisories.html change.
- Only people with push access to the GitHub repo (or added as OAuth-approved users) can log in — that's the real access boundary, not the page's URL being unlisted.

### Email signatures

⚠️ **Not in this repository, and deliberately so.** The staff Outlook signature is a **brand-kit
asset, not website content.** The master copy is an HTML file in the owner's **OneDrive brand
kit**, alongside the logo files. It is kept out of this repository because anything on `main` is
automatically served at a nyriac.com address, and the signature has no business being on the
public website.

**Do not re-add it to this repo.** If it needs changing, ask the owner for the file from OneDrive,
edit it, and give it back — do not commit it.

The file is a plain page holding the signature ready to select and copy, with setup steps around
it: a worked example (Sharon Ames), a blank template, and a table of all six centres'
phone/email taken from `contact.html` — **if contact details change here, that file needs the
same change.**

**The cause, and the rule that follows from it.** The old signature did not contain the logo — it
contained an `<img>` pointing at `https://nyriac.com/images/riac-email-logo.png`. Mail clients
block remotely-loaded images by default from senders not already trusted, so **first-time
recipients — most of the attorneys RIAC writes to — saw an empty box with the alt text in blue.**
It looked like "the logo breaks on replies" because a reply from an untrusted sender blocks
downloads across the whole message, quoted signature included, while the sender's own copy always
looked fine.

⚠️ **Never put a website-hosted image in an email signature.** The picture has to travel inside
the message. In the file the logo is a **base64 `data:` URI**, so copying the rendered block out
of a browser hands Outlook the actual bitmap and it embeds its own copy — nothing left to block.
This also makes the file self-contained: it works from OneDrive with no connection to the site.
Base64 in a `data:` URI works *for this purpose only*; classic Outlook desktop will not render a
`data:` URI in a received email, which is fine here because the URI never reaches the email.

Other notes:

- Signature markup is **inline styles on nested `<table>`s** on purpose. Do not "tidy" it into
  modern CSS; Outlook renders mail through Word's engine and will drop it.
- **Outlook has two signature dropdowns**, one for new messages and one for replies/forwards.
  A blank second dropdown is the other reason a signature "doesn't show on replies".
- The general lesson about `robots.txt` still applies to any future `noindex` page here: do
  **not** add a `Disallow` for it, because that stops crawlers ever reading the `noindex`, which
  is the stronger instruction.

## The `***Publish` command

When the owner writes **`***Publish`** (any capitalisation; the three asterisks are what make it a
command rather than the word appearing in a sentence), do all of this without being asked
again:

1. **Write everything down.** Every decision, finding, correction and open question from the
   conversation goes into the right file — `AIRTABLE.md` for how the database works,
   `AIRTABLE-TODO.md` for what is still outstanding, this file for anything else. Nothing of
   substance should exist only in the chat.
   ⚠️ **The first two are in the private repo `maildej/RIAC-Airtable`**, so a `***Publish` means
   committing and pushing **both repositories**, not just this one. If that repo has not been
   added to the session, say so rather than writing database notes into this public one.
2. **Commit and push to GitHub**, so the files are safe and readable from any computer.
3. **Report back plainly**: what was written down, what was pushed, and — separately —
   **anything left that only the owner can do**, such as hand-work in the Airtable interface
   designer, turning an automation on, or a decision still outstanding.
4. **Ask, if anything is genuinely unclear** — but only about real forks in the road, not to
   confirm the obvious.

**Explain in plain English when asking.** The owner uses "publish", "push" and "pull"
narratively and does not claim to know the technical distinctions. So if a question has to be asked about
one, say what the thing actually does rather than naming it — "save these notes to GitHub so
they're on your other computer too" rather than "push to origin".

The point of the command is that a chat can be closed at any moment without losing anything.

## Conventions

- Navigation (header) and footer are copied into each page — when editing them, update **every
  page that carries them**: `index.html`, `advisories.html`, `intake.html`, `contact.html`,
  `request.html`, `thanks.html` and `404.html`, plus the test pages in `p9vt3xk6qz1md7bw/`.
- Pages use relative links (`advisories.html`); only `404.html` and the test pages use absolute links (`/advisories.html`) because they are served from other addresses.
- To publish changes: commit and push to `main` (or upload the changed files via github.com); GitHub Pages redeploys automatically in ~1 minute.

### Design rules

The look of the site takes its cues from the RIAC database's own pages (in the private
repository), without sharing any of their code.

- **Type.** Source Serif 4 for headings, Inter for everything else. **Every font size is one of
  the `--fs-*` variables** at the top of `css/style.css` (display, title, section, card, lede,
  text, small, label); do not add a size of its own to a rule. Capitals are for short labels
  only (the menu, "Region 1", "Counties served"), never for a sentence or a title. The logo
  lettering and the funder ribbon keep their own sizes.
- **Paragraphs.** Reading paragraphs (`.section-intro`) are **justified** on a computer, held to
  about 75 letters a line, with no first-line indent; on a phone they are left-aligned, because
  a short line cannot be justified without wide gaps between words. Card text is centred.
- **Cards.** A card has a two-tone header: the title in a navy bar (orange on a featured card),
  with the card's symbol as a cream badge on the bar's lower edge. The advisory, intake and
  home-page cards all use it. Title bars side by side are always the same height: on the home
  page the stylesheet does it (each card is a two-row CSS subgrid); on the advisories page
  `js/advisory-search.js` measures and matches them, except on a phone, where the cards are in
  one column and each keeps its own height.
- **Buttons and pills in a group are the same width and height**, unless there is a reason not
  to — the rule the database pages follow. On a phone the four menu buttons are a two-by-two
  grid of equal buttons, and the home page's two buttons stack, full width. The one exception:
  on a computer the menu's "Practice Advisories" is wider than the other three, because four
  items that wide would push the menu onto a second row.
- **Symbols** (`images/symbols.svg`) are drawn for this site: solid navy shapes with one orange
  detail, on a 48-unit square. The navy follows the text colour; the cream and orange come from
  `--icon-fill` and `--icon-accent`, which `.symbol` sets. A page shows one with
  `<span class="symbol" aria-hidden="true"><svg><use href="images/symbols.svg#i-NAME"/></svg></span>`
  inside the card's `<h3>`. ⚠️ Never put two hyphens in a row inside a comment in that file: it
  is XML, a double hyphen in a comment is an error, and the browser then draws **none** of the
  symbols. Do not use stock or clip-art pictures, or images from the training slides: most are
  not licensed for a public website.

### The referral form and the attorney portal (being built)

Attorneys will send a new case through a form on this site, and sign in to an attorney portal
to see their referrals and add to them. Both are being built by the chat "Website - [W] nyriac.com
referral and portal pages (Local)"; the owner's decisions on them are coded W1, W2 and so on.
Nothing visible is built before the owner says "build", and nothing is pushed to `main` before
the owner says yes to that push.

⚠️ **The pages send to a private worker** (a small program on Cloudflare), never straight into
the database. The worker is built in a private repository. This repository is public, so
nothing from the private repositories goes in it: no code, no database, table or field names or
IDs, and no keys. The pages know only the worker's public addresses and what each one takes
and gives back, agreed with the worker's chat. On the desktop the pages are previewed on
`http://localhost:8790` (the port is this chat's, given by the dispatcher), beside the worker on 8789.
The agreed contract (draft 12, 18 October 2026, which adds W20's one change to draft 11: the addresses, what each takes and gives back, the
errors, and a short code for every answer on the form; files go up one at a time before the
referral itself) is in the shared hand-over folder on the desktop,
`riac-handover\RW\public-contract-draft.md` and `riac-handover\W\referral-keys.md`. It is copied
into this repository with the build.

- **File limits** (the owner's RW3 1): up to 20 files a referral or addition, 25 MB each, 100 MB
  together. The pages read them from the worker's answer rather than writing them in, show them
  before files are chosen, and name the file any refusal is about.
- **Answer lengths** (RW4 1): 6,000 characters for the answers written at length, 1,000 for other
  long answers, 200 short, 100 names. The whole referral is at most 80 KB, which the page checks at
  Send, naming the longest answer if over. That a longer account can be attached as a file is
  said only once an answer nears its limit (W24 2).
- **Senders:** the portal's sign-in emails come from `portal@nyriac.com` (one address for every
  centre), so the sign-in page may name it; receipts for a referral come from the centre's own
  referral address (`cny-referrals@nyriac.com` for Region 2).
- **Daily ceiling** (RW5 1, contract draft 7): past 25 referrals in a day for a centre, a referral
  is still taken with the usual answer, and nothing tells the sender. Past 100 in a day the worker
  refuses at the first step, before any file is sent ("daily-limit"); the page then shows the
  centre's contact details and the PDF forms, and keeps the attorney's answers on screen as a copy
  to print or save.
- **A referral's reference** (RW6 1) looks like `R2-261016-7KQ4MX`: the centre's code, the New
  York date, and six characters with no 0, O, 1, I, L or U. The pages show it exactly as the
  worker gives it (the mockups' shorter `R2-0142` is only a stand-in).
- **Still with the owner:** the bot-check key.

**Settled:**

- **W1 1** (15 October 2026): the form shows its steps as **numbered circles** across the top,
  on a pale band, with the progress bar beneath; on a phone, the numbers only, with the current
  step's name under them. After Send: a card with the reference, the time it was sent and where
  the receipt went; an orange box, "This page is your only copy", beside **Print Or Save As
  PDF**; then the full copy as **one document on a white sheet** with the RIAC letterhead,
  section by section. Chosen over steps as pills in a navy bar with the copy as one card per
  section.
- **W2 1** (15 October 2026): the menu keeps its four buttons. **"Intake Forms" becomes "Send A
  Case"**; its page keeps the address `intake.html` and holds two cards side by side, **Send Us A
  New Case** (the form, the featured orange card) and **Your Referrals** (the portal's sign-in),
  with the paper intake forms beneath. Chosen over Your Referrals taking Home's place in the menu,
  and over a separate Sign In button after the four.
- **W3 2** (15 October 2026): once the form is live, the home page's navy panel carries **Send Us
  A New Case** (the cream button) and **Find Your RIAC** (the outlined one), two buttons of one
  size; Practice Advisories leaves the panel (it stays in the menu and the cards). Chosen over
  leaving the panel as it is, and over an orange full-width button above the two.
- **W4 1** (15 October 2026): the portal's sign-in is **one narrow card, centred**, with nothing
  beside it: the email box, Cloudflare's bot check, **Email Me A Sign-In Link**, and a line that
  the link works once, for 15 minutes, in this browser only; under the card, a line to Send Us A
  New Case. After asking: **Check your email** (from `portal@nyriac.com`), with "open the link on
  this device, in this browser" in a tinted box, **Send Another Link** and **Use A Different Email
  Address**. A link that cannot be used gets its own card with the three reasons and **Email Me A
  New Link**. The page answers the same whatever address is typed. Chosen over the card with a
  panel beside it listing what the portal shows.
- **W5 1, with the owner's two changes** (15 October 2026): the portal lists referrals as **a
  table**, one line each (client with reference and case number; court and docket; received;
  where it stands; **Add To This Referral**), becoming short blocks on a phone; newest first;
  closed ones under a heading that starts collapsed; orange only for "Waiting for documents".
  The owner's changes: **(1)** the card at the top shows **the signed-in attorney's name and
  contact details prominently** ("Steven Smith, Esq.", then "RIAC Referrals:" over the list);
  **(2)** **a search bar** over the list. Chosen over a card for each referral. **Confirmed on the
  redraw ("W5 yes")**: the card shows the name large ("Steven Smith, Esq."; office staff without
  ", Esq."), the office, email and phone, and "These are the details RIAC holds for you. If one is
  wrong, tell your RIAC."; Sign Out and how long the sign-in lasts on its right; "RIAC
  Referrals:" over the list, the search bar beside it ("Search by name, court or number": client,
  court, docket, reference and case number, open and closed alike; the closed heading opens by
  itself when it holds a match). For office staff each row also names its attorney. Until the
  worker can supply the name, office and phone, the card shows the email address alone.
- **W6 1** (16 October 2026): **Add To This Referral opens a page of its own**, with "‹ Back To
  Your Referrals" above a card: which referral it is (client, reference, court and docket, where
  it stands); the message to RIAC (up to 6,000 characters, "a longer account can be attached as a
  file"); the limits; the same document boxes as the referral plus **Something else**, which asks
  what the document is (one line, up to 200 characters; it becomes RIAC's description of it); **Cancel** and **Send To RIAC**. After Send, a
  card shows what was added and when, with **Print Or Save As PDF** and **Back To Your
  Referrals**. Chosen over opening it under its row in the list, and over a box over the list.
- **W7 1** (16 October 2026): when the county's center does not take referrals online yet, the
  answer appears **in place, under the county**: a card edged in the region's colour with the
  center's name and contact details (the same as on `contact.html`) and **Criminal Intake Form
  (PDF)** and **Non-Criminal Intake Form (PDF)**; the other seven steps grey out and there is no
  Next; the county can be changed on the spot, and "Choose the center instead" is still offered.
  For New York City the card gives the Immigrant Defense Project's website and email and no PDFs.
  ⚠️ The form then holds a copy of the centers' contact details: **if `contact.html` changes, the
  form's copy changes with it.** Chosen over a page of its own.
- **W8 2** (16 October 2026): an attorney sends to a center other than the county's own by **two
  routes, each with its reason built in**, and no "why" question: **the county list ends with "The
  court is outside New York State"**, which then asks which center should receive the referral;
  and **under the county's center, "Does this center have a conflict with your client? Choose
  another center"**, which leaves that center out of the choice and offers an optional note about
  the conflict (up to 1,000 characters). Each center in the choice is tagged "Takes referrals here"
  or "By email or post"; one not online shows its W7 card. Chosen over one "Choose the center
  instead" panel with a reason question.
- **W9 yes** (16 October 2026, the owner's own idea): **the form also emails a referral straight
  to a center not yet on the system**, so the online form works across the state and only the
  portal stays with the centers on the system. Go-live is still Region 2 alone; the emailed route
  is added **center by center, as each agrees**. Conditions: each center agrees and confirms the
  address to send to; the sending mailbox keeps no copy and no RIAC staff can open it, so Region 2
  never holds another center's client's details (the rule of 13 August 2026 on a center conflicted
  out); big files go as links that expire, or a lower limit applies. It amends CS8 1 and needs the
  worker, email tenant and case-start chats, and CS5's security review covers it. New York City
  (the Immigrant Defense Project, its own system) stays as W7 1 unless it asks. How the form looks
  for an emailed center is W10. ⚠️ Until go-live every emailed center's receiving address is one of
  the tester's own two, so a test never reaches a real center; the real addresses go in only at
  the hard go-live, as a setting on the worker, **never in this repository**. The email's subject
  line carries no client name or detail (the email tenant chat: Exchange's message trace keeps
  every subject for 90 days, readable by Region 2's administrators); the worker writes the email,
  the form only sends the answers. Contract draft 11 (section G): each center has a `mode`
  ("system", "email" or "none"; New York City always "none"); the files travel inside the email,
  so an emailed center's limit is **2.8 MB in all** (the worker chat's call: links would leave a
  client's files on Cloudflare for days behind an address anyone holding the email could open);
  the page names the county at the upload step so the right limits come back, shows them before
  files are chosen, and says larger files can be sent to the center directly after Send; past 25
  a day for an emailed center the worker refuses ("daily-limit").
- **W10 1** (16 October 2026): for a center that receives referrals by email, the form is
  **seamless**: under the county, one line, "Western New York RIAC (Region 1) will receive this
  referral, by email.", and beneath it that we email it as it is sent and keep no copy, that it
  will not appear in Your Referrals, and that to add to it later the attorney contacts the center
  directly; then Next, as for Region 2. After Send the card reads **"Emailed to …"**, says the
  referral will not appear in Your Referrals, and gives the center's phone and email. The PDFs
  stay on the Send A Case page. Chosen over a card offering the form here or the PDF yourself.
- **W11 1** (16 October 2026): **nine steps**: County · About You · Court & Case · Client ·
  Immigration · *(the case type)* · Other People · Documents · Check And Send. Step 6 is named for
  the case type, its label short on the step bar (Criminal Case, Probation, Appeal,
  Post-Conviction, Family Court, Removal); post-conviction asks the criminal and the appeal
  questions. The questions are the old public form's, word for word, placed as follows: About You
  (the attorney's names, email, phone, office type, office); Court & Case (case type; answer here
  or upload a completed intake form instead; advice needed by; court, docket, next date; custody;
  orders of protection; ICE involvement; details); Client (names, date of birth, other names or
  dates of birth; country of birth, English, language); Immigration (entry and current status and
  dates, A-number, pending applications, three screening lists, immigration attorney, family,
  details); the case-type step; Other People (CS7 rows); Documents (each kind enclosed, sent
  before, to follow or not available; RAP sheet completeness; anything else). On the upload way,
  Immigration, the case-type step and Other People are skipped (struck through on the bar) and
  Client asks only names and date of birth. Step labels sit on one line. The three fixes are
  worded with the owner on their steps; the Removal questions (fix 2) are the owner's to set, and
  until then that case type's step is left out. Chosen over seven longer steps.
- **W12 1** (16 October 2026): step 2, **About You**: "Attorney's first name" and "Attorney's last
  name" side by side, both required (fix 1); Attorney Email (required) and Attorney Phone; Your
  Office Type, the six choices in two columns; the office found by typing part of its name, with
  "Office Not Listed?" and its details box. **Privately retained counsel: the form stops** there:
  a card, "Please contact your RIAC directly", saying RIAC gives free advice to public defenders
  and assigned counsel, that the RIAC may be able to refer them to private counsel, and that they
  need not complete the form, with the county's center's details; the later steps grey out and
  Next is disabled. The old help text's "all six centers" line goes. Chosen over the old form's
  warning with a firm-details box and the form going on.
- **W13 2** (16 October 2026): step 3, **Court & Case**: the old form's questions word for word,
  **Case Type first** (six choices, two columns), asked on both ways (fix 3); "If this case is
  urgent…"; the court found by typing, from the county's courts, with "Court Not Listed / Non-NY
  Court?"; Docket No. and Next Court Date side by side; ICE INVOLVEMENT in a tinted tick box; the
  order-of-protection question, its tick list opening under Yes; custody status (seven choices,
  two columns); the details box. **The upload way is offered by a quiet line at the top**,
  "Already filled in a RIAC intake form (the PDF)? Upload it instead ›", not a required question;
  on the upload way an orange line says what comes next (the client's name, then the form at step
  8) with "Answer the questions here instead ›", and the step keeps only the case type and the
  urgency. Chosen over the old form's required "How Would You Like To Submit Your Referral?".
- **W14 2** (17 October 2026): steps 4, **Client**, and 5, **Immigration**: the old form's
  questions and help text exactly as they were, two short answers to a row on a computer, one on
  a phone; entry and status dates stay free text (they are often estimates). **Every date that is
  a date (date of birth, next court date, "advice needed by") uses the browser's own date box**,
  which can be typed into on a computer and opens a calendar on a phone: one look throughout.
  Chosen over three boxes (month, day, year) for a date of birth. The owner asked why three boxes
  were recommended; the honest answer was that the downside of the date box is small (a few taps
  to reach an old year on a phone; the order follows the device's language setting).
- **W15 2, with the owner's change** (17 October 2026): the screening tick lists are **tiles, two
  lines high**, each choice a bordered tile of one size, the whole tile pressable, ticked ones
  navy; read down the first column, then the second (one column on a phone, the same order);
  "None of these apply" and "Unknown - PLEASE DESCRIBE WHY" as grey tiles beneath a dashed line,
  orange when chosen; ticking either clears the others, and the reverse; the explanation box
  under Unknown (1,000 characters); a required list needs a tick before Next. The owner's
  change: **each list must read visually as a group (a bolder outline)**. Chosen over plain tick
  boxes in two columns. **Settled on the redraw ("W15 b")**: each list sits in its own
  **square-cornered box with a 2 px outline** (navy at about half strength), inside the rounded
  form card, the rounded tiles inside it (the owner's rule for boxes inside boxes: rounded,
  square, rounded); **the question sits in a pale navy band across the top of its box**, so it
  plainly belongs to that list; "Select any which may apply" beneath the band. Chosen over the
  outline alone. **Every answer box on the form, the explanation under Unknown included, grows
  as the attorney types**, so the whole answer is always visible (the owner checked, 17 October
  2026; the mockup's two-line box was only a drawing).
- **W16, redrawn with the owner's changes** (17 October 2026): step 6, **Criminal Case**: the old
  form's five questions in its order (the allegations, the offer, the offence date, "Screening - The
  Incident" as W15's tiles, the details box); the co-defendant and complainant boxes are gone,
  because those people are rows at step 7; the offence date stays free text, like the entry dates.
  **A long answer's guidance is written inside its box**, in grey, rather than above or below it:
  the example first, after "e.g.", **in italics**; a blank line; then the instruction. It disappears
  as soon as anything is typed and comes back if the box is emptied. The owner's words:
  - Allegations: *e.g. "Client alleged to have slapped complainant, his girlfriend. She is alleged
    to have sustained a nose bleed and minor bruising"* / Please summarize the **ALLEGATIONS**
    (underlined) at their worst - not what actually happened / can be proven
  - Offer: *e.g. "Take it to trial unless they offer x"; "client would probably accept y type of
    disposition"* / Please record (1) any existing or likely offer to dispose of this case and (2)
    your client's current objectives. (Even your best guess is very helpful information.)
  - Offence date: *e.g. "August 2, 2026"; "between January and March 2026"* / Please provide as
    much detail as possible if this is unclear (many immigration consequences depend on commission
    date)

  (The standing length note under each long box is replaced by W24 2.) **How it is built:** a box's own placeholder text cannot mix italic and
  plain, so the guidance is an element laid over the box: the box and the guidance share one grid
  cell, so an empty box opens as tall as its guidance; once anything is typed, CSS hides the
  guidance (`:placeholder-shown`, with a placeholder of a single space) but keeps its room, so the
  box does not jump smaller at the first keystroke, and grows past it if the answer is longer. No
  script. The guidance is the box's description for screen readers (`aria-describedby`). Chosen
  over the help under the box (as steps 2 to 5 were first drawn) and between the question and the
  box.
- **W17 1** (18 October 2026): **the short answer boxes hold their guidance inside the box too**,
  as the long boxes (W16): one rule for every box that can hold words. A short box opens as tall as
  its guidance and shrinks to one line at the first letter typed (unlike a long box, which keeps
  its room), so the questions below move up once. The old help's own examples move into the
  "e.g." line. A date box or a choice cannot hold words, so its guidance sits between the question
  and the answer ("If unknown, please leave blank."); the tick lists keep W15's line under their
  band. Paired boxes on a computer line up (each pair is a two-row subgrid). Chosen over the
  guidance between the question and the box.
- **W19 yes** (18 October 2026, the owner's own idea): the client's name boxes are **"Client First
  Name"** and **"Client Middle & Last Names"**, both required. The database's search for a client
  already on file treats every word of the second box as a possible surname and reads only the
  first letter of the first, so the label now says what the old help text said; the second box has
  no guidance, and the first holds *"First name only. If in doubt, put a name in the next box."* The
  worker's key (`client.lastName`) and the database's field keep their names: only the page's label
  changes. Step 7's name boxes for other people follow the same labels.
- **W20, redrawn with the owner's changes** (18 October 2026): step 6 for a **violation of
  probation** (the case type is a violation of probation, not probation). Its heading says
  "Violation of probation"; the step bar says **"Probation Violation"**, because "Violation Of
  Probation" runs into "Other People" on a computer (measured). The old form's seven questions,
  changed as follows:
  - "Did RIAC Advise On The Underlying Criminal Case?": Yes, No, **Unknown** (not "Unknown -
    PLEASE DESCRIBE WHY"). Under **Yes**, "RIAC Case Number For The Underlying Case" (in the box:
    *If you know it*). Under **No or Unknown**, a notes box headed **"Please provide any
    information relevant to whether your client received immigration advice prior to the
    underlying conviction"** (the owner's words).
  - **"Statute And Subsection Of <u>ALL</u> Convictions"** (ALL underlined; it replaces "… Of The
    Underlying Conviction(s)"), in the box: *e.g. "PL 120.00(1) Assault 3rd"; "VTL 1192(3) DWI"*.
  - "Original Sentence", in the box: *e.g. "3 years probation"; "6 months jail and 5 years
    probation"*.
  - "Current Allegations", with the Criminal Case allegations guidance word for word (W16).
  - "Is There A Parallel Criminal Charge?" ("VOP - " dropped): Yes, No, **Unknown**. Under Yes,
    "Details Of The Parallel Criminal Charge" (in the box: *e.g. "Petit Larceny, arrested May 3,
    2026; pending in Syracuse City Court"*); under Unknown, a notes box headed "Please provide any
    information relevant to whether there is a parallel criminal charge".
  - **No "Up to 6,000 characters…" note on this step**: answers here will not come near it. The
    limits themselves are unchanged.

  ⚠️ The worker's contract changes with it: the notes about RIAC's advice
  (`vop.underlyingAdvisedUnknownWhy`) now come with **No** as well as Unknown, and are still refused
  under Yes; an empty box under No passes nothing on (contract draft 12, built and tested by the
  worker chat, 18 October 2026; not yet deployed). Narrow windows (below about 1,050 px) get the phone-style step bar, since
  the longer step names collide there.
- **W21 yes** (18 October 2026): **every "Unknown - PLEASE DESCRIBE WHY" on the form becomes a
  plain "Unknown"**, as on the probation step (W20): on every screening tick list (about the
  client, ICE, immigration questions, family, orders of protection, the incident, family court's
  three) and on the Yes / No / Unknown questions. When Unknown is chosen, a notes box opens under a
  gentle header, in place of W15's "Why it is unknown. Up to 1,000 characters.": on a tick list
  "Please provide any information relevant to these questions"; on the order-of-protection
  question "Please provide any information relevant to whether this case involves an order of
  protection"; on the family question "Please provide any information relevant to whether your
  client has US citizen or green card family members". The box opens under Unknown only, not under
  No or "None of these apply" (the probation step's advice question is the exception, W20). The
  codes and keys are unchanged (`unknown`, the `…UnknownWhy` keys, 1,000 characters).
- **W22 yes** (18 October 2026): step 6 for an **appeal**. "Did The Client Receive Formal
  Immigration Advice Before Disposition?" keeps its four choices (Yes - From RIAC, Yes - From
  Other Source, No, Unclear) with its old help above them (*Choose "Unclear" if you asked and
  could not establish it — that is more useful to us than leaving this blank.*). Under either
  Yes, "Details Of Immigration Advice Received By Client", in the box: *e.g. "Defense counsel told
  client at the plea that it could affect immigration; client did not ask"* / *Please include (1)
  what the client was advised, (2) at what point in the proceedings this advice was given and (3)
  whether your client affirmatively asked counsel about immigration*. Under No or Unclear, a notes
  box headed "Please provide any information relevant to whether your client received immigration
  advice before the disposition", sent in the same key (`appeal.adviceDetails`), so the contract
  does not change. Then "Details Of The Disposition", in the box: *e.g. "Pled guilty to PL
  120.00(1) Assault 3rd on May 4, 2026; sentenced to 3 years probation"*. No 6,000-character note.
  The old form's two uploads (the advice the client received; transcripts such as the plea
  colloquy) move to step 8 as their own kinds, and the step ends with *You can attach a copy of any
  immigration advice your client received, and any relevant transcripts (e.g. the plea colloquy),
  at step 8, Documents.*
- **W23 2** (18 October 2026): step 6 for **post-conviction relief** asks the Criminal Case
  questions (W16) under a small heading "The case", then the Appeal questions (W22) under "The
  conviction and the advice". Its "Existing Offer Or Likely Disposition" keeps its label and key
  but its guidance is for after a conviction: *e.g. "DA will consent to vacate and allow a re-plea
  to disorderly conduct"; "client's goal is a resentence of 364 days"* / *Please record (1) any
  existing or likely offer if the conviction is vacated or the sentence changed and (2) your
  client's current objectives. (Even your best guess is very helpful information.)* No
  6,000-character note under it (the owner, with W23 2). Chosen over the Criminal Case wording
  unchanged, and over leaving the question out.
- **W24 2** (18 October 2026, from the owner's "remember to remove the 6000 character warning"):
  **no standing "Up to 6,000 characters…" note anywhere on the form.** Instead a line appears under
  a box only once its answer nears the limit (from 5,000 of 6,000, or 900 of 1,000), for example
  *5,612 of 6,000 characters. A longer account can be attached as a file at step 8.*, in the
  orange-brown of a warning; the page still stops accepting text at the limit. This replaces RW4
  1's note near every long answer and W16's note under each long box. Chosen over no line at all.
- **W25 yes, with the owner's change** (18 October 2026): step 6 for **family court or divorce**,
  the old form's labels word for word (its "opposing or involved parties" are rows at step 7). In
  the boxes:
  - Case description: *e.g. "Accused of disciplining child 5-10 times with a paddle, resulting in
    red marks"; "wants to divorce spouse (who sponsored her green card). DV allegations from both
    sides likely."* / *Please provide an overview of what your client is facing / wants to
    accomplish*
  - Offers & likely outcome: *e.g. "Petitioner would withdraw if client consents to a one-year
    order of protection"; "client wants joint custody and will not admit to neglect"* / *Please
    record (1) any existing or likely offer to resolve this case and (2) your client's current
    objectives. (Even your best guess is very helpful information.)*
  - Children: **the numbered points sit outside the box**, between the question and the box, **as
    a formatted numbered list** (the owner's two changes): *For each child, please note:* 1. the
    child's date of birth AND country of birth; 2. whether they are the biological or adopted
    children of your client and their spouse; *If a child was not born in the U.S., please also
    include:* 3. their current immigration status; 4. when they received it (a list in two parts,
    numbered on, all in the italic grey of the guidance). The box holds the example only: *e.g. "Maria, born March
    3, 2015 in Mexico; biological child of client and spouse; green card since 2019"*
  - Marriage: *e.g. "Married June 12, 2018 at the Onondaga County Clerk's Office; religious
    ceremony in Pakistan in 2017, never registered"* / *Please include the date and physical
    location the marriage was solemnized, and highlight any less common situation, such as an
    arranged marriage, a religious or customary marriage NOT registered with civil authorities, or
    a possibly bigamous one*
  - Spouse's immigration status: *e.g. "U.S. citizen since 2012"; "green card since 2016"*

  The two Yes / No / Unsure questions and the three tick lists as the old form, W15 and W21;
  "Marriage Or Divorce" shows when Divorce is ticked, "Money And Support" when Divorce, Custody or
  Family Court (Other) is.
- **W26 2** (18 October 2026, the owner's observation that the guidance looked larger than the
  question): on the form, **a question is the largest text** (`--fs-text`, bold: the labels and the
  tick lists' banded questions), **the grey guidance and the descriptions are smaller**
  (`--fs-small`; the guidance inside a box no longer takes the typed answer's size), and typed
  answers are at `--fs-text`. The form's own styles; the site's `.field label` elsewhere is
  unchanged. Chosen over shrinking the guidance alone, which left it the same size as the question.
- **All guidance is in italics** (the owner's instruction, 18 October 2026): every piece of grey
  guidance on the form, inside the boxes and out, the length notes, "Select any which apply" and
  the step hints included. Inside a box, the example and the instruction are then told apart by
  "e.g." and the blank line between them.
- **W18 1** (18 October 2026, the owner's own request for a lighter grey): **all the form's grey
  guidance** (inside the boxes, under the questions, the length notes, the step hints) is
  **`#6b7786`**, a little lighter than the site's `--muted`: the lightest grey that still meets the
  usual accessibility standard for text this size (4.6 to 1 on the white card; the standard asks
  4.5). It is the form's own variable, so the rest of the site keeps `--muted`. Chosen over half way
  (`#8c95a1`, 3.0 to 1) and a browser's own in-box grey (`#a3aab3`, 2.3 to 1), both below the
  standard. ⚠️ Do not lighten it further without asking: the guidance carries rules the attorney has
  to follow.

## Working across two computers

The owner works from more than one desktop. Chats started in a **local terminal** are stored on
that machine only (`~/.claude/projects/<encoded-path>/*.jsonl`) and cannot be reached from
anywhere else — if that computer sleeps, the conversation is stranded. Chats started
**online** (claude.ai/code, or the desktop app's cloud option) run on Anthropic's servers
and are available from any computer.

Rule of thumb:

- **Website edits and Airtable work → start the chat online.** Neither needs anything on
  the owner's hard drive. Airtable is reached over the internet either way.
- **Practice advisory edits → local session.** The masters live in the owner's OneDrive, in the
  RIAC documents folder, and an online session cannot see that folder. Word source copies are
  also kept in `advisories/source/` in this repo.

Because stranded chats are a recurring problem, **durable decisions belong in files, not
in conversation** — `AIRTABLE.md` (in `maildej/RIAC-Airtable`) for database work, this file for
everything else. Write the conclusion down as you go.

## Where a chat runs, when it ends, and why the machinery is mentioned

These apply to every session on this repository, cloud or local. The fuller version, with its
reasoning, is rule 10 of `CLAUDE.md` in `maildej/RIAC-Airtable`.

- **Open every session by saying where it is running**, in one short paragraph: cloud or desktop,
  which repository or folder is attached (or none), and whether that fits the task. Website edits
  and GitHub housekeeping belong in the cloud; anything needing files on the desktop (OneDrive,
  Word masters, Outlook) belongs local; a chat with no folder attached cannot push to GitHub. If
  the place does not fit, say so and give the move: what to push first, how to start the right
  kind of chat, and a paste-ready opening message for it. Ask only where the opening message
  leaves it genuinely undecidable.
- **Suggest a new chat when the opening task is finished, the conversation has drifted from its
  title, or earlier decisions are being asked again.** Do the hand-over first: `***Publish`, then
  write the next chat's opening message, ready to paste.
- **When the work is done, say so and prompt the archive** in one line: "This chat is finished.
  Archive it: in the desktop sidebar, right-click the chat and choose Archive." Archiving hides the
  chat and can be undone. A cloud archive does not reach the desktop's list of local chats, nor
  the reverse.
- **Explain every technical step in one plain sentence before taking it** — pull, push, merge,
  branch, force-push, re-clone, attaching a repository — saying what it does and why it is needed
  now. Name the control, not the outcome: "merge the pull request, which copies the branch's
  changes into `main`, so the fix goes live", not "merge it".

## Outstanding

**Website:**

- **The referral form and the attorney portal** (see the section of that name above). Until they
  go live, `intake.html` stays PDF-only. Airtable's own form is no longer public, so it is
  **not** linked from this site.
- **[Owner] Confirm the staff email signature actually renders.** `nyriac.com` is blocked to
  Claude, and no session can see a real Outlook. Send a test to an address that has never
  received mail from the sender before.
- **[Owner] Update the OneDrive signature file's Region 2 number** to **(315) 898-2593** in every
  signature block it holds. An online session cannot reach OneDrive, and the individual staff
  blocks exist only in that file.
- **[Owner, optional] Delete the Chief Defender survey's form in Formspree** (`mdaqzrpq`,
  "Chief Defender Referral Survey"). The survey page is gone from the site, so nothing posts to
  it; deleting it frees the slot. The responses already emailed to RIAC2@ocbaacp.org are not
  affected.
- **[Owner, decide] The Region 2 and Region 3 cards on `contact.html` name no host office**; the
  other four do (e.g. "Legal Aid Bureau of Buffalo"). Suggested, not yet answered: send the names
  as they should appear if they are to be added.

**Traps that have already cost time:**

- ⚠️ **A fix committed to a branch changes nothing that the public sees.** Only `main` is
  published. A contact-page correction once sat unmerged for three weeks while attorneys were
  pointed at the wrong office. When a correction matters, say plainly that merging is the step
  that publishes it, and check back rather than assuming it happened.
- The Nassau County mailbox really is named `SuffolkLIRIAC@nclas.org`. It reads oddly, it is
  correct, and it is a Nassau (`nclas.org`) address. **Leave it.**
- Placeholder content, if any is ever added, is marked with yellow `.notice` boxes and the word
  "placeholder". None remains on the live site.

⚠️ **`nyriac.com` is blocked to Claude by the network proxy**, so the live site cannot be
checked from a session — only the files in this repo can. Ask the owner rather than assuming
the site is behind what is in the folder.

### RIAC CMS (the Airtable pilot — nothing to do with this website)

The base is "RIAC CMS Pilot", and it has its own two files. ⚠️ **Both now live in the private
repository `maildej/RIAC-Airtable`, not here** — ask for that repo to be added to the session
before doing any database work, or you will be working blind:

- **`AIRTABLE.md`** — the database map: tables, interface pages, automations, the reminder ladder and how a case gets chased and closed, the offence catalogues and their loader scripts, and everything currently unfinished. Read it before doing any Airtable work.
- **`AIRTABLE-TODO.md`** — **the Airtable to-do list.** Everything still outstanding on the database, not only the parts the owner has to do by hand. If asked "what's on my to-do list for the Airtable?", read it and offer a couple of items; most are big enough to want a chat each. Every item is tagged so it is clear up front what can be done in the session and what needs hands in the interface designer.

**Put Airtable items in those two files, not in the list above.** Nothing about the database is tracked here any more.
