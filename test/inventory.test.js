// Run: node test/inventory.test.js
const fs = require("fs"), path = require("path"), assert = require("assert");
const { parseInventory, detectPage } = require("../parse.js");

const text = fs.readFileSync(path.join(__dirname, "fixtures", "inventory-trimmed.txt"), "utf8");
const inv = parseInventory(text);

assert.strictEqual(inv.cap, 9850);
assert.strictEqual(Object.keys(inv.items).length, 8);
assert.deepStrictEqual(inv.items["Board"], { count: 9850, id: 21, atMax: true, mastery: "mm" });
assert.deepStrictEqual(inv.items["Apple Cider"], { count: 2745, id: 379, atMax: false, mastery: "m" });
assert.deepStrictEqual(inv.items["Mushroom Stew"], { count: 111, id: 634, atMax: false, mastery: null });
assert.strictEqual(inv.items["Use a Heart-shaped Gem"], undefined);   // not an item.php link

// Plain-text copy (links stripped) gives the same counts, without ids
const plain = parseInventory(text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"));
assert.strictEqual(plain.cap, 9850);
assert.strictEqual(Object.keys(plain.items).length, 8);
assert.deepStrictEqual(plain.items["Large Net"], { count: 9850, id: null, atMax: true, mastery: "gm" });
assert.strictEqual(plain.items["Shimmer Stone"].count, 4);

// Page detection
assert.strictEqual(detectPage(text), "inventory");
assert.strictEqual(detectPage(fs.readFileSync(path.join(__dirname, "fixtures", "mastery-trimmed.txt"), "utf8")), "mastery");
assert.strictEqual(detectPage("Active Requests (16)\nA Way Back XXVII\nRequest from Thomas - Main Quest"), "quests");   // the headings alone are the sidebar
assert.strictEqual(detectPage("hello"), null);

// Orchard page
const { parseOrchard } = require("../parse.js");
const orch = "About the orchard\nTrees (16,830)\n\n5,600\nApple Trees\n\n7,300\n Production\n(With Perks)\n\n Apples\nin Inventory:\n9,850\n\n5,610\nOrange Trees\n\n7,310\n Production\n(With Perks)\n\n5,620\nLemon Trees\n\n7,320\n Production\n(With Perks)";
assert.deepStrictEqual(parseOrchard(orch), { Apple: { trees: 5600, production: 7300 }, Orange: { trees: 5610, production: 7310 }, Lemon: { trees: 5620, production: 7320 } });
assert.strictEqual(detectPage(orch), "orchard");

// Farm page: every building's output as an hourly rate
const { parseFarm } = require("../parse.js");
const farmText = fs.readFileSync(path.join(__dirname, "fixtures", "farm-trimmed.txt"), "utf8");
assert.strictEqual(detectPage(farmText), "farm");
const farm = parseFarm(farmText);
// Trout Farm: trout drop daily, grubs and minnows hourly (stored per hour: 4,800 a day = 200/h; 4,000 an hour)
assert.strictEqual(farm.Trout, 200);
assert.strictEqual(farm.Grubs, 4000);
assert.strictEqual(farm.Minnows, 4000);
assert.strictEqual(farm.Iron, 10000);             // 500 every 3 minutes
assert.strictEqual(farm.Nails, 30000);
assert.strictEqual(farm.Straw, 52800);            // the "Hourly" figure, not the 10-minute one
assert.strictEqual(farm.Stone, 9600);
assert.strictEqual(farm.Coal, 1200);
assert.strictEqual(farm.Board, 14400);
assert.strictEqual(farm["Steel Wire"], 333);
assert.strictEqual(farm.Grapes, 8800 / 24);
assert.strictEqual(farm.Antler, 40800 / 24);
assert.strictEqual(farm.Apple, 7300 / 24);
assert.strictEqual(farm["Gummy Worms"], 800);
// (plots need the crop area of the page, which the trimmed fixture leaves out)
assert.strictEqual(parseFarm(["Harvest All", "CropsPlant All", "Selected", "Leek (36)", "Around Your Farm"].join(String.fromCharCode(10))).plots, 36);
// Plain-text copy works the same
assert.deepStrictEqual(parseFarm(farmText.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")), farm);
// The Steam app copies pages in capitals: farm, orchard and plots still read the same
assert.strictEqual(detectPage(farmText.toUpperCase()), "farm");
assert.deepStrictEqual(parseFarm(farmText.toUpperCase()), farm);
assert.strictEqual(detectPage(orch.toUpperCase()), "orchard");
assert.deepStrictEqual(parseOrchard(orch.toUpperCase()), parseOrchard(orch));
assert.strictEqual(parseFarm(["HARVEST ALL", "CROPSPLANT ALL", "SELECTED", "LEEK (36)", "AROUND YOUR FARM"].join(String.fromCharCode(10))).plots, 36);
// Steam's Orchard page also lists the farm: it's still the orchard, and both halves read
const steamOrchard = farmText.replace("Around Your Farm", "AROUND YOUR FARM") + String.fromCharCode(10) + orch.replace("About the orchard", "ABOUT THE ORCHARD").replace("Trees (", "TREES (");
assert.strictEqual(detectPage(steamOrchard), "orchard");
assert.deepStrictEqual(parseOrchard(steamOrchard), parseOrchard(orch));
assert.deepStrictEqual(parseFarm(steamOrchard), farm);

// Help Needed page
const { parseQuests } = require("../parse.js");
const qText = fs.readFileSync(path.join(__dirname, "fixtures", "quests-trimmed.txt"), "utf8");
assert.strictEqual(detectPage(qText), "quests");
const qs = parseQuests(qText);
assert.strictEqual(qs.length, 11);
assert.deepStrictEqual(qs[0], { name: "Zap of the Sting V", section: "special", npc: null, kind: null, ready: false, dates: "Sep 21 - Sep 30" });
assert.deepStrictEqual(qs.find(q => q.name.startsWith("Pleasantly")).name, "Pleasantly Arbitrating Misconstrued Relational Affronts, Troubles Skirted I");
assert.strictEqual(qs.find(q => q.name === "Spirit of the Cards I").ready, true);
assert.strictEqual(qs.find(q => q.name === "Look, A Secret Temple").kind, "main");
assert.strictEqual(qs.find(q => q.name === "Chickens Come Home To Roost III").kind, "side");
assert.strictEqual(qs.find(q => q.name === "Items Wanted").section, "personal");
// Other dash characters still mark main/side quests
const dash = parseQuests(["Active Requests (2)", "Look, A Secret Temple", "Request from Lorn – Main Quest", "Chickens Come Home To Roost III", "Request from ROOMBA — Side Request"].join(String.fromCharCode(10)));
assert.deepStrictEqual(dash.map(q => [q.npc, q.kind]), [["Lorn", "main"], ["ROOMBA", "side"]]);
// Every non-personal quest name matches the quest data (dated specials drop out of the snapshot once they end)
const QD = require("../quests.js").quests;
assert.deepStrictEqual(qs.filter(q => q.section !== "personal" && !q.dates && !QD[q.name]).map(q => q.name), []);
// Plain-text copy too
assert.deepStrictEqual(parseQuests(qText.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")), qs);
// The Steam app copies headings in capitals and includes the whole Home page around them
const steam = ["WHERE DO YOU WANT TO GO?", "* [Help Needed](https://farmrpg.com/quests.php)", "[2 READY!](https://farmrpg.com/quests.php)",
  "COMMUNITY CENTER", "* [Green Parchment for Leather](https://farmrpg.com/comm.php)",
  "SPECIAL REQUESTS (1)", "* [Zap of the Sting VI](https://farmrpg.com/quest.php?id=1)", "[Available Sep 21 - Sep 30](https://farmrpg.com/quest.php?id=1)",
  "ACTIVE REQUESTS (2)", "* [Look, A Secret Temple](https://farmrpg.com/quest.php?id=2)", "[Request from Lorn - Main Quest](https://farmrpg.com/quest.php?id=2)",
  "* [Spirit of the Cards I](https://farmrpg.com/quest.php?id=3)", "[Request from George](https://farmrpg.com/quest.php?id=3)", "[READY!](https://farmrpg.com/quest.php?id=3)",
  "PERSONAL REQUESTS (1)", "* [Items Wanted](https://farmrpg.com/quest.php?id=4)", "[Request from Vincent](https://farmrpg.com/quest.php?id=4)",
  "REQUEST TOTALS", "* [Requests Completed](https://farmrpg.com/questscomp.php)", "[1,536](https://farmrpg.com/questscomp.php)"].join(String.fromCharCode(10));
assert.strictEqual(detectPage(steam), "quests");
assert.deepStrictEqual(parseQuests(steam).map(q => [q.name, q.section, q.kind, q.ready]),
  [["Zap of the Sting VI", "special", null, false], ["Look, A Secret Temple", "active", "main", false], ["Spirit of the Cards I", "active", null, true], ["Items Wanted", "personal", null, false]]);

// Perks and Farm Supply pages -> settings
const { parsePerks, perkSettings } = require("../parse.js");
const perksText = fs.readFileSync(path.join(__dirname, "fixtures", "perks-trimmed.txt"), "utf8");
const supplyText = fs.readFileSync(path.join(__dirname, "fixtures", "supply-trimmed.txt"), "utf8");
assert.strictEqual(detectPage(perksText), "perks");
assert.strictEqual(detectPage(supplyText), "supply");
const ps = perkSettings(parsePerks(perksText));
assert.deepStrictEqual(ps, { cropGrowthCut: 60, cornGrowthCut: 20, resourceSaver: 10, cookFaster: 0, sellBonus: 0, craftSilverCut: 0, friendPrimer: 0, omg: 0, doublePrizes: 40, wanderer: 33, fishingTrawl: true });
// Sell and crafting-silver perks stack (Negotiator I-IV + Gift of Persuasion; Artisan I-II + Steady Hands)
const sellPage = ['52', 'Points Left', '19', 'Perks Avail', 'Farming Perks',
  '* Artisan I', 'Crafting costs 5% less Silver', 'Unlocked', '* Artisan II', 'Crafting costs 10% less Silver', 'Unlocked', '* Artisan III', 'Crafting costs 15% less Silver', '30 Points',
  'Profit Perks', '* Negotiator I', 'Items sold earn 5% more Silver', 'Unlocked', '* Negotiator II', 'Items sold earn 10% more Silver', 'Unlocked',
  '* Negotiator III', 'Items sold earn 15% more Silver', 'Unlocked', '* Negotiator IV', 'Items sold earn 20% more Silver', 'Unlocked',
  'Artifact Perks', '* Gift of Persuasion', 'Items sold earn 10% more Silver', 'Requires Tower Level 20', 'Unlocked',
  '* Steady Hands', 'Crafting costs 10% less Silver', 'Requires Tower Level 30', 'Unlocked', 'Consume a meal'].join(String.fromCharCode(10));
const sp = perkSettings(parsePerks(sellPage));
assert.strictEqual(sp.sellBonus, 60);
assert.strictEqual(sp.craftSilverCut, 25);
// Friendship perks: Primer and O.M.G
const fp = perkSettings(parsePerks(['52', 'Points Left', '19', 'Perks Avail', 'Farming Perks', 'Miscellaneous Perks',
  '* Friendship Primer', 'Earn 10% more XP making friendships', 'Unlocked', '* O.M.G I', '5% chance liked or loved items', 'given to townsfolk have huge XP bonus', 'Unlocked', 'Consume a meal'].join(String.fromCharCode(10))));
assert.strictEqual(fp.friendPrimer, 10);
assert.strictEqual(fp.omg, 1);
const ss = perkSettings(parsePerks(supplyText));
assert.strictEqual(ss.cropGrowthCut, 30);
assert.strictEqual(ss.resourceSaver, 35);
assert.strictEqual(ss.grapeJuice, 14);        // (1 + 1 + 2 + 3) x 2; the "on sale" copy of the Fountain isn't counted twice
assert.strictEqual(parsePerks(supplyText).unlocked.filter(u => u.name === "Grape Juice Fountain").length, 1);
assert.ok(!parsePerks(supplyText).unlocked.some(u => /Upgrades on Sale/.test(u.name)));
assert.strictEqual(ss.orchardNoon, 10);
assert.ok(ss.antlerNoon === 0 || ss.antlerNoon === 10);
assert.ok(ss.reinforcedNetting && ss.lemonSqueezer && ss.cinnamonSticks && ss.ironDepot);
// Steam app: headings in capitals (perk text itself stays as written)
const capHeads = t => t.split(String.fromCharCode(10)).map(l => /^(Farming Perks|Cap Upgrades|Farming Upgrades|Points Left|Perks Avail|Unlocked)$/.test(l.trim()) ? l.toUpperCase() : l).join(String.fromCharCode(10));
assert.strictEqual(detectPage(capHeads(perksText)), "perks");
assert.deepStrictEqual(perkSettings(parsePerks(capHeads(perksText))), ps);
assert.strictEqual(detectPage(capHeads(supplyText)), "supply");
assert.deepStrictEqual(perkSettings(parsePerks(capHeads(supplyText))), ss);

assert.strictEqual(perkSettings({ page: "supply", unlocked: [{ name: "Hotter Ovens I", desc: "Cooking is 10% faster" }] }).cookFaster, 10);
assert.strictEqual(perkSettings({ page: "supply", unlocked: [{ name: "Extra Wish", desc: "An extra toss into the Well daily" },
  { name: "Extra Wishes", desc: "+5 tosses into the Well daily" }, { name: "Extra Wishes II", desc: "+10 tosses into the Well daily" },
  { name: "Extra Wishes III", desc: "+10 tosses into the Well daily" }] }).wwTosses, 29);
assert.strictEqual(ss.wwTosses >= 3, true);

// Chat is cut out before anything reads the page (made-up messages that mention page headings)
const { stripChat } = require("../parse.js");
const NL = String.fromCharCode(10);
const chat = ["Help", "Global", "Spoilers", "Trivia", "Giveaways", "Trade", "Say something...",
  "03:56:17 PM", "[Someone](https://farmrpg.com/profile.php?user_name=Someone)", "flag_fill", "Active Requests (5) Chicken Coop 5,000 Eggs",
  "03:56:12 PM", "[Another One](https://farmrpg.com/profile.php?user_name=Another+One)", "About the orchard: 9,999 Apple Trees 9,999 Production",
  "", "[View Chat Log](https://farmrpg.com/chatlog.php?channel=giveaways)", "Navigation"].join(NL);
assert.strictEqual(detectPage(chat), null);                               // chat alone isn't a page
assert.ok(!/Someone|Another One|Chicken Coop/.test(stripChat(chat)));
assert.deepStrictEqual(parseOrchard(chat), {});
// A real page with chat on top reads exactly the same as without it
assert.deepStrictEqual(parseFarm(chat + NL + farmText), farm);
assert.deepStrictEqual(parseQuests(chat + NL + qText), qs);
assert.strictEqual(detectPage(chat + NL + qText), "quests");
// Steam-style chat (tabs on one line, flag_fill) and a stray message with no panel markers
const steamChat = "[HELPGLOBALSPOILERSTRIVIAGIVEAWAYSTRADE](https://farmrpg.com/index.php#)" + NL + "03:55:49 PM" + NL + "[MrX](https://farmrpg.com/profile.php?user_name=MrX)" + NL + "flag_fill" + NL + "Special Requests (2)" + NL + "[View Chat Log](https://farmrpg.com/chatlog.php?channel=giveaways)";
assert.strictEqual(detectPage(steamChat), null);
assert.strictEqual(stripChat("12:01:02 AM" + NL + "Plain Name" + NL + "Active Requests (3)" + NL + "Keep this line").trim(), "Keep this line");

// Silver from the top bar (Steam copies); none without it
const { parseSilver } = require("../parse.js");
assert.deepStrictEqual(parseSilver("x" + NL + "[1,234,567](https://farmrpg.com/bank.php)   [89](https://farmrpg.com/gold.php)   [2,000](https://farmrpg.com/town.php)" + NL + "Consume a meal"), { silver: 1234567, gold: 89 });
assert.strictEqual(parseSilver(qText), null);

// Friendship levels: the Friendship Levels page and a profile page (made-up levels, short profile names mapped)
const { parseFriends } = require("../parse.js");
const fPage = ["Friendship Levels", "Current Levels", "Thomas is the Townsfolk of the Day! Any items you give to Thomas today will be 2x Friendship XP.",
  "Rosalie", "Level 12", "Buddy", "Level 34", "Next Help Request at Level 90", "Star Meerif", "Level 5", "Drink Baba Cola", "Consume a meal"].join(NL);
assert.strictEqual(detectPage(fPage), "friends");
assert.deepStrictEqual(parseFriends(fPage), { levels: { Rosalie: 12, Buddy: 34, "Star Meerif": 5 }, totd: "Thomas" });
const prof = ["Skill Progress", "Friendship Levels", "Star", "Level 7", "CptThomas", "Level 3", "Gary", "Level 9", "Game Stats", "Net Worth"].join(NL);
assert.strictEqual(detectPage(prof), "friends");
assert.deepStrictEqual(parseFriends(prof).levels, { "Star Meerif": 7, "Captain Thomas": 3, "Gary Bearson V": 9 });

console.log("inventory tests passed");

// My Inventory on a wide screen carries the farm sidebar too: still an inventory page (made-up numbers)
{
  const wide = [farmText, text, "Inventory Stats", "Your inventory contains 5 unique items and 100 items in total."].join("\n");
  assert.strictEqual(detectPage(wide), "inventory");
  assert.ok(Object.keys(parseInventory(wide).items).length >= 3);
}

// Sprint Shoes: the highest tier unlocked on Farm Supply (made-up page section)
{
  const nl = String.fromCharCode(10);
  const t = ["Cap Upgrades", "Farming Upgrades", "Exploring Upgrades", "* Sprint Shoes I", "Doubles Stamina Effectiveness", "Unlocked",
    "* Sprint Shoes II", "Doubles Stamina Effectiveness", "Unlocked", "* Sprint Shoes III", "Doubles Stamina Effectiveness", "100 Gold"].join(nl);
  assert.strictEqual(perkSettings(parsePerks(t)).sprintShoes, 2);
  assert.strictEqual(ss.sprintShoes, 0);
}

// Plain-text copy whose sections aren't the usual ones (Loot & Treasure, Runestones): still read (made-up counts)
{
  const nl = String.fromCharCode(10);
  const t = ["Currently, you cannot have more than 5,000 of any single thing.", "Loot & Treasure chevron_down", "Grab Bag 05", "Random selection of late runestones",
    "Open it at the Locksmith in Town", "1,234", "Runestones chevron_down", "Runestone 18", "Some say it can be found", "in a great blue", "77", "Inventory Stats"].join(nl);
  const r = parseInventory(t);
  assert.deepStrictEqual([r.items["Grab Bag 05"].count, r.items["Runestone 18"].count, r.cap], [1234, 77, 5000]);
}

// The page's own unique-item count comes through, so a filtered copy can be spotted
assert.strictEqual(parseInventory(["Runestones chevron_down", "Runestone 18", "Some say", "77", "Inventory Stats",
  "Your inventory contains 933 unique items and 2,512,815 items in total."].join(String.fromCharCode(10))).unique, 933);
