# Domain sites — build spec

Each domain gets its own folder: `domain-sites/<domain>/` (e.g. `domain-sites/akharbors.com/`).
Each folder is a fully standalone static site (deployable as the web root). Plain HTML + one CSS file. No JS frameworks, no build step, no external fonts/CDNs (system font stack only). A tiny inline script is OK only if truly needed (prefer none).

## Required files per site
- `index.html` — homepage: clear H1 with primary keyword, intro, sections linking to every content page, FAQ section (5+ Q&As).
- 4–6 content pages (`<slug>.html`, lowercase-hyphenated slugs) — substantive, genuinely useful articles/guides/service pages, 700–1500 words each, targeting distinct long-tail keywords. Real, accurate information only.
- `about.html`, `contact.html`, `privacy.html`, `404.html`
- `styles.css` — shared stylesheet, mobile-first, responsive, accessible contrast, a distinct color palette/personality per site.
- `favicon.svg` — simple inline-designed SVG icon (letter/monogram or shape).
- `robots.txt` — allow all, `Sitemap: https://<domain>/sitemap.xml`. Explicitly allow AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot).
- `sitemap.xml` — every page, absolute https URLs, `<lastmod>2026-11-02</lastmod>`.
- `llms.txt` — per llmstxt.org format: `# Site name`, `> one-line summary`, then `## Pages` with markdown links + one-line descriptions for each page.

## Every HTML page must have
- `<!doctype html>`, `<html lang="en">`, charset, viewport
- Unique `<title>` (50–60 chars, keyword first, ends with brand) and unique `<meta name="description">` (140–160 chars)
- `<link rel="canonical" href="https://<domain>/<page>">` (homepage canonical = `https://<domain>/`)
- Open Graph (`og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`) + `twitter:card` = summary
- `<link rel="icon" href="/favicon.svg" type="image/svg+xml">`, `<link rel="stylesheet" href="/styles.css">`
- JSON-LD in `<script type="application/ld+json">`: homepage → `WebSite` + `Organization` (or `LocalBusiness` subtype ONLY if appropriate and without fake address/phone); articles → `Article` (headline, description, datePublished/dateModified 2026-11-02, author = Organization) + `BreadcrumbList`; FAQ sections → `FAQPage`.
- Semantic HTML: `<header>` with nav linking to all main pages, `<main>`, one `<h1>`, logical h2/h3, `<footer>` with links (About, Contact, Privacy) and © 2026.
- Breadcrumbs on content pages. Internal links between related content pages ("Related guides").
- Skip-to-content link. Alt text on any images (prefer no raster images; inline SVG/CSS decoration is fine).

## Content / honesty rules (important)
- Write for people first: specific, accurate, practical. Answer questions directly in the first paragraph of each section (good for AI answer engines). Use lists, tables, and short paragraphs.
- NEVER invent: phone numbers, street addresses, license numbers, credentials, staff names, testimonials, reviews, ratings, client counts, awards, years in business, prices presented as quotes. Where contact info belongs, use clearly marked placeholders inside HTML comments plus visible text like "Email: hello@<domain>" (email at the own domain is fine).
- contact.html: show `hello@<domain>` as mailto link; a simple `<form>` with `action="mailto:hello@<domain>"` method post enctype text/plain is acceptable. Add an HTML comment `<!-- TODO: replace with real form handler / phone / address -->`.
- Finance/tax/legal/insurance-claims/health topics: educational only, include a clear disclaimer ("not financial/tax/legal advice; consult a licensed professional"), and don't claim to be a licensed firm.
- Local-service sites (Alaska/Anchorage, Florida): write as a helpful local resource/guide about the service; mention real local factors (climate, freeze-thaw, hurricanes, etc.).
- privacy.html: generic, honest privacy policy (no analytics claims beyond "we may use privacy-respecting analytics"; mailto contact).
- No lorem ipsum, no "coming soon" filler.

## Quality bar
- Valid HTML; all internal links resolve to files that exist; nav consistent across pages.
- Check with: `grep -o 'href="/[^"#]*"' *.html | sort -u` and confirm each target exists.

## Site concepts (positioning + suggested pages; refine slugs/keywords as you see fit)
- **anchorageasphaltpaving.com** — Anchorage/Southcentral Alaska asphalt paving resource: driveway paving, sealcoating, crack filling/frost heave repair, cost factors, best paving season in Alaska, choosing a contractor.
- **akcoating.com** — Alaska protective coatings: epoxy/polyaspartic garage floors in cold climates, roof coatings, spray foam insulation basics, deck/log home stains & sealers, metal rust protection.
- **akharbors.com** — Guide to Alaska's harbors & small-boat ports (Homer, Seward, Whittier, Valdez, Kodiak, Juneau, Ketchikan): moorage basics, transient boater tips, tides, launching, seasonal considerations. No made-up moorage rates.
- **akclaims.com** — Alaska insurance claims guide (educational): homeowners claims, auto claims, earthquake & ice-dam/freeze claims, how to document damage, disputes and the Alaska Division of Insurance. Disclaimer required.
- **akcircle.com** — Alaska community/living hub: moving to Alaska, northern lights viewing, Alaska seasons & daylight, things to do in Anchorage, winter living tips.
- **financenorth.org** — Personal finance for Alaskans & northern living: Permanent Fund Dividend basics (don't state unverified current-year amounts), budgeting with high cost of living, heating costs, Alaska has no state income/sales tax (local sales taxes exist), saving for remote travel. Disclaimer.
- **taxproflorida.com** — Florida tax guide (educational, not a tax firm): no state personal income tax, homestead exemption & Save Our Homes, Florida sales tax basics, Florida corporate income tax & reemployment tax for businesses, how to choose a tax professional (CPA vs EA). Disclaimer.
- **floridarednecks.com** — Fun, respectful Florida country/outdoor lifestyle: freshwater & saltwater fishing spots, airboats & swamp culture, boiled peanuts & Southern food, hunting/fishing licenses (point to FWC, don't invent fees), hurricane prep for rural Floridians.
- **financialnow.org** — Personal finance basics: emergency fund, budgeting (50/30/20), credit scores, debt payoff (avalanche vs snowball), index fund investing basics, retirement accounts (401k vs IRA). Disclaimer. Avoid year-specific contribution limits unless certain; say "check IRS for current limits".
- **stockqb.com** — "Your stock market quarterback" — investing education: how to read a stock quote, P/E ratio & valuation, ETFs vs mutual funds, dividend investing, order types (market/limit/stop), beginner portfolio. Disclaimer.
- **sparksheets.com** — Spreadsheet tutorials for Excel & Google Sheets: XLOOKUP/VLOOKUP, pivot tables, conditional formatting, building a budget spreadsheet, essential formulas cheat sheet. Include formula code blocks.
- **15daytrial.com** — Free-trial & subscription savvy guide: how to use free trials without getting charged, how to cancel subscriptions (iPhone, Android, PayPal, credit card), tracking renewals, consumer rights/disputing charges. Don't claim the FTC "click-to-cancel" rule is in effect (it was vacated by a federal court in 2025).
- **africaguiding.com** — African safari & travel guide: best time for safari by country, the Great Migration, choosing a safari type (lodge/mobile/self-drive), gorilla trekking in Rwanda/Uganda, safari packing list, travel health (point to CDC). 
- **loveinafrica.com** — Romance & Africa: African honeymoon destinations (Zanzibar, Seychelles, Mauritius, Cape Winelands, safari honeymoons), destination weddings, African wedding traditions (respectful, accurate), romantic itineraries. NOT a dating site.
- **creekcaffe.com** — Coffee by the creek: home brewing & outdoor coffee — pour-over guide, French press, camp/backpacking coffee methods, cold brew, choosing beans & grind size, espresso basics.
- **dadgifs.com** — Dad humor hub: big collections of clean dad jokes (by category), dad-pun guide, Father's Day gift ideas (generic categories, no fake product claims), dad memes/GIF culture explainer. No copyrighted images.
- **byebyespam.com** — Stop spam for good: email spam filtering (Gmail/Outlook), robocalls & National Do Not Call Registry, spam texts (forward to 7726), data broker opt-outs, recognizing phishing.
- **highqulity.com** — (brand: "High Qulity" — lean into it playfully, e.g., "We spend our budget on quality, not spelling") Buy-it-for-life guide to spotting quality: clothing fabric & stitching, cookware (cast iron/stainless/carbon steel), hand tools, furniture construction, footwear (Goodyear welt), cost-per-use.
- **ubuntuapps.com** — Ubuntu app guide: best apps for Ubuntu, installing apps (apt vs snap vs flatpak vs .deb/AppImage), essential apps after a fresh install, Ubuntu alternatives to Windows/Mac apps, Ubuntu LTS releases overview. Footer note: "Ubuntu is a registered trademark of Canonical Ltd. This site is not affiliated with Canonical."
