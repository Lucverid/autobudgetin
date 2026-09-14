# AutoBudgetin v26.0.2 STABLE+

Base: v26.0.1 yang di-upload user dan dinilai paling stabil.

Prinsip update:
- Tidak mengganti v24-5-automation.js.
- Tidak mengganti v25-features.js.
- Tidak mengubah logika inti Home, transaksi, Firestore, Decision Lab, atau Financial Plan.
- Fitur baru hidup sebagai add-on terisolasi di dalam Decision Lab dan baru merender saat panel Realisasi dibuka.
- Tracking disimpan sebagai `trackingStable` di dalam state `agis_finance_v26_decision_lab`, sehingga backup/restore schema v26 yang sudah ada otomatis ikut membawanya.

Fitur baru:
- Tracking penjualan dari skenario bisnis tersimpan.
- Kalender penjualan + heatmap.
- Catat 0 pcs untuk hari buka tapi tidak laku.
- Omzet aktual terpisah dari qty.
- Profit setelah biaya produk.
- Perbandingan H-1 / H+1.
- Chart 7 hari Pcs / Omzet / Profit.
- Target keuntungan + proyeksi hari/minggu/bulan.
- Target adaptif setelah minimal 3 hari tercatat.
- Faktor hari: Normal, Ramai, Promo, Hujan, Libur/event, Stok terbatas, Lainnya.
- Weekly summary 7 hari.
- Restock CRUD + biaya aktual; biaya restock menambah modal berjalan/BEP.
- Tracking cicilan + CRUD pembayaran + jatuh tempo.
- Indikator keamanan cicilan.
- Telegram event tracking + reminder target, weekly business, dan jatuh tempo (backend perlu redeploy).

Offline/backup:
- Add-on dicache Service Worker.
- Data tracking ikut backup schema v26 melalui Decision Lab state.
- Factory Reset v26 otomatis menghapus tracking karena satu key yang sama.
