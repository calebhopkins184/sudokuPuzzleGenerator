# Deploying to Cloudflare Pages

Each domain is its own Cloudflare Pages project. No build step — Pages just serves the folder.

## One-time setup per domain (Git-connected)
1. Add the domain to Cloudflare (Websites → Add a site) and switch the nameservers at GoDaddy to the two Cloudflare gives you.
2. Workers & Pages → Create → Pages → **Connect to Git** → pick this repo.
3. Build settings:
   - Production branch: `domain-sites` (or `main` once merged / moved)
   - Framework preset: **None**
   - Build command: *(leave empty)*
   - Build output directory: `domain-sites/<domain>` (e.g. `domain-sites/akharbors.com`)
4. Save and deploy, then **Custom domains** → add `<domain>` and `www.<domain>`.
5. Redirect www → apex: Rules → Redirect Rules → "Redirect from WWW to root" template (301). Canonical URLs on every page use the bare domain (`https://<domain>/`).

Each project only rebuilds the folder it points at, but every push redeploys all connected projects. To skip unrelated ones, set **Build watch paths** (Settings → Builds) to `domain-sites/<domain>/*`.

## Alternative: direct upload with Wrangler (no Git)
```sh
npm i -g wrangler
wrangler login
wrangler pages deploy domain-sites/akharbors.com --project-name=akharbors
```

## How the sites fit Pages
- **Clean URLs:** Pages serves `about.html` at `/about` and redirects `/about.html` → `/about`. All links, canonicals, sitemaps and llms.txt already use the extensionless form, so there are no redirect hops.
- **404:** Pages serves `404.html` automatically for missing paths.
- **`_headers`:** basic security headers + caching for CSS/favicon.

## After each site is live
1. Google Search Console → add a **Domain** property (verify via DNS TXT — easy in Cloudflare) → Sitemaps → submit `sitemap.xml`.
2. Bing Webmaster Tools → import from Search Console (Bing's index also powers ChatGPT search and others).
3. Optional: Cloudflare Web Analytics (free, cookieless) — consistent with each site's privacy page.
4. In Cloudflare → Security → Bots, check that AI crawlers aren't being blocked if you want AI search visibility (Cloudflare can block them by default on some plans — "AI Scrapers and Crawlers" / "Block AI bots" setting).
