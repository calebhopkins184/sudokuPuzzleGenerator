# Domain sites

Static, SEO-ready HTML/CSS sites — one folder per domain. Each folder is a standalone web root (deploy the folder's contents as the site root; links are root-relative like `/styles.css`).

See `SPEC.md` for the conventions every site follows (meta tags, JSON-LD, sitemap, robots.txt with AI crawlers allowed, llms.txt, content honesty rules).

| Domain | Focus |
|---|---|
| 15daytrial.com | Free trials & cancelling subscriptions |
| africaguiding.com | African safari & travel guide |
| akcircle.com | Living in Alaska |
| akclaims.com | Alaska insurance claims guide (educational) |
| akcoating.com | Protective coatings for Alaska's climate |
| akharbors.com | Alaska harbors & small-boat ports |
| anchorageasphaltpaving.com | Asphalt paving in Anchorage |
| byebyespam.com | Stopping spam email, robocalls & texts |
| creekcaffe.com | Coffee brewing at home & outdoors |
| dadgifs.com | Dad jokes & dad humor |
| financenorth.org | Personal finance for Alaskans |
| financialnow.org | Personal finance basics |
| floridarednecks.com | Florida country & outdoor lifestyle |
| highqulity.com | Spotting well-made, buy-it-for-life products |
| loveinafrica.com | African honeymoons, weddings & romantic travel |
| sparksheets.com | Excel & Google Sheets tutorials |
| stockqb.com | Stock market education |
| taxproflorida.com | Florida tax guide (educational) |
| ubuntuapps.com | Ubuntu app guide |

## Before launch
- Replace `<!-- TODO -->` placeholders on each `contact.html` with a real form handler (mailto forms are a stopgap).
- Fact-check time-sensitive details (laws, fees, release dates) and click-test outbound links.
- Deploy with Cloudflare Pages — see `DEPLOY.md`.
