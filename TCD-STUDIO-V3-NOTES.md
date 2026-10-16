# TCD Studio v3 rebuild

This is a new, simplified presentation for Talented Creative Design. It keeps the site's dark navy/blue identity while making navigation, content cards, and guide discovery more consistent.

## Main changes
- Shared compact navigation and footer across public pages.
- Simpler responsive layout and consistent cards.
- Homepage reorganized around six clear visitor paths.
- Guides library generated from `public/data/content-library.json`, with search and category filtering.
- Local `public/content-studio.html` editor can add, edit, delete, and export guide-card entries without hand-editing HTML.
- Added complete Chaturbate beginner and DJI Mic Mini + OBS pages from the supplied multipage guide pack and connected them to the site.
- Preserved existing account/shop/admin scripts and server code.

## Local content workflow
Run the app locally, open `/content-studio.html`, export the JSON, replace `public/data/content-library.json`, preview, then commit to staging. The editor does not write to the server automatically.

## Cam model information integration

- The homepage now includes a Cam Model Starter Info section with links to privacy, camera, first-show and audio guidance.
- Cam Creator includes a quick-start checklist plus a link to the full Chaturbate starter guide.
- The central guide library labels the Chaturbate guide as a beginner guide and keeps the DJI Mic Mini + OBS guide featured.
- Both long-form guides include navigation back to the main TCD homepage and Cam Creator library.
- Affiliate recommendations are disclosed; gear choices should be checked for current availability and compatibility.
