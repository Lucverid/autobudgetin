# Agis Finance v24.4 — Smart Control + Telegram

v24.4 dibuat sebagai lapisan add-on. Logic utama v24.3 tetap dipertahankan; fitur baru berada di `v24-4-features.js` + `v24-4-features.css`.

## Fitur baru
- Essential vs Non-essential spending (dengan klasifikasi transaksi + fallback kategori).
- Safe Floor / saldo minimum yang jangan dipakai.
- Weekly Review 7 hari.
- Anomaly Alert berbasis pola pengeluaran historis.
- Spending Heatmap kalender bulanan.
- What-if Simulator.
- Financial Score 0–100.
- Goal Priority otomatis.
- Telegram Notifications melalui relay Cloudflare Worker, tanpa menyimpan bot token di frontend.

## Telegram
File contoh backend: `telegram-worker.js`.
Panduan setup: `TELEGRAM_SETUP.md`.

## PWA
Cache dinaikkan ke `agis-finance-v24-4` dan memasukkan asset add-on v24.4.
