# Silver goal: plan (2026-10-05, overnight; player to review)

Goal: "I'm saving up N silver" (default: the next Tower level's cost), then the best ways to get there for this player:
crafting and selling (from daily production, and from Large Nets / Arnold Palmers / Apple Ciders), and fishing with Large
Nets at the best place they have unlocked. Each way says silver a day (or per unit) and how many days to the goal.

## What exists
- `sellPrice(item, p)` = base x (1 + sell perks) x mastery bonus; `PRICES.sell` has 15 hand-kept base prices.
- "Making silver" card (Next steps, only before Fun Guy): best craft at your Crafting level + best fishing spot per net.
- `DROPS.locs[loc].silver.net / netR` (buddy.farm silver per fish with nets); `W.places` (places you can use).
- buddy.farm has no sell prices, so more prices must come from the player.

## Batches
1. **Market page paste -> base prices.** The Farmer's Market lists each unlocked item's whole-stack value at base price;
   base = value / count (count from the Inventory paste; "MAX ON HAND" = the cap). `parseMarket` + detection; saved as
   `S.prices` (hand-kept PRICES win). Tests with made-up numbers.
2. **Engine `silverWays(ctx)`:** for every sellable item you can craft (Crafting level), silver a day from production alone
   (`makesPerDay` x price) and silver per Large Net / Arnold Palmer / Apple Cider when it needs hand-gathered parts; fishing
   per Large Net at each unlocked fishing place, best first. Tests with a stub coster.
3. **Silver goal card** (Best use tab): goal field (blank = next Tower level), your silver, the top ways with silver a day and
   days to the goal, and what each uses up (production that could go to masteries). Condensed / Expanded.
4. **Docs + questions.**

## Progress
- Batches 1-3 done (2026-10-05). Market page -> base prices; silverWays; Silver goal card on Best use.

