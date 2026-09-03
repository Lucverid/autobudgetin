# v24.5 — Always-on Automation + Database Manager

- Added Google Apps Script + Google Sheets backend for server-side Telegram notifications without Cloud Billing.
- Added automatic snapshot sync after app data changes.
- Added visible Google Sheets database tables for expenses, incomes, transfers, goals and recurring data.
- Added Database Manager with JSON backup, preview-before-import, Sheets database wipe and guarded full reset.
- Added cleaner Automation Center UI and hid the legacy Cloudflare relay card to avoid duplicate configuration.
- Telegram token remains server-side in Apps Script Properties; frontend stores only Web App URL + App Key.
- Existing v24.4 financial logic remains intact.
