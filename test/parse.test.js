// Run: node test/parse.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const { parseMastery } = require("../parse.js");

const text = fs.readFileSync(path.join(__dirname, "fixtures", "mastery-trimmed.txt"), "utf8");
const r = parseMastery(text);

assert.deepStrictEqual(r.tower, { ak: 42, level: 220 });
assert.deepStrictEqual(r.totals, { m: 231, gm: 159, mm: 64 });
assert.deepStrictEqual(r.skills, { Farming: 99, Fishing: 99, Crafting: 99, Exploring: 99, Cooking: 57, Mining: 31 });
assert.strictEqual(r.items["Apple Cider"], 82194);
assert.strictEqual(r.items["Shimmer Stone"], 733048);
assert.strictEqual(r.items["Board"], 64800208);
assert.strictEqual(r.items["Sol Orb"], 7);
assert.strictEqual(Object.keys(r.items).length, 49);
assert.deepStrictEqual(r.collapsed, []);
assert.ok(r.looksLikeMastery);

// Single-line paste (phone browsers) still finds items via pass 2
const flat = parseMastery(text.replace(/\s+/g, " "));
assert.strictEqual(flat.items["Apple Cider"], 82194);
assert.strictEqual(flat.items["Frozen Catfish"], undefined);
assert.deepStrictEqual(flat.tower, { ak: 42, level: 220 });

// Collapsed tier is flagged
const col = parseMastery("Tier III (M) chevron_right\nTier IV (GM) chevron_down\nApple Cider\n1 / 100,000 Progress");
assert.deepStrictEqual(col.collapsed, ["Tier III (M)"]);

// Crop plots: from the next row's price, else the Plant All button; never from the seed list (made-up numbers)
{
  const { parseFarm } = require("../parse.js");
  const home = ["Nothing Selected Beet (9906)Broccoli (777)Gold Pepper (412)", "CropsPlant All", "Selected[GJ (6.6K)](x)",
    "[14 Left Today](x)", "Corn (40)", "Around Your Farm", "* [Sawmill](x)", "[Produces Boards/Wood hourly](x)", "[1,000 Boards](x)"];
  assert.strictEqual(parseFarm(home.join("\n")).plots, 40);
  assert.strictEqual(parseFarm(home.concat(["* [Grow more crops](x)", "[Adds another row of crops](x)", "[100.0T  Silver](x)"]).join("\n")).plots, 52);
  assert.strictEqual(parseFarm("Plant All Selected Leek (36) Drink Veg Juice").plots, 36);
  assert.strictEqual(parseFarm("Plant All Selected Nothing Selected Gold Pepper (412)").plots, undefined);
}

// Building pages: each one's own sentence, read per hour (daily / 24); the farm sidebar on the same page doesn't win
{
  const { parseBuilding, detectPage } = require("../parse.js");
  const side = "Around Your Farm\n* [Sawmill](x)\n[Produces Boards/Wood hourly](x)\n[today](x)\n";
  const pages = {
    "Chicken Coop": ["Currently, your chicken coop is producing 2,400 eggs and 2,400 feathers per day.", { Eggs: 100, Feathers: 100 }],
    "Cow Pasture": ["Currently, your cow pasture is producing 480 milk per day.", { Milk: 20 }],
    "Raptor Pen": ["Currently, your Raptor Pen is producing 4,800 antlers and 2,400 steak kabobs per day.", { Antler: 200, "Steak Kabob": 100 }],
    "Worm Habitat": ["Your worm habitat will generate fishing bait every hour. Currently generating 300 per hour. About gummy worms Your worm habitat will generate gummy worms every hour. Currently generating 20 per hour. About mealworms Your worm habitat will generate Mealworms every hour. Currently generating 10 per hour.", { Worms: 300, "Gummy Worms": 20, Mealworms: 10 }],
    "Trout / Bait Farm": ["Your trout farm will generate trout every day. Currently generating 240 per day. Grub Production In addition, the trout farm produces grubs every hour that can be used in fishing. Currently generating 50 per hour. Minnow Production The trout farm also produces minnows every hour that can be used in fishing. Currently generating 40 per hour.", { Trout: 10, Grubs: 50, Minnows: 40 }],
    "Vineyard": ["Your vineyard will generate grapes every day. Currently generating 720 per day.", { Grapes: 30 }],
    "Sawmill": ["Your sawmill will generate boards every hour. Currently generating 600 per hour. Wood Production Your sawmill will generate wood every hour. Currently generating 700 per hour.", { Board: 600, Wood: 700 }],
    "Ironworks": ["Currently generating 5 Iron and 15 Nails every 3 minutes. (100 Iron and 300 Nails hourly)", { Iron: 100, Nails: 300 }],
    "Steelworks": ["Currently generating 25 Steel and 8 Steel Wire every 60 minutes.", { Steel: 25, "Steel Wire": 8 }],
    "Hay Field": ["Currently generating 100 Straw every 10 minutes. (600 Straw hourly)", { Straw: 600 }],
    "Quarry": ["Your quarry will generate regular stone and sandstone every 10 minutes. Currently generating 50 every 10 minutes. (300 hourly). About coal production Your quarry will generate coal every hour. Currently generating 40 per hour.", { Stone: 300, Sandstone: 300, Coal: 40 }]
  };
  for (const [name, [sentence, want]] of Object.entries(pages)) {
    const t = side + "About the page\n" + sentence;
    assert.strictEqual(detectPage(t), "building", name);
    const r = parseBuilding(t);
    assert.deepStrictEqual(r.buildings, [name]);
    assert.deepStrictEqual(r.rates, want, name);
  }
  const store = side + "Right now, it will increase by 5 each time you work. Currently your MAX Inventory is 1,234.";
  assert.strictEqual(detectPage(store), "building");
  assert.strictEqual(parseBuilding(store).cap, 1234);
  assert.strictEqual(parseBuilding(store).capPerDay, 5);
}

// Farmer's Market: stack values at base price -> base = value / count (made-up numbers)
{
  const { parseMarket, marketPrices, detectPage } = require("../parse.js");
  const page = ["You are getting an extra 55% due to your unlocked perks.", "UNLOCKED INVENTORY", "",
    "* Iron Cup", "− +", "330,000 Silver unlock_fill", "* Emerald Ring", "− +", "MAX ON HAND", "25,000,000 Silver unlock_fill",
    "* Odd Thing", "− +", "1,000 Silver unlock_fill"].join("\n");
  assert.strictEqual(detectPage(page), "market");
  const m = parseMarket(page);
  assert.deepStrictEqual(m.items["Emerald Ring"], { value: 25000000, max: true });
  assert.strictEqual(m.perks, 55);
  // Iron Cup 2,000 on hand -> 165; Emerald Ring at the cap (10,000) -> 2,500; Odd Thing 3 on hand -> 333.3, not whole: skipped
  assert.deepStrictEqual(marketPrices(m, { "Iron Cup": 2000, "Odd Thing": 3 }, 10000), { "Iron Cup": 165, "Emerald Ring": 2500 });
}

console.log("parse tests passed");

// One request's own page (made-up ids and counts): needs, what you have, rewards; name and NPC from the sidebar link
{
  const { parseRequest, detectPage } = require("../parse.js");
  const page = [
    "Personal Requests (1)", "", "* [Items Wanted](https://farmrpg.com/quest.php?id=111)", "[Request from Vincent](https://farmrpg.com/quest.php?id=111)",
    "", "* [Items Wanted](https://farmrpg.com/index.php#)", "If you can find the following items and give them to Vincent, you'll be rewarded for your effort.",
    "Items Requested", "",
    "* [Onion](https://farmrpg.com/item.php?id=33&from=quest&quest_id=111&needed=20)", "[You have 1,200](https://farmrpg.com/item.php?id=33&from=quest&quest_id=111&needed=20)", "[20x](https://farmrpg.com/item.php?id=33&from=quest&quest_id=111&needed=20)",
    "* [Stone Jelly](https://farmrpg.com/item.php?id=694&from=quest&quest_id=111&needed=5)", "[You have 0](https://farmrpg.com/item.php?id=694)", "[5x](https://farmrpg.com/item.php?id=694)",
    "", "[Track Items](https://farmrpg.com/index.php#)", "Rewards", "", "* Silver", "1,000,000",
    "* [Canoe](https://farmrpg.com/item.php?id=615&from=quest&quest_id=111)", "[Gently down the stream...](https://farmrpg.com/item.php?id=615)", "[3x](https://farmrpg.com/item.php?id=615)",
    "", "Consume a meal"].join("\n");
  assert.strictEqual(detectPage(page), "request");
  const r = parseRequest(page);
  assert.deepStrictEqual(r, { id: "111", name: "Items Wanted", npc: "Vincent", kind: null, need: [["Onion", 20], ["Stone Jelly", 5]],
    have: { Onion: 1200, "Stone Jelly": 0 }, silver: 1000000, gold: 0, get: [["Canoe", 3]] });
  // Pasted into the site: plain text, no links and no "* " bullets; the header names the townsperson
  const plain = ("Personal Request from Vincent\n" + page).replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/^\* /gm, "");
  const rp = parseRequest(plain);
  assert.deepStrictEqual({ ...rp, id: "111" }, { ...r, id: "111", kind: "personal" });
  assert.strictEqual(rp.id, null);
}

// Steak Market page and its history pages (made-up prices)
{
  const { parseSteak, detectPage } = require("../parse.js");
  const page = ["About the Steak Market", "Steaks change in value each day. Right now the Steak Market is Risky. You can buy up to 1,000 more Steaks.",
    "Current Market Price: 45,000 Silver [[View History]](https://farmrpg.com/steakhistory.php)", "Steaks Owned: 20", "Total Steak Value: 900,000 Silver",
    "About the Steak Kabob Market", "Steak Kabobs change in value each hour. You can buy up to 5 more Kabobs.", "Current Market Price: 9,800 Silver", "Steak Kabobs Owned: 300",
    "About the Truffle Market", "Truffle prices change in value each day. Right now, a single White Truffle sells for 180,000,000 Silver and a single Black Truffle sells for 610,000,000 Silver.",
    "White Truffle price increase chance at Reset: Very Low", "Black Truffle price increase chance at Reset: High", "White Truffles Owned: 10", "Total Value: 1 Silver", "Black Truffles Owned: 4",
    "Truffle Market History (Last 90 Days)", "Date", "White Truffle Price", "Black Truffle Price", "Oct 5", "180,000,000", "610,000,000", "Oct 4", "150,000,000", "200,000,000",
    "White Truffle range 1 to 2 silver"].join("\n");
  assert.strictEqual(detectPage(page), "steak");
  const r = parseSteak(page);
  assert.deepStrictEqual(r.steak, { price: 45000, market: "Risky", canBuy: 1000, owned: 20 });
  assert.deepStrictEqual(r.kabob, { price: 9800, canBuy: 5, owned: 300 });
  assert.deepStrictEqual(r.truffle, { white: 180000000, black: 610000000, whiteChance: "Very Low", blackChance: "High", whiteOwned: 10, blackOwned: 4 });
  assert.deepStrictEqual(r.history.truffle, [{ date: "Oct 5", white: 180000000, black: 610000000 }, { date: "Oct 4", white: 150000000, black: 200000000 }]);
  const sh = parseSteak("About the Steak Market x About the Truffle Market y Steak Market History (Last 90 Days) Date Price Market Volume Oct 5 47,986 Unstable 913,339 Oct 4 49,590 Stable 2,595,384 Price range");
  assert.deepStrictEqual(sh.history.steak[1], { date: "Oct 4", price: 49590, market: "Stable", volume: 2595384 });
  const kh = parseSteak("About the Truffle Market Kabob Market History Kabob Price History is limited to previous 24 hours. Time Price Oct 5, 5 PM 9,519 Oct 5, 4 PM 10,116 Price range");
  assert.deepStrictEqual(kh.history.kabob, [{ time: "Oct 5, 5 PM", price: 9519 }, { time: "Oct 5, 4 PM", price: 10116 }]);
}

// Market page pasted into the site: plain text, no "* " bullets (made-up values)
{
  const { parseMarket } = require("../parse.js");
  const plain = ["You are getting an extra 70% due to your unlocked perks.", "Unlocked Inventory", "Fancy Violin", "− +", "3,000,000 Silver unlock_fill",
    "Fancy Pipe", "− +", "MAX ON HAND", "50,000 Silver unlock_fill", "Locked Inventory", "Lava Sphere", "6,619 in Inv, Locked, not sellable"].join("\n");
  assert.deepStrictEqual(parseMarket(plain), { items: { "Fancy Violin": { value: 3000000, max: false }, "Fancy Pipe": { value: 50000, max: true } }, perks: 70 });
  assert.deepStrictEqual(parseMarket(plain.replace("Fancy Violin", "* Fancy Violin")).items["Fancy Violin"], { value: 3000000, max: false });
}

// Farm page: the Storehouse's daily cap growth (made-up number), as plain text or as the copied links
{
  const { parseFarm } = require("../parse.js");
  const nl = String.fromCharCode(10);
  assert.strictEqual(parseFarm(["Around Your Farm", "* Storehouse", "Work to increase max inventory", "6 Inventory", "Increase Per Day", "* Farmhouse"].join(nl)).capPerDay, 6);
  assert.strictEqual(parseFarm(["* [Storehouse](https://x/s)", "[Work to increase max inventory](https://x/s)", "[6 Inventory](https://x/s)", "[Increase Per Day](https://x/s)"].join(nl)).capPerDay, 6);
}

// A place's Exploring Effectiveness page (made-up numbers): the place, the stamina per tap (= EE) and Protein Bars eaten
{
  const { parseExploreInfo, detectPage } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const t = ["Exploring Effectiveness", "Nadia is very knowledgeable about Whispering Creek and can help you explore it more effectively for a small fee.", "",
    "You are currently using 37 stamina every time you continue exploring this location.", "", "You have eaten 2 Protein Bars in this location.",
    "* [Pay Fee](https://x/#)", "[5.0B Silver](https://x/#)"].join(nl);
  assert.strictEqual(detectPage(t), "explore-info");
  assert.deepStrictEqual(parseExploreInfo(t), { place: "Whispering Creek", ee: 37, bars: 2, fee: { amount: 5e9, unit: "Silver" } });
  assert.deepStrictEqual(parseExploreInfo(t.replace("5.0B Silver", "250K Corn")).fee, { amount: 250000, unit: "Corn" });
  assert.strictEqual(parseExploreInfo(t.replace("about Whispering Creek", "about the Forest")).place, "Forest");
}

// A personal request copied as plain text takes its name from the Personal Requests list, not from a quest by the same
// townsfolk higher up the sidebar (made-up page)
{
  const { parseRequest } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const t = ["Help Needed", "Personal Request from Thomas", "Some Long Quest II", "Request from Thomas", "Personal Requests (1)", "Items Wanted",
    "Request from Thomas", "Items Requested", "Lemon", "You have 50", "35x", "Rewards", "Silver", "1,000", "Consume a meal"].join(nl);
  const r = parseRequest(t);
  assert.strictEqual(r.name, "Items Wanted");
  assert.strictEqual(r.npc, "Thomas");
  assert.deepStrictEqual(r.need, [["Lemon", 35]]);
}

// Special requests copied as plain text say what kind they are, so the page can label them when no name can be trusted
{
  const { parseRequest } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const t = ["Special Request from Rosalie", "Pie Inversion II", "Request from Rosalie", "Items Requested", "Apple", "You have 9", "20x", "Rewards", "Consume a meal"].join(nl);
  const r = parseRequest(t);
  assert.strictEqual(r.kind, "special");
  assert.strictEqual(r.name, "Pie Inversion II");      // the page checks this against known quests (index.html wrongName)
}

// All Pet Items (made-up page): items several pets bring are summed; the inventory count is kept
{
  const { parsePets, detectPage } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const t = ["All Pet Items", "This is a summary of every item that your pets have brought back since the last time you collected items.",
    "All Items Found", "* Straw", "From Hedgehog", "900 currently in Inventory", "Found 300", "* Straw", "From Wolf", "900 currently in Inventory", "Found 50",
    "* Twine", "From Hedgehog", "0 currently in Inventory", "Found 1,200", "[Collect All Items](https://x/#)", "Consume a meal"].join(nl);
  assert.strictEqual(detectPage(t), "pets");
  assert.deepStrictEqual(parsePets(t).items, { Straw: { found: 350, have: 900, from: { Hedgehog: 300, Wolf: 50 } }, Twine: { found: 1200, have: 0, from: { Hedgehog: 1200 } } });
  assert.deepStrictEqual(parsePets(t.replace(/^\* /gm, "")).items.Straw.found, 350);      // pasted as plain text
}

// Temple of Reward (made-up counts): open chains with how many more they take; finished chains left out
{
  const { parseTemple, detectPage } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const t = ["Temple of Reward", "One-Time Chains", "* [Treat Bag 05](https://x/t?id=1)", "[Sacrifice: Jack-o-lantern](https://x/t?id=1)", "[0 / 11 Rewards Claimed (0%)](https://x/t?id=1)",
    "[10 / 2,000 Items Sacrificed (0.5%)](https://x/t?id=1)", "[ONE-TIME TEMPLE CHAIN](https://x/t?id=1)", "Regular Chains",
    "* Piece of Heart", "Sacrifice: Watermelon", "0 / 22 Rewards Claimed (0%)", "300 / 15,000 Items Sacrificed (2%)",
    "Completed One-Time Chains", "* Old Crest", "Sacrifice: Onyx Scorpion", "350 / 350 Items Sacrificed (100%)", "ONE-TIME TEMPLE CHAIN"].join(nl);
  assert.strictEqual(detectPage(t), "temple");
  assert.deepStrictEqual(parseTemple(t), [
    { reward: "Treat Bag 05", item: "Jack-o-lantern", done: 10, total: 2000, oneTime: true },
    { reward: "Piece of Heart", item: "Watermelon", done: 300, total: 15000, oneTime: false }]);
}

// Bank page (made-up amounts): interest rate and cap, what's banked, silver on hand
{
  const { parseBank, detectPage } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const t = ["Bank", "About the bank", "The bank allows you to deposit your Silver so that it can gain interest when you are not playing. Right now, Silver will grow by 2% every day. The most you can earn each day from interest is 10,000,000 Silver. This will occur in 8h 37m 21s.",
    "Currently in Bank: 300,000,000 Silver [[View History]](https://x/h)", "Bulk Options", "* [Deposit All](https://x/#)", "[1,234,567 Silver](https://x/#)", "* [Withdraw All](https://x/#)", "[300,000,000 Silver](https://x/#)"].join(nl);
  assert.strictEqual(detectPage(t), "bank");
  assert.deepStrictEqual(parseBank(t), { rate: 0.02, cap: 10000000, bank: 300000000, onHand: 1234567 });
}

// Community Center goals, Town page status, farm "today" marks (made-up pages)
{
  const { parseCommunity, parseTown, parseFarmToday, detectPage } = require("../parse.js");
  const nl = String.fromCharCode(10);
  assert.deepStrictEqual(parseCommunity(["Community Center", "* [Daily Goal](https://x/c)", "[ Apple for Honey](https://x/c)", "[42.5%](https://x/c)",
    "* [Monthly Goal](https://x/m)", "[ Pumpkin for Ghost Candy](https://x/m)", "[98.99%](https://x/m)"].join(nl)),
    { daily: { item: "Apple", reward: "Honey", pct: 42.5 }, monthly: { item: "Pumpkin", reward: "Ghost Candy", pct: 98.99 } });
  const town = ["Market District", "* Country Store", "Buy seeds & materials", "Borgen's District", "* Wheel of Borgen", "Spin daily for something nice!", "READY!",
    "* Borgen's Treasure Hut", "Open a treasure chest daily", "* Borgen's Lost & Found", "Help recover items by finding their pairs",
    "* Wishing Well", "Toss things in & see what happens", "12 Left", "* Exchange Center", "Exchange items, XP, etc"].join(nl);
  assert.strictEqual(detectPage(town), "town");
  const t = parseTown(town);
  assert.deepStrictEqual([t["Wheel of Borgen"].ready, t["Borgen's Treasure Hut"].ready, t["Borgen's Lost & Found"].ready, t["Wishing Well"].left], [true, false, false, 12]);
  assert.deepStrictEqual(parseFarmToday(["Around Your Farm", "* Chicken Coop", "Add chickens to produce eggs daily", "today", "* Cow Pasture", "Add cows", "100 Milk",
    "* Raptor Pen", "Raise Raptors to hunt daily", "today"].join(nl)), ["Chicken Coop", "Raptor Pen"]);
}

// A Bank page copied on a wide screen also carries the Town list: still the bank; the Town list's bank figure is rounded
{
  const { detectPage, parseTown } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const town = ["Market District", "* Country Store", "Buy seeds", "Borgen's District", "* Wheel of Borgen", "Spin daily", "READY!", "Finance & Investing District", "* Bank", "Deposit your Silver", "2.5T"];
  assert.strictEqual(detectPage([...town, "About the bank", "Currently in Bank: 100 Silver"].join(nl)), "bank");
  assert.strictEqual(detectPage(town.join(nl)), "town");
  assert.strictEqual(parseTown(town.join(nl)).bank, 2.5e12);
}

// A copy holds the page you came from first; the last title under a Back link is the page on screen
{
  const { detectPage } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const pen = ["About the Pig Pen", "Raise pigs.", "Pigs (2 / 10)", "Pig 1", "Level 3", "Pig 2", "Level 4"];
  const town = ["Market District", "* Country Store", "Buy seeds", "Borgen's District", "* Wheel of Borgen", "Spin daily"];
  assert.strictEqual(detectPage(["[Back](https://x/a)", "Pig Pen", "[Back](https://x/b)", "Town", ...pen, ...town].join(nl)), "town");
  assert.strictEqual(detectPage(["[Back](https://x/b)", "Town", "[Back](https://x/a)", "Pig Pen", ...town, ...pen].join(nl)), "pigpen");
  // A title without its page's text falls back to the usual checks
  assert.strictEqual(detectPage(["[Back](https://x/b)", "Bank", ...pen].join(nl)), "pigpen");
}

// The Vault and Daily Chores: no mark means done; "READY!" / "N Left" means not yet
{
  const { parseTown } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const done = parseTown(["* The Vault", "Try to crack the code", "* Exchange Center", "Exchange items", "Daily Chores", "Earn Ancient Coins Daily", "Done!"].join(nl));
  assert.deepStrictEqual([done["The Vault"].ready, done["Daily Chores"].ready], [false, false]);
  const open = parseTown(["* The Vault", "Try to crack the code", "READY!", "Daily Chores", "Earn Ancient Coins Daily", "2 Left"].join(nl));
  assert.deepStrictEqual([open["The Vault"].ready, open["Daily Chores"].ready, open["Daily Chores"].left], [true, true, 2]);
  // Right after reset Home shows "Not Started": not done
  assert.strictEqual(parseTown(["Daily Chores", "Earn Ancient Coins Daily", "Not Started"].join(nl))["Daily Chores"].ready, true);
}

// Pig Pen page (made-up names and levels): every pig's level; "Sent Off" from the farm page
{
  const { parsePigPen, parseFarm, detectPage } = require("../parse.js");
  const nl = String.fromCharCode(10);
  const t = ["Around Your Farm", "* Pig Pen", "Add pigs", "About the Pig Pen", "Raise pigs and fatten them up with feed.", "Pigs (5 / 10)",
    "Hammy", "Level 12", "Pig 2", "Level 12", "Pig 3", "Level 3", "Pig 4", "Level 3", "Pig 5", "Level 1", "Consume a meal"].join(nl);
  assert.strictEqual(detectPage(t), "pigpen");
  assert.deepStrictEqual(parsePigPen(t), { levels: [12, 12, 3, 3, 1], max: 10 });
  assert.strictEqual(parseFarm(["Around Your Farm", "* [Pig Pen](https://x/p)", "[Add pigs and fatten them up](https://x/p)", "[500 Pigs](https://x/p)", "[16 Sent Off](https://x/p)"].join(nl)).pigsSentOff, 16);
}

// A copy carries the page you came from and the farm sidebar: listed in the order they appear, never the pasted page
{
  const { carriedPages } = require("../parse.js"), nl = "\n";
  const t = ["Pigs (10 / 10)", "Around Your Farm", "Market District", "Sacrifice: Potato", "Items Sacrificed"].join(nl);
  assert.deepStrictEqual(carriedPages(t, "temple"), ["pigpen", "farm", "town"]);
  assert.deepStrictEqual(carriedPages(t, "farm"), ["pigpen", "town", "temple"]);
  assert.deepStrictEqual(carriedPages("Sacrifice: Potato", "town"), []);                // no Temple without its own heading
  assert.deepStrictEqual(carriedPages("Active Requests", "quests"), []);
}

// Craftworks page: recipes in order, paused ones marked, slot count
{
  const { parseCraftworks, detectPage } = require("../parse.js"), nl = "\n";
  const t = ["Items added to the Craftworks will be crafted automatically anytime the resources are available in the order you set below. You can add up to 13 items total to the Craftworks.",
    "[Adjust Order](https://x/#)Craftworks Items (3)", "[play Play Allpause Pause Alltrash Remove All](https://x/#)", "* 1", "Twine", "pauseRemove", "* 2", "Rope", "playRemove", "* 3", "Coal Thing", "pauseRemove", "Save Item Set"].join(nl);
  assert.strictEqual(detectPage(t), "craftworks");
  assert.deepStrictEqual(parseCraftworks(t), { items: [{ name: "Twine", paused: false }, { name: "Rope", paused: true }, { name: "Coal Thing", paused: false }], slots: 13 });
}

// Auto-read hands over every page: an item's own page (one mastery bar, a recipe's level) is not the Mastery page,
// and a skill level elsewhere on the Mastery page doesn't beat the "My skills" block
{
  const { detectPage } = require("../parse.js"), nl = "\n";
  const item = ["Twine", "Crafting Level 5", "Mastery", "1,234 / 10,000 Progress", "You have 40"].join(nl);
  assert.notStrictEqual(detectPage(item), "mastery");
  assert.strictEqual(detectPage(text), "mastery");
  const extra = parseMastery(["Requires Crafting Level 5", text].join(nl));
  assert.strictEqual(extra.skills.Crafting, 99);
}

// Craftworks as auto-read sees it: inventory lines under each item, the buttons on their own lines (made-up items)
{
  const { detectPage, parseCraftworks } = require("../parse.js"), nl = "\n";
  const t = ["Items added to the Craftworks will be crafted automatically anytime the resources are available in the order you set below. You can add up to 10 items total to the Craftworks.",
    "ADJUST ORDER", "CRAFTWORKS ITEMS (3)", "play Play All", "pause Pause All", "trash Remove All",
    "1", "Twine", "Inventory: 7", "Out of: Straw", "pause", "Remove",
    "2", "Rope", "Inventory: 30", "play", "Remove",
    "3", "Hammer", "Inventory: 120", "pause", "Remove", "SAVE ITEM SET", "MY ITEM SETS"].join(nl);
  assert.strictEqual(detectPage(t), "craftworks");
  assert.deepStrictEqual(parseCraftworks(t), { items: [{ name: "Twine", paused: false }, { name: "Rope", paused: true }, { name: "Hammer", paused: false }], slots: 10 });
}
