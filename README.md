# AutoBudgetin v27.5.5 SAFE — Lazy Stability Hotfix

Fix khusus freeze total di Home setelah v27.5.x.

Perubahan utama:
- `v27-tracking.js` TIDAK lagi inject/render saat startup.
- Tidak ada MutationObserver v27 saat startup.
- Kalender, chart, weekly intelligence, dan icon tracking baru dirender ketika user membuka tab `Realisasi` atau mulai tracking dari Decision Lab.
- Home, Riwayat, tombol +, dan Settings tidak menunggu modul tracking baru.
- Cache PWA dibump supaya browser tidak terus memakai v27.5.4.

Upload/replace hanya:
1. index.html
2. service-worker.js
3. v27-tracking.js

Tidak perlu update Apps Script Telegram.
