// Readers for pasted FarmRPG pages (browser: window.FRP; node: require).
// Headings match in any case: the Steam app copies in capitals.
(function (root) {
  const toInt = s => parseInt(String(s).replace(/,/g, ""), 10);
  // Strip list bullets and markdown links that some browsers add when copying
  const clean = s => s.trim().replace(/^[*•-]\s+/, "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
  const SKILLS = ["Farming", "Fishing", "Crafting", "Exploring", "Cooking", "Mining"];

  function parseMastery(text) {
    const items = {};
    const put = (name, val) => {
      if (!name || !isFinite(val) || name.length > 60) return;
      items[name] = Math.max(items[name] || 0, val);
    };
    // Pass 1: name on its own line, "X / Y Progress" on a later line
    const lines = text.split(/\r?\n/).map(clean);
    const progRe = /^([\d,]+)\s*\/\s*([\d,]+|∞)\s*Progress/i;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(progRe);
      if (!m) continue;
      let j = i - 1;
      while (j >= 0 && !lines[j]) j--;
      if (j >= 0) put(lines[j], toInt(m[1]));
    }
    // Pass 2: all on one line (some phone browsers); only used if pass 1 found little.
    const flat = text.replace(/\s+/g, " ");
    if (Object.keys(items).length < 5) {
      const re = /(?:^|\bStop|\bTrack|Complete!|chevron_down|chevron_right|chevron_up)\s+([^\/%]+?)\s+([\d,]+)\s*\/\s*([\d,]+|∞)\s*Progress/g;
      let m;
      while ((m = re.exec(flat))) {
        put(m[1].replace(/^.*chevron_\w+\s+/, "").replace(/^(Mega Mastered|Ready to Claim|Nothing ready yet|Mastery In-Progress|Stop Tracking All)\s+/i, "").replace(/^[*•-]\s+/, "").trim(), toInt(m[2]));
      }
    }
    // A tier only counts as collapsed if it never appears expanded anywhere in the paste
    const closed = new Set(), open = new Set();
    const cre = /(Tier\s+[IVX]+(?:\s*\([A-Z]+\))?|No Tier|Mega Mastered)\s*chevron_(right|down|up)/g;
    let m;
    while ((m = cre.exec(text))) (m[2] === "right" ? closed : open).add(m[1].replace(/\s+/g, " "));
    const collapsed = [...closed].filter(t => !open.has(t));

    // Home block: "The Tower / Unused Points: N / Level N" (Unused Points here = AK, single points)
    const plain = lines.join("\n").replace(/\s+/g, " ");
    let tower = null;
    const tm = plain.match(/The Tower\b.{0,120}?Unused Points:\s*([\d,]+).{0,120}?Level\s+([\d,]+)/);
    if (tm) tower = { ak: toInt(tm[1]), level: toInt(tm[2]) };

    // Skill levels from the "My skills" block when it's there: other text on the page (a recipe's "Crafting Level 5")
    // must not win just by coming first
    const skillText = plain.includes("My skills") ? plain.slice(plain.indexOf("My skills")) : plain;
    const skills = {};
    for (const s of SKILLS) {
      const sm = skillText.match(new RegExp("\\b" + s + " Level (\\d+)"));
      if (sm) skills[s] = toInt(sm[1]);
    }

    // "So far, you have 246 items Mastered, 168 items Grand Mastered and 69 items Mega Mastered"
    let totals = null;
    const cm = plain.match(/([\d,]+) items Mastered, ([\d,]+) items Grand Mastered and ([\d,]+) items Mega Mastered/);
    if (cm) totals = { m: toInt(cm[1]), gm: toInt(cm[2]), mm: toInt(cm[3]) };

    const looksLikeMastery = /Progress/.test(text) && /(Mastery In-Progress|Tier\s+[IVX]+|Mastered)/i.test(text);
    return { items, tower, skills, totals, collapsed, looksLikeMastery };
  }

  // Inventory: each item is a run of lines linking item.php?id=N: name, description, [MAX ON HAND], [mastery tag], count.
  // MAX ON HAND = at the cap (crafting into it is blocked).
  const MASTERY_TAGS = { "Mastered": "m", "Grand Mastered": "gm", "Mega Mastered": "mm" };
  function parseInventory(text) {
    const items = {};
    const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    const linkRe = /^(?:[*•-]\s+)?\[([^\]]*)\]\(https?:\/\/[^)]*item\.php\?id=(\d+)\)$/;
    let cur = null;
    const flush = () => {
      if (!cur) return;
      const last = cur.parts[cur.parts.length - 1];
      if (cur.parts.length >= 2 && /^[\d,]+$/.test(last)) {
        const mid = cur.parts.slice(1, -1);
        const tag = mid.map(p => MASTERY_TAGS[p]).find(Boolean) || null;
        items[cur.parts[0]] = { count: toInt(last), id: +cur.id, atMax: mid.includes("MAX ON HAND"), mastery: tag };
      }
      cur = null;
    };
    for (const line of lines) {
      const m = line.match(linkRe);
      if (!m) { flush(); continue; }
      if (!cur || cur.id !== m[2]) { flush(); cur = { id: m[2], parts: [] }; }
      cur.parts.push(m[1].trim());
    }
    flush();

    // Plain-text copy (no links): name line, description lines, count line, inside the item sections
    if (!Object.keys(items).length) {
      // The first section heading ("Meals chevron_down", "Loot & Treasure chevron_down", "Runestones chevron_down"...)
      const start = lines.findIndex(l => /^(?:[*•-]\s+)?[A-Z][\w &'-]* chevron_(down|up|right)$/.test(l));
      let block = [];
      for (const raw of start < 0 ? [] : lines.slice(start)) {
        const l = raw.replace(/^[*•-]\s+/, "");
        if (/chevron_\w+$/.test(l)) { block = []; continue; }
        if (/^Inventory Stats/i.test(l)) break;
        if (/^[\d,]+$/.test(l) && block.length) {
          const mid = block.slice(1);
          items[block[0]] = { count: toInt(l), id: null, atMax: mid.includes("MAX ON HAND"), mastery: mid.map(p => MASTERY_TAGS[p]).find(Boolean) || null };
          block = [];
        } else block.push(l);
      }
    }

    const cm = text.match(/cannot have more than ([\d,]+) of any single thing/);
    const um = text.match(/Your inventory contains ([\d,]+) unique items/i);      // the page's own count: shows a filtered copy
    return { items, cap: cm ? toInt(cm[1]) : null, unique: um ? toInt(um[1]) : null };
  }

  // Orchard page: "7,018 Apple Trees 9,123 Production (With Perks)" for each fruit. Production is the midnight drop.
  function parseOrchard(text) {
    const flat = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ");
    const out = {};
    const re = /([\d,]+) (Apple|Orange|Lemon) Trees ([\d,]+) Production/gi;
    let m;
    while ((m = re.exec(flat))) out[m[2][0].toUpperCase() + m[2].slice(1).toLowerCase()] = { trees: toInt(m[1]), production: toInt(m[3]) };
    return out;
  }

  // Farm page ("Around Your Farm"): { item: per hour }; index.html saves it in each item's own unit (engine storeRates).
  // Each building states its own period (daily, hourly, every 3 or 10 minutes).
  const FARM = [
    { at: "Chicken Coop", per: 24 * 60, items: [["Eggs", "Eggs"], ["Feathers", "Feathers"]] },
    { at: "Cow Pasture", per: 24 * 60, items: [["Milk", "Milk"]] },
    { at: "Raise Raptors to hunt daily", per: 24 * 60, items: [["Antlers", "Antler"], ["Kabobs", "Steak Kabob"]] },
    { at: "Worm Habitat", per: 60, items: [["Worms", "Worms"], ["Gummies", "Gummy Worms"], ["Mealworms", "Mealworms"]] },
    { at: "Plant trees to produce fruit daily", per: 24 * 60, items: [["Apples", "Apple"], ["Oranges", "Orange"], ["Lemons", "Lemon"]] },
    { at: "Produces Trout & Bait daily", per: 24 * 60, items: [["Trout", "Trout"]] },
    { at: "Produces Trout & Bait daily", per: 60, items: [["Grubs", "Grubs"], ["Minnows", "Minnows"]] },   // grubs and minnows drop hourly
    { at: "Grow grapes for wine making", per: 24 * 60, items: [["Grapes", "Grapes"]] },
    { at: "Produces Boards/Wood hourly", per: 60, items: [["Boards", "Board"], ["Wood", "Wood"]] },
    { at: "Produces Iron/Nails every 3 mins", per: 3, items: [["Iron", "Iron"], ["Nails", "Nails"]] },
    { at: "Produces Steel/Wire hourly", per: 60, items: [["Steel", "Steel"], ["Wire", "Steel Wire"]] },
    { at: "Produces Straw every 10 mins", per: 60, items: [["Hourly", "Straw"]] },
    { at: "Stone/Gems every 10 mins", per: 60, items: [["Stone Hourly", "Stone"], ["Stone Hourly", "Sandstone"], ["Coal Hourly", "Coal"]] }   // sandstone drops with stone
  ];
  function parseFarm(text) {
    const flat = text.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ");
    const lower = flat.toLowerCase();
    const out = {};
    for (const b of FARM) {
      const i = lower.indexOf(b.at.toLowerCase());
      if (i < 0) continue;
      const seg = flat.slice(i, i + 220).split(" * ")[0];              // stop at the next building
      for (const [label, item] of b.items) {
        const m = seg.match(new RegExp("([\\d,]+) " + label + "\\b", "i"));
        if (m) out[item] = toInt(m[1]) * 60 / b.per;
      }
    }
    // Crop plots: the next Expand Farm row's price (rows of 4, x10 each, 10T reaches 52; trusted from 1T), else the
    // Plant All button (crop names are 1-2 words, so the seed list can't be misread). knowledge/mechanics/crops.md
    let plots = null;
    const row = flat.match(/Grow more crops Adds another row of crops ([\d.,]+)\s*([KMBTQ]?)\s*Silver/i);
    if (row) {
      const cost = parseFloat(row[1].replace(/,/g, "")) * ({ K: 1e3, M: 1e6, B: 1e9, T: 1e12, Q: 1e15 }[row[2].toUpperCase()] || 1);
      const n = 48 + 4 * Math.round(Math.log10(cost / 1e13));
      if (cost >= 1e12 && n >= 44) plots = n;
    }
    if (plots == null) {
      const pl = flat.match(/Plant All Selected ?(?:GJ \([^)]*\) ?)?(?:\d+ Left Today ?)?[A-Z][A-Za-z'-]*(?: [A-Z][A-Za-z'-]*)? \((\d+)\)/i);
      if (pl) plots = +pl[1];
    }
    if (plots != null) Object.defineProperty(out, "plots", { value: plots, enumerable: false });
    // Storehouse: "Work to increase max inventory 18 Inventory Increase Per Day" (the cap's daily growth, for Slow grinds)
    const grow = flat.match(/Storehouse Work to increase max inventory ([\d,]+) Inventory Increase Per Day/i);
    const sent = flat.match(/Pig Pen Add pigs and fatten them up [\d,]+ Pigs ([\d,]+) Sent Off/i);      // pigs on their way to the Slaughterhouse today
    if (sent) Object.defineProperty(out, "pigsSentOff", { value: toInt(sent[1]), enumerable: false });
    if (grow) Object.defineProperty(out, "capPerDay", { value: toInt(grow[1]), enumerable: false });
    return out;
  }

  // Help Needed page: [{ name, section: "special"|"active"|"personal", npc, kind: "main"|"side"|null, ready, dates }].
  // Each quest is its name (sometimes split over two lines), then "Request from NPC[ - Main Quest]" or
  // "Available Sep 21 - Sep 30", then an optional "READY!".
  function parseQuests(text) {
    const lines = text.split(/\r?\n/).map(clean).filter(Boolean);
    const out = [];
    let section = null, name = [], last = null;
    for (const l of lines) {
      const h = l.match(/^(Special|Active|Personal) Requests\s*\(\d+\)/i);
      if (h) { section = h[1].toLowerCase(); name = []; last = null; continue; }
      if (!section) continue;
      if (/^(Request Totals|Use a PHR Voucher|Community Center)\b/i.test(l)) { section = null; continue; }
      if (l === "READY!") { if (last) last.ready = true; continue; }
      // Any dash (-, –, —) and any spacing before "Main Quest" / "Side Request", since copies differ
      const req = l.match(/^Request from (.+?)(?:\s*[-–—]\s*(Main Quest|Side Request))?\s*$/i);
      const avail = l.match(/^Available (.+)$/);
      if ((req || avail) && name.length) {
        last = { name: name.join(" "), section, npc: req ? req[1] : null, kind: req && req[2] ? (/main/i.test(req[2]) ? "main" : "side") : null, ready: false, dates: avail ? avail[1] : null };
        out.push(last);
        name = [];
        continue;
      }
      name.push(l);
    }
    return out;
  }

  // Perks page and Farm Supply page: each perk is its name, one or more description lines, then "Unlocked"
  // (or a price: "10 Points", "285 Gold", "Requires …"). Returns { page, unlocked: [{ name, desc }] }.
  function parsePerks(text) {
    const lines = text.split(/\r?\n/).map(clean).filter(Boolean);
    const page = /Points Left/i.test(text) && /Perks Avail/i.test(text) ? "perks" : "supply";
    const startAt = lines.findIndex(l => page === "perks" ? /^Farming Perks$/i.test(l) : /^Cap Upgrades$/i.test(l));
    const unlocked = [];
    let block = [];
    for (const l of startAt < 0 ? [] : lines.slice(startAt)) {
      if (/^Consume a meal$/i.test(l)) break;
      // A perk can be listed twice (the weekly "Upgrades on Sale" repeats one): keep the first
      if (/^Unlocked$/i.test(l)) { if (block.length && !unlocked.some(u => u.name === block[0])) unlocked.push({ name: block[0], desc: block.slice(1).join(" ") }); block = []; continue; }
      if (/^[\d,]+ (Points|Gold)$/.test(l) || /^SALE!/.test(l)) { block = []; continue; }
      if (/ (Perks|Upgrades)(\s*\(.*\))?$/i.test(l) && !/[.%]/.test(l) || /^Upgrades on Sale/i.test(l)) { block = []; continue; }   // section headings
      block.push(l);
    }
    return { page, unlocked, misc: /^Miscellaneous Perks/im.test(text) };
  }

  // What the unlocked perks mean for the planner's settings. Only returns settings that page can tell us.
  function perkSettings({ page, unlocked, misc }) {
    const has = n => unlocked.some(u => u.name === n);
    const sum = re => unlocked.reduce((s, u) => { const m = u.desc.match(re); return s + (m ? +m[1] : 0); }, 0);
    const out = {
      cropGrowthCut: sum(/^Crops grow (\d+)% faster/),
      cornGrowthCut: sum(/^Corn grows (\d+)% faster/),
      resourceSaver: sum(/^(\d+)% chance item is duplicated/),
      cookFaster: sum(/Cooking is (\d+)% faster/i),
      // Negotiator I-IV, Fertilizer I, Gift of Persuasion; Artisan I-IV, Toolbox I, Steady Hands (both pages add up)
      sellBonus: sum(/Items sold earn (\d+)% more Silver/i),
      craftSilverCut: sum(/Crafting costs (\d+)% less Silver/i),
      // Friendship: Friendship Primer (+10%) and O.M.G I/II (each a 5% chance of x7-x10 on liked/loved gifts, about +37% on average)
      friendPrimer: sum(/Earn (\d+)% more XP making friendships/i),
      omg: unlocked.filter(u => /^O\.M\.G/i.test(u.name)).length
    };
    if (page === "perks") {
      out.doublePrizes = sum(/^(\d+)% chance a crop will yield 2/);
      out.wanderer = sum(/^(\d+)% chance exploring won't use Stamina/);
      if (misc) out.animalLover = has("Animal Lover");           // only when the copy reaches that section
    } else {
      out.grapeJuice = (1 + sum(/^\+(\d+) Extra Grape Juice uses/)) * (unlocked.some(u => /Doubles Grape Juice use/.test(u.desc)) ? 2 : 1);
      out.reinforcedNetting = has("Reinforced Netting");
      out.lemonSqueezer = has("Lemon Squeezer");
      out.cinnamonSticks = has("Cinnamon Sticks");
      // Sprint Shoes I-III (each doubles the EE an upgrade adds): the highest one unlocked
      out.sprintShoes = Math.max(0, ...unlocked.map(u => (u.name.match(/^Sprint Shoes (I{1,3})$/i) || [, ""])[1].length));
      out.ironDepot = has("Iron Depot");              // one perk: auto-buys Iron and Nails, changes explore drops
      out.orchardNoon = unlocked.some(u => /10% of Orchard Production/i.test(u.desc)) ? 10 : 0;   // Tree Shaker (Tower 170)
      out.antlerNoon = unlocked.some(u => /10% of Antler Production/i.test(u.desc)) ? 10 : 0;     // Antler Snare (Tower 160)
      // Wishing well: 3 free tosses a day, plus Extra Wish (+1) and Extra Wishes I-III (+5, +10, +10) = 29 at most (beta testers +1)
      out.wwTosses = 3 + (unlocked.some(u => /An extra toss into the Well/i.test(u.desc)) ? 1 : 0) + sum(/^\+(\d+) tosses into the Well/i);
    }
    if (page === "perks") out.fishingTrawl = has("Fishing Trawl");
    return out;
  }

  // Friendship levels, from the Friendship Levels page or a profile page: "Name / Level N" pairs. The profile uses short
  // names (Star, Charles, CptThomas, Gary), mapped to the full ones. Also reads the Townsfolk of the Day (2x friendship XP).
  const FRIEND_ALIAS = { "Star": "Star Meerif", "Charles": "Charles Horsington III", "CptThomas": "Captain Thomas", "Cpt Thomas": "Captain Thomas", "Gary": "Gary Bearson V" };
  function parseFriends(text) {
    const lines = text.split(/\r?\n/).map(clean).filter(Boolean);
    let at = lines.findIndex(l => /^Current Levels$/i.test(l));
    if (at < 0) { const i = lines.map(l => /^Friendship Levels$/i.test(l)).lastIndexOf(true); at = i; }
    const levels = {};
    if (at >= 0) for (let i = at + 1; i < lines.length - 1; i++) {
      if (/^(Game Stats|Drink Baba Cola|Consume a meal)$/i.test(lines[i])) break;
      const m = lines[i + 1].match(/^Level (\d+)$/i);
      if (m && !/^Level /i.test(lines[i])) levels[FRIEND_ALIAS[lines[i]] || lines[i]] = +m[1];
    }
    const t = text.match(/(.+?) is the Townsfolk of the Day/i);
    return { levels, totd: t ? (FRIEND_ALIAS[clean(t[1])] || clean(t[1])) : null };
  }

  // One building's own page (players whose home page doesn't list output); each ends with its own sentence.
  // Rates per hour like parseFarm. [building, regex, [[item, group, perDay?]]]
  const BUILDING_PAGES = [
    ["Chicken Coop", /chicken coop is producing ([\d,]+) eggs and ([\d,]+) feathers per day/i, [["Eggs", 1, 1], ["Feathers", 2, 1]]],
    ["Cow Pasture", /cow pasture is producing ([\d,]+) milk per day/i, [["Milk", 1, 1]]],
    ["Raptor Pen", /Raptor Pen is producing ([\d,]+) antlers and ([\d,]+) steak kabobs per day/i, [["Antler", 1, 1], ["Steak Kabob", 2, 1]]],
    ["Worm Habitat", /generate fishing bait every hour\. Currently generating ([\d,]+) per hour/i, [["Worms", 1]]],
    ["Worm Habitat", /generate gummy worms every hour\. Currently generating ([\d,]+) per hour/i, [["Gummy Worms", 1]]],
    ["Worm Habitat", /generate Mealworms every hour\. Currently generating ([\d,]+) per hour/i, [["Mealworms", 1]]],
    ["Trout / Bait Farm", /generate trout every day\. Currently generating ([\d,]+) per day/i, [["Trout", 1, 1]]],
    ["Trout / Bait Farm", /produces grubs every hour[^.]*\. Currently generating ([\d,]+) per hour/i, [["Grubs", 1]]],
    ["Trout / Bait Farm", /produces minnows every hour[^.]*\. Currently generating ([\d,]+) per hour/i, [["Minnows", 1]]],
    ["Vineyard", /generate grapes every day\. Currently generating ([\d,]+) per day/i, [["Grapes", 1, 1]]],
    ["Sawmill", /generate boards every hour\. Currently generating ([\d,]+) per hour/i, [["Board", 1]]],
    ["Sawmill", /generate wood every hour\. Currently generating ([\d,]+) per hour/i, [["Wood", 1]]],
    ["Ironworks", /\(([\d,]+) Iron and ([\d,]+) Nails hourly\)/i, [["Iron", 1], ["Nails", 2]]],
    ["Steelworks", /Currently generating ([\d,]+) Steel and ([\d,]+) Steel Wire every 60 minutes/i, [["Steel", 1], ["Steel Wire", 2]]],
    ["Hay Field", /\(([\d,]+) Straw hourly\)/i, [["Straw", 1]]],
    ["Quarry", /stone and sandstone every 10 minutes\. Currently generating [\d,]+ every 10 minutes\. \(([\d,]+) hourly\)/i, [["Stone", 1], ["Sandstone", 1]]],
    ["Quarry", /generate coal every hour\. Currently generating ([\d,]+) per hour/i, [["Coal", 1]]]
  ];
  const flatText = text => String(text || "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ");
  function parseBuilding(text) {
    const flat = flatText(text), rates = {}, buildings = [];
    for (const [b, re, items] of BUILDING_PAGES) {
      const m = flat.match(re);
      if (!m) continue;
      if (!buildings.includes(b)) buildings.push(b);
      for (const [item, g, daily] of items) rates[item] = toInt(m[g]) / (daily ? 24 : 1);
    }
    const cap = flat.match(/Currently your MAX Inventory is ([\d,]+)/i);   // the Storehouse page: cap and its daily growth
    const grow = flat.match(/it will increase by ([\d,]+) each time you work/i);
    return { buildings, rates, cap: cap ? toInt(cap[1]) : null, capPerDay: grow ? toInt(grow[1]) : null };
  }

  // The Farmer's Market: each unlocked item's whole-stack value at BASE price ("* Iron Cup / − + / [MAX ON HAND] /
  // 1,589,940 Silver"). Base price = value / count, so it needs the inventory count (or the cap for MAX ON HAND).
  // Returns { items: {name: {value, max}}, perks: % from "extra N% due to your unlocked perks" }.
  function parseMarket(text) {
    // Pasted into the site it's plain text (no "* " bullets): the name is the line just above the "− +" buttons
    const lines = String(text || "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const items = {};
    let name = null, max = false, on = false;
    for (let k = 0; k < lines.length; k++) {
      const l = lines[k];
      if (/UNLOCKED INVENTORY/i.test(l)) { on = true; continue; }       // the item list starts here (skips menus and chat)
      if (!on) continue;
      if (/^Locked Inventory$/i.test(l)) break;
      if (/^[−-]\s*\+$/.test(l)) { name = lines[k - 1].replace(/^[*•]\s+/, ""); max = false; continue; }
      if (!name) continue;
      if (/^MAX ON HAND$/i.test(l)) { max = true; continue; }
      const v = l.match(/^([\d,]+) Silver\b/i);
      if (v) { items[name] = { value: toInt(v[1]), max }; name = null; }
    }
    const pk = String(text).match(/extra (\d+)% due to your unlocked perks/i);
    return { items, perks: pk ? +pk[1] : null };
  }
  // One request's own page (quest.php: special and personal requests). "Items Requested": "* Name" / "You have N" / "Nx";
  // "Rewards": "* Silver" / amount (or Gold), then "* Item" / description lines / "Nx". The item links carry quest_id, and the
  // Help Needed sidebar on the same page links that id to the title and "Request from NPC".
  // Returns { id, name, npc, need: [[item, qty]], have: {item: n}, silver, gold, get: [[item, qty]] } or null.
  function parseRequest(text) {
    const raw = String(text || "");
    const id = (raw.match(/quest_id=(\d+)/) || [])[1] || null;
    let name = null, npc = null;
    if (id) {
      const t = raw.match(new RegExp("\\[([^\\]]+)\\]\\([^)]*quest\\.php\\?id=" + id + "\\)\\s*\\n\\s*\\[Request from ([^\\]]+)\\]"));
      if (t) { name = t[1].trim(); npc = t[2].replace(/\s*[-–—]\s*(Main Quest|Side Request)\s*$/i, "").trim(); }
    }
    // A page pasted into the site is plain text: no links and no "* " bullets, so names are found by position
    const lines = raw.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").split(/\r?\n/).map(l => l.trim().replace(/^[*•]\s+/, "")).filter(Boolean);
    const at = lines.findIndex(l => /^Items Requested$/i.test(l)), rw = lines.findIndex(l => /^Rewards$/i.test(l));
    if (at < 0 || rw < at) return null;
    const head = raw.match(/(Personal|Special) Request from ([^\n\]]+)/i);
    if (!npc && head) npc = head[2].trim();
    if (!name && npc) {                            // no links: the sidebar lists the title just above "Request from NPC"
      // A personal request is listed under "Personal Requests (N)": look only there, or a quest from the same
      // townsfolk higher up the sidebar ("A Way Back XXVII / Request from Thomas") lends it its name
      const from = head && /personal/i.test(head[1]) ? Math.max(0, lines.findIndex(l => /^Personal Requests \(\d+\)$/i.test(l))) : 0;
      const k = lines.findIndex((l, i) => i > from && l === "Request from " + npc);
      if (k > 0) name = lines[k - 1];
    }
    // Items Requested: name / "You have N" / "Nx"
    const need = [], have = {};
    const block = lines.slice(at + 1, rw);
    block.forEach((l, k) => {
      const h = l.match(/^You have ([\d,]+)$/i);
      if (h && k > 0) {
        const item = block[k - 1], q = (block[k + 1] || "").match(/^([\d,]+)x$/);
        have[item] = toInt(h[1]);
        if (q) need.push([item, toInt(q[1])]);
      }
    });
    // Rewards: "Silver" / amount (or Gold), then name / description lines / "Nx"
    const get = [];
    let silver = 0, gold = 0, start = rw + 1;
    for (let k = rw + 1; k < lines.length; k++) {
      const l = lines[k];
      if (/^Consume a meal$/i.test(l)) break;
      if (/^(Silver|Gold)$/i.test(l) && /^[\d,]+$/.test(lines[k + 1] || "")) {
        if (/^Silver$/i.test(l)) silver = toInt(lines[k + 1]); else gold = toInt(lines[k + 1]);
        k++; start = k + 1; continue;
      }
      const q = l.match(/^([\d,]+)x$/);
      if (q && k > start) { get.push([lines[start], toInt(q[1])]); start = k + 1; }
    }
    return need.length ? { id, name, npc, kind: head ? head[1].toLowerCase() : null, need, have, silver, gold, get } : null;
  }

  // The Steak Market page (steaks, hourly Steak Kabobs, daily Truffles), plus any of its three history pages.
  // Returns { steak: {price, market, canBuy, owned}, kabob: {price, canBuy, owned}, truffle: {white, black, whiteChance,
  // blackChance, whiteOwned, blackOwned}, history: { truffle: [{date, white, black}], steak: [{date, price, market,
  // volume}], kabob: [{time, price}] } } (parts missing from the paste are null).
  // All Pet Items page: each line is "Item / From Pet / N currently in Inventory / Found N". Items several pets bring are
  // summed: { items: { Straw: { found: 2592, have: 11680, from: { Hedgehog: 2059, Wolf: 533 } } } }
  function parsePets(text) {
    const lines = String(text || "").split(/\r?\n/).map(clean).filter(Boolean), items = {};
    lines.forEach((l, k) => {
      const h = l.match(/^([\d,]+) currently in Inventory$/i);
      if (!h || k < 2) return;
      const from = lines[k - 1].match(/^From (.+)$/i), found = (lines[k + 1] || "").match(/^Found ([\d,]+)$/i);
      if (!from || !found) return;
      const name = lines[k - 2], it = items[name] || (items[name] = { found: 0, have: toInt(h[1]), from: {} });
      it.found += toInt(found[1]);
      it.from[from[1].trim()] = (it.from[from[1].trim()] || 0) + toInt(found[1]);
    });
    return { items };
  }

  // Pet Shop (Town › Pet Shop): "My Pets" lists each pet's name and level, in the game's fixed pet order but without the
  // type (knowledge/mechanics/pets.md); "Available Pets" lists what isn't bought yet. { pets: [{ name, level }], available }
  function parsePetShop(text) {
    const lines = String(text || "").split(/\r?\n/).map(clean).filter(Boolean);
    const at = lines.findIndex(l => /^My Pets$/i.test(l));
    if (at < 0) return null;
    const pets = [], available = [];
    let k = at + 1;
    for (; k < lines.length && !/^Available Pets$/i.test(lines[k]); k++) {
      const m = (lines[k + 1] || "").match(/^Level ([\d,]+)$/i);
      if (m && !/^Level /i.test(lines[k])) { pets.push({ name: lines[k], level: toInt(m[1]) }); k++; }
    }
    for (k++; k < lines.length && !/^Consume a meal$/i.test(lines[k]); k++) if (!/^No pets available$/i.test(lines[k])) available.push(lines[k]);
    return { pets, available };
  }

  // Craftworks page: the recipes in the order they run ("1 / Twine / pauseRemove"; a paused one shows "play" instead of
  // "pause") and the slot count ("You can add up to 13 items total"). { items: [{ name, paused }], slots }
  function parseCraftworks(text) {
    const lines = String(text || "").split(/\r?\n/).map(clean).filter(Boolean), items = [];
    const at = lines.findIndex(l => /Craftworks Items \(\d+\)$/i.test(l));
    if (at < 0) return null;
    // Each item: its place number, its name, then (on the live page) "Inventory: N" / "Out of: X" lines, then its
    // buttons, ending "Remove": "pauseRemove" on one line in a copy, "pause" / "Remove" on two in auto-read's text.
    // A "play" button means the item is paused.
    for (let k = at + 1; k < lines.length - 2; k++) {
      if (/^Save Item Set$/i.test(lines[k])) break;
      if (!/^\d+$/.test(lines[k])) continue;
      const end = lines.slice(k + 2, k + 7).findIndex(l => /Remove$/i.test(l));
      if (end < 0) continue;
      const btns = lines.slice(k + 2, k + 3 + end).filter(l => /^(play|pause)/i.test(l));
      items.push({ name: lines[k + 1], paused: btns.some(l => /^play/i.test(l)) });
      k += 2 + end;
    }
    const s = String(text).match(/add up to ([\d,]+) items total/i);
    return { items, slots: s ? toInt(s[1]) : null };
  }

  // Temple of Reward: each chain is "Reward / Sacrifice: Item / a / b Rewards Claimed / x / y Items Sacrificed", plus
  // "ONE-TIME TEMPLE CHAIN" for event chains. Finished chains are left out. [{ reward, item, done, total, oneTime }]
  function parseTemple(text) {
    const lines = String(text || "").split(/\r?\n/).map(clean).filter(Boolean), out = [];
    lines.forEach((l, k) => {
      const m = l.match(/^Sacrifice: (.+)$/i);
      if (!m || k < 1) return;
      const block = lines.slice(k + 1, k + 4), n = block.map(x => x.match(/^([\d,]+) \/ ([\d,]+) Items Sacrificed/i)).find(Boolean);
      if (!n || toInt(n[1]) >= toInt(n[2])) return;
      out.push({ reward: lines[k - 1], item: m[1].trim(), done: toInt(n[1]), total: toInt(n[2]), oneTime: block.some(x => /ONE-TIME TEMPLE CHAIN/i.test(x)) });
    });
    return out;
  }

  // Bank page: "Silver will grow by 1% every day. The most you can earn each day from interest is 8,000,000 Silver",
  // "Currently in Bank: N Silver" and "Deposit All / N Silver" (silver on hand). knowledge/mechanics/silver.md
  function parseBank(text) {
    const flat = flatText(text);
    const rate = flat.match(/Silver will grow by ([\d.]+)% every day/i), cap = flat.match(/most you can earn each day from interest is ([\d,]+) Silver/i);
    const bank = flat.match(/Currently in Bank: ([\d,]+) Silver/i), hand = flat.match(/Deposit All ([\d,]+) Silver/i);
    if (!rate && !bank) return null;
    return { rate: rate ? parseFloat(rate[1]) / 100 : null, cap: cap ? toInt(cap[1]) : null, bank: bank ? toInt(bank[1]) : null, onHand: hand ? toInt(hand[1]) : null };
  }

  // Community Center goals (on Help Needed and the Community Center): "Daily Goal / Antler for Skeleton Key / 169.29%",
  // "Monthly Goal / Pumpkin for Ghost Candy / 98.99%". { daily: { item, reward, pct }, monthly: {...} }
  function parseCommunity(text) {
    const lines = String(text || "").split(/\r?\n/).map(clean).filter(Boolean), out = {};
    for (const [key, head] of [["daily", /^Daily Goal$/i], ["monthly", /^Monthly Goal$/i]]) {
      const k = lines.findIndex(l => head.test(l)), m = k >= 0 && (lines[k + 1] || "").match(/^(.+?) for (.+)$/), pct = k >= 0 && (lines[k + 2] || "").match(/^([\d.,]+)%$/);
      if (m) out[key] = { item: m[1].trim(), reward: m[2].trim(), pct: pct ? parseFloat(pct[1].replace(/,/g, "")) : null };
    }
    return Object.keys(out).length ? out : null;
  }
  // Town page: each place is "Name / description / status". "READY!" or "N Left" means not done today; no status line
  // means done. Only the daily places that show one: { "Wheel of Borgen": { ready: true }, "Wishing Well": { left: 29 } }
  // Daily Chores is in the sidebar of every page: "Daily Chores / Earn Ancient Coins Daily / 2 Left" (or "Not Started", "Done!")
  const TOWN_DAILY = ["Wheel of Borgen", "Borgen's Treasure Hut", "Borgen's Lost & Found", "House of Cards", "Wishing Well", "The Vault", "Daily Chores"];
  function parseTown(text) {
    const lines = String(text || "").split(/\r?\n/).map(clean).filter(Boolean), out = {};
    for (const name of TOWN_DAILY) {
      const k = lines.findIndex(l => l === name);
      if (k < 0) continue;
      const st = lines[k + 2] || "", left = st.match(/^([\d,]+) Left$/i);
      out[name] = { ready: /^(READY!?|Not Started)$/i.test(st) || !!left, left: left ? toInt(left[1]) : 0 };
    }
    const b = lines.findIndex(l => l === "Bank"), amt = b >= 0 && (lines[b + 2] || "").match(/^([\d.]+)\s*([KMBTQ]?)$/i);
    if (amt) Object.defineProperty(out, "bank", { value: Math.round(parseFloat(amt[1]) * ({ K: 1e3, M: 1e6, B: 1e9, T: 1e12, Q: 1e15 }[amt[2].toUpperCase()] || 1)), enumerable: false });
    return out;
  }
  // Farm page: a building not done today shows "today" (a calendar mark) instead of its numbers: "Raptor Pen / Raise
  // Raptors to hunt daily / today". The buildings still to do.
  function parseFarmToday(text) {
    const lines = String(text || "").split(/\r?\n/).map(clean).filter(Boolean), at = lines.findIndex(l => /^Around Your Farm$/i.test(l));
    return at < 0 ? null : lines.slice(at).map((l, i, a) => /^today$/i.test(l) && i >= 2 ? a[i - 2] : null).filter(Boolean);
  }

  // Pig Pen page: "Pigs (500 / 500)" then each pig as "Name / Level N". { levels: [N, ...], max }
  function parsePigPen(text) {
    const lines = String(text || "").split(/\r?\n/).map(clean).filter(Boolean);
    const at = lines.findIndex(l => /^Pigs \([\d,]+ \/ [\d,]+\)$/i.test(l));
    if (at < 0) return null;
    const max = toInt(lines[at].match(/\/ ([\d,]+)\)/)[1]), levels = [];
    for (let k = at + 1; k < lines.length; k++) {
      if (/^Consume a meal$/i.test(lines[k])) break;
      const m = lines[k].match(/^Level (\d+)$/i);
      if (m) levels.push(+m[1]);
    }
    return levels.length ? { levels, max } : null;
  }

  function parseSteak(text) {
    const flat = String(text || "").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ");
    const num = re => { const m = flat.match(re); return m ? toInt(m[1]) : null; };
    const part = (from, to) => { const i = flat.search(from); if (i < 0) return ""; const rest = flat.slice(i); const j = to ? rest.slice(1).search(to) : -1; return j < 0 ? rest : rest.slice(0, j + 1); };
    const st = part(/About the Steak Market/i, /About the Steak Kabob Market/i), kb = part(/About the Steak Kabob Market/i, /About the Truffle Market/i);
    const tr = flat.match(/single White Truffle sells for ([\d,]+) Silver and a single Black Truffle sells for ([\d,]+)/i);
    const out = {
      steak: st ? { price: (st.match(/Current Market Price: ([\d,]+)/i) || [])[1] ? toInt(st.match(/Current Market Price: ([\d,]+)/i)[1]) : null,
        market: (st.match(/Steak Market is (\w+)/i) || [])[1] || null, canBuy: (st.match(/buy up to ([\d,]+) more Steaks/i) || [])[1] ? toInt(st.match(/buy up to ([\d,]+) more Steaks/i)[1]) : null,
        owned: (st.match(/Steaks Owned: ([\d,]+)/i) || [])[1] ? toInt(st.match(/Steaks Owned: ([\d,]+)/i)[1]) : null } : null,
      kabob: kb ? { price: (kb.match(/Current Market Price: ([\d,]+)/i) || [])[1] ? toInt(kb.match(/Current Market Price: ([\d,]+)/i)[1]) : null,
        canBuy: (kb.match(/buy up to ([\d,]+) more Kabobs/i) || [])[1] ? toInt(kb.match(/buy up to ([\d,]+) more Kabobs/i)[1]) : null,
        owned: (kb.match(/Steak Kabobs Owned: ([\d,]+)/i) || [])[1] ? toInt(kb.match(/Steak Kabobs Owned: ([\d,]+)/i)[1]) : null } : null,
      truffle: tr ? { white: toInt(tr[1]), black: toInt(tr[2]),
        whiteChance: (flat.match(/White Truffle price increase chance at Reset: ([A-Za-z ]+?)(?= Black| White|$)/i) || [])[1] || null,
        blackChance: (flat.match(/Black Truffle price increase chance at Reset: ([A-Za-z ]+?)(?= White| Black|$)/i) || [])[1] || null,
        whiteOwned: num(/White Truffles Owned: ([\d,]+)/i), blackOwned: num(/Black Truffles Owned: ([\d,]+)/i) } : null,
      history: { truffle: [], steak: [], kabob: [] }
    };
    const D = "(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\\d{1,2})";
    const th = part(/Truffle Market History/i), sh = part(/Steak Market History/i), kh = part(/Kabob Market History/i);
    if (th) for (const m of th.matchAll(new RegExp(D + " ([\\d,]+) ([\\d,]+)", "g"))) out.history.truffle.push({ date: m[1] + " " + m[2], white: toInt(m[3]), black: toInt(m[4]) });
    if (sh) for (const m of sh.matchAll(new RegExp(D + " ([\\d,]+) (Stable|Unstable|Risky|Wild) ([\\d,]+)", "g"))) out.history.steak.push({ date: m[1] + " " + m[2], price: toInt(m[3]), market: m[4], volume: toInt(m[5]) });
    if (kh) for (const m of kh.matchAll(new RegExp(D + ", (\\d{1,2} [AP]M) ([\\d,]+)", "g"))) out.history.kabob.push({ time: m[1] + " " + m[2] + ", " + m[3], price: toInt(m[4]) });
    return out;
  }

  // Base prices from a Market paste and inventory counts (cap for MAX ON HAND); whole numbers only (the game's prices are)
  function marketPrices(market, counts, cap) {
    const out = {};
    for (const [n, { value, max }] of Object.entries(market.items)) {
      const c = max ? cap : counts[n];
      if (!(c > 0)) continue;
      const base = value / c;
      if (Math.abs(base - Math.round(base)) < 0.01 && base >= 1) out[n] = Math.round(base);
    }
    return out;
  }

  // A place's Exploring Effectiveness page (its Info button): "George is very knowledgeable about the Forest and can help you
  // explore it more effectively ... You are currently using 104 stamina every time you continue exploring this location."
  // The stamina per tap is the Exploring Effectiveness. knowledge/mechanics/exploring-drinks.md
  function parseExploreInfo(text) {
    const flat = flatText(text);
    const place = flat.match(/is very knowledgeable about (?:the )?(.+?) and can help you explore it more effectively/i);
    const ee = flat.match(/currently using ([\d,]+) stamina every time you continue exploring/i);
    if (!place || !ee) return null;
    const bars = flat.match(/You have eaten ([\d,]+) Protein Bars? in this location/i);
    // The next upgrade's fee: "Pay Fee 1.0T Silver" (some places charge an item, e.g. Corn)
    const fee = flat.match(/Pay Fee ([\d.,]+)\s*([KMBTQ]?)\s+(Silver|[A-Z][A-Za-z']*(?: [A-Z][A-Za-z']*)?)/);
    const amount = fee && Math.round(parseFloat(fee[1].replace(/,/g, "")) * ({ K: 1e3, M: 1e6, B: 1e9, T: 1e12, Q: 1e15 }[fee[2].toUpperCase()] || 1));
    return { place: place[1].trim(), ee: toInt(ee[1]), bars: bars ? toInt(bars[1]) : null, fee: fee ? { amount, unit: fee[3] } : null };
  }

  // The game keeps the page you came from in the copy, ahead of the one on screen: "[Back](…) / Pig Pen / [Back](…) / Town".
  // The last title under a Back link is the page on screen; trusted only when that page's own text is there too.
  const PAGE_TITLES = {
    "Town": ["town", t => /^\s*Market District\s*$/im.test(t)],
    "Bank": ["bank", t => /Currently in Bank/i.test(t)],
    "Temple of Reward": ["temple", t => /Sacrifice: /.test(t)],
    "Pets": ["petshop", t => /^\s*My Pets\s*$/im.test(t) && /About Pets/i.test(t)],
  "Pig Pen": ["pigpen", t => /^\s*Pigs \([\d,]+ \/ [\d,]+\)\s*$/im.test(t)],
  };
  function screenTitle(text) {
    const lines = String(text || "").split(/\r?\n/);
    let title = null;
    lines.forEach((l, i) => { if (/^\s*\[Back\]\(/.test(l) && lines[i + 1]) title = lines[i + 1].trim(); });
    return title;
  }

  function detectPage(text) {
    const onScreen = PAGE_TITLES[screenTitle(text)];
    if (onScreen && onScreen[1](text)) return onScreen[0];
    if (/About the Pig Pen/i.test(text) && /^\s*Pigs \([\d,]+ \/ [\d,]+\)\s*$/im.test(text)) return "pigpen";   // before the farm: it carries the farm list
    if (/About the bank/i.test(text) && /Currently in Bank/i.test(text)) return "bank";
    if (/Sacrifice: /.test(text) && /Items Sacrificed/i.test(text)) return "temple";
    if (/Items added to the Craftworks will be crafted automatically/i.test(text) && /Craftworks Items \(\d+\)/i.test(text)) return "craftworks";
    if (/every item that your pets have brought back/i.test(text) || (/All Pet Items/i.test(text) && /currently in Inventory/i.test(text))) return "pets";
    // The Pet Shop after All Pet Items: that page carries the Pet Shop list first
    if (/About Pets/i.test(text) && /^\s*My Pets\s*$/im.test(text) && /^\s*Available Pets\s*$/im.test(text)) return "petshop";
    if (/currently using [\d,]+ stamina every time you continue exploring/i.test(text)) return "explore-info";
    if (/Points Left/i.test(text) && /Perks Avail/i.test(text)) return "perks";
    if (/About the Truffle Market/i.test(text) && /About the Steak Market/i.test(text)) return "steak";
    if (/due to your unlocked perks/i.test(text) && /UNLOCKED INVENTORY/i.test(text)) return "market";
    if (/^\s*Current Levels\s*$/im.test(text) && /Townsfolk/i.test(text)) return "friends";
    if (/^\s*Friendship Levels\s*$/im.test(text) && /^\s*Game Stats\s*$/im.test(text)) return "friends";      // a profile page
    if (/Cap Upgrades/i.test(text) && /Farming Upgrades/i.test(text)) return "supply";
    // The orchard first: in the Steam app the Orchard page also lists the whole farm ("Around Your Farm")
    if (/About the orchard/i.test(text)) return "orchard";
    // My Inventory on a wide screen also carries the farm sidebar ("Around Your Farm"): its own footer decides
    if (/Inventory Stats/i.test(text) && /cannot have more than [\d,]+ of any single thing/i.test(text)) return "inventory";
    // A building's own page also carries the farm sidebar, so check for its sentence first
    { const b = parseBuilding(text); if (b.buildings.length || b.cap) return "building"; }
    if (/Around Your Farm/i.test(text)) return "farm";
    if (/cannot have more than [\d,]+ of any single thing|Inventory Stats/.test(text)) return "inventory";
    // Mastery Progress: many "n / m Progress" lines, or its "So far, you have N items Mastered" line. A single progress
    // line is an item's own page (its mastery bar), which auto-read hands over too: that must not replace the mastery list
    if ((String(text).match(/[\d,]+\s*\/\s*([\d,]+|∞)\s*Progress/g) || []).length >= 5
      || /[\d,]+ items Mastered, [\d,]+ items Grand Mastered/.test(text)) return "mastery";
    // One request's page carries the Help Needed sidebar, so check for its own headings first
    if (/^\s*Items Requested\s*$/im.test(text) && /^\s*Rewards\s*$/im.test(text)) return "request";
    // The Town page last: its list also shows on the Bank and Temple pages (wide screens), which are read first
    if (/^\s*Market District\s*$/im.test(text) && /Borgen's District/i.test(text)) return "town";
    if (/Active Requests|Special Requests/i.test(text)) return "quests";
    return null;
  }

  // Other pages a copy carries besides the one pasted (the page you came from, the farm sidebar), in the order they
  // appear: each is read quietly before the pasted page, which has the last word
  const CARRIED = [["town", /^\s*Market District\s*$/im], ["farm", /^\s*Around Your Farm\s*$/im],
    ["pigpen", /^\s*Pigs \([\d,]+ \/ [\d,]+\)\s*$/im], ["temple", /^\s*Sacrifice: /m]];
  function carriedPages(text, kind) {
    const t = String(text || "");
    return CARRIED.filter(([k, re]) => k !== kind && re.test(t) && (k !== "temple" || /Items Sacrificed/i.test(t)))
      .map(([k, re]) => [k, t.search(re)]).sort((a, b) => a[1] - b[1]).map(([k]) => k);
  }

  // Silver and gold from the top bar: "[122,730,994,151](https://farmrpg.com/bank.php)   [513](https://farmrpg.com/gold.php)".
  // Only pages copied with that bar (the Steam app) have it; null when it isn't there.
  function parseSilver(text) {
    const s = String(text || "").match(/\[([\d,]+)\]\([^)]*\/bank\.php\)/i);
    if (!s) return null;
    const g = String(text).match(/\[([\d,]+)\]\([^)]*\/(?:steam_)?gold\.php\)/i);
    return { silver: toInt(s[1]), gold: g ? toInt(g[1]) : null };
  }

  // Chat: cut it out before anything reads the page, so a message can't fool detection (and names go nowhere):
  // 1. the panel, from the channel tabs (or first message time) to "View Chat Log";
  // 2. any stray message: a "03:56:17 PM" line, the sender (link or plain name), optional "flag_fill", the message.
  function stripChat(text) {
    let t = String(text || "");
    const end = t.search(/\[?View Chat Log\]?/i);
    if (end >= 0) {
      const head = t.slice(0, end);
      const tabs = head.search(/HELP\s*GLOBAL\s*SPOILERS|^\s*Help\s*\r?\n\s*Global\s*\r?\n/im);
      const firstMsg = head.search(/^\s*\d{1,2}:\d{2}:\d{2}\s?[AP]M\s*$/m);
      const start = tabs >= 0 ? tabs : firstMsg;
      if (start >= 0) {
        const after = t.indexOf("\n", end);
        t = t.slice(0, start) + (after >= 0 ? t.slice(after + 1) : "");
      }
    }
    return t.replace(/^[ \t]*\d{1,2}:\d{2}:\d{2}\s?[AP]M[ \t]*\r?\n[^\n]*\r?\n(?:[ \t]*flag_fill[ \t]*\r?\n)?[^\n]*(?:\r?\n|$)/gm, "");
  }
  // Every page reader strips chat first
  const noChat = f => (text, ...rest) => f(stripChat(text), ...rest);

  const api = { parseMastery: noChat(parseMastery), parseInventory: noChat(parseInventory), parseOrchard: noChat(parseOrchard),
    parseFarm: noChat(parseFarm), parseQuests: noChat(parseQuests), parsePerks: noChat(parsePerks), parseBuilding: noChat(parseBuilding), parseMarket: noChat(parseMarket), marketPrices, parseRequest: noChat(parseRequest), parseSteak: noChat(parseSteak), parseFriends: noChat(parseFriends), perkSettings,
    parseExploreInfo: noChat(parseExploreInfo), parsePets: noChat(parsePets), parseTemple: noChat(parseTemple), parseCraftworks: noChat(parseCraftworks), parsePetShop: noChat(parsePetShop), parseBank: noChat(parseBank), parsePigPen: noChat(parsePigPen), parseCommunity: noChat(parseCommunity), parseTown: noChat(parseTown), parseFarmToday: noChat(parseFarmToday), detectPage: noChat(detectPage), carriedPages: noChat(carriedPages), parseSilver: noChat(parseSilver), stripChat, toInt };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.FRP = Object.assign(root.FRP || {}, api);
})(typeof window !== "undefined" ? window : globalThis);
