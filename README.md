# Gender equity rubric for venture capital firms

A weighted, evidence-anchored scoring instrument covering both a venture
firm's management company and its investment portfolio. Twenty-one
indicators across ten dimensions, each rated 0-4 against written anchors
that describe observable practice rather than intent.

Static site. No build step, no dependencies, no server, no tracking.
Everything runs in the browser and assessments are stored in
`localStorage`, so no data leaves the machine it was entered on.

---

## Deploy it

### GitHub Pages (recommended)

1. Create a repository and push these files to `main`.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push. The included workflow publishes the repository root on every
   push to `main`, and the URL appears in the Actions run summary.

Nothing is compiled, so the deploy takes a few seconds.

If you would rather not use Actions, set **Source** to *Deploy from a
branch*, pick `main` and `/ (root)`, and delete
`.github/workflows/deploy.yml`. The `.nojekyll` file stops GitHub
ignoring paths beginning with an underscore; keep it either way.

### Anywhere else

Any static host works — Netlify, Vercel, Cloudflare Pages, S3, an
internal file server. There is no configuration to supply.

```bash
# Or just look at it locally:
python3 -m http.server 8000   # then open http://localhost:8000
```

Opening `index.html` directly from the filesystem also works; the scripts
are plain `<script>` tags rather than ES modules for exactly that reason.

---

## What it does

| | |
|---|---|
| **Multiple assessments** | Score several firms, or the same firm across years, and switch between them from the toolbar. |
| **Evidence notes** | Every indicator takes a free-text note. Record the document, dataset or decision record behind each rating, so the score survives a change of personnel. |
| **Not applicable** | Indicators marked N/A drop out of the denominator instead of scoring zero, and their dimension's weight is shared across the remaining indicators. |
| **Export** | Download an assessment as JSON (round-trips back in) or CSV (for a spreadsheet or BI tool). |
| **Print** | A print stylesheet dims unselected anchors and drops the interface chrome, so *Print → Save as PDF* produces a readable record. |
| **Dark mode** | Follows the system setting, with a manual override. |

---

## Login

The site is behind an Auth0 email/password login screen, and excluded
from search indexing via `robots.txt` and a `noindex` meta tag.

### What this protects, and what it doesn't

GitHub Pages serves every file in the repository to anyone who requests
it by URL — that's what static hosting is. The login screen gates what
the *page renders*; it does not make `assets/rubric.js` or anything else
in the repository confidential. Someone who opens their browser's network
tab, or simply requests `your-site.example/assets/rubric.js` directly,
can read the rubric's content whether or not they've signed in. There is
no server here to enforce a check on that file.

What login *does* provide: a stranger who finds the bare URL sees a
sign-in form, not the working app, and can't get past it without an
account you or Auth0 provisioned. Combined with `robots.txt`, the site
also won't appear in search results. That matches "I don't want this
public," which is different from "this data must stay confidential from
anyone who tries." If you need the second one, you need a real backend —
see "If you actually need confidentiality" below.

### Setting up Auth0

1. Create a free account at [auth0.com](https://auth0.com).
2. In the dashboard, go to **Applications → Create Application**, name it
   anything, and choose **Single Page Web Applications**.
3. Under that application's **Settings**, set:
   - **Allowed Callback URLs**: your site's URL (e.g.
     `https://yourname.github.io/gender-equity-rubric/`)
   - **Allowed Logout URLs**: the same URL
   - **Allowed Web Origins**: the same URL, without a trailing slash
4. Copy the **Domain** and **Client ID** from that same Settings page into
   `assets/auth-config.js`, replacing the placeholder values.
5. Commit and push. The gate activates automatically — `auth.js` checks
   for placeholder text and shows a setup notice instead of a login form
   until real values are in place.

By default, Auth0 lets anyone sign themselves up with any email address,
which defeats the point of a private gate. To restrict access to people
you've chosen:

- Go to **Authentication → Database → your connection → Settings** and
  turn off **"Disable Sign Ups."**
- Then add people yourself under **User Management → Users → Create
  User**, or use **Organizations** if you want to manage a team.

### Removing the login screen

Delete the three lines near the bottom of `index.html` that load
`auth0-spa-js`, `auth-config.js`, and `auth.js`, and remove the `#gate`
markup near the top of `<body>`. `app.js` falls back to booting itself
immediately when `window.__RUBRIC_GATED__` is never set, so nothing else
needs to change.

### If you actually need confidentiality

A static site fundamentally cannot keep its own files secret from a
determined visitor. If the assessments themselves are sensitive enough
that this matters, options include:

- A small serverless function (Cloudflare Worker, Netlify Function, AWS
  Lambda) in front of the static files, checking a session before serving
  them — real access control, at the cost of no longer being "just a
  GitHub Pages site."
- Keeping the repository itself private and using GitHub's built-in
  collaborator access instead of a public deployment.
- Storing assessment data server-side behind real authentication, rather
  than in browser `localStorage`, if the *scores* — not just the blank
  rubric — are what needs protecting.

---

## Customising the rubric

`assets/rubric.js` is the whole model. Everything in the interface —
navigation, scoring, exports, the summary table — derives from it, so
retuning the instrument means editing one file and nothing else.

```js
{
  id: "B2",
  name: "Capital allocation outcomes",
  weight: 18,                       // points out of 100
  purpose: "The headline result…",
  inds: [
    {
      id: "B2.1",
      name: "Share of capital deployed",
      metric: "Percentage of dollars invested…",
      anchors: [ /* exactly five strings, describing scores 0 through 4 */ ]
    }
  ]
}
```

Two rules the app checks at load time and warns about in the console:

- dimension weights must sum to **100**;
- every indicator needs **exactly five** anchors.

### Weights worth reconsidering

The defaults give the portfolio 60 points and the firm 40, on the
reasoning that a venture firm's largest effect on gender equity runs
through its capital allocation rather than its own payroll. That is a
position, not a fact. An LP assessing a GP's internal governance, or a
firm of sixty people rather than twelve, may reasonably invert it.

Inside the portfolio half, deal funnel equity (B1) and capital allocation
(B2) carry 33 of the 60 points, because nearly all of the observed gap in
venture is produced upstream of the investment decision rather than at
the final yes or no.

### Changing the rubric after people have scored against it

Ratings are stored by indicator ID. Renaming an indicator is safe;
changing an ID orphans existing ratings. If you restructure, bump
`RUBRIC_META.version` and treat old exports as a separate baseline rather
than a comparable one. On import, any indicator ID the current rubric
does not recognise is skipped and reported.

---

## Measurement cautions

These are in the interface too, because they are easy to skip and
expensive to get wrong.

- **Small numbers move percentages, not reality.** In a twelve-person
  firm one hire swings representation by eight points. Use three-year
  rolling figures and suppress any cell with fewer than five people.
- **Dollars and deal counts diverge sharply.** A portfolio can be 30%
  women-founded by company count and 9% by capital deployed.
- **Choose the denominator honestly.** Parity is not automatically 50%.
  Benchmark against the addressable founder population in your sectors,
  stages and geographies, state which denominator you used, and keep it
  stable year to year.
- **Definitions are gameable.** "At least one woman founder" is the
  weakest defensible definition and the easiest to inflate.
- **Gender data is self-identified and often legally sensitive.** Collect
  by voluntary self-identification with a non-binary option and a decline
  option; never infer from names or photographs. In the EU and UK this is
  special-category personal data.
- **Funnel gaps need controls.** Raw conversion differences may reflect
  the sector mix of who applies.

One design decision is deliberate and worth preserving if you fork this:
**outcome parity (B5.2) is scored on reporting quality, never on hitting
a number.** Setting a target on exit multiples by founder gender would
corrupt both the measure and the decisions underneath it.

---

## Privacy

No analytics, no cookies, no network calls except the Google Fonts
stylesheet. If your organisation prohibits third-party font loading,
delete the two `<link>` tags for `fonts.googleapis.com` in `index.html`
and self-host Archivo, or let the CSS fall back to the system stack — the
layout is unaffected.

Assessments live in `localStorage` under the key `gender-equity-rubric`,
scoped to the origin. Clearing site data erases them, so export anything
you need to keep.

---

## Tests

The site itself has no dependencies. The test suite has one — `jsdom` —
and runs the real `index.html` in a headless DOM, checking that the
rubric renders, that the weighted maths is right at the boundaries, and
that N/A redistribution, notes and storage behave.

```bash
npm install
npm test
```

The deploy workflow runs this before publishing, so a broken scoring
change cannot reach the live site.

---

## Licence

MIT. See `LICENSE`.

This is a management and diligence tool, not legal advice. Collecting
gender data is regulated differently in each jurisdiction; review your
approach against local employment and privacy law before you start.
