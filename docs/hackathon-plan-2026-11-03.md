# Older plan (2026-11-03). Superseded by project-brief.md and CLAUDE.md; kept for history.

# Packwise: Hackathon Plan

Last updated: 2026-11-03. Target submission: December 15, 2026 (official deadline December 20, 2026, 9:00pm PST).

## Context for a new chat

- Event: Arbiter Hacks V1 (online, Devpost). Students only, teams of 1 to 4, one track per team.
- Track: Theme Track, "Rethinking Waste". Waste reduction must be central to the project.
- Theme rubric: Impact on waste problem 35%, Technical execution 25%, Feasibility 20%, Presentation and demo 20%.
- Required: public code repo, 2 to 3 minute demo video (YouTube or Vimeo), written description, and a Theme paragraph naming the waste problem and how success is measured. Missing the repo or video makes a submission ineligible.
- Prizes: 1st place Theme is $1,100 ($100 cash plus $1,000 Adaption credits per the rules page; the Devpost overview is unclear on the split). 2nd place Theme is only $50 cash plus credits.
- Constraint from the team: use only public, easily downloadable data.
- Idea origin: Packwise was drafted by a teammate (Whit) on Oct 20, 2026 and restructured here for the hackathon rather than for Tiger Cage.
- Packwise is a free website that helps new and small online sellers choose packaging that is affordable, protective, legal, and low-waste. Most packaging waste is decided when a small brand picks its mailers and boxes, so the tool steps in at that moment.

## Score

As written, Packwise scores about 7.0/10 on the Theme Track rubric, not the 8.5 the original summary claimed. After the changes below it scores about 8.1.

| Criterion | Weight | Original self-score | Score as written | Score after changes | What moves it |
| --- | --- | --- | --- | --- | --- |
| Impact on waste problem | 35% | 8 | 7 | 8 | Lead with plastic avoided and right-sizing; show impact as a projection with its math visible |
| Technical execution | 25% | 8 | 6 | 7.5 | Photo scan is an API call; the scoring engine and right-sizing with dimensional weight are the real depth |
| Feasibility | 20% | 9 | 7 | 8.5 | Cut from 15 features to 7; fix the exempt persona and the fee numbers |
| Presentation and demo | 20% | 8 | 8 | 8.5 | One clean story, one swap reveal, no half-built screens |
| Weighted total | | 8.2 | 7.0 | 8.1 | |

The problem is real, the data is public, and the low-waste choice lines up with the cheaper choice. The ceiling is that impact is projected, not measured, so a few real sellers testing it before submission would be the single biggest boost.

## Keep and change

Keep the core idea, the five-factor label, and the waste-first framing. Cut everything that exists only for a future business.

### Keep

- The core claim: packaging waste is decided at the design stage, and the low-waste choice is often the cheaper one.
- The five-factor label (Cost, Protection, Waste, Legal/fees, Carbon) as the visual signature of every recommendation.
- The swap reveal ("switch this mailer, save $X and Y lbs of plastic") as the demo climax.
- The disposal insert generator, which gives judges a direct contamination story.
- The tech stack: Next.js on Vercel, JSON data files, a vision API, PDF export, a public repo from day one.
- The data rules: SOURCES.md, sources shown in the app, "last updated" dates, estimates labeled as estimates.
- The risk calls on scope creep and "looks like tax software."

### Change

| Original | Change to | Why |
| --- | --- | --- |
| 15 features in seven steps | 7 core features, the rest on a stretch list | Unfinished flows cost Feasibility and Presentation points |
| Maya at $3M, "likely covered" in OR and CO | Maya at $8M, plus a second result showing an exempt seller | Oregon exempts producers under $5M; the original result is likely wrong |
| EPR fees as the money hook | Shipping cost and breakage as the money hook; fees as a bonus | Fees only apply to orders shipped into EPR states, so they are small for most sellers |
| "About $0.05 paper, $0.34 flexible" averages | Exact category rates from the final Oregon schedule | The draft schedule shows kraft paper at 3 cents/lb and LDPE film at 54 to 72 cents/lb base |
| Box right-sizing as a size picker | Right-sizing that also computes dimensional-weight shipping cost | This is where the dollar savings come from, and it adds technical depth |
| Dashboard, impact scorecard, downloadable report | One results page with an impact summary and a single PDF export | Same demo value, a third of the build |
| Self-scored 8.5/10 | Drop self-scores from anything judges see | Judges score it; an inflated number reads as unearned |
| Business model, pricing, moat, launch path | Cut from the hackathon plan | Not judged; keep for a later venture pitch |
| Competitor table with 8 rows | Two lines in the writeup naming D4PACKtool and SustainaBUILD as prior work | The Theme rubric has no originality criterion |

## Core build

Seven features carry the demo, built in this order. Anything on the stretch list starts only after all seven work end to end.

| # | Feature | What it does | Rubric it serves |
| --- | --- | --- | --- |
| 1 | Packaging library | About 50 hand-weighed components with material, weight, unit price, and source link | Feasibility |
| 2 | Packaging Planner | A few questions (product, fragility, weight, ship-to states) return cheapest, best-balance, and lowest-waste setups | Impact, Presentation |
| 3 | Scoring engine and five-factor label | One documented formula scores every option on Cost, Protection, Waste, Legal/fees, Carbon | Technical, Impact |
| 4 | Right-sizing and shipping cost | Smallest safe standard box, filler volume, and dimensional-weight shipping cost before and after | Technical, Impact |
| 5 | Swap engine | Ranked swaps with dollars saved, pounds of plastic avoided, and trade-offs | Impact, Presentation |
| 6 | Photo scan | Vision API lists a package's parts and materials; the user corrects them | Technical, Presentation |
| 7 | Coverage check and fee estimate | Exempt or covered per state (OR, CO, CA proposed), with the reason and yearly fee estimate | Feasibility |

### Stretch, in order

1. Disposal insert generator (printable PDF card)
2. One PDF export of the results page
3. Spec sheet PDF reader
4. Status list for the other EPR states (MN, MD, WA, ME)
5. Three short guides linked from the planner

### Cut

Match score (folded into the planner ranking), 50-state table, dashboard, impact scorecard and badge, user accounts.

### Why these were cut

- Match score: repeats the five-factor label; two scoring systems on one screen confuse the reader.
- Dashboard and impact scorecard: need history, but a demo user is brand new, so the screens would be empty or filled with made-up numbers.
- Downloadable report: overlaps the other exports, merged into the single PDF export.
- 50-state table: most rows would say "no law yet"; real work that never shows in the video.
- User accounts: logins, storage, and security are plumbing judges do not score; saving in the browser covers the demo.
- Spec sheet reader: same trick as the photo scan, so building it twice adds no depth.
- Beginner guides: writing, not code; judges will not read articles during a demo.

## Demo story

The video follows one seller from "what do I ship in?" to a lower-waste, cheaper setup. Every number on screen is calculated by the app, not typed into a script.

### Walkthrough

1. Maya runs an $8M candle brand on Shopify and ships nationwide in poly mailers with plastic void fill.
2. She snaps a photo of a packed order. The scan lists a glass jar, metal lid, label, plastic void fill, and poly mailer; she fixes one item.
3. She uploads a sample Shopify orders file. The app counts orders per state.
4. Results: a five-factor label for each part. The poly mailer and void fill rate poorly; right-sizing shows a smaller box with less filler and its shipping cost.
5. Swaps: a recycled paper mailer with paper fill, showing dollars saved (mostly shipping) and pounds of flexible plastic avoided per year.
6. Coverage: covered in Oregon, with the reason and the fee before and after the swap. A second, $2M seller appears briefly as exempt, to show the checker is accurate, not alarmist.

### Video outline (2:30)

| Time | Segment | On screen |
| --- | --- | --- |
| 0:00 to 0:20 | Problem | A poly mailer and an oversized box; the packaging choice is made once, by price, with no guidance |
| 0:20 to 0:45 | Plan | The planner questions for Maya's candle brand |
| 0:45 to 1:10 | Scan | Photo in, parts and materials out, one correction |
| 1:10 to 1:45 | The reveal | Five-factor label and right-sizing with shipping cost |
| 1:45 to 2:15 | The fix | Ranked swap with dollars saved and plastic avoided; Oregon fee before and after |
| 2:15 to 2:30 | Impact | Pounds of plastic avoided if 1,000 similar sellers made the same swap, with the math shown |

## Theme paragraph

> Most e-commerce packaging waste is locked in the day a small brand picks its mailers and boxes, usually the cheapest plastic option in a box too big for the product. Packwise targets that decision. It scans a seller's current packaging, scores every option on cost, protection, waste, state fees, and carbon, and recommends right-sized, recyclable swaps that also cut shipping costs. A printable insert tells customers how to dispose of each part, which reduces contamination at the bin. We measure success by pounds of hard-to-recycle packaging each seller switches to recyclable or reusable alternatives per year, calculated from their order volume and shown alongside the dollars they save.

If the disposal insert does not ship, drop its sentence from this paragraph.

## Build timeline

Seven core features must work end to end by November 24, before Thanksgiving. Stretch items and real-seller tests only fill time that is left over. Roles for a team of four: frontend and design, data and law research, AI features and scoring engine, video and writeup.

| Work block | Start | End |
| --- | --- | --- |
| Library and fee research | Oct 21 | Nov 3 |
| Planner and scoring | Oct 28 | Nov 14 |
| Right-sizing and swaps | Nov 9 | Nov 24 |
| Photo scan and coverage | Nov 16 | Dec 1 |
| Milestone: demo spine works | Nov 24 | Nov 24 |
| Stretch and real testers | Nov 25 | Dec 6 |
| Polish and accuracy pass | Dec 1 | Dec 8 |
| Video and writeup | Dec 7 | Dec 14 |
| Milestone: submit on Devpost | Dec 15 | Dec 15 |
| Official deadline | Dec 20 | Dec 20 |

## Open questions

- [ ] Pull the final Oregon fee schedule by material category; only the draft 2025 base rates are confirmed so far.
- [ ] Confirm how Oregon's two exemption tests combine (under $5M revenue, or under one metric ton shipped into the state). Maya needs more than a ton into Oregon to be covered; check against the sample orders file.
- [ ] Confirm Colorado's low-volume producer rules for sellers under about $5.5M, and whether the 2027 schedule is out.
- [ ] Confirm whether California's $1M exemption counts total sales or California sales; keep its rates labeled "proposed."
- [ ] If the disposal insert does not ship, drop its sentence from the theme paragraph.
- [ ] Ask in the event Discord about the unclear $100 and $50 cash amounts listed beside the prizes.
- [ ] Check the build plan against Auburn finals week.

## Sources

- [Arbiter Hacks V1 on Devpost](https://arbiter-hacks-v1.devpost.com/): tracks, rubric weights, prizes, deadline, submission rules
- [EcoEnclose EPR FAQ](https://ecoenclose.com/blog/epr-faq): Oregon, Colorado, and California small-producer thresholds
- [Circular Action Alliance draft Oregon fee estimates](https://schwabe.com/wp-content/uploads/2025/04/Circular-Action-Alliance-pg-196-203.pdf): 2025 base rates per pound by material (draft, not final)
