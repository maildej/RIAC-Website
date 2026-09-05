# One-time setup: GitHub Pages + Wix DNS

> This setup was completed once. The repository created in Step 1 is now named `RIAC-Website`;
> the site and its domain are unaffected by the name.


Follow these steps once. After that, updating the site is just uploading changed files to GitHub.

## Step 1 — Create the repository

1. Sign in at github.com.
2. Click the **+** (top right) → **New repository**.
3. Name it `nyriac.com` (any name works). Leave it **Public** — required for free GitHub Pages.
4. Click **Create repository**.

## Step 2 — Upload this folder

Option A (browser): on the new repo page, click **uploading an existing file**, drag in everything from this folder (including the `css`, `images`, `advisories`, and `tools` folders and the hidden `.nojekyll` file), and click **Commit changes**.

Option B (PowerShell, if an SSH key is set up in GitHub):

```powershell
cd C:\Users\dejac\OneDrive\Cowork\nyriac.com
git init -b main
git add .
git commit -m "Initial RIAC site"
git remote add origin git@github.com:USERNAME/nyriac.com.git
git push -u origin main
```

Replace `USERNAME` with the GitHub username. After this, publishing future edits is just: `git add . ; git commit -m "update" ; git push`

## Step 3 — Turn on GitHub Pages

1. In the repo: **Settings** → **Pages** (left sidebar).
2. Under "Build and deployment", set Source to **Deploy from a branch**, branch **main**, folder **/ (root)**. Save.
3. Under "Custom domain", it should show `nyriac.com` (picked up from the CNAME file). If not, type `nyriac.com` and Save.
4. Wait a few minutes, then tick **Enforce HTTPS** (it appears once the certificate is ready — can take up to a day after DNS is set in Step 4).

## Step 4 — Add DNS records in Wix

In Wix: **Domains** → click `nyriac.com` → **Manage DNS Records** (may be under "Advanced").

**Delete** any existing A records or CNAME on `www` that Wix added, then add:

Four A records (all with Host blank or `@`):

| Type | Host | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

One CNAME record:

| Type | Host | Value |
|---|---|---|
| CNAME | www | `YOUR-GITHUB-USERNAME.github.io` |

Replace `YOUR-GITHUB-USERNAME` with the actual GitHub username (lowercase). Example: if the username is `nyriac`, the value is `nyriac.github.io`.

One TXT record, to finish GitHub's **domain verification** (GitHub profile → Settings → Pages → Add a domain, which shows the exact name and code):

| Type | Host | Value |
|---|---|---|
| TXT | `_github-pages-challenge-YOUR-GITHUB-USERNAME` | verification code shown by GitHub |

Verification isn't required for the site to work, but it stops anyone else from claiming `nyriac.com` on GitHub Pages — click **Verify** back on GitHub once the record is saved.

## Step 5 — Verify

- DNS changes take from a few minutes up to 48 hours.
- Visit `https://nyriac.com` — the site should load with a padlock (HTTPS).
- Also check `https://www.nyriac.com` redirects correctly.
- In GitHub **Settings → Pages**, a green check next to the custom domain means everything is working.

Recommended: in GitHub **Settings → Pages**, also click **Verify domain** if offered — it prevents others from claiming nyriac.com on GitHub Pages if the repo is ever deleted.

## Step 6 — Set up admin login for the secret advisories page (`/admin/`)

This page lets you upload/manage practice advisory PDFs (and their Word source files) from a login-protected page, instead of through github.com. Because the site itself has no server, the login step ("sign in with GitHub") is handled by a free Netlify account that does nothing except pass that login through — the site keeps living on GitHub Pages exactly as before.

### 6a — Register a GitHub OAuth App

1. Go to [github.com/settings/developers](https://github.com/settings/developers) (signed in as the GitHub account that owns the `nyriac.com` repo).
2. Click **OAuth Apps** → **New OAuth App**.
3. Fill in:
   - **Application name:** `RIAC Site Admin` (anything you like)
   - **Homepage URL:** `https://nyriac.com`
   - **Authorization callback URL:** `https://api.netlify.com/auth/done`
4. Click **Register application**.
5. Copy the **Client ID** shown on the next page.
6. Click **Generate a new client secret**, and copy that too — it's only shown once.

### 6b — Create a free Netlify site (used only for login, not hosting)

1. Go to [app.netlify.com/signup](https://app.netlify.com/signup) and sign up (signing in with your GitHub account is easiest).
2. Click **Add new site** → **Import an existing project** → choose GitHub → select the `nyriac.com` repository.
3. Accept the defaults and click **Deploy**. (Netlify will build its own unused copy of the site — that's fine, ignore it. `nyriac.com` itself keeps being served by GitHub Pages, not Netlify.)
4. Once the site exists, note its Netlify address shown at the top of the dashboard — something like `https://random-name-123abc.netlify.app`.
5. In that site, go to **Project configuration → Access & security → OAuth**.
6. Under **Authentication Providers**, click **Install provider** → **GitHub**.
7. Paste in the **Client ID** and **Client Secret** from step 6a. Save.
8. Still in that site's dashboard, go to **Domain management** and click **Add a domain**. Type `nyriac.com` and add it. When Netlify asks whether you're the owner / want to add it anyway, choose **Yes**. (This does **not** change where the site is actually hosted or touch any DNS records — GitHub Pages keeps serving `nyriac.com` exactly as before. This step only lets Netlify's login system recognize `nyriac.com` as allowed to use this site's OAuth settings. Ignore any "DNS not configured" warning Netlify shows afterward.)

### 6c — Connect the two together

`admin/config.yml` needs a `site_domain` line set to your Netlify site's address (e.g. `site_domain: random-name-123abc.netlify.app`), telling the login page which Netlify site's OAuth settings to use. Ask Claude to set this once you have your Netlify address.

### 6d — Try it

Visit `https://nyriac.com/admin/` and click **Login with GitHub**. Only GitHub accounts with push access to the `nyriac.com` repo (or ones you explicitly invite as collaborators) will be able to log in and make changes.

## Updating the site later

1. Edit the file(s) locally, or open the file on github.com and click the pencil icon.
2. Commit (save) the change on GitHub.
3. The live site updates automatically in about a minute.
