# AutoBudgetin v27.5.4 Integrated — User Base

Dibangun langsung dari ZIP yang diberikan user, bukan dari full-pack lama. Core finance lama tetap dipertahankan.

## Fitur yang diaktifkan
- Realisasi penjualan berbasis kalender
- Profit aktual harian
- Heatmap penjualan
- Target adaptif setelah cukup data
- Ringkasan 7 hari
- Faktor penjualan (ramai/promo/hujan/event/stok/dll)
- Grafik Pcs / Omzet / Profit
- Restock + biaya restock masuk perhitungan BEP
- Tracking cicilan + indikator keamanan cicilan
- Cicilan lunas: apresiasi, saran, input pembayaran dikunci, history tetap editable
- Target harian/BEP/target keuntungan: apresiasi dan saran sekali per milestone
- Backup schema v27 membawa data Realisasi
- Factory Reset juga membersihkan Decision Lab/Realisasi
- PWA service worker konsisten dengan file yang benar-benar dipakai
- Backend Telegram v27.5 disertakan untuk notif tracking/weekly/risk

## Deployment
Untuk menghindari campur cache, upload semua file pack ini dalam satu commit / batch. Jangan gabungkan lagi dengan full-pack v27.5.1/v27.5.2 lama.

Apps Script hanya perlu redeploy jika ingin memakai notif Telegram tracking terbaru.
