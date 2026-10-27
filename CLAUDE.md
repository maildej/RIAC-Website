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

- **Plain static HTML/CSS.** No build step, no frameworks, no Jekyll (`.nojekyll` disables it). JavaScript is limited to small plain scripts in `js/` (the advisory search, the map tooltips, the download-request form), plus the referral form's and the portal's, which are larger but still plain JavaScript with no library and no build step. External dependencies: Google Fonts (Source Serif 4 + Inter) loaded via a `<link>` in each page's `<head>`, and, on the form and the portal only, Cloudflare's Turnstile bot check, loaded from `challenges.cloudflare.com` when it is needed.
- **Hosting:** GitHub Pages, deployed from the `main` branch of a GitHub repo.
- **Domain:** `nyriac.com`, registered at **Wix**. Wix does not allow domain transfers or nameserver changes, so DNS is managed inside Wix: A records point the apex domain to GitHub Pages' IPs, and a CNAME points `www` to the GitHub Pages address. The `CNAME` file in this folder tells GitHub Pages the custom domain. See `SETUP.md` for the exact records.

## File map

| File | Purpose |
|---|---|
| `index.html` | Landing page: hero with the **clickable region map** (inline SVG), what we do, who we serve |
| `advisories.html` | List of downloadable practice advisory PDFs |
| `contact.html` | Six region cards (`#region-1` … `#region-6`) with counties served and each center's contacts — the map links here |
| `intake.html` | **Send A Case** (W2 1; the address is kept): two cards, **Send Us A New Case** (the form, orange) and **Your Referrals** (the portal's sign-in), with the paper intake forms beneath |
| `referral.html` | **The referral form**, nine steps drawn by `js/referral.js` from `js/referral-data.js`, sent to the worker. See "The referral form and the attorney portal" |
| `portal/` | **Your Referrals**, the attorney portal: `index.html` (sign in by an emailed link, then the list) and `add.html` (Send RIAC A Message, W97 1; once Add To This Referral, then Send RIAC An Update), both run by `js/portal.js`. Links inside use `../` |
| `css/style.css` | All styling, shared by every page. At the top in `:root`: the brand and region colors, and the type scale (`--fs-*`) — see "Design rules" below |
| `css/referral.css` | The form's and the portal's own styles, loaded after `style.css` by those pages only: the step bar, the questions (each step a ruled sheet, W103 3), tick tiles, document boxes, the copy and its print, the portal's list |
| `js/referral-data.js` | **Every question on the form**: its key and choice codes exactly as the worker's contract has them, its words on screen and its guidance; the centers' contact details (a copy of `contact.html`); the "Before You Receive RIAC Advice" warnings with their advisories' titles and PDF addresses (W32 1; a copy of what `advisories.html` lists); the worker's address and the Turnstile key. Change wording here | 
| `js/referral.js`, `js/portal.js` | The form and the portal: drawing, checking, uploading files one at a time, sending | 
| `js/offenses.js` | RIAC's list of New York offenses for the form's charge picker (W101 1a): public law only, made by a chat from RIAC's own list, never edited by hand |
| `images/symbols.svg` | The symbols on the advisory, intake and home-page cards and in the portal (its tick tiles, "Send a message"), one `<symbol id="i-…">` each — see "Design rules" below |
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

The general lesson, from the intake test folder this site once had (deleted with the build of the referral form):
a page can be left unlinked and carry `noindex, nofollow` (as `portal/add.html` does).

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
- **Decap is pinned** (security review CS5, finding 2, 20 October 2026): `admin/index.html` loads exactly
  `decap-cms@3.17.1` from unpkg with an integrity fingerprint, `sha384-d2pbrhjc5asvSK35gKkrgRIk0Wq+2CQynWnXtSsYWQawXCgBXhcAK737jBAKXT4T`,
  and `crossorigin="anonymous"`, so the browser refuses the file if unpkg ever serves anything else (before, `@^3.0.0`
  loaded whatever 3.x unpkg offered). The fingerprint was checked against the same file in npm's own package. Live since 20 October 2026; the owner signed in afterwards and the advisory list opened.
  **Updating Decap means a new version number and a new fingerprint together**: hash the new file (`openssl dgst
  -sha384 -binary decap-cms.js | openssl base64 -A`), cross-check it with `npm pack decap-cms@<version>`, and change
  both in one edit; a new number with the old fingerprint leaves the admin page blank. The admin page has no
  security policy yet: one can only be tested with a real GitHub sign-in.

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
  `request.html`, `thanks.html`, `404.html`, `referral.html`, and `portal/index.html` and `portal/add.html` (whose links start `../`).
- Pages use relative links (`advisories.html`); only `404.html` uses absolute links (`/advisories.html`) because it is served from other addresses; the portal's pages, one folder down, use `../`.
- To publish changes: commit and push to `main` (or upload the changed files via github.com); GitHub Pages redeploys automatically in ~1 minute.
- **Every public page carries a security policy** (a `<meta http-equiv="Content-Security-Policy">` right after
  the charset line): scripts only from this site, no inline scripts or styles, fonts from Google, and on
  `request.html` also Formspree. **A new page copies it, and colours or other styles go in `css/style.css`, never
  in a `style="..."` attribute** (the policy would ignore it; the region colours are classes `.dot-r1`... and
  `#region-1`...). The form and the portal have their own, wider policy. `admin/` has none yet: it needs Decap
  pinned first (the security review's finding 2).
- **The Download PDF button on `thanks.html` only ever points at one of this site's advisory PDFs**
  (`advisories/<name>.pdf`, lower-case letters, digits and hyphens); anything else in the address leaves it on
  `advisories.html`, and `request.html` passes nothing else on (`js/document-request.js`). It once took any
  address, so a crafted link could run code on nyriac.com (security review CS5, finding 1, fixed 20 October 2026).
  **Advisory PDF names must keep to that pattern.**

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
- **The cream title card** at the top of Practice Advisories, Send A Case, the referral form and the portal's two pages
  is kept small (W66 1, 22 October 2026: it read as "too large/doughy"): the title at `--fs-section`, the line under
  it at `--fs-text` (`--fs-small` on a phone; on the portal's two pages `--fs-small` at every width, W82 1), little
  padding. The navy title card (Find Your RIAC, the request and thanks pages) is unchanged.
- **Buttons and pills in a group are the same width and height**, unless there is a reason not
  to — the rule the database pages follow. On a phone the four menu buttons are a two-by-two
  grid of equal buttons, and the home page's two buttons stack, full width. The one exception:
  on a computer the menu's "Practice Advisories" is wider than the other three, because four
  items that wide would push the menu onto a second row.
- **Drop-downs, search bars and pills (status flags included) are full width, or the width of an
  obvious column**, unless there is a reason not to (the owner, 22 October 2026, with W58 1). On
  the portal's list: the search fills the line beside the heading (on a computer the column
  headings sort, W99 1; below that Sort is a full-width drop-down), and each status box fills its
  column; on a phone each is full width.
- **A button or box that wraps never leaves one word alone on its last line** (the owner, 26 October 2026, with W96
  1): `text-wrap: balance` on `.btn` (in `style.css`, written before `white-space`, which would otherwise be overridden
  and make every button wrap) and on the status boxes.
- **Never a pill directly above or below plain left-aligned text** (the owner, 26 October 2026, with W95 2c: "a general
  design problem"): with the pill's edge on the text's edge its words look indented, with its words on the text's edge
  the pill looks off to the left, and splitting the difference looks wrong too. Make both pills, or keep them apart.
- **Symbols** (`images/symbols.svg`) are drawn for this site: solid navy shapes with one orange
  detail, on a 48-unit square. The navy follows the text colour; the cream and orange come from
  `--icon-fill` and `--icon-accent`, which `.symbol` sets. A page shows one with
  `<span class="symbol" aria-hidden="true"><svg><use href="images/symbols.svg#i-NAME"/></svg></span>`
  inside the card's `<h3>`. ⚠️ Never put two hyphens in a row inside a comment in that file: it
  is XML, a double hyphen in a comment is an error, and the browser then draws **none** of the
  symbols. Do not use stock or clip-art pictures, or images from the training slides: most are
  not licensed for a public website.

### The referral form and the attorney portal (built, not yet live)

Attorneys will send a new case through a form on this site, and sign in to an attorney portal
to see their referrals and add to them. Both were designed and then built (on the owner's "build", 18 October
2026) by the chats "Website - [W] nyriac.com referral and portal pages (Local)" and its successor "…, continued
(Local)"; the owner's decisions on them are coded W1, W2 and so on. **Nothing is pushed to `main` before the owner
says yes to that push: merging is what publishes it.**

⚠️ **The pages send to a private worker** (a small program on Cloudflare), never straight into
the database. The worker is built in a private repository. This repository is public, so
nothing from the private repositories goes in it: no code, no database, table or field names or
IDs, and no keys. The pages know only the worker's public addresses and what each one takes
and gives back, agreed with the worker's chat. On the desktop the pages are previewed on
`http://localhost:8790` (the port is this chat's, given by the dispatcher), beside the worker on 8789.
The agreed contract (draft 17, 20 October 2026; draft 13 added W36's removal answers and named files, draft 17 the
client's address: the addresses, what each takes and gives back, the
errors, and a short code for every answer on the form; files go up one at a time before the
referral itself) is in the shared hand-over folder on the desktop,
`riac-handover\RW\public-contract-draft.md` and `riac-handover\W\referral-keys.md`. It stays there: it
names the tester's own email addresses, which do not belong in this public repository. `js/referral-data.js` holds
every key and code the pages send.

- **File limits** (the owner's RW3 1): up to 20 files a referral or addition, 25 MB each, 100 MB
  together. **File types:** PDF, Word (.docx only; the old .doc is refused since 20 October 2026, security review CS5
  finding 4), JPEG, PNG and HEIC; the pickers offer only these. The pages read them from the worker's answer rather than writing them in, show them
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
- **A referral's reference** (RW6 1, settled as digits in contract draft 14, 20 October 2026) looks like
  `R2-261016-734062`: the centre's code, the New York date, and six random digits; an intake keyed in at RIAC has the
  same form. The portal's search, like the worker, reads a typed O as 0 and I or L as 1. The pages show it exactly as the
  worker gives it (the mockups' shorter `R2-0142` is only a stand-in).
- **The bot-check key** (19 October 2026): the live pages use the site key of the owner's Turnstile widget "nyriac.com
  referrals and portal" (Managed, nyriac.com and www.nyriac.com), `0x4AAAAAAFbnCVMLz6_diRwD` (six A's; copied from
  Cloudflare), in `js/referral-data.js`; on localhost the pages keep Cloudflare's test key, which always passes. The
  secret key is on the worker only (set by the owner), never in this repository.

**How the build works** (18 October 2026, tested against the worker running locally):

- `referral.html` holds only the page's frame; `js/referral.js` draws the nine steps from `js/referral-data.js`, one at
  a time, re-drawing the step when a choice changes what is shown. A question hidden by an earlier answer is not sent.
  Choices are sent as their codes; the words on screen can change in `referral-data.js` alone.
- **While the form is open the answers are held in the browser tab** (`sessionStorage`), so a reload does not lose
  them; closing the tab, or Send, clears them. Files cannot survive a reload unless they had finished uploading.
- **Files** (W28): at the Documents step Cloudflare's check runs, then the worker's first call makes a batch naming
  the county or the center chosen, which returns that center's limits; each file then uploads as soon as it is chosen,
  one at a time, with its own progress bar. A batch past its hour, or made for another center, is made again (one more
  check) and the files sent again. **Send** posts the referral with an `Idempotency-Key`, so a retry never sends it
  twice.
- **The portal** keeps its session in the browser tab only (`sessionStorage`, since 20 October 2026, security review
  CS5 finding 8; it was a cookie for `/portal/`), so it is sent nowhere and ends when the tab closes: a portal page
  opened in a new tab asks to sign in again ("Send RIAC An Update" opens in the same tab); the sign-in link's token comes after `#`, is read
  and cleared from the address bar at once, and works only with the secret this browser kept when it asked.
- **Each page has a security policy** (a `<meta>` Content-Security-Policy) allowing scripts only from this site and
  Cloudflare's check, and connections only to the worker's two addresses (the live one and `localhost:8789` for
  testing). No inline scripts or styles. **Framed by another site, the form and the portal draw nothing but a link to
  open the page properly** (GitHub Pages cannot send the headers that forbid framing; security review CS5, finding 6).
- **Go-live checklist** (security review CS5, finding 9), in the same step as the worker's MODE "live": **remove
  `http://localhost:8789` from `connect-src` in the policy of `referral.html`, `portal/index.html` and
  `portal/add.html`**; the live pages then talk only to the live worker.
- **The trial run, then the go-live** (agreed 20 October 2026 with the worker chat and the dispatcher; the full plan,
  with every check, is `riac-handover\W\trial-plan.md` on the desktop). Each step waits for the owner's yes.
  - **S0:** the deployed worker made able to take a test referral: the case-start chat's receiving side and what the
    portal reads, the email tenant chat's two Microsoft registrations, the owner's secrets in Cloudflare. Until
    then it answers "unavailable" to every Send. Started on the owner's W38 1.
  - **S1:** the pages go on nyriac.com **unlisted**, shortly before the trial and only once S0 works (the dispatcher's
    advice): a branch `claude/referral-trial` is this branch plus **one commit** that puts back the live site's menu
    ("Intake Forms"), `intake.html` and `index.html`, and adds the trial band (W39) and `noindex` to the three new
    pages. That branch is merged to `main`. **Done 21 October 2026** (W41 1): `main` is the trial version.
  - **S2:** the trial on nyriac.com with invented details, example.com and the owner's two addresses only (the worker,
    in test mode, refuses any other address). **S3:** fixes, then a go / no-go from the owner.
    **The emailed centres were tried on 21 October 2026** (W42, W44): four referrals sent and arrived with their files,
    and every refusal behaved (a file past 2.8 MB, `.doc` and a `.doc` renamed `.docx`, an address outside the test
    ones, Send pressed twice). Region 2 and the portal wait for the case-start chat's receiving side. Found then: at
    Outlook.com the emails went to **Junk**. The email chat read the headers: nyriac.com's sender checks all pass, so
    this is the receiving filter's judgement of a brand-new sender, not a fault to fix. (The "Unverified" tag was only
    on the copy OCBA forwards on, whose mail filter rewrites links.) The emails also name Regions 1 and 3 differently
    from this site; that is the worker chat's to settle with the owner.
    ⚠️ **The trial is run from the owner's own Chrome (Claude in Chrome), not the app's built-in browser:** on nyriac.com
    the real Cloudflare check refuses the built-in browser, even when a person ticks the box (error 600010).
  - **H1, H2:** the worker goes live first (the trial's rows deleted, MODE "live"), then on `main` **the trial commit
    is reverted** and `localhost:8789` taken out of the three policies, in one pull request; that publishes Send A Case.
    ⚠️ Worker first, so no real attorney ever meets "only a test email address can be used".
- **Testing locally:** the worker chat starts the worker on `localhost:8789` with stand-ins; serve this folder on
  `localhost:8790`; the local worker writes each sign-in link to `riac-handover\RW\local-links.txt`. Test scripts
  (Playwright, from `RIAC-App\tests\case-page\node_modules`) are in `riac-handover\W\tests\`: a full criminal
  referral, one referral for each case type and route, and the portal end to end. All passed on 18 October 2026.
- **All the wording drafted in the build has been put to the owner** (the error messages W31, the advice warnings
  W32, the spelling W33, the document descriptions W34, step 9's name W35).

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
  (the attorney's names, email, phone, office type, office); Court & Case (case type, at step 1 since W90 2; answer here
  or upload a completed intake form instead; advice needed by; court, docket, next date; custody;
  orders of protection; ICE involvement; details); Client (names, date of birth, other names or
  dates of birth; country of birth, English, language); Immigration (entry and current status and
  dates, A-number, pending applications, three screening lists, immigration attorney, family,
  details); the case-type step; Other People (CS7 rows); Documents (each kind enclosed, sent
  before, to follow or not available; RAP sheet completeness; anything else). On the upload way,
  Immigration, the case-type step and Other People are skipped (struck through on the bar) and
  Client asks only names and date of birth. Step labels sit on one line. The three fixes are
  worded with the owner on their steps; the Removal questions (fix 2) were set by the owner in W36. Chosen over seven longer steps.
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
  **Case Type first** (six choices, two columns), asked on both ways (fix 3; at the top of step 1 since W90 2); "If this case is
  urgent…"; the court found by typing, from the county's courts, with "Court Not Listed / Non-NY
  Court?"; Docket No. and Next Court Date side by side; ICE INVOLVEMENT in a tinted tick box; the
  order-of-protection question, its tick list opening under Yes; custody status (seven choices,
  two columns); the details box. **The upload way is offered by a quiet line at the top**,
  "Already filled in a RIAC intake form (the PDF)? Upload it instead ›", not a required question;
  on the upload way an orange line says what comes next (the client's name, then the form at step
  8) with "Answer the questions here instead ›", and the step keeps only the case type and the
  urgency. Chosen over the old form's required "How Would You Like To Submit Your Referral?".
- **W14 2** (17 October 2026; **two answers to a row reversed by W103 3**): steps 4, **Client**, and 5, **Immigration**: the old form's
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
- **W16, redrawn with the owner's changes** (17 October 2026; **guidance inside the box reversed by W103 3**): step 6, **Criminal Case**: the old
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
- **W17 1** (18 October 2026; **reversed by W103 3**): **the short answer boxes hold their guidance inside the box too**,
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
  worker chat, 18 October 2026; not yet deployed). Narrow windows (below about 1,120 px since 27 October; 1,050 before, which let "Probation Violation" meet "Other People": the overnight review's W-Q15) get the phone-style step bar, since
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
- **W27 2** (18 October 2026): step 7, **Other People**. "Is Anyone Else Involved In This Case?"
  (required: Yes, No, Not known yet), described *Co-defendants, complainants or victims, witnesses,
  family members, or anyone else named.* Under Yes, **each person added becomes one line** (name,
  role, relationship, date of birth; **Change** and **Remove**), and **one "Add a person" box** sits
  beneath: First Name and Middle & Last Names (W19's labels and guidance), Date Of Birth (the
  browser's date box, *If known*), Their Role (a dropdown of the five: Co-defendant, Complainant or
  victim, Witness, Family member, Other person named), Relationship To The Client (*e.g. "former
  partner"; "brother"; "none"*), and **+ Add This Person**, which moves the person into the list and
  empties the box. **Safeguard:** pressing Next with details still in the box adds that person, or,
  if the name or role is missing, stops and points at the box, so nobody typed is lost. Then
  "Anyone Involved Whose Name You Do Not Know" (*e.g. "Two unidentified co-defendants"; "the
  complainant's mother, name unknown"*). Keys as the contract: `people[]`, `peopleNote`,
  `noOtherPeople`. Chosen over a card for each person with every field open.
- **W28 yes** (18 October 2026): step 8, **Documents**. At the top, **Cloudflare's bot check**
  (the upload's first call needs it before any file can go; on most visits it ticks itself), then
  **the limits the worker gives** (Region 2: 20 files, 25 MB each, 100 MB in all; a center reached
  by email: 2.8 MB in all, with a line that larger files can go to the center directly after
  Send). **Each document is a square box** with its name and description in a band, **named as on
  the paper criminal intake form**: *Fingerprint RAP Sheet* (Repository inquiries are generally
  insufficient), *All Accusatory Instruments* (Must include supporting affidavits / police
  reports), *All Immigration Documents* (e.g. green card, work permit, USCIS receipt or passport
  visa). Each box has **four buttons of one size: Attach Now, Sent Before, To Follow, Not
  Available** (Sent Before only on those three kinds, as the contract allows). Files **upload as
  soon as they are chosen**, each with its own progress bar, Remove, and Try Again if it fails.
  Not Available opens *Please explain (we may be able to help)* (the paper form's words). The boxes
  shown follow the case type: the RAP sheet and immigration documents always; accusatory
  instruments for a criminal case, an appeal and post-conviction relief; probation paperwork for a
  violation of probation; pleadings for family court; the immigration advice and transcripts for an
  appeal and post-conviction relief; on the upload way, the completed intake form first. Then the
  old form's "Does The RAP Sheet Include ALL Of Your Client's Criminal History?" and, under No or
  Unsure, "Criminal History Not On The RAP Sheet / Further Details" (in the box: *e.g. "Arrested in
  New Jersey in 2019 for shoplifting; outcome unknown"*), and "Include Anything Else RIAC Needs To
  Know Here:". The page checks every document has an answer before Send. Chosen over the paper
  form's tick boxes beside each upload.
- **W29 1** (18 October 2026): step 9, **Check And Send**, shows every answer **as the same
  document as the copy kept after Send** (W1 1's letterhead and sections, "Not sent yet" where the
  reference will go), with *Please read every answer. Change any section before you send; this is
  also the copy you will keep.* and a **Change** link beside each section's heading, which opens
  that step. The page ends with *Once sent, this referral cannot be changed here. To add to it
  later, use Your Referrals.* (for a center reached by email: contact the center), a full-width
  button named for the center (**Send To Central New York RIAC**), and Back. If the referral is
  over 80 KB, Send stops and names the longest answer. Chosen over a card for each step.
- **W30 1** (18 October 2026): **the printed copy** (Print Or Save As PDF, after Send). Only the
  document prints, on US Letter: no site header, menu, footer or buttons. Page 1 carries the
  letterhead and the reference, then when it was sent and where the receipt went; the sections
  run in order; a heading is never left at the foot of a page, and no answer is split across pages
  (`break-after: avoid` on headings, `break-inside: avoid` on each answer). **Every page's foot
  reads "Referral R2-…" on the left and "Page 1 of 3" on the right**, no client name (CSS `@page`
  margin boxes). Chosen over adding the client's name to the footer.
- **W31, with the owner's change** (18 October 2026): **the error messages.** The owner's change: **an answer
  still to be given is shown in red, with no words** ("the message description seems overkill"): its question
  turns red and its box gets a red outline (a tick list or document box: red border and a pale red band; a
  Yes / No question: a red bar down its left side). There is **no list of problems at the top of the step**;
  pressing Next goes to the first red answer instead, and the red goes as soon as that answer is given. Where
  either of two answers will do (Other People: add a person, or describe someone whose name is not known),
  both are outlined. Screen readers are told how many answers are still needed (hidden text, `aria-invalid`).
  **Words stay only where an answer is there but cannot be used:** an email address that is not one ("Please
  enter an email address, like name@example.org."), an office or court typed but not chosen from the list, and
  **files** (each refused file's reason on its row, e.g. "Over the 25 MB limit for one file." and "This kind
  of file cannot be sent: use PDF, Word (.docx), JPEG, PNG or HEIC." ("(.docx)" added 20 October 2026, when the old .doc was dropped: security review CS5, finding 4, the owner's yes), with "Remove the files that could not be sent;
  the reason is beside each." and "Please wait for every file to finish uploading." under the box). **The
  messages at Send are approved as drawn** (the owner: "the upload error and submission error are fine"): a
  failed connection ("Your referral may not have been sent: the connection failed. Check your connection and
  press Send again; it will not arrive twice."); the center's system refusing an answer ("The center's system
  did not accept the referral. Please change these answers and send again:" with each answer as a link back to
  its step); the center's limit for today (RW5 1: the center's details, the PDFs and the answers to print);
  the form unable to load ("The form cannot load just now": try again in a few minutes, or send the intake
  form). Pictures in `riac-handover\W\design\w31\` and `w31b\`. **Confirmed on the redraw ("W31 yes").**
- **W32 1, with the owner's changes** (18 October 2026): the paper criminal form's **"STEP 3: BEFORE YOU RECEIVE
  RIAC ADVICE"** goes **on Check And Send, above the Send button**, so every attorney passes it before sending (as
  on paper). Chosen over putting it after Send. The owner's changes: make it **visually appealing, in the style of
  the Practice Advisories page**, and **keep each warning short, because each is one click from its advisory**.
  Built as an orange panel like the featured advisory card, headed "Before You Receive RIAC Advice", **a row for
  each warning with that advisory's own symbol beside it** (two across on a computer; chosen over tiles like small
  advisory cards, which break each warning into short centred lines on a phone), and **"Read the advisory ›"**,
  which opens the PDF itself in a new tab (one click, and the form is not lost; not through `request.html`, so no
  Formspree request is used, and `robots.txt` already keeps the PDFs out of search). The words (the owner's):
  - **Orders of protection** require immediate steps by you. (Orders Of Protection advisory)
  - **ICE detainer, or an ICE arrest likely?** Review our advisory immediately. (Steps You Must Take If Your
    Client Was Not Born In The U.S., which covers detainers; checked)
  - **No plea or diversion** without RIAC advice. (No Diversion Or Up-Front Pleas)
  - **No ACD** until you have gone through the ACD advisory with your client. (ACDs)
  - **No use of court interpreters for client conversations:** it's not privileged! (Court Interpreters)
  - **Your client can refuse to speak with ICE,** even to confirm their name. Tell them. (Steps You Must Take…,
    which covers the right to remain silent and the Know Your Rights flyers)
  - **We advise you, not your client:** please do not ask them to contact RIAC. (no advisory, no link)

  Shown only for the case types the paper criminal form covers (criminal, violation of probation, appeal,
  post-conviction); the non-criminal paper form has no such section, so not for family court or removal. The
  courtroom advisory that the old ICE detainer line might have meant is one the owner sends directly, not a public
  one, so it is not linked. The words, symbols and PDF addresses are in `js/referral-data.js` (`ADVICE_FIRST`):
  **if an advisory's title on `advisories.html` changes, change it there too.** Pictures in
  `riac-handover\W\design\w32\`, `w32b\` (the mockups) and `w32c\` (as built).
- **W33 offense** (19 October 2026): **US spelling, "offense", throughout the form's words**; the offense-date
  question now reads "Date Of The Alleged Offense Or Misconduct (i.e. not simply arrest date)", matching its
  guidance. The worker's key `criminal.offenceDate` keeps its spelling: it is a code shared with the worker, not
  words on screen. The old form's other typing slips went with W16's offer guidance and W32's rewording.
- **W34 yes** (19 October 2026): the descriptions drafted for the document kinds the paper form does not name, as
  built: Completed RIAC Intake Form (*The intake form you filled in (the PDF)*), Family Court Pleadings (*The
  petitions and any orders*), Violation Of Probation Paperwork (*The declaration of delinquency, and the original
  sentence and conditions*), Immigration Advice The Client Received (*A copy of any written advice*), Transcripts
  (*e.g. the plea colloquy*).
- **W35, the owner's choice** (19 October 2026): **step 9 is "Review And Send"** on the step bar and "Review and
  send" as its heading, in place of "Check And Send" (W11 1 and W29 1 above use the old name). Measured: it still
  fits the step bar on a computer, at least 24 px clear of "Documents" at the narrowest computer width.
- **W36 keep, with the owner's changes** (19 October 2026): the **Removal / USCIS** case type, set by the owner
  (the old forms have no such section). Step 6 is headed **"Removal defense or USCIS applications"**, with no line
  under the heading (the owner deleted "The questions for …"), and asks one required box, **"What Issues Would You
  Like Advice On?"**, its guidance in the box: *e.g. "Client is in removal proceedings based on a NY conviction -
  considering whether a vacatur is possible"; "Need help assessing whether client is inadmissible based on his
  record in association with an adjustment application"* (key `removal.issues`, 6,000). At **Documents**, a removal
  referral keeps the **Fingerprint RAP Sheet** box ("W36 keep": the record is the heart of the question, and the box
  asks whether the RAP sheet is complete) and then has **"Your Documents"** (*Attach as many as you like, and say
  what each one is*): no Attach Now / To Follow choice, any number of files, and under each file a required one-line
  **"What is it?"** (200 characters; *e.g. Notice to Appear; I-213; denial of adjustment*), which becomes that
  document's description at RIAC (the worker's kind `other`, one entry per file with its `note`). The accusatory
  instruments and immigration documents boxes are not asked for removal. A name left empty is outlined in red (W31).
  **The worker's contract draft 13** (20 October 2026) takes `removal.issues` (required on the questions way) and
  `other` on any referral (attached only, note required, one line, 1 to 200); it is on the worker's main. Tested end
  to end on 20 October 2026: removal to Region 2 with named files, to Erie by email, with no files, and on the upload
  way, all accepted, and the ten earlier test referrals still accepted (`w36-e2e.mjs`, `e2e-scenarios.mjs`). First tested against stand-ins (`riac-handover\W\tests\
  w36-check.mjs`); pictures in `riac-handover\W\design\w36\` (mockup) and `w36c\` (as built).
- **W37 yes** (20 October 2026): with the portal's sign-in kept in the tab (security review CS5, finding 8), the line
  beside Sign Out reads "You stay signed in until you close this tab, or for 12 hours at most." (it said "this
  browser"; W5's card otherwise unchanged).
- **W38 1** (20 October 2026): the case-start chat and the email tenant chat were asked to start their parts of S0 (see
  "The trial run, then the go-live" above). Chosen over waiting until each finished its current work.
- **W39 1b, with the owner's change** (21 October 2026): during the trial the form and the portal pages carry a **magenta
  "Trial run" band** under the page title: *"This page is being tested with invented details. Please do not enter a real
  client's details here: nothing sent from it is treated as a real case. To send us a case today, use the intake
  forms."* (linking `intake.html`). Magenta is used nowhere else on the site. The owner's change: **the white "Trial run"
  label fades slowly out and in**; settled as **three fades as the page opens, then it stays on** (W39 1b), chosen over
  fading all the time (the band scrolls away once the form is begun, and the accessibility standard asks that anything
  blinking past five seconds can be stopped). Built as three fades of 1.6 seconds (4.8 in all; the mockup's 2.4 would
  have run past five seconds), and still on a device set to reduce motion. The band comes off at H2. Chosen over no
  band. Pictures in `riac-handover\W\design\w39\`.
- **W40 1** (21 October 2026): **the client's address** (CS58 2, the owner in the case-start chat; contract draft 17) is
  asked on the Client step **after the aliases question** and before country of birth, both ways of sending:
  "Client's Address (If Known)", optional, several lines, up to 500 characters, with *e.g. "123 Main Street, Apt 4,
  Syracuse, NY 13202"* in the box (key `client.address`). Chosen over straight after the date of birth, which would part
  the aliases question from the name and date of birth it is about. Tested: sent with its line breaks on every route,
  a longer one refused by the worker and linked back to the Client step (`e2e-scenarios.mjs`, `w40-check.mjs`).
- **W41 1** (21 October 2026): the unlisted trial pages went on nyriac.com as soon as the emailed centres could be
  tried, without waiting for Region 2 (chosen over trying everything in one sitting later).
- **W42 1, then W44 1** (21 October 2026): the trial's test referrals are sent by Claude with the owner at the desk, in
  the owner's own Chrome, where Cloudflare's check passes by itself (W42's plan, the owner ticking the check in the
  app's browser, failed: the check refuses that browser). Chosen over the owner sending them by hand.
- **W45 1** (21 October 2026): when a file cannot be sent, **the reason goes on its own line under the file name**,
  with Remove beside the name. On a computer a long reason beside the name had squeezed the name to a letter a line.
  Phones were already right and are unchanged; the portal's file rows follow the same rule. Chosen over keeping the
  reason beside a name held at a fixed width. Pictures in `riac-handover\W\design\w45\`.
- **W46 1** (21 October 2026): when Cloudflare's check fails, the form and the portal's sign-in say **"The check that
  you are not a robot could not be completed. Please reload the page and try again."** (the form had said "did not
  load", wrong when it loaded and did not pass; the portal had said nothing until the button was pressed). Kept once in
  `js/referral-data.js`. Chosen over "did not pass", wrong when it never loaded.
- **W48 1** (22 October 2026): after Send, under "Receipt: emailed to …", the card says **"It comes from
  <sending address>. Not in your inbox within a few minutes? Look in your Junk or Spam folder, and mark it “Not
  junk”."** In the trial a brand-new sender's receipts were put in Junk. The sending address comes from the worker's
  answer (`receiptFrom`, asked of the worker chat 22 October 2026), so the page holds no copy of each centre's address;
  without it the card says only "Not in your inbox within a few minutes? Look in your Junk or Spam folder." Nothing
  shows when no receipt went. Chosen over the Junk sentence alone. Pictures in `riac-handover\W\design\w48\`.
- **W53 1** (22 October 2026, the owner trying the portal on his phone: "This wording needs improvement"): the sign-in
  card says under "Your email address" **"Use the email address you put on your referrals."** and under the button **"No
  password needed. We'll email you a sign-in link: open it on this device, in this same browser, within 15 minutes.
  Each link works once."** The old line for office staff is gone: letting staff sign in for their attorney is not built
  yet. Chosen over keeping a line for office staff. Pictures in `riac-handover\W\design\w53\`.
- **W54 1** (22 October 2026): **Region 2's email on this site is cny@nyriac.com** (Find Your RIAC, and the form's
  centre card), matching the emails the worker sends and where replies to receipts go. It was RIAC2@ocbaacp.org.
  Chosen over keeping the OCBA address and changing the emails.
- **W58 1, with the owner's changes** (22 October 2026, after trying the portal): **the portal's list in four groups**,
  every referral in one: **Received** (no case opened yet), **Waiting on you** (RIAC needs something from the
  attorney, before or after a case is opened), **Case open** (the case number shows; also after advice is sent), and
  **Closed**. The owner's own idea, in place of the first drawing's Open / Waiting on you / All; the labels are the
  short ones suggested ("intake" and "pending case" are RIAC's words, not the attorney's). **Five buttons of one size**,
  All and the four groups, each with its count (of the matches while searching); on a phone All runs full width over
  two rows of two. **Sort** (Status, Newest first, Oldest first, Client name) sits beside the search, as wide as the
  table's last column (since W99 1 only below computer width; on a computer the column headings sort). Sorted by **Status**, All shows the four groups as boxes in that order, Waiting on you edged
  orange and Closed folded (it opens when a search finds something in it); any other sort shows one list with each
  referral's status on its row. Status is offered under All only. The view chosen is kept in the tab, so Back from Add
  To This Referral finds it as it was. The owner's changes: **"Where it stands" is now "Status"** (the column and the
  sort; W5 1 named it), and the design rule above on drop-downs, search bars and pills. **The status is no longer a
  pill but a tinted box with rounded corners and a coloured left edge** ("A", the owner's choice): navy (green, outlined,
  since W88 1), orange (with brown words) when waiting on the attorney, grey when closed; the words at the left; as wide
  as its column, and on
  the Add To This Referral page too. Chosen over a white box with a thin border ("B"), which read like a box to type
  into beside the white Add To This Referral button. On a computer the columns line
  up from one group to the next; below 1,100 px wide each referral is a card (the table no longer fits). Chosen over
  the case page's Show and Sort By drop-downs (the owner's inspiration: a drop-down suits the case page's many filters,
  buttons the portal's five). **Waiting on you comes from the worker's `waitingOnYou`** (contract draft 20, with what
  counts settled by the owner as W63 and built by the database chat); until the worker sends it, the page uses the
  status "Waiting for documents". Pictures in `riac-handover\W\design\w58\`, `w58b\`, `w58d\` (the mockups) and
  `w58c\` (as built); checks in `riac-handover\W\tests\w58-check.mjs`.
- **W63, the owner's yes to the recommendations** (22 October 2026): what counts as **Waiting on you**, for the
  database chat's formula behind `waitingOnYou`: (1) RIAC has asked the attorney to get in touch and is waiting for them
  to (the stage RIAC's reminders chase): yes; (2) the attorney has been in contact: only while documents are actually
  outstanding from the attorney (where RIAC has the next move, the status words stop saying "Waiting for documents"); (3) advice
  sent with the case still open: not for now (to revisit with W59, reporting a disposition). Closed is never waiting.
  Nothing more is needed on the page.
- **W65 A, with the owner's corrections** (22 October 2026), on the portal list (**since W98 1 the signed-in details
  are inside the cream title card**, no card of their own): **the signed-in person's card is three short lines**: the name (the address until the worker can supply a name) with a small Sign Out beside it; the office
  in bold, email and phone; "You stay signed in until you close this tab, or for 12 hours at most." **"These are the
  details RIAC holds for you. If one is wrong, tell your RIAC." is gone** (the owner: it "doesn't really do anything";
  W5 1 had it). **Each referral is its own white card with a slight shadow**, set apart by a small gap, with no box round
  a group: the group's name is a heading over its cards ("Waiting on you" in brown with an orange arrow; W58 1's boxes
  and orange edge are gone). On a computer the rows are the cards, the column headings kept once at the top, and
  **everything in a row is centred on one line** (the owner's "vertical centering ... rather than top alignment"); the
  status box is as tall as Add To This Referral, its words centred. On a phone each card stacks as before, the status box
  and the button one width and height. Chosen over B (the name at text size on one line with the details, and the cards
  inside group boxes). **The search reads "Search by name, court, referral reference or docket number"** (the owner's
  words; it also finds case numbers and, for office staff, attorneys); on a phone "Search: name, court, reference or
  docket", and on the smallest phones "Name, court, reference, docket", since the full words do not fit the box.
  Pictures in `riac-handover\W\design\w65\` (mockups) and `w65c\` (as built); checks `tests\w65-check.mjs`.
- **W66 1** (22 October 2026): the smaller cream title card on **every page that has it**, not the portal only (see
  Design rules). Chosen over the portal's two pages only.
- **W68 a** (22 October 2026): **a disposition the attorney reports through the portal marks the case disposed at
  RIAC at once**, and staff then answer the database's follow-up question on it (which puts it in front of them). Chosen
  over the note arriving marked "reported by the attorney" for staff to confirm, which nothing would have brought to
  their attention. An offer is a label only.
- **W59 A, with the owner's changes** (22 October 2026; the owner: "the note is almost an afterthought"): **Add To This
  Referral becomes "Send RIAC An Update"** (the list's button, the page's title and its bar, "Send RIAC an update"), and
  the page leads with the message (since W83 1, two tick tiles in place of the three: see there): "What is this about?",
  **three tiles of one size, chosen first**: **Note to RIAC**
  (chosen to start), **Report an offer**, **Report a disposition**; the question over the box follows the choice ("Your
  note to RIAC", "The offer", "The disposition"); then **Documents (optional)**, the same boxes as before. The owner's
  changes: **no description under the tiles and no guidance in the box**. An offer or a disposition needs words: with
  none, the box turns red (W31, no words; files alone are not enough). After Send, "Sent to RIAC" and "What you sent:"
  with the kind (Note to RIAC, Offer, Disposition). The referral at the top keeps its status in a column as wide as the
  list's, full width on a phone (the full-width rule, W58 1). Sent as `addition.about` (`message`, `offer`,
  `disposition`; contract draft 21). Tiles one above another below 900 px. Chosen over B (the box first, then ticking
  "It reports an offer / a disposition"), whose guidance could not follow the kind. Published first with Note to RIAC
  alone on nyriac.com (no question shown) while RIAC's database could not yet tag offers and dispositions; **all three
  since W72** (23 October 2026, once the database chat had the tagging live). `updateKinds` in `js/referral-data.js`
  lists the kinds offered; with one, the question is not asked.
  The page promises no reply ("RIAC sees it with this referral"). Pictures in `riac-handover\W\design\w59\` (mockup)
  and `w59c\` (as built); checks `tests\w59c-check.mjs`, and `tests\w59-e2e.mjs` against the worker chat's local worker.
- **W69, the owner's layout** (22 October 2026): on the portal list, **under the client's name, labels with their values
  lined up from card to card**: **Reference:** (the reference in an outlined pill; the owner's "reference is good", over
  his first "RIAC Intake:", because the card after Send, the copy and the receipt all say Reference), **RIAC Case No:**
  (the navy pill) once there is a case, **Received:** the date, and **Closed:** the date on a closed one. The Received
  column goes, so the court and docket, one over the other, get a wider column. On the smallest phones (below 360 px
  since W84 2b; 350 px before) each label sits over its value. Once a case is open, W84 2b changes the first two rows.
  **Since W95 2c the numbers are pills with no labels and Received is a column again**; the labelled lines remain only
  for the dates on a phone.
  **The "Attorney:" line is off** (the owner asked why another attorney's name
  showed): it is for office staff signing in for an attorney, which is not built; until then the worker cannot tell
  staff from the attorney, so the line and the search by attorney wait for it. Pictures `riac-handover\W\design\w69\`
  (mockup) and `w59c\` (as built).
- **W74 a** (23 October 2026): a referral that holds no client name (one keyed in at RIAC without it; the form always
  asks) shows **"Client name not recorded"** in grey italics where the name goes, on the list, at the top of Send RIAC
  An Update and on the card after Send. Chosen over the card starting at "Reference:". Pictures
  `riac-handover\W\design\w74\`; check `tests\w74-check.mjs`.
- **W61 a, with the owner's changes** (23 October 2026): **Send RIAC An Update will show what RIAC has for each kind of
  document**, beside its box: **Received** with the date, **Still needed** (orange), **To follow, as you said** or **Not
  available** (grey). **A file that arrived counts as received at once** (from the form, an update, or one staff filed);
  staff can still mark a kind as needed. Chosen over "received" only once staff have checked it. The owner's changes:
  **the state boxes one size** (a column of their own on a computer, full width on a phone), and **on a phone each kind of
  document is a box of its own**, its name in a band, as on the form's Documents step (built at once, for today's page
  too). Built with the words of W80 1 (below), from the worker's `documents` (contract draft 22). Pictures
  `riac-handover\W\design\w61\` and `w61b\`.
- **W62 a** (23 October 2026; the owner had asked "is there a reason not to do passwords AND email sign ons as login
  options?"): **no passwords; the portal keeps the emailed sign-in link only, for now.** The owner: "we will do w62-b at
  some point": **passkeys** (Face ID, a fingerprint or Windows Hello), offered after the first emailed sign-in, the link
  kept as the fallback; nothing is built for them until the owner says. Passwords were advised against (the worker chat):
  a reset goes by email anyway, so they add a second way in without taking one away; reused passwords; a store of them is
  private information under New York's SHIELD Act; lockouts anyone could cause; a paid Cloudflare plan and several days'
  work. A 30-day "keep me signed in on this device" was not chosen (it would undo the security review's sign-in that ends
  with the tab, CS5 finding 8). Pictures `riac-handover\W\design\w62\`.
- **W77 1** (23 October 2026, S3's small finding): when the upload has lapsed (past its hour), Review and send asks for
  Cloudflare's check again. **The check and its one note now sit beside Send**, under "Once sent, this referral cannot be
  changed here…" (they were above the advice panel, and pressing Send added a second, near-identical note by the
  button). Pressing Send before the check is done **changes that note's words in place** ("One more check that you are
  not a robot, then the referral is sent."), and **the button reads "Sending…", greyed, until the referral goes**; if the
  check fails, Send comes back. The same when the worker answers at Send that the upload expired (the note says so).
  Chosen over leaving the check where it was and changing its note. Pictures `riac-handover\W\design\s3\` (mockup) and
  `w77c\` (as built); checks `tests\w77-check.mjs`.
- **W78 1** (23 October 2026): on **Send RIAC An Update** the files sit in a narrow column beside each kind of document,
  so on a computer the size, "✓ Uploaded" and Remove beside a file's name had squeezed the name to a letter a line.
  **At every width a file's name now has its own line, with its state (or the reason it was refused) and Remove under
  it, and no size**: the phone's arrangement, which W45 1 kept. The form's own file rows are unchanged (W45 1). Chosen
  over the name, size and Remove on one line with the state under them, where a long name still wrapped over two to four
  lines. Pictures `riac-handover\W\design\w78\` (mockup) and `w78c\` (as built); checks `tests\w45-portal-check.mjs`
  (1360 to 320 px).
- **W80 1** (23 October 2026): **W61 a's words**, for what the worker can now say of each kind (contract draft 22): a kind
  the attorney said on the referral was sent before reads **"Sent before, as you said"** (grey); when one has arrived but
  RIAC needs another (a RAP sheet found too old, say), the orange box reads **"Still needed"** with **"One received Oct 5"**
  under it, inside the box of one size (12rem on a computer, full width on a phone); "Received" with no day known reads
  "✓ Received", and a day in another year carries the year. Under "Documents (optional)": *What RIAC has for this
  referral is shown beside each kind. A file you have just sent may take up to 20 minutes to show here.* (RIAC's copy for
  the portal runs up to about 20 minutes behind.) A kind RIAC lists that the page had no box for (the completed intake
  form, family court pleadings, probation paperwork, the immigration advice, transcripts) **gets a box of its own**, in the
  form's order, before Something else, so it can be attached there; "None chosen" is left out beside a state. The page
  ignores a kind or state it does not know, and with no `documents` from the worker shows no line and no states, as
  before. The live worker sends `documents` since 23 October 2026 (about 1:15 AM, New York time). Words in `js/referral-data.js` (`DOC_STATES`). Chosen over "Still
  needed (one received Oct 5)" on one line in wider boxes. Pictures `riac-handover\W\design\w80\` (mockup) and `w80c\`
  (as built); checks `tests\w80-check.mjs` (1360 to 320 px) and `tests\w80-local.mjs` (the worker chat's local worker).
- **W82 1** (23 October 2026, the owner on the live page: "The fonts used look a little big/doughy. The case info at the
  top is good."): **the portal's tag line** under "Your Referrals" reads *Review the status of cases referred to the RIAC,
  upload additional documents and send messages about specific cases.* (the owner's words), at `--fs-small` at every width
  (class `portal-head`; the other cream title cards keep theirs). On **Send RIAC An Update**: the questions ("What is this
  about?", "Your note to RIAC", "What is it?", "Documents") at `--fs-small`, the case info's size, still semibold; the
  tiles' words and the kinds' names regular (the site loads Inter at 400 and 600 only); the note box opens three lines tall
  (it read as one line, "which suggests it won't expand") and still grows; on a computer each kind's name, state box and
  button are centred on one line, its files under the state box (the box's holder is `display: contents`, so its parts
  are the row's own cells), and Something else's name and button are centred on its box, "What is it?" over it. The
  form's own sizes are unchanged (W26 2). Chosen over the questions smaller with every weight kept. Pictures
  `riac-handover\W\design\w82\` (mockup) and `w82c\` (as built); checks `tests\w82-check.mjs` (1360 to 320 px).
- **W83 1, with W87 2b** (23 October 2026; the owner: "the note to RIAC seems a bit redundant - they are all notes to
  RIAC? So maybe make report an offer and report a disposition check boxes and only have those two?"): on **Send RIAC An
  Update**, "What is this about?" and **Note to RIAC** go; above the box, **two tick tiles of one size, "Report an offer"
  and "Report a disposition"**; neither ticked sends a note. **Ticking one unticks the other** (one update is filed as
  one kind at RIAC; the worker chat's advice, so `addition.about` is unchanged); the box's question still follows the
  tick. A screen reader hears "Does this update report an offer or a disposition? Tick one, or neither for a note." The
  owner then asked for symbols that read easily (W87): **the handshake** (`i-plea`, the plea advisory's) for an offer and
  **a gavel on an orange block** (`i-disposition`, new: the judge's gavel without its question) for a disposition, set
  **before the words, the symbol and words centred on the tile, and the tick as far from the tile's left as from its top
  and bottom** (the owner's "2, but"): each tile is three columns, a square one for the tick, the middle, and an empty one
  as wide as the first. On phones 380 px wide or less the tiles are a little shorter and the symbols smaller, so "Report a
  disposition" keeps to one line; below about 355 px the words wrap, both tiles together. With it (the owner: "a little
  big and padded"), **what the attorney types on this page is at the case info's size**, a little closer to the box's
  edges. Chosen over the tick tiles under the box, and over the symbols at the tiles' right end. Pictures
  `riac-handover\W\design\w83\`, `w87\` (mockups) and `w83c\` (as built); checks `tests\w83-check.mjs` (1360 to 320 px).
- **W88 1** (23 October 2026; the owner: "can you put an outline around the advice being prepared (it melts) - also,
  shouldn't this be pale green to denote everything is good?"): **every status box is outlined in its own colour** (on
  the case info's grey panel at the top of Send RIAC An Update it had melted), and **green when all is well**, for
  Received and Case open (the site's own green, `--r2`, as "✓ Uploaded"); orange when waiting on the attorney and grey
  when closed, as before. **The documents' "✓ Received" is green to match**, so across the portal green means all is
  well, orange that something is needed from the attorney, grey closed or as the attorney said. The words read at 7.2 to
  1 on green, 6.3 on orange, 4.9 on grey. Chosen over the outline alone, navy kept. Pictures `riac-handover\W\design\w88\`
  (mockup) and `w88c\` (as built); checks `tests\w88-check.mjs`.
- **W84 2b** (23 October 2026; the owner: "Once a case is opened, the intake reference should be de-emphasized and the
  case reference should be the only prominent one (e.g. "Was Reference R2-123454)", then "2, but in italics - and would
  intake reference fit?"): **once a case is open, its number leads and the reference is quiet.** On the list's cards the
  rows are **RIAC Case No:** (the navy pill), ***Intake Reference:*** (label and value in grey italics, the value at
  `--fs-label`, no pill), Received and Closed; before a case opens, **Reference:** and its outlined pill as W69. To fit
  the longer label the label column is 7.6rem on every card (they still line up), and each label sits over its value
  below 360 px (was 350). On Send RIAC An Update, and on the card after Send, the case info reads **"RIAC Case No
  4121** · court · docket" (the number in dark bold), with *"Intake Reference R2-…"* in grey italics beneath. The search
  still finds a referral by its reference. Chosen over the reference as a grey line under the labels ("1"); "Intake
  Reference" is the owner's wording, in place of the "Was Reference:" first drawn. Pictures `riac-handover\W\design\w84\` (mockup,
  `W84-2b-*` the one chosen) and `w84c\` (as built); checks `tests\w84-check.mjs` (1360 to 320 px). Live since 23
  October 2026. **On the list, W95 2c replaces the labelled rows**: the reference is a grey pill once a case is open.
- **W86 1** (23 October 2026): since the worker's RW13 every update gets an email receipt, and **the "Sent to RIAC" card
  after Send RIAC An Update says where it went, in W48 1's words**: under "Received …", **"Receipt:** emailed to
  <address>." and beneath it "It comes from **<the centre's referral address>**. Not in your inbox within a few minutes?
  Look in your Junk or Spam folder, and mark it “Not junk”." Both addresses come from the worker's answer (`receiptTo`,
  `receiptFrom`, contract draft 23); without `receiptFrom` only the Junk sentence, and nothing when no receipt went. The
  Junk sentence is kept once in `js/referral-data.js` (`RECEIPT_JUNK`) for both cards. Chosen over one short sentence,
  "A receipt was emailed to …", with no sender or Junk advice (an attorney's first emailed receipt may be an update's,
  for a referral keyed in at RIAC). Pictures `riac-handover\W\design\w86\` (mockup) and `w86c\` (as built); checks
  `tests\w86-check.mjs`. Live since 23 October 2026.
- **W90 2, with the owner's words** (23 October 2026; the owner, through the case-start chat: "for USCIS cases, there is
  no court and no county - so I just want to make sure the intake takes this into account (e.g. allowing for what county
  are you in, as opposed to what county is the court in)"): **the case type is asked first, at the top of step 1**
  ("Case type and county", *The kind of case, and the county that decides which regional center receives your
  referral.*), **and the county question follows it.** For Removal / USCIS it reads **"County where your office is"**,
  with *For removal defense or a USCIS application, your office location decides which regional center receives your
  referral.* (the owner's sentence, with the word "application" his left out), and the list ends "My office is outside
  New York State"; for every other case type as before. A county chosen stays when the case type changes. **Step 3 for
  Removal / USCIS** asks no court, Court Not Listed, docket or next court date; in their place **"Immigration Court Or
  USCIS Office (If Any)"** (*e.g. "Batavia Immigration Court"; "Buffalo USCIS Field Office"*; the new key
  `court.immigrationOffice`, one line of up to 200, removal and the questions way only: contract draft 24) and **"Next
  Hearing Or Interview Date (If Any)"** (sent as `court.nextDate`); the urgency, ICE involvement, order of protection, custody and
  details stay. Step 3's line is now *The court, and where things stand.*, and on Review and send the first section is
  "Case Type & County". The county still picks the centre; for removal it is the attorney's office's, which the worker,
  database and case-start chats were told. Chosen over keeping the case type at step 3 with one line for removal under
  the county ("1"). Pictures `riac-handover\W\design\w90\` (mockup) and `w90c\` (as built); checks `tests\w90-check.mjs`.
  Live since 23 October 2026.
- **W95 2c, with the owner's change** (26 October 2026; the owner: "the intake reference and riac case number should drop
  beneath the client name, (2) the received date should be its own column"): on the portal list, **under the client's
  name its numbers, each in a pill that says what it is, with no labels**: before a case is open the outlined pill
  **"Reference R2-…"**; once one is open the navy pill **"RIAC Case No 4121"** over a **gentle grey pill, "Intake
  Reference R2-…"** in italics (no longer in use; W84 2b), each pill its own width and one height. **Received is a column
  of its own** after Client, the date alone, and on a closed referral "Closed Aug 12, 2026" under it, smaller and grey; on
  a phone, where each referral is a card, the dates stay labelled lines under the numbers, lined up from card to card. On
  a computer the client's column is 17.5rem (its widest pill), Received 9.8rem, and the court takes what is left. On the
  smallest phones (below 360 px) the grey pill's number goes under "Intake Reference" inside it. The owner's change, from
  a general design rule of his: **a pill directly above or below plain left-aligned text never looks right** (the pill's
  edge with the text's edge makes its words look indented; the words with the text's makes the pill look off to the
  left), so the reference stays a pill rather than the plain grey line first drawn. Chosen over the labels kept for the
  numbers ("1"), and over the two pills one width ("2b", which turned the navy pill into a heavy bar louder than the
  name). The case info at the top of Send RIAC An Update is unchanged (W84 2b). Pictures `riac-handover\W\design\w95\`
  (mockups; `W95-2c-*` the one chosen) and `w95c\` (as built); checks `tests\w95-check.mjs` (1360 to 320 px). Live
  since 26 October 2026 (W100 yes, with W96 1 to W99 1).
- **W99 1** (26 October 2026; the owner: "Is it possible to give column sorter toggles?"): on a computer **the column
  headings sort the list**: a press on Client sorts A to Z, Received newest first, Court A to Z, and a second press on
  the same heading reverses it; Status sorts into the four groups (W58 1), one way only, and is a plain heading when one
  group is shown, as the drop-down's Status was. The heading sorted by is navy with one arrow (and `aria-sort`); the
  others are grey with a faint pair of arrows, so they read as something to press; the pressed heading keeps the
  keyboard's focus. **On a computer the Sort drop-down goes and the search fills the line**; on a phone, where each
  referral is a card with no headings, the drop-down stays with its four (Status, Newest first, Oldest first, Client
  name), plus the one in use if a heading chose another. The choice is kept in the tab as before. Chosen over keeping the
  drop-down on a computer as well ("2"). Pictures `riac-handover\W\design\w99\` (mockup) and `w99c\` (as built); checks
  `tests\w99-check.mjs`; `tests\w58-check.mjs` now sorts with the headings on a computer. Live since 26 October 2026.
- **W96 1, with the owner's notes** (26 October 2026; the owner: "the case status bar text should be centered (and
  possibly narrowed, unless this is set at the size of whatever the maximum width one is"): it was not sized to the
  widest status but filled its 15.5rem column. Now **the status box's words are centred**, and on a computer **its column
  is 13.2rem** (a box of 186 px: every open status on one line, the longest "Received, being reviewed" at 179 px, and the
  common closed ones), the court taking the 37 px saved; the same column at the top of Send RIAC An Update. A long
  status wraps onto two lines, centred. The owner's notes: **(1) a box or button that wraps never leaves one word alone
  on its last line** (`text-wrap: balance` on `.btn` and `.status`; see Design rules); (2) the column narrows with the
  box; (3) the update button shrinks next (W97); (4) **the status words should be more attorney-friendly and generic,
  closed ones above all (conflict cases)**. The words are made in the database, not on this page, so they are the
  database chat's (its RR17, RR18), passed on through the dispatcher on 26 October 2026. That chat found the database
  already sends generic words for a closed referral, not its closing codes (this chat had wrongly said otherwise), and
  that five began "Closed: ", which the page's own "Closed: " doubled; **the page now adds "Closed: " only where the
  words do not already begin with it**, so it reads right with the words of today and of RR18 alike. One line of the
  box holds about 24 characters with "Closed: ". **The database's words for a closed referral, live since 26 October
  2026** (the owner's choice in the database chat), each beginning "Closed: " and each on one line: "Closed: see our
  email", "Closed: advice sent", "Closed: no advice needed", "Closed: case concluded" and "Closed: no response" (four of
  the earlier wordings had run to two lines). Chosen over centring the words and keeping the width ("2"). Pictures
  `riac-handover\W\design\w96\` (mockup) and `w96c\` (as built); checks `tests\w96-check.mjs`. Live since 26 October
  2026, with the "Closed: " fix.
- **W97 1** (26 October 2026; the owner: "send riac an update text is too big and doesn't read as an action button. maybe
  have it as a grey button with a symbol just saying send a message?"): each referral's button on the list is **a grey
  "Send a message"**: a cool grey (`#eef0f3`, outlined `#c3c9d2`, darker under the mouse), apart from the warm grey of a
  closed status, its words navy at the status box's size, as tall as the status box, with **a new symbol before them,
  `i-message`** (a navy envelope, its flap in the button's grey, an orange seal; 18 px). Its column is 11.4rem on a
  computer (13rem before; the court takes the rest), full width on a phone. A screen reader hears "Send a message about
  <client>" (or the reference when no name is held). **The page it opens is "Send RIAC a message"** (its bar and the
  tab; W59 A named it Send RIAC An Update), and the hidden question over the tick tiles says "this message". The worker's
  email receipt for one still says "Update Received" and "to send another update": the worker chat's, only if the owner
  wants them to match. Chosen over the page keeping its old name ("2"). Pictures `riac-handover\W\design\w97\`
  (mockup) and `w97c\` (as built); checks `tests\w97-check.mjs`; `tests\w59-e2e.mjs` (with the worker chat's local
  worker) updated for W95 2c and W97 1 and passing. Live since 26 October 2026.
- **W98 1** (26 October 2026; the owner: "the signed in card on the portal should be incorporated into the your referrals
  card in a structured format"): **the signed-in details go inside the cream "Your Referrals" title card**, no card of
  their own (W65 A's). Under the tag line, a thin rule, then **labelled fields**: Signed in as (the name, ", Esq." for an
  attorney; the address while the worker supplies no name), Office, Email (only beside a name) and Phone, each only when
  the worker sends it, each **a small capitalised grey label over its value** (as the list's column headings), the name
  semibold navy; **Sign Out** last; "You stay signed in until you close this tab, or for 12 hours at most." beneath, small
  grey italics. On a computer the fields side by side in one centred row, Sign Out at its end; on a phone one under
  another, centred, Sign Out full width (a long office may wrap at a space on the smallest phones; the email never breaks).
  The title card is the page's own HTML, so `js/portal.js` adds the details when the list is drawn and `clear()` removes
  them (the sign-in screen, Sign Out). Send RIAC A Message is unchanged. Chosen over a label-beside-value list centred as
  a block ("2", taller on a computer). Pictures `riac-handover\W\design\w98\` (mockup) and `w98c\` (as built); checks
  `tests\w98-check.mjs` (W65's card checks retired); `tests\w59-e2e.mjs` and `tests\e2e-portal.mjs` (the worker chat's
  local worker) pass. Live since 26 October 2026.
- **W101 1a** (26 October 2026; W91, the owner's yes in the dispatcher's chat on 23 October: "a static public list,
  optional, free text kept, staff confirm"): on a **criminal** or **post-conviction** referral (the questions way), step 6
  opens with **"Charges (If Known)"**, *Optional. Choose each charge from RIAC's list of New York offenses. Not sure of
  the statute? Leave this empty and describe the allegations below.* The search box holds its guidance inside (W17: *e.g.
  "120.00(1)"; "assault 3rd"; "DWI"* / *Type a statute number or the offense's name*). A number ("120.00(1)", "PL 120",
  "1192(3)") or words ("assault 3", "robbery second degree") drop down up to eight matches, each with its class, a
  section's "subdivision not known" after its subdivisions, and last **"Not in the list? Add "…" as you typed it"**; the
  first is chosen to start, the arrow keys move, Enter or a click takes it. **Each charge chosen becomes a line** (as
  Other People's) with its class beneath and Remove; **a Penal Law line has an "Attempted" tick**, and ticked it reads
  "Attempted PL 160.10(1) Robbery 2nd", *Class D felony, as an attempt* (the class from PL 110.05, in the list); a charge
  added as typed reads *Added as you typed it: not in the list*. On a phone the tick and Remove sit on a row under the
  charge. No charge twice; 30 at most. A search typed but not chosen stops Next with "Please choose the charge from the
  list, or add it as you typed it." (W31's kind of words for a choice not from a list). Review and send, and the copy,
  list the charges one a line. Not on a violation of probation (its convictions box stays words) or the upload way.
  Chosen over plain lines with no class or tick ("2"), and over criminal only ("c") or probation too ("b").
  **The list is `js/offenses.js`, public law only**, made from RIAC's own list of offenses in its database: each
  offense's law, statute and prior-offense tier **written exactly as RIAC's list has them** (together they pick out one
  offense there, so the database can match a chosen charge; the database chat's rule), its name, its class and its class
  as an attempt; the definitions sections left out (1,852 of 2,018 on 26 October 2026; about 16 KB as sent). **Nothing
  else from the database goes in it**: no notes, no immigration-consequence columns, no IDs. It does not change by
  itself: when RIAC's list changes, a chat makes it again with the scripts in `riac-handover\W\tools\` on the desktop (a
  read of those six columns only, then `build-offenses.mjs`). A line made from an older list that no longer matches is
  kept by the database as typed words, so nothing is lost. **Sent as `criminal.charges`**, only when a charge is chosen:
  each `{ law, statute, tier, attempted, label }` (the label the line in words, for the emailed centres and as the
  database's fallback) or `{ typed }`: **contract draft 25** (26 October 2026; 0 to 30; statute and tier one line of up
  to 60, the label up to 200, typed 1 to 200; `attempted` true only on Penal Law; the same charge twice kept once; a
  problem comes back as `criminal.charges[n].…`, which the page links to the question; the worker checks no charge
  against the list; an emailed centre's email lists each label under "Charges"). ⚠️ **The live worker refuses a key it
  does not know, so the page goes live only after the worker's push**, which waits for the database to take the charges
  (RR21, the owner's, in the database chat).
  Classes beyond a felony, misdemeanor or violation read "Traffic infraction", "Not a crime", "Class depends on prior
  convictions", "Class depends on the subdivision", "Class depends on the underlying offense" and "Penalty set by the
  statute" (`CHARGES` in `js/referral-data.js`). Pictures `riac-handover\W\design\w101\` (mockup) and `w101c\` (as
  built); checks `tests\w101-check.mjs` (1360 and 390 px, and Send to the worker chat's local worker).
- **W103 3, with the owner's change** (26 October 2026; his nine comments on his W102 test send, in full in
  `riac-handover\W\open-decisions.md`: "no visual delineation between title/box/helper text/actual text/next title",
  "big and doughy", "field names to the left and fields to the right, all full width not two columns"): **every step
  but Review and send is one ruled sheet** (square inside the rounded card), its questions in **sections under navy
  bands** (`SEC` in `js/referral-data.js`; step 3: The court, Where things stand, Anything else; step 5: Status and
  history, Screening, Family, Anything else), **each question a row: the question, with its guidance under it in small
  grey italics, in a grey column 15rem wide on the left, the answer on the right**; on a phone the question sits over
  its answer. The owner's change: **the answer is centred against its question where the question is the taller**
  (Yes / No / Unknown beside a three-line question); where the answer is taller the question stays at the top. The
  form is 60rem wide on a computer (40 before), a size smaller (questions and typed answers `--fs-small`, guidance
  `--fs-label`; W26 2's order kept). **Reverses W16 and W17 1** (no guidance inside a box: the charges' search box is one
  line again, so typing no longer lands half way down it, the owner's comment 7) **and W14 2** (one answer to a row).
  **A box for words opens two lines tall, a long answer's three** (comment 5b) and still grows; names, numbers, dates
  and email stay one line. Short choices (Yes / No / Unknown) are **pills of one size**, longer ones **tiles with a round
  box**. Step 3 (comment 4): **ICE involvement** a tile with a red "ICE" triangle, its tick centred, **ticked for you by
  "Detained - Immigration Custody"** ("Ticked for you: your client is detained in immigration custody."; unticked again
  if the custody changes, unless the attorney ticked it); **the custody status in two groups**, Released (grey) and In
  custody (orange tint), the triangle on immigration custody; **"Advice Needed By"**, *If this case is urgent, the date
  you need advice by. Leave blank otherwise.*; the court, Court Not Listed and its details in one row. Step 5 (comment
  6): **the family tiles in rows**, Parent (blue), Spouse (purple), Child under 21 and over 21 (green), each US citizen /
  Green card holder (a screen reader hears "Parent: US citizen"); "Screening - " dropped inside a Screening section (the
  copy says "Screening: …"). **"… Details & Explanations for Screening Questions …" became "Anything Else About The
  Court Or Case?", "… About Your Client’s Immigration?" and "… About The Case?"** (comment 4d), with *Explain any answer
  above, or add anything else RIAC should know.*; Documents' last box "Anything Else RIAC Needs To Know?". Documents
  (comment 9): **Attach Now dashed, the other three grey** (navy once chosen); the document boxes unchanged. Search boxes
  carry a magnifier. Keys, codes and what is sent are unchanged. Chosen over each section a box of its own ("1", the
  recommendation) and the question above its box ("2"). Pictures `riac-handover\W\design\w103\`, `w103b\` (mockups,
  regrouped by option with the badge top left at the owner's asking) and `w103c\` (as built); checks
  `tests\w103-check.mjs`; `w90-check.mjs` and `w101-check.mjs` updated; `e2e.mjs` (1360 and 390 px),
  `e2e-scenarios.mjs`, `w36-e2e.mjs`, `w40-check.mjs`, `w31b-check.mjs` and `w77-check.mjs` pass against the worker
  chat's local worker. **Found with it:** since the form was built (18 October) step 6 for an **appeal or post-conviction
  relief drew nothing** (the closing note has no key, and drawing it stopped the page; `tests\live-appeal-check.mjs`);
  fixed, and **live on its own since 27 October 2026** (1:35 PM, the owner's yes: `main` 50fb66d, Pages run 129; checked
  on nyriac.com: the file, and an appeal's step 6 drawing its questions). **W103 3 itself live since 27 October 2026** (1:50
  PM, the owner's "Yes, publish W103 3 with the overnight fixes to nyriac.com.": `main` 9b59f2f, Pages run 130; checked on
  nyriac.com: every changed file served, and step 3 drawn as the ruled sheet with its three bands, the ICE tile and the
  two custody groups). Still to come, one decision at a time, a mockup first: the case
  types as cards with symbols and the county a search-and-choose list (comments 1, 2), the office and court lists
  dropping down under the box as the charges do (comment 3), and W104 (comment 5a).
- **W104 to W111, the overnight mockups** (drawn 27 October 2026, 1 to 2 AM, on the owner's D63; each put to him with a
  recommendation): **the owner's yes to every recommendation** (27 October 2026, about 2 PM: "Yes: build W104 to W111 as
  you recommended, one at a time, and show me each before publishing."). Each is built on its own and published only on
  his yes. The shared brief is `riac-handover\W\mockup-brief-overnight.md`; the mockups are in `design\w104\` to `w111\`.
- **W110 1** (27 October 2026; the overnight review's W-Q13): after "Email Me A Sign-In Link", the "Check your email"
  card's tinted box reads **"Open the link on this device, in this browser. It works only here, so a forwarded email lets
  nobody in."** (it said "It will not work anywhere else, so that a forwarded email lets nobody in."). Chosen over "It
  will not work on another phone or computer, or in another browser, …" ("2"). Pictures `riac-handover\W\design\w110\`
  (mockup) and `w110c\` (as built); check `tests\w110c-shots.mjs`.
- **W111 1** (27 October 2026; the overnight review's W-S06: a half-filled referral can come back in some browsers after
  the tab is closed, and the form had no way to clear it): **"Start over"**, a quiet underlined link in grey at the right
  under the step bar, after "N of 8 sections done" and a thin divider, shown once anything has been answered (not on a
  blank form, nor while sending). Pressed, a question opens under the step bar, edged in red: **"Clear every answer and
  start again?"** *Every step is emptied, and any files attached are removed. This cannot be undone.*, with **Clear Every
  Answer** (red words, outlined) and **Keep My Answers** (navy), one size: side by side on a computer, Keep My Answers on
  top on a phone. The focus goes to Keep My Answers; Escape or Keep closes it with every answer kept. Clear empties the
  draft in the tab, stops any file still uploading and goes to step 1. Chosen over the link beside Back at the foot of
  each step ("2"). Pictures `riac-handover\W\design\w111\` (mockup) and `w111c\` (as built); checks
  `tests\w111-check.mjs`.
- **W109 1** (27 October 2026; the overnight review's W-Q08): on **Send RIAC a message**, **each "Something else" file has
  its own "What is it?"** under its name (required, one line, up to 200; *e.g. letter of support; bail decision* under
  the label, no placeholder in the box), as the form's Your Documents (W36), since each becomes that document's
  description at RIAC; there is none until a file is chosen. On a computer Something else's files sit beside its name, as
  the other kinds'. A name left empty at Send is outlined in red with no words (W31) and the focus goes to it; a name being
  typed keeps its place while another file's progress is redrawn. Each document is sent with its own `note` (the contract
  unchanged). Chosen over one file only under Something else ("2"). Pictures `riac-handover\W\design\w109\` (mockup) and
  `w109c\` (as built); checks `tests\w109-check.mjs`.
- **W108 1** (27 October 2026; the overnight review's W-Q10, white on the site's orange at 2.8 to 1): **on the orange the
  words are navy** (5.5 to 1): the "Before You Receive RIAC Advice" heading on Review and send, the "only copy" box's
  **Print Or Save As PDF**, and with them the same pairs elsewhere on the site, the featured advisory's title bar and
  Download button on Practice Advisories, the follow-up box on today's Send A Case and the featured "Send Us A New Case"
  card that comes back at the go-live. Under the mouse an orange button turns navy with cream words, as every other
  card's (navy on the darker orange the site used would be 3.2). **The answer boxes' and tick boxes' edges are #838d9b**
  (3.4 to 1 on white; #b4bcc7 was 1.9, #9aa4b0 2.5). Chosen over a darker orange carrying the white words ("2") and a navy
  band and button ("3"). Pictures `riac-handover\W\design\w108\` (mockup) and `w108c\` (as built); checks
  `tests\w108-check.mjs` (every pair measured from the page) and `tests\w108c-shots.mjs`.
- **W105 1** (27 October 2026; the owner on step 1, comment 1 of his W102 test: "looks a little messy - we should consider
  individual cards / more structure / better wrapping / smaller text / possibly the use of symbols?"): **the case types
  are six cards of one size**, each a round box at its top left, its symbol in a cream circle, its short name and a line
  under it, centred; **3 across on a computer, 2 below 900 px**; the names end level across a row (each card a three-row
  subgrid); chosen, a card is edged navy and tinted, as a tile. **The criminal side first**, as the paper forms divide
  them: **Criminal Case** (*Charges pending, before a plea or trial*; the fingerprint), **Probation Violation** (*A
  violation of probation is alleged*; a new symbol, `i-probation`, a clipboard of conditions with an orange warning),
  **Appeal** (*A conviction on appeal*; new, `i-appeal`, a courthouse with an orange arrow rising), **Post-Conviction**
  (*Vacating or changing a past conviction or sentence*; the portal's gavel, `i-disposition`), **Family Court / Divorce**
  (*Abuse & neglect, family offense, custody or divorce*; the family) and **Removal / USCIS** (*Removal defense, or an
  application to USCIS*; the passport). The shorter names (they were "Violation of Probation", "Post-Conviction Relief /
  Post-Disposition" and "Assistance With Removal Defense / USCIS") are also what Review and send and the copy say. The
  codes sent are unchanged; the words, descriptions and symbols are `CASE_TYPES` in `js/referral-data.js`. Chosen over
  two groups, Criminal and Non-criminal, without symbols ("2"), and today's tiles tidied ("3"). Pictures
  `riac-handover\W\design\w105\` (mockup) and `w105c\` (as built); checks `tests\w105-check.mjs` (1360 to 320 px).
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

- **The referral form and the attorney portal** (see the section of that name above): **on nyriac.com unlisted, as
  a trial** (since 21 October 2026, W41 1); the menu still says Intake Forms and the old PDF-only page is what
  attorneys see. CS5's security review is done. **The trial (S2) is complete** (22 October 2026: the emailed centres,
  Region 2, receipts, the portal's sign-in, list and an addition). **W56, the owner's go / no-go: not yet.** "We are still
  at the soft launch - I would like this fully operational, hidden from public view, so we can play with it. No real data
  will be going in until hard launch." The go-live (H1, H2) waits until the owner says "hard launch". Meanwhile, **the
  owner's portal additions**, one decision at a time, a mockup first: done and live, W58 1 (the list's groups, buttons
  and Sort), W63 (what counts as waiting on you; built by the database chat, sent by the worker since contract draft 20),
  W65 A and W66 1 (cards and title cards), W59 A with W68 a (Send RIAC An Update, live 22 October 2026; offers and
  dispositions offered since W72), W69 (the labelled cards) and W74 a (no client name). Decided, for the database chats,
  nothing on the page: **W71 a** (a note or an offer sent through the portal flags itself to staff until someone has
  read it; a disposition already reaches them, W68 a), **W73 a** (a court typed as "not listed" shows on the list as the
  attorney typed it, where a listed court would be; live in the database since 23 October 2026) and
  **W60 c** (no cases without a referral behind them: email cases now arrive as intakes, and legacy cases, if ever
  brought in, would be stubs). **W61 a** with **W80 1** (what RIAC has received, per kind of document): live
  since 23 October 2026 (contract draft 22), the page and the worker both. Then, from the owner's look at the live
  page (23 October 2026): **W82 1** (lighter type, the tag line, centred rows), **W83 1 with W87 2b** (offer and
  disposition as tick tiles with symbols), **W88 1** (green, outlined status boxes) and **W84 2b** (once a case is open,
  the case number leads, the reference shown as "Intake Reference"). The worker sends an email receipt
  for every update since 23 October 2026 too (the worker chat's RW13, the owner's yes there; contract draft 23), and
  **W86 1** has the card after an update say where it went. **W90 2**: for a removal or USCIS referral the case type
  comes first and the county is the attorney's office's, with the immigration court or USCIS office in place of the
  court (live since 23 October 2026). Then the owner's five points on the portal list (26 October 2026), one decision at a
  time: **W95 2c** (the numbers as pills under the name, Received a column), **W99 1** (sorting by the column headings
  on a computer), **W96 1** (the status box's words centred, the box narrower) and **W97 1** (a grey "Send a message"
  button with an envelope; the page it opens "Send RIAC a message"); and **W98 1** (the signed-in details inside the
  cream "Your Referrals" card). All five live since 26 October 2026 (W100 yes), with a closed referral saying "Closed: "
  once; the database's attorney-friendly closed words (W96 1's note 4) live the same day, each on one line. **W91** (the
  charge picker, the owner's yes in the dispatcher's chat: on a criminal case the attorney may pick the charges from a
  fixed public list of offences, by statute number or name; optional, the free text kept, staff confirm; the list file
  holds public law only): **W101 1a**, built 26 October 2026, not yet published. In order: the database takes the charges
  (RR21, the owner's, in the database chat), the worker chat pushes its side (contract draft 25), then this page:
  **W102 yes** (the owner, 26 October 2026: "publish once the worker chat has pushed and its own checks are normal; I'll
  send one test referral with a charge from my Chrome afterwards"; no chat can send a live referral, since Cloudflare's
  check passes only in the owner's own browser). Then the database chat checks the intake shows the charges. **Live
  since 26 October 2026** (4:20 PM, after the database's side and the worker's push); checked on nyriac.com: the files,
  and the picker drawing its matches. The owner's test referral with three charges went through at 4:48 PM
  (R2-261026-701846, its receipt arrived; "The charge selector worked really well"). **Confirmed by the database chat**:
  all three charges arrived on its intake as chosen, the two from the list each matched to its one offense (the
  attempted one with its attempt class, as the page showed), the typed one kept as typed. **Next, from his comments as he sent it** (in full in `riac-handover\W\open-decisions.md`,
  "Dan's comments (1)" to "(9)"), each a mockup first:
  - **W103, the form's look as a whole**: "no visual delineation between title/box/helper text/actual text/next title",
    the guidance inside boxes "looks like it has already been filled in", the text "big and doughy"; tighter, smaller,
    "like a dashboard"; his idea of the question on the left and the answer on the right, full width, not two columns;
    choices grouped (the custody status), the case types as cards with symbols, an ICE symbol (a red triangle) with
    its tick centred, the family tiles coloured by parent / spouse / child; the county a search-and-choose list, and the
    office and court searches showing their matches in a list under the box, as the charges do; every box that holds
    words at least two lines tall; on Documents "Attach Now" dashed and the other three grey (Documents' boxes "have
    better visual separation than elsewhere"); "Court And Case - Details & Explanations..." and the like reworded for
    attorneys; choosing "Detained - Immigration Custody" ticks ICE involvement. This reverses W16, W17 1 (guidance
    inside boxes) and W14 2 (two answers to a row). The charges box's cursor sits half way down its guidance until
    something is typed (found by the owner): fix with W103. **W103 3 chosen and built** (26 to 27 October, see Settled),
    the appeal step's blank page fixed and live on its own since 27 October; W103 3 itself **live since 27
    October** (1:50 PM), with the overnight review's fixes. Comments 1 to 3 and 5a next.
  - **W104**: "a way for an attorney to submit a new case through the portal, where it pre-populates their contact
    information" (needs the worker chat).
  - **Re-making `js/offenses.js`**: a chat of the owner's is splitting the Penal Law offenses whose class depends on
    prior convictions into one row per class, as VTL 1192's are; it says when, and the list is made again. Passed to the database chat: a note subject naming the kinds of document when an update carries
  only files. **W62 a**: emailed links only for now; passkeys later, when the owner says. S3's small finding is fixed by
  **W77 1**.
  Airtable's own form is no longer public, so it is **not** linked from this site.
- **The overnight review (SW, 27 October 2026)**: `RIAC Parked Tweaks\Overnight review 27 Oct 2026\SW - Website
  security and quality.md` on the desktop, routed to the website chat by the dispatcher on the owner's word. **Fixed, and
  live with W103 3 since 27 October 2026** (faults, no mockup): W-Q01 (step 6 blank for an appeal or post-conviction
  relief; **live on its own since 27 October**, from `claude/w-appeal-fix`), W-S03 (`robots.txt` keeps search engines off `CLAUDE.md`, `NOTES.md`,
  `SETUP.md` and `tools/`, which Pages serves), W-S06 (a draft untouched for 12 hours is dropped on load: some browsers
  bring a closed tab's storage back), W-S14 (a sign-in link that met no answer, too many tries or the worker down keeps
  the browser's secret and says to open it again), W-Q04 (the portal no longer promises a message can go when the
  upload batch cannot be made), W-Q05 (a refused answer outside the question lists named in words and found on its own
  step, `OTHER_KEYS`), W-Q06 (an address with an apostrophe or other sign before the @: both pages say the system
  cannot take it yet, `EMAIL_CHARS`; the worker could allow the apostrophe, the worker chat's call), W-Q07 (a new case
  type, or the other way of sending, un-ticks the later steps), W-Q09 (a mangled `add.html#…` shows "not in your list"),
  W-Q11's stale comment, W-Q12 (the retry key follows the referral's words, not a 32-bit hash), W-Q13 (a file waiting
  for the bot check says so; New York City tagged "Its own intake"; the screen-reader count first in the step), W-Q15,
  and W-Q19's `tests\every-step-check.mjs` (every step of every case type, both ways: 108). Checks
  `tests\overnight-check.mjs`. **For W103's mockups** (anything that looks different): W-Q10's colours (white on orange
  in the advice panel's heading and the Print button, 2.8 to 1; box and tick-box edges under 3 to 1), W-Q08 (one "What
  is it?" for every Something else file on the portal page; its placeholder cut short), W-Q13's portal sentence ("It
  will not work anywhere else…"), W-S06's "Start over". **The owner's to decide:** W-S01 (the base's ID and two share
  addresses are in the public history: they open nothing; rewriting the history is not advised) and W-S04 (HSTS and
  framing headers need a proxy in front of Pages). Notes only: W-S02, W-S05 (at H2), W-S07 to W-S13. The worker chat's:
  the portal worker's rows. **W-Q02 and W-Q03 turned out to need no worker change (the worker chat) and are fixed here
  too:** a message on Send RIAC a message after the hour's upload batch has lapsed gets a new batch with the same
  sign-in, any files sent again, and goes (the worker chat has put to the owner letting a batch last the sign-in's 12
  hours instead); a referral refused because its files are too large for a centre reached by email now says so, with a
  link to Documents, not "too long" (`tests\q02-q03-check.mjs`).
- **Security review (CS5, 20 October 2026)**: report in `riac-handover\CS5\security-review.md` on the desktop. Done:
  findings 1 (download link) and 2 (Decap pinned), both **live** (pull requests #20 and #22); 4 (.doc refused), 6
  (framing), 8 (portal sign-in in the tab) and 9 (go-live checklist) on this branch, re-tested by CS5; 5, 7, 13 and 14
  by the worker chat. Check the report for anything still open before the go-live. Also live: the advisory search
  display fix (#21).
- **Before merging this branch**: `main` already has #20, #21 and #22, and this branch carries the same changes as
  separate commits, so bring `main` into this branch first and check the result (the stylesheet's end and
  `CLAUDE.md` are where the two meet).
- **[Owner] Confirm the staff email signature actually renders.** `nyriac.com` is blocked to
  Claude, and no session can see a real Outlook. Send a test to an address that has never
  received mail from the sender before.
- **[Owner] Update the OneDrive signature file's Region 2 number** to **(315) 898-2593** in every
  signature block it holds, **and its Region 2 email to cny@nyriac.com** (W54 1, 22 October 2026). An online
  session cannot reach OneDrive, and the individual staff blocks exist only in that file.
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
