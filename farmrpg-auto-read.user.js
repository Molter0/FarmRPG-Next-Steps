// ==UserScript==
// @name         FarmRPG Next Steps: auto-read
// @namespace    farmrpg-next-steps
// @version      1.2.0
// @updateURL    https://molter0.github.io/FarmRPG-Next-Steps/farmrpg-auto-read.user.js
// @downloadURL  https://molter0.github.io/FarmRPG-Next-Steps/farmrpg-auto-read.user.js
// @description  Hands the text of each FarmRPG page you open to the FarmRPG Next Steps planner, so you don't have to copy and paste. Read-only: it loads nothing from FarmRPG, clicks nothing and changes nothing on the game's pages.
// @match        https://farmrpg.com/*
// @match        https://www.farmrpg.com/*
// @match        https://*.github.io/FarmRPG-Next-Steps/*
// @match        http://localhost:5174/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @run-at       document-idle
// @noframes
// ==/UserScript==

// Two halves of one script, sharing the userscript manager's storage:
// - on FarmRPG: after you open a page or click something, wait for the page to settle, then keep its visible text
//   (what Ctrl+A, Ctrl+C would copy). Nothing is sent anywhere and no request is made to the game.
// - on the planner: pass the kept pages to it whenever its tab is in view. The planner reads each one once and skips
//   pages it doesn't use.
// Storage: each page's text under its own key ("page:" + address), plus a small index of the latest 30, so a click
// writes only the page that changed; "here" is the page you're on now.
(function () {
  "use strict";
  const INDEX = "index", MAX = 30, HERE = "here", PAGE = where => "page:" + where;

  if (/(^|\.)farmrpg\.com$/.test(location.hostname)) game();
  else if (document.querySelector('meta[name="frp-planner"]')) planner();

  function game() {
    if (GM_getValue("pages", null)) GM_deleteValue("pages");          // 1.1 kept every page in one big value
    let last = "", obs = null, quiet = null, cap = null, here = null;
    const keep = () => {
      if (document.hidden) return;
      // The page you are on, even when its text hasn't changed: the planner's Here card and Checklist follow it
      const where = location.hash || location.pathname + location.search;
      if (!here || here.where !== where || Date.now() - here.at > 60e3) { here = { where, at: Date.now() }; GM_setValue(HERE, here); }
      const text = document.body && document.body.innerText;
      if (!text || !text.trim() || text === last) return;
      last = text;
      const entry = { id: Date.now() + "-" + Math.random().toString(36).slice(2), where, at: Date.now() };
      GM_setValue(PAGE(where), { ...entry, text });
      const index = GM_getValue(INDEX, []).filter(p => p.where !== where);
      index.push(entry);
      while (index.length > MAX) GM_deleteValue(PAGE(index.shift().where));
      GM_setValue(INDEX, index);                                         // last: the planner listens to this one
      console.info(`[FarmRPG auto-read] kept ${where} (${text.length} characters)`);
    };
    console.info("[FarmRPG auto-read] running on this tab");
    // Wait until the page stops changing (0.7 s with no new content, at most 5 s), so a page that is still loading
    // isn't kept half-drawn. Countdown timers keep ticking, hence the 5 s ceiling.
    const settle = (first = 1500) => {
      const done = () => { if (obs) obs.disconnect(); obs = null; clearTimeout(quiet); clearTimeout(cap); keep(); };
      if (obs) obs.disconnect();
      clearTimeout(quiet); clearTimeout(cap);
      obs = new MutationObserver(() => { clearTimeout(quiet); quiet = setTimeout(done, 700); });
      obs.observe(document.body, { childList: true, subtree: true });
      quiet = setTimeout(done, first);
      cap = setTimeout(done, 5000);
    };
    addEventListener("hashchange", () => settle());
    addEventListener("popstate", () => settle());
    addEventListener("click", () => settle(), true);         // opening a page, a mastery tier, a menu
    document.addEventListener("visibilitychange", () => { if (!document.hidden) settle(); });
    settle(2000);
  }

  function planner() {
    const post = m => window.postMessage(m, location.origin), sent = new Set();
    // Pages this tab hasn't been given yet, oldest first (the newest has the last word), only while you look at it
    const flush = () => {
      if (document.hidden) return;
      for (const p of GM_getValue(INDEX, []).slice().sort((a, b) => a.at - b.at)) {
        if (sent.has(p.id)) continue;
        const page = GM_getValue(PAGE(p.where), null);
        if (!page || page.id !== p.id) continue;                         // replaced since: the newer one comes next time
        sent.add(p.id);
        post({ type: "frp-auto-page", id: page.id, where: page.where, at: page.at, text: page.text });
      }
    };
    const where = () => { const h = GM_getValue(HERE, null); if (h) post({ type: "frp-auto-here", where: h.where, at: h.at }); };
    post({ type: "frp-auto-hello", version: 3 });
    where();
    GM_addValueChangeListener(HERE, where);                 // light: sent even while this tab is hidden
    GM_addValueChangeListener(INDEX, flush);
    document.addEventListener("visibilitychange", flush);
    flush();
  }
})();
