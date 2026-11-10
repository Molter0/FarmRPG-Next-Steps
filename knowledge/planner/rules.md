---
type: Reference
title: "Planner design rules"
description: "How the planner ranks, costs and words things, as agreed with the player."
tags: [planner]
sources:
  - id: player
    resource: confirmed by the player in planning chats
    title: "Player confirmation"
  - id: readme
    resource: ../../README.md
    title: "farmrpg-planner README"
generated: { by: claude-code/opus-5.5, at: 2026-09-30T12:00:00Z }
---

# Rules

- Metric: finishing things (tower levels, GMs, MMs, quests). Works for any player; nothing player-specific is hardcoded.[^player]
- Effort in AP (see [effort units](/mechanics/effort-units.md)) plus time waiting on [daily production](/mechanics/production.md); waiting leads the wording.[^player]
- Daily production covers at most 7 days of a job; the rest is gathered or crafted.[^player]
- Masteries and quests weighted equally; quickest done first; main quests always shown.[^player]
- No plan relies on voiding; leftovers past the cap: say how soon the cap fills, use or sell as you go.[^player]
- Never recommend cookies or paid wishing well tosses; wishing well shows today only.[^player]
- Never say "keep it for its mastery" ([mastery](/mechanics/mastery.md) is counted on gain).[^player]
- "Do these next" blends by effort in minutes of play: AP ÷ your AP-per-minute (default 100) + waiting hours × "an hour of waiting = N minutes" (default 20, since you can do other things while waiting). A "By type" view groups them instead.[^player]
- Players without the Tower see no Tower talk; masteries show their silver/gold/perk-point rewards instead of AK; a Leveling up card helps toward 4x90/4x99 (see [levels and XP](/mechanics/levels-and-xp.md), [progression](/mechanics/progression.md)).[^player]
- New visitors start with no paid perks; only items with a known production rate count as daily production.[^player]
- Places that need only an Exploring level (Small Cave to Mount Banon) are open at that level; the others need their skill
  level as well as item evidence (see [locked places](/mechanics/locked-places.md)).
- A place shown open by any paste stays open (places don't lock again); a short or filtered paste can't close it. Your own
  ticks still win. When something can't be costed, say which places look closed.[^player]
- Pastes: chat is stripped before anything is read; headings match in any case (the Steam app copies in capitals); the Steam Orchard page also carries the farm list, and both are read.[^player]
- A page pasted into the site arrives as **plain text**: no links and no "* " bullets (a paste into a chat keeps them). Readers
  must find names by position (the line above "You have N", above "− +", after "Silver"), never by bullets or links;
  test every reader with a bullet-free, link-free copy. Links (quest ids) are a bonus when present.[^player]
- Veggie Juice on crops is a setting (none / as much as helps / N each / down to X min), 10% per juice or 20% after "A Better Juice" ([Veggie Juice](/mechanics/veggie-juice.md)).[^player]
- Veggie Juice has a goal box (blank: what full Tomatoes and Watermelons make). It can't ask for more than you can still
  hold (cap minus Veggie Juice on hand): it says so and plans for that. Each ingredient is filled to what the goal takes,
  never past the cap.[^player]
- Kitchen is a pantry list (quest needs, then lowest stock); cook time = perks + your usual stirs, never perfect ([cooking](/mechanics/cooking.md)).[^player]
- Keep on-screen text short and formal; no superlatives ("the most useful…").[^player]
- **Monotask** (a Detail setting): one thing per section, an action before any waiting. Do this next = the top action;
  Tower = the next named GM/MM not yet done; AK = the quickest mastery; Spend my = the best place for nets and for drinks;
  Slow grinds = nearest Tower level, shortest, longest (no repeats); Veggie Juice = one step (waiting on Twine etc. only once
  every crop is full); Quests = ready to turn in, else a special ending within 7 days, else the fewest AP; Silver goal = one
  fishing place and one craft, each with the total nets or items sold the goal takes. "more" opens only that one item.[^player]
- Monotask items are concrete steps ("Fish ~50 LN at Vast Ocean for 259 Aquamarine"): gather, grow, craft, wait, then finish
  or turn in. ✓ Done adds what the step brings to your counts until the next paste (undo under the tabs); Do this next skips
  to the next target while the top one only waits. Masteries and quests have Skip (hides them; show again from the AK table
  or the Quests tab).[^player]
- Quests tab: "Show one" picks any quest from the last Help Needed paste and gives it its own step card above the list (the
  planner's pick stays). Clicking a quest's title folds it to its title line; folds are remembered per quest on the
  device.[^player]
- Tower table: shows the next 30 levels by default (10 / 30 / 50 / 100 / all to choose); "Hide levels that need only AK"
  folds each run of them into one line ("228–234: only AK") so the AK and silver totals still add up.[^player]
- Slow grinds, "Maxed" line (grinds held back by a building): how much of each building part a day can really use, from a
  simulated day: awake 16 hours (the same for everyone) with Setup's checks spread evenly over them; drops past the cap
  void; after every drop the Craftworks runs its list in order (the pasted list, plus the crafts the grind needs if they're
  missing); at each check the player uses or sells the grind's item and tops every other ingredient back up to the cap,
  and between checks every building drop adds more (the grind's own parts and the other ingredients alike). Without a recipe using it, a check uses what's on hand. The line gives
  the upgrades to that amount, their silver (priced buildings; others "price not known") and the time now vs maxed, and
  ends "(assumes N crafted a day)": click to type your own number, clear it to go back. A number above the planner's
  says how often you'd have to check instead ("needs a check every ~2 h 17 min, not every 4 h"). Iron, and Nails with
  Iron Depot, are always on hand. No line for a building's own item (production past the cap still counts for it). Grapes keep their own
  line; Orchard fruit and Antlers top out by their noon bonus. Never recommends buying Craftworks slots.[^player]
- Pet levels: Setup › Your settings › "Pet levels…" lists every pet in the game's order with the level from your pastes
  (Pet Shop for names and levels, All Pet Items for which pets you have when the list isn't complete). Type to fix one,
  0 = you don't have it, clear to go back to the pastes (S.petLevels).[^player]
- Pet items count as daily production (from the pet levels; seasonal pets left out): added to a building's own output
  (Feathers) or as production when nothing else makes them. Items you also gather (the Seal's Frost Snapper Shell) stay
  gathered, and Slow grinds add the pets' share on top: days = need / (daily gathering + pets' items a day).[^player]
- Spend my… quests: what to gather or craft, and for which quest. A crafted item counts by how many the trip's parts make
  ("craft 500 Mushroom Paste"; "with farm parts" when it also needs production). Only what fits under your cap counts: an
  item at the cap is never suggested, nor a later step while the earlier steps already need a full inventory of it.[^player]
- Layout: Grid = tiles side by side on wide screens (default), List = one column; it applies to Next steps in every Detail
  setting and to Monotask items on every tab.[^player]
- "I do personal requests every day" (General settings): personal requests count as ending today, so they go first in Do
  these next and the quest picks. A 7-day window marks a special as ending soon. Kitchen never uses meal prices (meals aren't
  sold).[^player]
- Steak Market in Monotask: hold / sell (buy for Steaks and Kabobs) only. Every view shows a good-bad bar of today's price
  against the lines: red to green for Truffles; blue (buy) to green (sell) for Steaks and Kabobs.[^player]
- Iron is always counted as bought (50 silver each, never a limit); Nails too with Iron Depot. Exploring is measured in AP
  everywhere (Apple Ciders only where you pick them: trips, "spend my Apple Ciders"); Arnold Palmers and Apple Ciders a day
  both count toward the AP a day for timing grinds. Drinks and nets can be bought, so they're never named as the limit:
  a grind limited by gathering names the item (Salt: "Salt Rock, ~2.4M AP at Whispering Creek"), never a bought or quick part.[^player]
- Pig days: a Pig Pen paste gives every pig's level (each taken at the start of its level, so reminders are never early);
  every reset adds the daily pig XP (fed every day). The pen is the lowest pigs up to the slaughter batch (default 16);
  pig day is when they reach the slaughter level (default 6; 5 is close behind). A line above the tabs and the Checklist
  say "slaughter N pigs (Bacon)"; the next day "Rebuy N pigs". Ticking the Slaughterhouse item, or a farm page showing
  "N Sent Off", records it (those pigs restart at level 1); a new Pig Pen paste quietly replaces the model.[^player]
- Never slaughter more pigs than your Bacon space holds (cap minus Bacon on hand; it lands at reset): plans stop there
  and say to use some Bacon first for the rest; with under one pig's Bacon of room, the advice is to use Bacon first and
  the Checklist's Slaughterhouse item is hidden.[^player]
- Bacon comes from pigs, not Mount Banon (unless "Most animals I'll slaughter at one time" is 0): slaughter pigs at
  level 5 in batches of that size, rebuy them and wait for them to grow back (the same pen each round, so high-level
  pigs keep finding Truffles). Level 6 is shown too when it takes fewer rounds. Pig XP: 1,000 a feed, +350 Animal Lover
  (a perk tick, or read from a Perks copy that reaches Miscellaneous Perks), +500 from Tower 40. See mechanics/pigs.md.[^player]
- A personal request copied as plain text is named from the Personal Requests list ("Items Wanted"), never from a quest
  by the same townsfolk higher up the sidebar; it shows as "Thomas's personal request". For any request (personal,
  special or active, any townsfolk), a name that belongs to a known quest with different items is dropped ("Rosalie's
  special request"); pastes with links are matched by quest id and never guessed.[^player]
- A Help Needed paste replaces every quest, personal requests included (3-4 at most). A pasted request it no longer
  lists was turned in and goes; as plain text, personal requests are kept per townsfolk only up to the number listed
  (newest first). A listed personal request whose page wasn't pasted shows last: "paste this request's page".
  Each listed quest keeps one pasted request at most: by id, else the same name, else a nameless one from that
  townsfolk. Personal requests can have real titles ("Special Gift"); those are shown as is. On load, requests older
  than the last Help Needed paste are checked the same way.[^player]
- Quest crafts list the ingredients you'll have to craft first (stock won't cover them), deepest first: "Craft first ~690
  Twine", then "Craft 1,000 Horn Powder". An item that's both an ingredient and wanted itself is one craft of the total.
  The same order is used for Monotask steps.[^player]
- All Pet Items paste: items several pets bring are summed. It refreshes those inventory counts; a count above the known
  cap means the cap grew, so the cap is raised to it. "Before you collect" (Best use) lists what would go over the cap,
  biggest loss first, with an outlet your stock covers right now (you craft before collecting); else gift or sell, saying
  what a craft would still need. "I've collected them" clears it. Between a craft and gift/sell: a Temple chain that
  still takes the item (from a pasted Temple page; see mechanics/temple.md).[^player]
- A "Crunchy Omelette (+50% collected)" box on Before you collect counts every pet item at 1.5x (rounded down).[^player]
- Before collecting you can only make room with what you hold: no suggestion (craft, Temple, gift, sell) uses more than
  your stock of the item. Lines are short: just the action ("Cabbage: gift all to frank or Baba Gec"), "all" when it
  takes your whole stock; no "N over" or "N will still void".[^player]
- Broccoli on Before you collect: "put all in the Feed Mill" first (the queue has no limit, so nothing is lost).[^player]
- Orange Juice on Before you collect: always "drink all" (free stamina), never gift or sell it.[^player]
- Bags and chests (anything the Locksmith opens) on Before you collect: "open at the Locksmith", never sell; a chest only
  as many as you have keys for.[^player]
- Checklist tab: the Library's Reset Checklist as daily, daily extras and monthly lists. Ticks clear at reset (game day)
  and on the 1st; items can be hidden. Nothing that costs real money (no beta special, starter pack or extra chore sets).
  The Steak Market card lives on this tab. "Bank your silver" ticks itself once the bank holds cap / rate (from a Bank
  paste); otherwise it says how much more to deposit, or the default 800M for 8M a day.[^player]
- Checklist from today's pastes: Help Needed gives the Community Center goals (daily item and reward, monthly too);
  the Town page marks places not done with "READY!" or "N Left" (no mark = done: Wheel of Borgen, Treasure Hut, Lost &
  Found, House of Cards, Wishing Well, the Vault; Daily Chores from the sidebar or Home: "N Left" or "Not Started" = not done,
  "Done!" = done); the farm page shows "today" (a
  calendar mark) on buildings not done. Done ones tick themselves; open ones say what's left. Only same-day pastes count.[^player]
- Reference tab: the knowledge notes for players (all mechanics notes, and the data notes meant for reading), built
  into reference.js by tools/build-reference.js (run by bump-version before each push). Entries start folded; search
  covers every entry's text and marks matches; a heading ending "(spoiler)" folds its section behind a second fold.[^player]
- Notes players read (mechanics, and data notes in Reference) say what's true now: no "X is not one" corrections of
  earlier mistakes, no built or dropped proposals, no "not modelled yet" app status. Ideas go in docs/.[^player]
- Setup's page list: frequent pages always show (Mastery, Inventory, Help Needed, requests, silver, Steak Market);
  infrequent ones (farm, Orchard, perks, Farm Supply, friendship, Pig Pen, Temple, Bank) sit in a fold that opens only
  when one is missing or over a month old (a never-pasted Pig Pen doesn't count: not everyone keeps pigs).[^player]
- Trips is a card on Best use (it answers the same question as "Spend my…"), not a tab of its own.[^player]
- Never recommend buying from the Flea Market: trade chat is always much cheaper (a Protein Bar trades at about 10 Gold).[^player]
- Exploring drinks in Expanded: no place dropdown; a grid of every open place (EE, then items per gold for each drink,
  the best per place marked). Sprint Shoes I-III are read from a Farm Supply paste (highest tier unlocked).[^player]
- Cheap EE upgrades (Exploring drinks, from each pasted EE page): suggest one when it costs little next to what you have:
  a silver fee of 1% of your silver or less; an item fee (e.g. Corn) or Protein Bar gold of 10% of what you have or less.
  The first 3 Protein Bars per place need no gold beyond the bar (~10 Gold in trade). Each upgrade adds 2^Sprint Shoes EE.[^player]
- Exploring drinks (Best use): items per gold for Arnold Palmers, Apple Ciders plus the Orange Juice they use, and Orange
  Juice by hand, at one place. Prices are typed (gold per 1,000; the trade snapshot until then). EE per place comes from
  pasting that place's Exploring Effectiveness page, or typing it. See mechanics/exploring-drinks.md. Every
  Apple Cider cost (trips, "spend my Apple Ciders", Exploring XP) uses that place's EE, or 1 (the minimum) when it isn't known.[^player]
- A small Truffle line sits above every tab (players with Truffles, or a Truffle price pasted before): White and Black,
  "hold" or a large "SELL" (from the sell line), "???" before today's paste. ✕ hides it for 24 hours; App settings turn it off.[^player]
- Slow grinds name where to gather the limiting part (Feathers for White Parchment at its explore place). When Grapes are
  the limit and below the cap, times assume Grapes raised to the cap now and kept there as the cap grows, with the silver
  that costs (see [building upgrades](/mechanics/building-upgrades.md)).[^player]
- **Expanded** is labelled points (Why, Cost, Needs, Where), never paragraphs.[^player]
- App settings (theme, detail, layout, Best use order, folded cards) are kept apart from game data: not in save codes, not
  cleared by Forget my pastes. The last 3 pastes (and save-code loads) can be undone.[^player]
- A page copy also holds the page opened before it, first (from My Farm: the farm list; from Town: the Town list; from
  Home: Home). Each page has a title line under a Back link, and the last one is the page on screen: Town, Bank, Temple
  of Reward and Pig Pen are detected by it (when that page's own text is there), the rest by their own text.[^player]
- A paste reads everything it carries, but the message names only the page pasted. Today: a Bank or farm paste also
  ticks the Town places from a carried Town list; My Inventory also reads the farm's production from a carried farm
  list.[^player]
- My Inventory's footer (Inventory Stats) marks it as an inventory even with the farm list first.[^player]
- A My Inventory paste replaces the old one (an item missing from it is 0 now), unless it has under 30% of the last copy's
  items, or under 90% of the page's own "N unique items" count (a search-filtered page): then it updates what it shows,
  keeps the rest, and says the page is filtered (clear the search bar, open folded sections, copy again).[^player]
- **Slow grinds** shows only masteries the Tower still needs (its tier), plus Orange Juice, Lemonade, Large Net, White Parchment
  and Beet until MM'd; "Slower than" (default 180 days) filters the rest. Each row assumes it gets the whole production or
  budget.[^player]
- Grind times count the cap growing every day (cap + daily growth x day), not today's cap forever.[^player]
- Steel and Steel Wire are produced and craftable: when one is the slowest part of a grind, enough is crafted (Carbon Sphere +
  Glass Orb + Iron; Carbon Sphere + Iron + Stone) that the Steelworks and the crafting finish together; the crafting's
  drinks and parts count in that grind's totals.[^player]
- Drinks and nets (Arnold Palmers, Apple Ciders, Lemonade, Large Nets) default from fruit / Antlers only: the hand-gathered parts
  (Glass, Tea Leaves) are easy and assumed on hand; show the exploring they take as a side note.[^player]
- Always state the **total** Arnold Palmers / Apple Ciders / Large Nets a mastery takes, not just the time: they can be bought
  or gifted, so a small total can be done in a day.[^player]
- Crops: players plant one crop in every plot (Plant All), then the next crop. Show crop needs as harvests and growth time before
  Veggie Juice; the Veggie Juice setting then decides the days. Breakfast Boost for very short crops, Grape Juice likely (not
  certain) for the longest. Ignore the rare, expensive mixed-planting item entirely.[^player]
- Each view spends the whole budget its own way (all Large Nets on fishing in Silver goal, all on masteries in Slow grinds):
  it's math for the player, not an allocation, so budgets aren't split between views.[^player]
- Silver goal: blank goal = the next Tower level; ways = crafting from production, per drink/net, and Large Nets at the best
  unlocked fishing place; the next better locked place says what unlocks it.[^player]
- Sell end products, not their parts: an item is never suggested for sale while anything made from it isn't Mega Mastered
  (sell the Butter, not the Butter Churn; tables, boxes and shields, not Wood, Boards or Planks). Items used exploring or
  fishing (Explosive, nets, drinks) aren't sold either; Chum is better gifted to a townsperson. Cooking uses count like
  crafting. 1:1 recipes with the crafting bonus (Leather Helmet -> Reinforced Helmet): MM the top item first, then the lower
  one; only then is selling the lower one sensible.[^player]
- Exceptions, case by case: Lantern and Red Shield sell well and Linked Lantern's / Frost Shield's parts are slow or costly,
  so selling them is fine short term (say the next step pays more). An item at the cap that can't be made into anything
  right now (another part is missing) may be sold.[^player]
- A single request's page (quest.php: special and personal requests, e.g. "Items Wanted", "Lost Items") lists "Items Requested"
  (item, "You have N", "Nx") and "Rewards" (Silver amount, items "Nx").[^player]
- Every personal request is generated fresh, even with the same name and townsperson: requests are keyed by their own id
  (quest_id) for Hide, Done and clean-up; a Help Needed paste drops any request whose id it no longer links; a new request
  with the same name and townsperson replaces the old one.[^player]
- Optional pastes are never prompted for, with one exception: players with Truffles in their inventory are reminded each day
  (until they paste it after reset) to paste the Steak Market for the sell check. Players without Truffles can't see the
  Truffle market (it appears after "The Smell of a Fun Guy"), so they get no reminder. If shared Truffle prices are built,
  the same prompt becomes the way to share, and its wording must say the two Truffle prices are shared.[^player]
- Saved production carries its own unit, as the game states it: `{ n: 54210, per: "day" }` for daily drops (Antler,
  Eggs, Milk, Trout…), `{ n: 18002, per: "hour" }` for the rest. The math converts to per hour in one place
  (`ratesPerHour` in engine.js); never store or quote a daily drop as an hourly rate.[^player]
- Home, Farm and building pastes update only the items they show and keep the rest (a copy can miss a building); clearing a
  box in Setup removes an item.[^player]
- Quest value = max(craft/gather cost, trade price), x2 if it helps the plan, x0.1 otherwise; silver and gold not counted;
  chests = contents - key cost. Ready isn't free (stock used is shown and costed). Chain look-ahead x0.7 a step, main x1.5.[^player]
- Outlets (where a pile goes): one that earns a mastery or Tower need is always offered with its cost; others only if cheaper
  than the job. Items with other uses (OTHER_USES: bait, Veggie Juice, pickaxes) say "keep for ..." instead of "sell".[^player]
- What to plant: crops that aren't gatherable and are in season, ranked by what they feed (own tier, quest needs current + 5
  ahead, AK-plan masteries; Tower and main x1.5), score = sum of weights / (1 + hours / 24). Crops officially <= 5 min are done
  together under Breakfast Boost, counted in harvests.[^player]
- Wishing well: only today's free tosses, each with what it brings and why; no totals or later days; items whose usual route is
  covered by exploring done anyway don't need tosses. Spare tosses stock up for later steps of active chains (the biggest
  single step past 5 ahead, never above the cap).[^player]
- Daily overflow is framed as a goal (the product's next tier or Tower tier: "Mega Mastery in N days, X is the slowest").[^player]
- Trips: places you explore anyway are discounted (default 50%); the main item's chain claims side drops first.[^player]
- Done ticks: a quest leaves the list (needs out, rewards in, next quests appear); a mastery moves up a tier (+AK); a Tower level
  goes +1 (AK -100). Undo via snapshots; any fresh Mastery, Inventory or Help Needed paste clears ticks.[^player]
- Tabs and files: the README.[^readme]

[^player]: Player confirmation
[^readme]: farmrpg-planner README
