# AutoBudgetin v27.5.3 SAFE — Full Pack

Full project pack rebuilt on the **v27.4.0 stable core**.

## Why this build
v27.4.0 was the last stable build where the main navigation, core finance flow, Firebase/local data flow, Planning switcher, and PWA shell worked normally. v27.5.3 SAFE keeps that core and adds the newer tracking intelligence through isolated files instead of modifying the core v24/v25 modules.

## Safe core kept from v27.4.0
- Main `index.html` structure and navigation behavior
- `v24-5-automation.js`
- `v25-features.js`
- Firebase/local snapshot flow
- Financial Plan feature switcher
- Core transaction, budget, Decision Lab, CRUD, and PWA behavior

## New/updated in v27.5.3 SAFE
- Sales daily profit
- Sales calendar heatmap
- Adaptive target suggestions
- 7-day business summary
- Sales factors: Promo / Hujan / Ramai / Libur / Stok terbatas
- Chart metric: Pcs / Omzet / Profit
- Credit safety indicator
- 0 pcs sales record support
- Restock cost included in BEP/capital calculation
- Restock CRUD Telegram notifications
- `v27-safe-bridge.js` for v27 backup/export integration without rewriting the older v25 core

## Upload
Upload **all files in this folder** to the repository root, replacing files with the same names.

Important: do not mix this pack with the old v27.5.1/v27.5.2 patch files after upload. This full pack already contains the intended versions.

## Telegram
`telegram-database-backend.gs` is included. If your Apps Script is already on the v27.5.1 backend, it is compatible. Otherwise replace the Apps Script code with this file and deploy a new version.
