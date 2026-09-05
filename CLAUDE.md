# CLAUDE.md — nyriac.com

## About the owner

The owner of this project is not a developer and knows little about web design or development. When helping them:

- Explain things in plain English; avoid jargon (or define it when unavoidable).
- Make edits for them rather than telling them how to code.
- Keep the site simple — resist adding frameworks, build tools, or JavaScript unless truly needed.
- When something requires action outside this folder (GitHub, Wix), give exact click-by-click steps.

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
| `p9vt3xk6qz1md7bw/` | **Unlisted test pages** for the online intake route (`nyriac.com/p9vt3xk6qz1md7bw/`). All `noindex` and linked from nowhere. `index.html` is the front door (two cards: start a new case / add to an existing case); `new-case.html` embeds the **Airtable form** in the page; `new-case-handoff.html` is the same page but sends the attorney to airtable.com — the two exist to be compared, then one is deleted; `supplemental.html` is a placeholder until that form is published. Currently points at **Region 2's** form only. **Never replace the Airtable form with a form hosted here** — the conflict check is bound to the Airtable form and silently stops running on anything else. Embedding it is fine; re-implementing it is not. When testing is done this content moves into `intake.html` and the folder is deleted |
| `chief-defender-survey.html` | **Unlisted** survey for NY chief defenders (see "Chief Defender survey" below). `noindex`; not linked from any nav or footer — reachable only by direct URL |
| `js/chief-defender-survey.js` | Submits the survey to Formspree via `fetch` and shows an inline thank-you |
| `css/style.css` | All styling, shared by every page (brand + region colors at top in `:root`) |
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

Two pages are deliberately not linked from anywhere: `chief-defender-survey.html` and the
intake test folder. Both carry `noindex, nofollow`.

⚠️ **Neither is secret, and nothing should be built assuming otherwise.** This repository is
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

- Configuration: `admin/config.yml`. Backend is `github`, repo `maildej/RIAC-Website`, branch `main`.
- Because GitHub Pages can't run server-side code, GitHub OAuth login is proxied through a **free Netlify site created only for this purpose** (Netlify doesn't host the actual site — nyriac.com stays on GitHub Pages). See `SETUP.md` for the one-time setup the owner needs to complete (registering a GitHub OAuth App, connecting Netlify, and adding `nyriac.com` as a domain on that Netlify site so its OAuth login recognizes requests from it), which fills in `site_domain` in `admin/config.yml`.
- Uploads land in `advisories/` (PDF) and `advisories/source/` (Word doc) and create a small metadata entry under `cms/advisories/` that Decap uses for its list/search — this metadata isn't read by the public site. **Uploading a file here does not automatically add it as a card on `advisories.html`** — that step (title, summary, card styling) is still a manual edit, same as any other advisories.html change.
- Only people with push access to the GitHub repo (or added as OAuth-approved users) can log in — that's the real access boundary, not the page's URL being unlisted.

### Chief Defender survey

An **unlisted** page (`chief-defender-survey.html`) sent to NY chief defenders, asking how their office identifies and refers non-U.S.-born clients to their RIAC. It is deliberately not linked anywhere on the site and carries `noindex, nofollow` — it's shared by direct link only. Question 1 is a searchable office picker whose ~130 options were generated from the NYSDA "Public Defense Services" Chief Defender list; if that list changes, update the `<datalist id="offices">` options in the page.

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

- Navigation (header) and footer are copied into each page — when editing them, update **all three pages** (`index.html`, `advisories.html`, `contact.html`) plus `404.html`'s header.
- Pages use relative links (`advisories.html`); only `404.html` uses absolute links (`/advisories.html`) because GitHub serves it from any URL.
- To publish changes: commit and push to `main` (or upload the changed files via github.com); GitHub Pages redeploys automatically in ~1 minute.

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

- **Point `intake.html` at the Airtable intake form.** No online intake form is built on this
  site; the Airtable intake form supersedes the ones once planned here.
  **Do not build any website form that posts into Airtable** — the conflict check is bound to
  Airtable's own form by internal ID and silently stops running on anything else. Link out to the
  Airtable form instead. See `AIRTABLE-TODO.md`.
- **[Owner] Confirm the staff email signature actually renders.** `nyriac.com` is blocked to
  Claude, and no session can see a real Outlook. Send a test to an address that has never
  received mail from the sender before.
- **[Owner] Update the OneDrive signature file's Region 2 number** to **(315) 898-2593** in every
  signature block it holds. An online session cannot reach OneDrive, and the individual staff
  blocks exist only in that file.

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
