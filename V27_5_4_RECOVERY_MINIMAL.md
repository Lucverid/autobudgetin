# AutoBudgetin v27.5.4 Recovery Minimal

Base: ZIP working yang user upload (`autobudgetin-main (2).zip`).

Perubahan web sengaja minimal:
- load `v27-tracking.js` + `v27-tracking.css`
- load `v27-safe-bridge.js` untuk backup/reset v27
- backup/restore schema v27
- service worker cache dibump dan memasukkan asset v27
- **TIDAK memuat `v26-feature-switcher.js` / CSS**
- fungsi `window.nav`, markup bottom navigation, dan core v26.0.1 tidak diubah

Realisasi tampil langsung di halaman Planning di bawah Decision Lab. Ini sengaja agar tidak ada wrapper navigasi tambahan.
