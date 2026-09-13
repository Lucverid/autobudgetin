# AutoBudgetin v27.0.0 — Patch Only (base v26.1.0)

Patch ini **harus dipasang di atas v26.1.0 stable**. Jangan pakai v26.2.0 sebagai base.

## Yang ditambahkan

### Tracking Penjualan
- Saat **Simpan skenario bisnis**, tracking penjualan otomatis dibuat dan halaman tracking dibuka.
- CRUD penjualan harian.
- CRUD penambahan/restock stok.
- Stok tersisa otomatis.
- Progress balik modal dan target keuntungan.
- Perbandingan target penjualan harian vs realisasi.
- Rata-rata penjualan aktual.
- Estimasi balik modal ikut mundur/maju mengikuti penjualan nyata.
- Tetap bisa membuat tracking dari skenario lama lewat dropdown.

### Tracking Cicilan
- Saat **Simpan simulasi kredit**, tracking cicilan otomatis dibuat.
- CRUD pembayaran cicilan.
- Progress cicilan, total dibayar, sisa cicilan, dan jatuh tempo berikutnya.
- Tanggal jatuh tempo bulanan bisa diubah.
- Tetap bisa membuat tracking dari simulasi lama lewat dropdown.

### Telegram / Apps Script
Backend sekarang membaca tracking v27 dan dapat mengirim:
- target penjualan harian belum tercapai;
- proyeksi balik modal mundur;
- stok hampir habis;
- balik modal tercapai;
- target keuntungan tercapai;
- pengingat cicilan H-7, H-3, H-1, hari H;
- peringatan terlambat H+1, H+3, H+7;
- cicilan lunas.

Notifikasi tetap memakai konfigurasi Telegram + Apps Script yang sudah ada.

## File patch
Timpa file berikut di repo v26.1.0:
- `index.html`
- `service-worker.js`
- `v26-decision-lab.js`
- `v24-5-automation.js`
- `telegram-database-backend.gs`

Tambahkan file baru:
- `v27-tracking.js`
- `v27-tracking.css`

## Penting untuk Telegram
Karena `telegram-database-backend.gs` berubah, setelah menyalin kode Apps Script:
1. Buka project Apps Script yang terhubung ke AutoBudgetin.
2. Ganti isi backend dengan file patch `telegram-database-backend.gs`.
3. **Deploy > Manage deployments > Edit > New version > Deploy**.
4. URL Web App biasanya tetap sama jika deployment yang sama diperbarui.
5. Jalankan **Tes Telegram** dari AutoBudgetin untuk memastikan backend aktif.

## Data lama
Patch tidak menghapus data v26.1.0. Tracking disimpan di localStorage baru:
`agis_finance_v27_tracking`

Backup/restore dan snapshot Google Sheets juga sudah memasukkan data tracking v27.
