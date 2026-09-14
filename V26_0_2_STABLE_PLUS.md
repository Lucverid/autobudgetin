# AutoBudgetin v26.0.2 Stable+

Base: v26.0.1 yang dipertahankan sebagai core stabil/Firestore.

## Prinsip integrasi
- Core Firestore, realtime listener, outbox, local snapshot, transaksi, Home, Financial Plan, dan Decision Lab tidak di-rewrite.
- Tracking baru disimpan sebagai `trackingStable` di dalam `agis_finance_v26_decision_lab`.
- Backup/restore schema v26 otomatis membawa tracking karena `getV26DecisionData()` tetap menjadi sumber backup.
- Factory reset Decision Lab juga otomatis menghapus tracking karena memakai key v26 yang sama.
- Service Worker hanya membersihkan cache AutoBudgetin, tidak cache project lain pada origin yang sama.

## Fitur Stable+ yang ditambahkan
- Realisasi penjualan dari skenario bisnis tersimpan.
- Kalender penjualan + heatmap.
- Catat 0 pcs untuk hari tanpa penjualan.
- Omzet aktual, profit produk, perbandingan H-1/H+1.
- Grafik 7 hari: Pcs / Omzet / Profit.
- Target keuntungan + proyeksi target.
- Target adaptif setelah minimal 3 hari tercatat.
- Faktor penjualan: normal, ramai, promo, hujan, libur/event, stok terbatas, lainnya.
- Ringkasan 7 hari.
- Restock CRUD + biaya aktual; restock menambah modal berjalan/BEP.
- Milestone target harian, balik modal, dan target keuntungan.
- Tracking cicilan + CRUD pembayaran + jatuh tempo.
- Indikator keamanan cicilan.
- Proteksi overpayment.
- Status LUNAS, pembayaran baru dikunci, dan terbuka kembali bila riwayat diedit/dihapus sehingga utang muncul lagi.
- Format nominal Realisasi memakai pemisah ribuan Indonesia.

## Validasi
- 10/10 Node regression tests pass.
- Semua JS/CJS lolos `node --check`.
- `manifest.json` valid.
- Blok core Firestore/sync identik byte-for-byte dengan v26.0.1 base.
