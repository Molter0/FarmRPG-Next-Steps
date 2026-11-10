# Overnight plan (2026-10-21)

Everything stays local (commits only); nothing is pushed until the player says "push". Tests run after each piece.
Questions and problems found along the way go in docs/questions-for-morning.md.

## 1. Read everything a paste carries
A copy holds the page opened before it first (Town list, farm list, Pig Pen, Temple), then the page on screen.
- parse.js: `carriedPages(text, kind)` lists the other pages a copy carries, in the order they appear (Town by
  "Market District", farm by "Around Your Farm", Pig Pen by its "Pigs (n / m)" line, Temple by "Sacrifice: "), never
  the pasted page itself. Testable on its own.
- index.html: move each branch's reading into a small reader per page (town, farm, pigpen, temple) that saves to S and
  returns its message. Before the pasted page's own branch, run the readers for the carried pages and drop their messages;
  the pasted page then runs last, so it has the last word.
- Remove the "Read the Town list too" note from the farm branch, and the special Town/farm reads in the bank and
  inventory branches (the general step covers them).
- Safe already: pigs sent off count once a day, so a carried farm list read again doesn't sell pigs twice.
- Page tests: each saved copy also lists what it carries (Bank carries Town, Town from Pig Pen carries Pig Pen, and so on).

## 2. Quests tab: pick a quest
- A small select above the quest list: "Planner's pick" first, then each quest from the last Quests paste (by name).
- Picking one puts that quest's next step in the step card at the top (the same card the planner fills now: its
  next step, ✓ Done, what it still needs). Saved in U (per device) and cleared when a new Quests paste no longer has it.

## 3. Quests tab: fold entries
- Clicking a quest's title folds the entry to its title line (and buttons); clicking again opens it.
- Folded quests are remembered by quest (in U), so a repaste or re-render keeps them folded.
- Works in both the condensed and the expanded views; titles get a small ▸/▾ and are keyboard-reachable.

## 4. Tower table: how far, and hide AK-only levels
- engine.towerPlan already takes a level count; the table asks it for 10 / 30 / 50 / 100 / all (all = to the end of
  the table, level 350). The "Do these next" list keeps using 30.
- A small select in the Tower section's header line, and a checkbox "Hide levels that need only AK". Totals (AK and
  silver still needed) still count every level, hidden or not; hidden runs show as one line ("221–226: only AK").
- Saved in U.

## 5. Roadmap items
- Shared Truffle prices: needs a Cloudflare account (the player's). Can be written and tested locally (Worker code +
  the site's fetch with a fallback), not deployed. Only if wanted.
- Friendship "gifts to the next level": the reader exists; waits on a Friendship Levels paste to see what the page shows.
- Parked items stay parked.
- Ideas (each needs a yes first): "if you maxed this building" on building-limited goals; count crafted quest items in
  Spend my…; plan-by-place view; mining costs; Compass via Magna Core as a crafting loop.

## Order
1, then 4 (small), 3, 2, then any roadmap items chosen. Each ends with tests, a browser check, a commit and a line in
the questions file if anything came up.

## Player's answers (2026-10-21, before starting)
- Quest pick: an extra card above the list (the planner's pick card stays).
- Folding: entries start open; any quest folded stays folded until opened.
- Tower: 30 levels and AK-only levels shown by default.
- Extras tonight: "if you maxed this building", and crafted quest items in Spend my…. Not tonight: shared Truffle
  prices, plan-by-place view (mining costs and the Compass loop stay ideas).

## Done (local commits, not pushed)
1. Read everything a paste carries: `carriedPages` (parse.js) + one `read(kind)` per page in index.html; carried pages
   read first with no message; the old special cases (farm note, bank/inventory/orchard extras) removed. Page tests
   check what each copy carries and that each carried list reads something.
2. Quests "Show one" picker (header line): its own step card above the list; per device (U.questPick).
3. Quest titles fold entries (click or Enter/Space; U.questFolded).
4. Tower table: 10/30/50/100/all and "Hide levels that need only AK" (folds runs; U.towerRange, U.towerHideAk).
5. Spend my…: crafted quest items count by their gathered parts.
- Not done: "if you maxed this building" (question in questions-for-morning.md).
