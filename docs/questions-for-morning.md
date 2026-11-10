# Open questions for the player (updated 2026-10-22)

Answered questions are removed; their answers live in knowledge/.

## Questions
None open.

## Waiting on data

### Animal building prices
Chicken Coop, Pasture and other animal buildings have no prices in the planner (the Raptor Pen has none to buy). The
player will paste the Pig Pen after the next slaughter (pig prices, an example with pricing) plus the Coop and Pasture
pages, so we can work out what a priced page looks like. Then Slow grinds' Maxed line can price them.

### Page copies for the local page tests
Paste each page twice, once from the browser and once from the Steam app (say which). Saved copies live in
test/pages/ (local only; usernames, farm name and farm id replaced) and are checked by test/pages.test.js.

Done: Pig Pen, Bank, Temple of Reward, Town (opened from another page), My Farm with all buildings done, My Inventory, Orchard, All Pet Items, Steak Market, mastery page, My Farm with buildings still to do, Town with places still to do, Farm Supply upgrades (browser + Steam each).

Still to paste:
- [ ] My Inventory: a filtered copy from Steam, and a plain copy (no links)
- [ ] A building page (Storehouse, Farmhouse, Sawmill…)
- [ ] Exploring info (the "stamina every time you continue exploring" page)
- [ ] Perks page (Farm Supply in Town, the perks list)
- [ ] Friendship / Townsfolk levels, and your profile page
- [ ] Quests / Help Needed
- [ ] One Personal Help Request page
- [ ] Home (tower, Ancient Knowledge, skills)

### Shelved
- Base sell prices for locked items: the Farmer's Market shows values only for unlocked items, so the 455 locked ones
  without a price in prices.js stay unpriced. Selling is a last resort; the important prices are stored. Players are no
  longer asked to paste the Market (a pasted one is still read).

### Page tests (local only, gitignored)
test/pages/*.txt are the player's real copies with usernames, farm name and farm id swapped by test/pages/scrub.js;
test/pages.test.js checks detection and key values for each and runs with the other tests. Extracting a paste from the
session log (C:/Users/prlyg/.claude/projects/D--Claude/<session>.jsonl) and scrubbing it: node test/pages/extract.js <session .jsonl> "<marker>|<marker2>" raw.txt (extract-all.js saves every pasted block of one message), then
node test/pages/scrub.js raw.txt test/pages/<page>.<browser|steam>[.variant].txt <farm name> [pig name].
