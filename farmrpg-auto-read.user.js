// ==UserScript==
// @name         FarmRPG Next Steps: auto-read
// @namespace    farmrpg-next-steps
// @version      1.0.1
// @description  Hands the text of each FarmRPG page you open to the FarmRPG Next Steps planner, so you don't have to copy and paste. Read-only: it loads nothing from FarmRPG, clicks nothing and changes nothing on the game's pages.
// @match        https://farmrpg.com/*
// @match        https://www.farmrpg.com/*
// @match        https://*.github.io/FarmRPG-Next-Steps/*
// @match        http://localhost:5174/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @run-at       document-idle
// @noframes
// ==/UserScript==

// Two halves of one script, sharing the userscript manager's storage:
// - on FarmRPG: after you open a page or click something, wait for the page to settle, then keep its visible text
//   (what Ctrl+A, Ctrl+C would copy). Nothing is sent anywhere and no request is made to the game.
// - on the planner: pass the kept pages to it whenever its tab is in view. The planner reads each one once and skips
//   pages it doesn't use.
(function () {
  "use strict";
  const KEY = "pages", MAX = 30;            // the last 30 game pages, one per address

  if (/(^|\.)farmrpg\.com$/.test(location.hostname)) game();
  else if (document.querySelector('meta[name="frp-planner"]')) planner();

  function game() {
    let last = "", obs = null, quiet = null, cap = null;
    const keep = () => {
      if (document.hidden) return;
      const text = document.body && document.body.innerText;
      if (!text || !text.trim() || text === last) return;
      last = text;
      const where = location.hash || location.pathname;
      const pages = GM_getValue(KEY, []).filter(p => p.where !== where);
      pages.push({ id: Date.now() + "-" + Math.random().toString(36).slice(2), where, at: Date.now(), text });
      GM_setValue(KEY, pages.slice(-MAX));
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
    const post = m => window.postMessage(m, location.origin);
    const flush = () => {
      if (document.hidden) return;                            // wait until you look at it
      GM_getValue(KEY, []).slice().sort((a, b) => a.at - b.at)  // oldest first: the newest has the last word
        .forEach(p => post({ type: "frp-auto-page", id: p.id, where: p.where, at: p.at, text: p.text }));
    };
    post({ type: "frp-auto-hello" });
    GM_addValueChangeListener(KEY, flush);
    document.addEventListener("visibilitychange", flush);
    flush();
  }
})();
