# AutoBudgetin v27.5.4 SAFE — Freeze Hotfix

Base: v27.5.3 SAFE (core tetap v27.4.0 stable).

Perbaikan:
- Menghapus pemindahan paksa `#v27-tracking` setiap MutationObserver aktif.
- Observer tracking sekarang hanya reinject jika card tracking benar-benar hilang.
- Mencegah loop antar observer Financial Plan yang bisa mengunci main thread dan memunculkan "Halaman Tidak Merespons".
- Bump asset query + Service Worker cache supaya browser tidak memakai JS lama.

Upload/replace ke root repo:
1. `index.html`
2. `service-worker.js`
3. `v27-tracking.js`

Tidak perlu ubah Apps Script Telegram, `v27-safe-bridge.js`, CSS, atau file core v27.4 lainnya.
