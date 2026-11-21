> Note (2026-11-16 handoff): this brief predates the research. Sections 9 (roles), 14 (research) and 15 (open questions) are superseded by CLAUDE.md at the repo root. The demo is now website-only (no seller pilot, drop test or live testing).

# Packwise: Project Brief for the Team

Updated November 16, 2026. This replaces the original Packwise summary and the October hackathon plan. Read it top to bottom once. Sections 7 to 11 explain how we actually build it.

## Contents

1. The idea in one minute
2. The hackathon: rules, tracks, judging, prizes
3. Decisions already made
4. What we are building
5. How good the idea is, and how to raise the score
6. Demo story, video outline, theme paragraph
7. The process from absolute start to absolute finish
8. Revised timeline
9. Who does what
10. How we work together (GitHub, localhost, branches, keys)
11. The project skeleton, explained
12. Design direction
13. How the scoring works
14. Research so far: state laws and fees
15. Open questions
16. Sources

---

## 1. The idea in one minute

**Packwise is a free website that helps small online sellers pick packaging that costs less, protects the product, and creates less plastic waste.** A seller describes or photographs how they ship today. Packwise shows a better setup and what it saves.

**Why it matters:** most packaging waste is locked in on one day, when a small business first picks its boxes and mailers. They usually grab the cheapest plastic option in a box that is too big, then ship that way for years. Packwise steps in at that moment and shows that the greener option is often the cheaper one too.

**Pain points it solves**

1. Sellers have no guidance. Big companies have packaging engineers; small sellers guess or copy others.
2. Oversized boxes waste money. Carriers charge by box size, not just weight, so a box that is too big costs more to ship and needs more filler.
3. Plastic packaging is hard to recycle. Poly mailers and plastic filler usually end up in landfills or contaminate recycling.
4. New state laws are confusing. Seven states now make brands pay for their packaging, and plastic costs several times more than paper. Most small sellers do not know whether the laws apply to them.
5. Customers do not know how to dispose of packaging, so the wrong items go in the recycling bin.

**The seven core features, in plain words**

1. **Packaging library:** a built-in list of about 50 boxes, mailers, and fillers with their weight, material, and price.
2. **Packaging planner:** answer a few questions about your product and get three options: cheapest, best balance, and lowest waste.
3. **Five-factor label:** a nutrition-label style scorecard for every option: cost, protection, waste, state fees, carbon.
4. **Box right-sizing:** finds the smallest safe box and shows the shipping savings.
5. **Swap suggestions:** "switch your plastic mailer to a paper one, save $X a year and Y pounds of plastic."
6. **Photo scan:** take a picture of a packed order and AI lists every part and material.
7. **"Am I covered?" check:** tells you whether the state packaging laws apply to you, and what you would owe before and after a swap.

**One-sentence pitch:** Packwise helps small sellers switch to packaging that costs less, ships smaller, and keeps plastic out of landfills.

**Why it stands out:** the organizers' own Theme examples (a recyclability checker, food-waste routing, a sorting vision system) all act after waste exists. Most teams will copy those. Packwise works upstream, at the moment the packaging is chosen. Lead the video with that.

---

## 2. The hackathon: rules, tracks, judging, prizes

**Event:** Arbiter Hacks V1, online, on Devpost: https://arbiter-hacks-v1.devpost.com/
Tagline: "Open innovation for all, submit projects that have potential impact and usability!"

**Who can enter:** students only, ages 13 and up, teams of 1 to 4 (we are a team of 2). Companies and professional organizations are excluded.

**Deadline:** December 20, 2026 at 9:00pm PST. Late submissions are not judged. **Our target is December 15.**

**Size:** 1,191 registered participants as of November 16. The page lists $7,800 in cash.

**Tags on the page:** Beginner Friendly, Machine Learning/AI, Open Ended. These are category labels, not requirements.

**Tracks** (from the official page):

- **General Track:** "Build anything. Any language, any stack, any idea. This track rewards technical ambition and execution, regardless of subject."
- **Theme Track, Rethinking Waste:** "Build something that helps people or systems reduce, sort, or recycle waste more effectively." Their examples: a tool that identifies whether an item is recyclable, an app that routes food waste to donation, a hardware or vision system that sorts materials, or a dataset or model that improves recycling accuracy.
- Tracks are judged separately for separate prizes. Pick one at registration or switch before the deadline. One track per team.
- **Key rule for us:** "Judges will check that the theme is central to the project, not bolted on." This is why we lead with waste, not with state fees.

**What every submission must include:**

1. A public code repository (GitHub).
2. A demo video, 2 to 3 minutes max, on YouTube or Vimeo, showing the project working.
3. A written description: what it does, how we built it, what we would do next.
4. Theme Track only: one paragraph stating the specific waste problem and how we would measure whether it worked.

Missing the repo or the video makes the submission ineligible. A live website link is not required.

**Judging weights** (read on Devpost on October 21; confirm on the rules page):

| General Track | Weight | Theme Track (ours) | Weight |
| --- | --- | --- | --- |
| Technical execution | 35% | Impact on waste problem | 35% |
| Innovation and originality | 25% | Technical execution | 25% |
| Completeness and polish | 25% | Feasibility | 20% |
| Presentation and demo | 15% | Presentation and demo | 20% |

**Prizes:** on October 21 the page listed 1st place in each track at $1,100, 2nd place General at $1,050, 2nd place Theme at only $50, and a $500 participation prize, with Adaption platform credits on top. The cash total has since risen to $7,800, so the breakdown has probably changed. Check the Prizes section.

**This is not a business competition.** No criterion scores revenue, pricing, market size, or customers. "Feasibility" means "could this realistically work," not "could this make money." Pitch Packwise as a tool that solves a waste problem. Nothing on the page bans AI coding tools; ask in the event Discord to be fully safe.

---

## 3. Decisions already made

- **Theme Track** ("Rethinking Waste").
- **Hackathon only.** The Tiger Cage version, business model, pricing, and launch plan are dropped. At most one line under "what's next."
- **Public data only.** No private business data.
- **Scope cut from 15 features to 7 core features**, plus a short stretch list.
- **No seller pilot.** Testing with real sellers would push the score toward 9, but there is no time. We accept a ceiling of about 8.3 to 8.5 and raise it in other ways (section 5).
- **Build on localhost first, deploy later.** First deploy to Vercel once the core works.
- **No trained machine learning model for scoring.** We use a transparent formula plus a robustness check (section 13). AI is used where it belongs: the photo scan.
- **Polished, earthy design.** Dark green, brown, kraft tones. No neon, no generic AI look (section 12).
- **Tech stack:** Next.js (React) with TypeScript, Tailwind styled from our own color file, JSON data files, a vision-capable AI API, GitHub, and Vercel for hosting.
- **Team of two:** Tyler owns data, math design, the AI feature, and the look. Partner owns the heavy logic and holds the app together.

---

## 4. What we are building

### Core features, built in this order

| # | Feature | What it does | Rubric it serves |
| --- | --- | --- | --- |
| 1 | Packaging library | ~50 components with material, weight, price, source link | Feasibility |
| 2 | Packaging planner | A few questions return cheapest, best-balance, and lowest-waste setups | Impact, Presentation |
| 3 | Scoring engine and five-factor label | One documented formula scores every option on 5 factors | Technical, Impact |
| 4 | Right-sizing and shipping cost | Smallest safe box, filler volume, dimensional-weight shipping cost before and after | Technical, Impact |
| 5 | Swap engine | Ranked swaps with dollars saved, plastic avoided, trade-offs | Impact, Presentation |
| 6 | Photo scan | Vision AI lists a package's parts and materials; the user corrects them | Technical, Presentation |
| 7 | Coverage check and fee estimate | Exempt or covered per state, with the reason and yearly fee | Feasibility |

### Stretch, only after all seven work end to end

1. Disposal insert generator (printable card telling customers how to recycle each part). First pick: cheap and strengthens the waste story.
2. One PDF export of the results page.
3. Robustness check on rankings (section 13, step 5). Small code, big credibility.
4. Spec sheet PDF reader.
5. Status list for the other EPR states.
6. Three short guides linked from the planner.

### Cut, and why

| Cut | Why |
| --- | --- |
| Match score | Repeats the five-factor label; two scoring systems on one screen confuse people |
| Dashboard and impact scorecard | Need months of history; a demo user is brand new, so the screens would be empty or fake |
| Separate downloadable report | Overlaps the PDF export |
| 50-state table | Most rows would say "no law yet"; work that never shows in the video |
| User accounts and logins | Plumbing judges never score; saving in the browser covers the demo |
| Business model, pricing, competitor table | Not judged in either track |

**Rule:** 7 features at 100% beat 15 features at 70%. Unfinished screens cost points.

---

## 5. How good the idea is, and how to raise the score

Our estimate on the Theme rubric:

| Criterion | Weight | Original summary (self-scored) | As originally written | With the plan in this brief |
| --- | --- | --- | --- | --- |
| Impact on waste | 35% | 8 | 7 | 8 |
| Technical execution | 25% | 8 | 6 | 7.5 |
| Feasibility | 20% | 9 | 7 | 8.5 |
| Presentation and demo | 20% | 8 | 8 | 8.5 |
| **Weighted total** | | **8.2** | **7.0** | **8.1** |

**What would get it to 9:** proof from real sellers (a 3 to 5 seller pilot). We skipped it for time, so the realistic ceiling is about 8.3 to 8.5.

**What still raises the score without a pilot:**

1. **A measured accuracy number for the photo scan.** Test it on 30 to 50 labeled package photos and report the result, for example "identified 87% of parts correctly."
2. **Real packing math.** Handle orders with more than one item and compare against a simple baseline (the box the seller uses now): "picks a smaller box on X% of orders."
3. **A drop test on video.** Drop the plastic setup and the recommended paper setup from the same height; both arrive intact. Proves the swap does not trade waste for broken products.
4. **The robustness check** on rankings (section 13).
5. **Exact, sourced fee data** with "last updated" dates.

**What does not raise the score:** more features, more states in the interface, fancy animations.

---

## 6. Demo story, video outline, theme paragraph

### Walkthrough (the demo seller)

1. Maya runs an $8M candle brand on Shopify and ships nationwide in poly mailers with plastic void fill. ($8M, not the original $3M, because Oregon exempts producers under $5M.)
2. She snaps a photo of a packed order. The scan lists a glass jar, metal lid, label, plastic void fill, and poly mailer; she fixes one item.
3. She uploads a sample Shopify orders file. The app counts orders per state.
4. Results: a five-factor label for each part. The poly mailer and plastic fill rate poorly. Right-sizing shows a smaller box with less filler and its shipping cost.
5. Swap: a recycled paper mailer with paper fill, showing dollars saved (mostly shipping) and pounds of plastic avoided per year.
6. Coverage: covered in Oregon, with the reason and the fee before and after the swap. A second $2M seller appears briefly as exempt, to show the checker is accurate, not alarmist.

Every number on screen must be calculated by the app, not typed into the script.

### Video outline (2:30)

| Time | Segment | On screen |
| --- | --- | --- |
| 0:00 to 0:20 | Problem | A poly mailer and an oversized box; the packaging choice is made once, by price, with no guidance |
| 0:20 to 0:45 | Plan | Planner questions for Maya's candle brand |
| 0:45 to 1:10 | Scan | Photo in, parts and materials out, one correction |
| 1:10 to 1:45 | Reveal | Five-factor label and right-sizing with shipping cost |
| 1:45 to 2:15 | Fix | Ranked swap with dollars saved and plastic avoided; Oregon fee before and after |
| 2:15 to 2:30 | Impact | Pounds of plastic avoided if 1,000 similar sellers made the same swap, with the math shown |

### Theme paragraph (required for submission)

> Most e-commerce packaging waste is locked in the day a small brand picks its mailers and boxes, usually the cheapest plastic option in a box too big for the product. Packwise targets that decision. It scans a seller's current packaging, scores every option on cost, protection, waste, state fees, and carbon, and recommends right-sized, recyclable swaps that also cut shipping costs. A printable insert tells customers how to dispose of each part, which reduces contamination at the bin. We measure success by pounds of hard-to-recycle packaging each seller switches to recyclable or reusable alternatives per year, calculated from their order volume and shown alongside the dollars they save.

If the disposal insert does not ship, delete its sentence.

---

## 7. The process from absolute start to absolute finish

Think of the website like a restaurant:

- **The dining room** is what visitors see: pages, buttons, colors (the "frontend").
- **The kitchen** does the work: scoring, box fitting, swaps (the "engine" or "logic").
- **The pantry** holds the ingredients: our data files about packaging, fees, and rules.
- **The phone call to a supplier** is the photo scan: our server calls an outside AI service, using a secret key that the public never sees.

The whole project goes through ten phases.

**Phase 1. Set up your computers (both, day 1, about 1 hour)**
Each person needs: a GitHub account, VS Code (the code editor), Node.js (the engine that runs the website on your laptop; install the "LTS" version from nodejs.org), Git (tracks changes; on a Mac, typing `git --version` in Terminal offers to install it), and an AI coding assistant inside or next to VS Code.

**Phase 2. Create the project (Partner, day 1 to 2)**
Partner runs the Next.js setup command, which builds an empty starter website with dozens of files automatically. Partner creates the folders in section 11, pushes everything to a new GitHub repository, and invites Tyler as a collaborator.

**Phase 3. Get the project on Tyler's laptop (Tyler, day 2)**
In Terminal: `git clone <repo link>`, then `cd` into the folder, `npm install` (downloads the building blocks), and `npm run dev` (starts the site). Open `localhost:3000` in a browser. Each person now has a private working copy.

**Phase 4. Agree on the "contract" (both, by November 19)**
Two things, written down before anyone builds:

1. **The data format:** exactly how one packaging item is written, so Tyler can collect data while Partner writes code that reads it. Draft below.
2. **Three hand-worked example products:** work out by hand what box each should get, what it costs to ship, and its scores. These become the answer key for testing.

Draft data format for one packaging item (numbers are placeholders):

```json
{
  "id": "poly-mailer-10x13",
  "name": "Poly mailer, 10 x 13 in",
  "type": "mailer",
  "material": "ldpe_film",
  "dimensions_in": { "length": 13, "width": 10, "height": 0 },
  "weight_g": 15,
  "price_usd": 0.12,
  "recycle_rate": 0.10,
  "source_url": "https://example.com/product-page",
  "is_estimate": true,
  "last_checked": "2026-11-20"
}
```

Agree on units once: inches for size, grams for weight, US dollars for price. Convert in code where needed.

**Phase 5. Build the pieces in parallel (both, November 20 to 30)**
Tyler fills the pantry (data) and writes the scoring recipe (spec), then builds the photo scan. Partner builds the kitchen (scoring engine, box fitting, swaps) using the three example products. Each person works on their own branch, so nobody breaks the other's work.

**Phase 6. Build the screens (both, overlapping with phase 5)**
Tyler sets the look (colors and fonts file, landing page, scan page). Partner builds the planner and results screens, because they plug directly into the engine.

**Phase 7. Connect everything (Partner leads, December 1 to 6)**
Merge both people's work, wire the screens to the engine and the data, and run the full flow on localhost: photo or planner in, results out. **Milestone December 6: the whole demo works end to end.** Then deploy to Vercel for the first time (about 10 minutes) to catch "works on my laptop only" problems early.

**Phase 8. Test and polish (both, December 7 to 11)**
Run the known-answer tests. Measure the photo scan's accuracy. Fix bugs. Clean up the design. Add stretch items only if the core is solid. Film the drop test.

**Phase 9. Make the submission materials (both, December 12 to 14)**
Record the 2 to 3 minute video following the outline. Write the description (what it does, how we built it, what's next), the theme paragraph, the README (the front page of the GitHub repo), and SOURCES.md.

**Phase 10. Submit (December 15)**
Make sure the repo is public. Upload the video to YouTube or Vimeo. Fill in the Devpost form: repo link, video link, description, theme paragraph, optional live link. December 16 to 20 is emergency buffer only.

---

## 8. Revised timeline

As of November 16 nothing is built yet, so the October dates no longer apply.

| Dates | Phase | Tyler | Partner |
| --- | --- | --- | --- |
| Nov 16 to 19 | Setup and contract | Install tools, clone repo, start research, co-write data format and 3 examples | Install tools, create project and repo, co-write data format and 3 examples |
| Nov 20 to 25 | Build pieces | Packaging library, fee and rules data, scoring spec, colors and fonts file | Scoring engine, right-sizing math, tests from the 3 examples |
| Nov 26 to 30 | Thanksgiving, lighter | Photo scan | Swap engine |
| Dec 1 to 6 | Connect and screens | Landing page, scan page, coverage check | Planner and results pages, merging everything |
| **Dec 6** | **Milestone** | **Whole demo works end to end on localhost; first Vercel deploy** | |
| Dec 7 to 11 | Test and polish | Scan accuracy test, drop test, design polish, stretch items | Bug fixes, tests passing, stretch items |
| Dec 12 to 14 | Submission materials | Video script and recording, writeup, theme paragraph | README, technical part of the writeup, final checks |
| **Dec 15** | **Submit on Devpost** | | |
| Dec 16 to 20 | Emergency buffer only | | |

**If the December 6 milestone slips:** cut stretch items and the robustness check, never the core. Check this timeline against Auburn finals week.

---

## 9. Who does what

### Tyler: data, math design, AI feature, and the look

1. **Gather the facts the app runs on:** ~50 packaging items (size, weight, material, price, source), state fee rates, and exemption rules. Research and spreadsheet work, not coding.
2. **Design the scoring system:** write the five-factor formula as simple math in `docs/scoring-spec.md`. Partner codes it; Tyler checks the outputs.
3. **Build the photo scan:** connect to the AI service and build the review screen. Very doable with AI coding tools.
4. **Prove the scan works:** 30 to 50 labeled package photos and an accuracy number.
5. **Build the "Am I covered?" check:** simple code; the hard part is getting the rules right.
6. **Set the look:** the colors and fonts file, the landing page, the scan page.
7. **Keep SOURCES.md:** every website a fact came from, with dates.
8. **Lead the video and writeup.**

### Partner: heavy logic and holding the app together

1. **Create the project** and GitHub repo, and invite Tyler. Everything depends on this, so it comes first.
2. **Box-fitting logic:** the smallest box a product fits in and the shipping savings. The hardest coding in the project.
3. **Code the scoring formula** from Tyler's spec.
4. **Swap suggestions:** compare options and rank the swaps.
5. **Planner and results pages**, since they plug straight into the engine.
6. **Connect all the pieces** and review Tyler's work before it joins the main version.
7. **Write tests** using the three hand-worked examples.
8. **Deploy to Vercel** and write the README.

### Both

- Agree on the data format on day one.
- Work out the three example products by hand together.
- Record the video and write the submission near the end.

### How much can be vibe-coded

| Part | Vibe-codable? | Why |
| --- | --- | --- |
| Packaging library | No code | Data entry into a JSON file |
| Planner screens, five-factor label | High | Forms and display; AI tools handle this well |
| Photo scan | High | One AI call plus a review screen |
| "Am I covered?" check | High for code, low for content | Simple if/then rules, but getting the law right is research |
| Disposal insert PDF | High | Standard PDF library |
| Scoring engine | Medium | AI can write it, but a human must design the formula and check outputs |
| Swap engine | Medium | Depends on scoring being right |
| Right-sizing and dimensional weight | Low | Packing math has subtle bugs that AI often gets wrong while looking right |
| Connecting everything | Low | Where vibe-coded projects usually break |

**Rules for vibe-coding safely:**

1. Write known-answer tests before AI writes any math. If the code disagrees with the hand-worked answer, the code is wrong.
2. Whoever builds a part should be able to explain it. Judges may ask.
3. Keep AI-written code in the folders you own, so it does not tangle with the other person's work.

---

## 10. How we work together

**The rule of thumb: localhost is private, GitHub is shared.**

- Each person runs their own copy of the site at `localhost:3000`. You cannot see the other person's localhost from your laptop.
- To share work: push your branch to GitHub. Partner merges it into the main version. Both run `git pull` to get everything.
- To show work in progress: share your screen on a call, or turn your laptop around.

**Branches:** every feature gets its own branch (for example `tyler/photo-scan`, `partner/rightsizing`). Nobody pushes straight to main. Partner reviews and merges.

**Daily habits:**

1. `git pull` before starting work.
2. Commit small pieces with clear messages ("Add 20 mailers to library").
3. Push at the end of every work session.
4. Stay in your own folders to avoid merge conflicts.

**Secret keys:** the photo scan needs an AI API key. It goes in a file called `.env.local`, which is never pushed to GitHub (a public repo would leak it). Each person keeps their own copy. Share the key privately by text or DM. The repo includes `.env.example`, which lists the key names with no real values.

**Deploying:** a live link is optional. Deploy to Vercel once at the December 6 milestone. After that, Vercel builds a preview link for every branch automatically, which is the easiest way to share progress.

---

## 11. The project skeleton, explained

### The big picture, in restaurant terms

| Folder | Restaurant role | What lives there | Owner |
| --- | --- | --- | --- |
| `data/` | Pantry | Facts only: packaging items, fee rates, state rules, box sizes, carbon factors, a sample order file | Tyler |
| `docs/` | Recipe book | The data format, the scoring formula in plain math, how the parts connect | Tyler and Partner |
| `src/lib/` | Kitchen | The engine: scoring, box fitting, swaps, coverage, reading the AI reply. No screens here | Partner (Tyler: coverage and scan parsing) |
| `src/app/` | Dining room layout | One folder per page: landing, planner, scan, results, plus the private server route that calls the AI | Both |
| `src/components/` | Plates and furniture | Reusable screen pieces: buttons, cards, the five-factor label, swap cards | Both |
| `src/styles/` | Decor | One file with every color, font, and spacing value | Tyler |
| `tests/` | Taste test | Checks that the math matches the hand-worked answers | Partner |
| `evaluation/` | Health inspection | Photos and correct answers that measure the scan's accuracy | Tyler |
| `public/` | Front window | Images anyone can load | Both |
| Root files | Building paperwork | Settings, the README (repo front page), SOURCES.md, the key template | Partner, with Tyler on SOURCES.md |

### Follow one click through the files

1. Maya opens the site. `src/app/page.tsx` shows the landing page.
2. She uploads a photo on the scan page (`src/app/scan/page.tsx`).
3. The page sends the photo to the private server route (`src/app/api/scan/route.ts`), which calls the AI service with the secret key.
4. The AI replies with a list of parts. `src/lib/scan/parseScan.ts` matches each part to an item in `data/library/components.json`.
5. `PartsReview` shows her the list so she can fix mistakes.
6. The results page (`src/app/results/page.tsx`) asks the kitchen for answers: `lib/scoring` grades each option, `lib/rightsizing` finds the smallest box and its shipping cost, `lib/swaps` ranks the better options, `lib/coverage` checks the state laws.
7. The results appear as `FiveFactorLabel`, `BoxFitDiagram`, `SwapCard`, and `CoverageCard`, all styled from `src/styles/tokens.css`.

### Files the setup tool creates that you can ignore

`node_modules/` (thousands of downloaded building blocks, never edit), `package-lock.json`, `next-env.d.ts`, and the `.next/` folder (built automatically when the site runs). The setup tool creates these; nobody needs to understand them.

### The full tree, as it appears in VS Code

```
PACKWISE
├── .github/
│   ├── workflows/
│   │   └── tests.yml                # runs the tests on every push
│   └── pull_request_template.md     # checklist before anyone merges
├── data/                            # every fact the app uses, no code
│   ├── fees/
│   │   ├── california.json          # labeled "proposed"
│   │   ├── colorado.json
│   │   └── oregon.json              # rates per material, with "last updated"
│   ├── library/
│   │   ├── box-sizes.json           # standard boxes for right-sizing
│   │   └── components.json          # ~50 mailers, boxes, fillers
│   ├── rules/
│   │   ├── carrier-dim-weight.json  # USPS and UPS size-pricing rules
│   │   └── state-coverage.json      # exemption tests per state
│   ├── samples/
│   │   └── shopify-orders.csv       # sample order file for the demo
│   ├── carbon-factors.json          # rough CO2 per material, marked estimates
│   └── disposal-guidance.json       # for the disposal insert (stretch)
├── docs/
│   ├── architecture.md              # how the pieces connect
│   ├── data-format.md               # the agreed shape of every JSON file
│   └── scoring-spec.md              # the five-factor formula in plain math
├── evaluation/                      # proof the photo scan works
│   ├── photos/                      # 30 to 50 package photos
│   ├── labels.json                  # correct parts for each photo
│   └── run-scan-eval.ts             # prints the accuracy number
├── public/
│   ├── demo/                        # photos used in the video
│   └── images/
├── src/
│   ├── app/                         # the pages
│   │   ├── api/
│   │   │   └── scan/
│   │   │       └── route.ts         # calls the AI on the server, key stays hidden
│   │   ├── planner/
│   │   │   └── page.tsx             # step-by-step questions
│   │   ├── results/
│   │   │   └── page.tsx             # labels, right-sizing, swaps, coverage
│   │   ├── scan/
│   │   │   └── page.tsx             # photo upload and correction
│   │   ├── fonts.ts
│   │   ├── globals.css
│   │   ├── layout.tsx               # header, footer, fonts on every page
│   │   └── page.tsx                 # landing page
│   ├── components/
│   │   ├── label/
│   │   │   └── FiveFactorLabel.tsx  # the nutrition-label scorecard
│   │   ├── layout/
│   │   │   ├── Footer.tsx           # sources and "data last updated"
│   │   │   └── Header.tsx
│   │   ├── planner/
│   │   │   ├── OptionsCompare.tsx
│   │   │   ├── ProductStep.tsx
│   │   │   └── ShippingStep.tsx
│   │   ├── results/
│   │   │   ├── BoxFitDiagram.tsx    # product in the box, before and after
│   │   │   ├── CoverageCard.tsx
│   │   │   ├── ImpactSummary.tsx
│   │   │   └── SwapCard.tsx
│   │   ├── scan/
│   │   │   ├── PartsReview.tsx
│   │   │   └── PhotoDrop.tsx
│   │   └── ui/                      # our own buttons, cards, inputs
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Field.tsx
│   │       ├── ScoreBar.tsx
│   │       └── Stepper.tsx
│   ├── lib/                         # the engine, no screens in here
│   │   ├── coverage/
│   │   │   ├── checkCoverage.ts     # exempt or covered, with the reason
│   │   │   └── estimateFees.ts
│   │   ├── orders/
│   │   │   └── parseShopifyCsv.ts
│   │   ├── rightsizing/
│   │   │   ├── dimWeight.ts         # shipping cost from box size
│   │   │   └── packItems.ts         # fits items into the smallest box
│   │   ├── scan/
│   │   │   └── parseScan.ts         # turns the AI reply into library parts
│   │   ├── scoring/
│   │   │   ├── fiveFactor.ts        # scoring-spec.md as code
│   │   │   └── weights.ts
│   │   ├── swaps/
│   │   │   └── rankSwaps.ts
│   │   ├── data.ts                  # loads the JSON files
│   │   └── types.ts                 # shared shapes: Component, Score, Swap
│   └── styles/
│       └── tokens.css               # every color, font, and spacing value
├── tests/                           # answers worked out by hand first
│   ├── fixtures/
│   │   └── sample-products.json     # the 3 hand-calculated products
│   ├── coverage.test.ts
│   ├── rightsizing.test.ts
│   └── scoring.test.ts
├── .env.example                     # names the keys needed, no real values
├── .gitignore                       # keeps .env.local and node_modules out
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md                        # the first thing judges see on GitHub
├── SOURCES.md                       # every data source with a link and date
└── tsconfig.json
```

**Words you will see:** Next.js is a toolkit for building websites. TypeScript is JavaScript with labels that catch mistakes early. Tailwind is a styling shortcut; ours reads all its colors from `tokens.css`. A `.tsx` file is a page or screen piece; a `.ts` file is pure logic; a `.json` file is data.

---

## 12. Design direction

**Goal:** a calm, earthy, professional site that looks designed, not generated.

### Palette (starting point)

| Role | Name | Hex |
| --- | --- | --- |
| Main color | Forest | `#1F3A2B` |
| Second green | Moss | `#4A6B3F` |
| Brown | Bark | `#5C4033` |
| Accent | Kraft | `#C8A97E` |
| Background | Paper | `#F4EFE6` |
| Text | Ink | `#1C1A17` |
| Warning | Ochre | `#B8862B` |
| Bad score | Brick | `#9C4A3A` |

The accent is the color of kraft paper, the material Packwise recommends.

**Fonts:** a warm serif for headings and a clean sans-serif for body text. This pairing does more than anything else to make the site look designed.

### What makes a site look vibe-coded (avoid)

- Neon colors, purple-to-blue gradients, glowing buttons.
- A default component library left in its default colors.
- Emoji used as icons.
- Generic hero lines like "Revolutionize your packaging with AI."
- Every element in a rounded card with a heavy shadow.

### What to do instead

- Every color, font, and spacing value comes from `tokens.css`, so every screen matches.
- Our own small set of buttons, cards, and inputs in `components/ui/`.
- Plenty of empty space, flat surfaces, thin borders.
- The five-factor label as the signature visual, designed like a real nutrition label.
- Real photos of packaging, not stock illustrations.

---

## 13. How the scoring works

**Why not a trained machine learning model:** there is no public dataset of packaging rated by experts to learn from, most factors are plain math from our data, and judges trust scores they can see the reasoning for. AI is used in the photo scan instead. Protection is the one factor that is a true prediction; it uses simple rules for now ("predict breakage from real damage data" is a good "what's next" line).

**Step 1: calculate a real number for each factor**

| Factor | Calculation | Unit |
| --- | --- | --- |
| Cost | Packaging price + shipping cost based on box size | dollars per order |
| Protection | Rules: product fragility + padding + box strength | Low, Medium, High |
| Waste | Weight × (1 − share that gets recycled) | grams likely sent to landfill |
| Fees | Weight in lbs × state rate × share of orders to that state | dollars per year |
| Carbon | Weight in kg × emission factor for the material | kg of CO2 |

**Step 2: convert each to a 0 to 10 score.** Compare the options for the same product; the best gets 10, the worst gets 0:

```
score = 10 × (worst − this option) / (worst − best)
```

Protection maps directly: Low = 2, Medium = 6, High = 9.

**Step 3: drop any option that loses on every factor** (a Pareto filter).

**Step 4: rank with the seller's priorities.** Overall score = sum of (weight × score). The app has default weights, and the seller can choose "cost matters most" or "waste matters most."

**Step 5 (stretch): robustness check.** Some inputs are uncertain (California fees are proposed, carbon factors are rough). Run the ranking a few hundred times with those inputs nudged within their likely ranges, and report how often each option wins: "ranked first in 91% of runs." This is a Monte Carlo simulation, about 50 lines of code.

**Worked example** (made-up numbers to show the method):

| Option | Cost per order | Protection | Weight | Share recycled | Landfilled grams |
| --- | --- | --- | --- | --- | --- |
| A: poly mailer + plastic fill | $8.20 | Low | 30 g | 10% | 30 × 0.90 = 27 |
| B: paper mailer + paper fill | $8.40 | Medium | 75 g | 80% | 75 × 0.20 = 15 |
| C: right-sized box + paper fill | $8.60 | High | 95 g | 90% | 95 × 0.10 = 9.5 |

- Waste scores (worst 27, best 9.5, range 17.5): A = 0, B = 10 × 12 / 17.5 = 6.9, C = 10.
- Cost scores (best $8.20, worst $8.60, range $0.40): A = 10, B = 10 × 0.20 / 0.40 = 5, C = 0.
- Protection scores: A = 2, B = 6, C = 9.
- Default weights (cost 40%, protection 30%, waste 30%): A = 4.6, B = 5.9, C = 5.7. B wins narrowly.
- "Waste matters most" (cost 20%, protection 30%, waste 50%): A = 2.6, B = 6.3, C = 7.7. C wins.

Paper weighs more but wins on waste because most of it is recycled, which is why waste is measured in grams likely landfilled, not total weight. This example becomes one of the test cases.

---

## 14. Research so far: state laws and fees

The research has not started in earnest. These are first findings from November 16, to be verified.

### Small-producer exemptions (all seven EPR states)

| State | Revenue test | Weight test | How they combine | Notes |
| --- | --- | --- | --- | --- |
| Oregon | Under $5M global gross revenue | Under 1 metric ton into Oregon | Either one exempts | Revenues of associated companies are added together |
| Colorado | Under $5,779,297 global gross revenue | Under 1 ton into Colorado | Either one exempts | Conflicts with an earlier source (see open questions) |
| California | Under $1M gross sales in California | None | Single test | Must apply for the exemption |
| Maine | Under $2M (temporarily $5M) | Under 1 ton | Any one of three tests | No stewardship organization contracted yet |
| Minnesota | Under $2M global gross revenue | Under 1 ton | Either one exempts | |
| Maryland | Under $2M global revenue | Under 1 ton | Either one exempts | |
| Washington | Under $5M global gross revenue | Under 1 ton | Any one of three tests | |

Source: EPR Atlas, citing each state's statute. Secondary, so check each against the statute or agency page.

**What this means for the demo:** in Oregon, a seller is exempt if they pass either test. Maya at $8M must also ship at least 1 metric ton (about 2,205 lbs) of packaging into Oregon per year to be covered. Check that against the sample order file.

### Fee rates (dollars per pound)

The official schedules are posted in the Circular Action Alliance Producer Portal, which requires a login. The rates below come from Strategic Packaging Insights, which says it did not check them against the original PDFs. Treat them as secondary until confirmed.

| Material | Oregon 2026 | Oregon 2027 (final) | Colorado 2026 | Colorado 2027 (base) |
| --- | --- | --- | --- | --- |
| Corrugated cardboard | 0.08 | 0.02 | 0.08 | 0.10 |
| Polycoated paperboard | 0.48 | 0.34 | 0.20 | 0.25 |
| Glass bottles and jars | 0.10 | 0.00 | 0.04 | 0.05 |
| HDPE/LDPE flexible film (poly mailers) | 0.43 | 0.12 | 0.48 | 0.62 |
| PP flexible film | 1.02 | 0.56 | 0.64 | 0.69 |
| Plastic laminates, other flexible | 1.02 | 0.56 | 0.74 | 0.78 |
| PS foam (packing peanuts and similar) | 1.38 | 0.74 | 1.72 | 2.09 |
| Aluminum containers | 0.06 | -0.09 | 0.02 | 0.05 |
| Steel containers | 0.10 | 0.04 | 0.07 | 0.11 |

- The 2027 schedules were published October 1, 2026. Oregon's 2027 "final" rates are after reserve drawdowns; the base rates before them were higher (for example, corrugated 0.07 and film 0.29).
- **The key gap holds:** plastic film costs about 5 to 6 times more per pound than corrugated in every column. That supports the swap story.
- Kraft paper is not in this table. A paper mailer's category needs confirming.
- California has only estimated ranges so far.
- Minnesota, Maryland, Washington, and Maine: no fee rates found yet. Status and deadlines only.
- The October plan quoted 2025 draft Oregon rates (kraft 3 cents, LDPE film 54 to 72 cents per pound). Those are now outdated. Use 2026 and 2027 rates.

### Research plan (agreed, not started)

1. State laws, exemptions, and fees for all seven states, with sources and dates.
2. The ~50-item library: about 30 items for the candle and glass-jar demo, plus about 20 general items. Missing weights and prices get estimated and flagged for weighing on a kitchen scale.
3. USPS and UPS dimensional-weight rules and standard box sizes.
4. Output as a spreadsheet plus matching JSON files for the `data/` folder, and SOURCES.md.

---

## 15. Open questions

- [ ] Confirm the fee rates from the official schedules (Producer Portal login, Oregon DEQ, or Colorado CDPHE pages).
- [ ] Which fee category a paper mailer and kraft paper fill fall into.
- [ ] Whether a candle's glass jar and lid count as covered packaging.
- [ ] Colorado's threshold: EPR Atlas says under about $5.78M or under 1 ton exempts; an earlier EcoEnclose page said a full exemption only under $500,000, with low-volume registration under about $5.5M.
- [ ] Deadlines and status for Minnesota, Maryland, Washington, and Maine.
- [ ] The prize breakdown now that cash is listed at $7,800, especially whether 2nd place Theme is still only $50.
- [ ] Confirm AI coding tools are allowed (ask in the event Discord).
- [ ] Confirm the judging weights on the rules page.
- [ ] Check the timeline against Auburn finals week.
- [ ] Which AI service to use for the photo scan, and who pays (likely a few dollars for testing).
- [ ] Repo name and team name on Devpost.

---

## 16. Sources

- Arbiter Hacks V1, official Devpost page: https://arbiter-hacks-v1.devpost.com/ (rules pasted November 16; judging weights and prizes read October 21)
- Arbiter Hacks V1 listing, Startup Grants India: https://www.startupgrantsindia.com/arbiter-hacks-v1
- Circular Action Alliance, Producer Resource Center (schedule names and dates; schedules behind login): https://circularactionalliance.org/producer-resource-center
- Strategic Packaging Insights, Oregon and Colorado fee schedules line by line (secondary): https://www.strategicpackaginginsights.com/insights/oregon-colorado-epr-fee-schedules-line-by-line/
- EPR Atlas, small-producer thresholds by state (secondary, cites statutes): https://epratlas.com/epr-de-minimis/
- EcoEnclose, EPR packaging FAQ: https://ecoenclose.com/blog/epr-faq
- Circular Action Alliance draft 2025 Oregon estimates (outdated, superseded by the 2026 and 2027 schedules): https://schwabe.com/wp-content/uploads/2025/04/Circular-Action-Alliance-pg-196-203.pdf
