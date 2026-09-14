# AutoBudgetin v27.5.4 Recovery — Safe Feature Switcher

Base ini dibuat LANGSUNG dari file upload:
`autobudgetin-main (3).zip`

Feature switcher Planning:
- Decision Lab
- Realisasi
- What-if
- Laporan

Budget Planning + Bill Calendar tetap tampil di atas switcher.

Yang sengaja tidak disentuh:
- window.nav / bottom navigation
- transaksi dan kalkulasi finance
- Firebase core
- Decision Lab logic
- Realisasi / milestone logic
- v24-5 automation
- v25-features
- backend Telegram

Switcher baru:
- tidak membungkus atau mengganti window.nav
- tidak memakai DOM observer permanen
- tidak memindahkan card fitur
- hanya membuat tab dan hide/show card
- pilihan terakhir disimpan di localStorage

Upload PATCH paling aman:
1. index.html
2. service-worker.js
3. v27-feature-switcher-safe.js
4. v27-feature-switcher-safe.css

File v26-feature-switcher.js / .css lama boleh tetap ada di repo,
tetapi build ini TIDAK memuat file lama tersebut.

Tes sesudah deploy:
Home → Riwayat → + → Planning → Settings
lalu di Planning:
Decision Lab → Realisasi → What-if → Laporan

Jangan clear site data sebelum tes.
