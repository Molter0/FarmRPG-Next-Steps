# Shared Truffle prices (idea, not built)

**Decided 2026-11-10: not building it.** Owner's answer: "no, it complicates things unnecessarily". Kept as a record of the idea; nothing needs a decision.

A Cloudflare Worker + KV (free) would have let one player's Steak Market paste give everyone today's Truffle prices.

- Only the two prices and the date would be sent; two exact matching reports confirm a day.
- Plausible ranges and a per-device limit guard against false reports.
- r/FarmRPG gets about one Truffle post a week, mostly "% of best value" titles, so a Reddit reader would only catch notable days.
- The daily Steak Market reminder stays as it is: each player pastes their own prices.
