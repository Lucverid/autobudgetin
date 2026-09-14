# AutoBudgetin v27.5.4 — Service Worker Repair

Masalah yang ditemukan di repo:
- index.html sudah v27.5.4 SAFE
- v27-tracking.js / v27-tracking.css / v27-safe-bridge.js sudah versi baru
- tetapi service-worker.js masih versi lama v26.0.9

Upload/replace HANYA:
1. service-worker.js

Jangan clear site data sebelum mengetes ulang, supaya data lokal yang masih ada tidak ikut hilang.
Setelah GitHub Pages selesai deploy:
1. Tutup semua tab/PWA AutoBudgetin.
2. Buka URL web dari browser.
3. Reload sekali.
4. Tes Home, Riwayat, +, Planning, Settings.
5. Kalau web normal, baru buka/install PWA lagi.
