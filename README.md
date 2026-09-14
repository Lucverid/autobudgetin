# AutoBudgetin v26.0.8 STABLE+ — Decision Coach

Patch dari v26.0.7 STABLE+.

## Yang baru
- Decision Lab sekarang memberi **Saran terbaik** secara otomatis saat angka diubah.
- Analisis bisnis memberi langkah konkret: harga rekomendasi, minimal unit/hari untuk menutup biaya tetap, opsi menurunkan stok awal jika modal kurang, evaluasi margin, kecepatan balik modal, dan saran uji pasar 7 hari.
- Simulasi kredit memberi langkah konkret: keputusan tunda/revisi/aman, DP yang lebih sehat, tenor alternatif, kisaran harga barang yang lebih sesuai, buffer bulanan, total biaya kredit, serta pengecekan DP + admin terhadap uang bebas.
- Feedback berubah real-time mengikuti input; bukan skor acak.
- Perbaikan input Rupiah v26.0.7 tetap dipertahankan dan diuji regresi.

## File yang ditimpa di GitHub
1. `index.html`
2. `service-worker.js`
3. `v26-decision-lab.js`

Apps Script **tidak perlu deploy ulang** untuk update ini.

## Catatan
Feature Switcher v26.0.6, online retry, tracking, backup, dan automation tidak diubah oleh patch ini.
