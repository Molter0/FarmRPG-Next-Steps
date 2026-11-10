# Slow grinds: plan (draft, 2026-10-05)

Written by a read-only planning agent; not yet reviewed with the player. Open questions at the end.

## 1. The view
- **New tab "Slow grinds"** (`data-go="grinds"`); Best use already has four cards. Daily overflow's "Set and forget" fold (STANDING)
  moves here; Daily overflow keeps a one-line link.
- **Candidates** (one target each: next GM/MM, or Tower tier if lower and needed): Tower needs above the player's level
  (`towerUses`, walls from `towerPlan().walls`), the STANDING chain ends (Large Net, Orange Juice, Lemonade, Apple Cider), and
  `akPlan().slow`. Kept only if > "Too slow after" (`S.perks.slowDays`, default 7) at current production. Pre-Tower: no tags.
- **Sort:** longest first; toggle Longest | Most saved (only with a what-if set). 12 rows then Show more; untimeable items as one
  muted line.
- **Condensed row:** `Orange Juice MM · ~2.1 years` + progress bar + `Limited by: Orange (Orchard)` + Tower tag; with a what-if
  `→ ~1.6 years (−6 mo)`. **Expanded** adds how the daily amount is made, co-ingredients, cap voiding, Tower level blocked.
- Wording: "~", days < 60 → months → years (`yearsText` helper).

## 2. Time to GM/MM (new pure function in engine.js)
- `grindTime(item, left, ctx)` → `{ days, perDay, bottleneck, parts }` from `makeCoster(...).effort(item, left)`: passive inputs
  ÷ per-day rate, AP ÷ AP/day, LN ÷ nets/day; days = max (run in parallel), bottleneck = the max. No `adjust`/`activeEffort`.
- Buildings: `usableRate` (cap per drop), Antlers `noonDay`; orchard `fruitPerDay`; crops `cropInfo().perHour × 24`; crafted:
  slowest farm-made ingredient via the recipe tree; fish/explore: two new optional General settings ("Large Nets I use a day",
  default = own net output; "AP I spend a day", blank → show AP only). Never prompted.
- Prerequisite refactor: `dailyRates(env)` in engine.js (move noonDay/usableRate/fruitPerDay), index.html wrappers delegate.

## 3. What-ifs
- "What if" card, `S.whatIf`, Reset. 1) inventory cap, 2) trees per fruit (scale by (trees+N)/trees from the orchard paste),
  3) building output per drop (typed). Later: plots, Grape Juice. Each row runs twice, shows days saved, sortable.

## 4. Data gaps
- Building upgrade tables (output per level, max) not in repo → typed output for now; later knowledge/mechanics/buildings.md +
  buildings.js for a "Max" preset. Cap growth per day unknown → typed. Large Net MM chain math stays as in STANDING.

## 5. Batches (tests in test/engine.test.js, made-up numbers)
1. `dailyRates(env)` + wrappers + tests (cap per drop, 10-min drops, noon bonus, trees).
2. `grindTime` + `grindList` + tests (Chum bottleneck, AP/LN days, threshold, pre-Tower).
3. The tab (Condensed/Expanded, progress bar, two settings, STANDING moved; savecode packs new settings; README, rules.md).
4. What-if card (`S.whatIf`, two-scenario runs, Most saved sort) + tests.
5. (When data exists) buildings.md + buildings.js, Max preset, "or ~N days if maxed" in Daily overflow.

## 6. Player's answers (2026-10-05)
1. **Upgrades:** buildings have no levels; production is bought in chosen amounts with a rising price (curve unknown; the
   player may sample it). What-ifs take a **target amount** per building. Orchard has a hard tree limit. See
   knowledge/mechanics/building-upgrades.md.
2. **Large Nets a day:** default = nets made per day, plus an optional "AP spent in the forest on antlers" to add more.
3. **Scope:** items that take **longer than ~6 months** at current production, plus an always-on list until MM'd:
   **Orange Juice, Lemonade, Large Net, White Parchment, Beet** (parchment surprises people; beets can be hard). Daily/weekly
   grinds driven by passive production: show how it can be increased, time now, time with more production.
4. **Inventory cap:** grows a fixed amount per day (starts ~+2), raised by perks and bought in +2 steps (player: +18 → +20 for
   10T). So the cap can be projected ("your cap in 90 days") and the daily growth is a what-if.
5. **New tab: yes**, with "Set and forget" moving into it.

Updated batches: as section 5, with the threshold set to ~180 days (setting), the always-on list, a cap-growth field
(+N a day) and target-amount what-ifs per building.

## Progress
- Batch 1 done (2026-10-05): `productionMath(env)` in engine.js (usableRate, noonDay, fruitPerDay, perDay) with tests;
  index.html wrappers delegate. Storehouse page gives cap growth (`S.perks.capPerDay`). Cap upgrades: each +2 costs 10x the last.
- Batch 2 done (2026-10-05): `grindTime`, `grindList`, `makesPerDay` in engine.js with tests. Rows assume each item gets the
  whole LN/AP budget. Items needing an unset budget (AP) can't be timed and are left out unless pinned; batch 3 should show
  them as a muted count. Large Nets a day default = `makesPerDay("Large Net")`.
- Batch 3 done (2026-10-05): the tab (Condensed/Expanded rows, progress bar, Limited by, Tower tag), "Your numbers" (threshold,
  Large Nets / Arnold Palmers / Apple Ciders a day, extra Antlers), Set and forget moved here, no-production items counted.
  Next: batch 4, the What if card (cap, cap growth, trees, building output targets) and days saved.
- Batch 4 done (2026-10-05): What if card (`S.whatIf`: cap, days, capPerDay, prod targets per hour, fruit at midnight),
  second run per row, Longest | Most saved sort. Fruit is a target amount, not trees (the farm page has no tree counts).
- Batch 5 (Max preset per building, upgrade costs) waits on price data: see questions-for-morning.md.
