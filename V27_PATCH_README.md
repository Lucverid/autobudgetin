# AutoBudgetin v27.1.0 — Patch Only

Base aman: **v26.1.0 stable**. Patch ini juga bisa langsung menimpa **v27.0.0**.
Jangan gunakan v26.2.0 sebagai base.

## Yang baru di v27.1.0

### Kalender penjualan
- Data penjualan sekarang dilihat lewat kalender bulanan.
- Klik tanggal untuk melihat data hari tersebut.
- Tiap tanggal menampilkan jumlah pcs dan omzet secara ringkas.
- Tombol **Hari ini**, bulan sebelumnya, dan bulan berikutnya.
- Tetap nyaman di layar HP kecil.

### Omzet aktual bisa di-adjust
Saat mencatat penjualan, isi:
- tanggal;
- jumlah terjual (pcs);
- **uang yang benar-benar didapat**;
- catatan opsional.

Kalau kolom uang dikosongkan, aplikasi otomatis memakai `pcs × harga jual`.
Kalau ada diskon/promo/perbedaan harga, nominal uang dapat diubah manual dan seluruh tracking memakai nominal aktual tersebut.

### CRUD lengkap
Penjualan mendukung:
- **Create** — tambah catatan penjualan;
- **Read** — kalender + detail tanggal;
- **Update** — edit pcs, omzet, tanggal, dan catatan;
- **Delete** — hapus catatan penjualan.

Restock dan pembayaran cicilan tetap punya CRUD seperti v27.0.0.

### Perbandingan hari
Pada tanggal yang dipilih, aplikasi menampilkan:
- perbandingan dengan 1 hari sebelumnya;
- perbandingan dengan 1 hari setelahnya;
- selisih pcs;
- persentase perubahan pcs;
- selisih omzet;
- persentase perubahan omzet.

Jika hari pembanding belum punya data, aplikasi menampilkan **Belum ada data** agar tidak membuat kesimpulan palsu.

### Chart, bukan full text
Ada chart tren 7 hari dengan pilihan:
- **Pcs**;
- **Omzet**.

Chart mengikuti tanggal yang sedang dipilih di kalender dan menggunakan Chart.js yang sudah ada di AutoBudgetin, jadi tidak menambah library online/billing.

### Proyeksi memakai omzet aktual
Data lama tetap kompatibel. Penjualan lama tanpa field omzet akan dihitung dari harga jual skenario.
Data baru memakai omzet aktual, sehingga diskon/promo tidak membuat analisis terlihat lebih untung dari kenyataan.

## Telegram v27.1.0
Backend Apps Script sudah diperbarui.

Telegram sekarang bisa mengirim notifikasi ketika:
- penjualan baru dicatat;
- catatan penjualan diedit;
- catatan penjualan dihapus;
- target harian belum tercapai;
- proyeksi balik modal mundur;
- stok hampir habis;
- balik modal tercapai;
- target keuntungan tercapai;
- pembayaran cicilan dicatat;
- pembayaran cicilan diedit;
- pembayaran cicilan dihapus;
- cicilan mendekati jatuh tempo / terlambat / lunas.

Notifikasi penjualan juga membawa **pcs + omzet aktual** dan perbandingan dengan hari sebelumnya jika tersedia.

## File patch
Timpa file berikut:
- `index.html`
- `service-worker.js`
- `v26-decision-lab.js`
- `v24-5-automation.js`
- `telegram-database-backend.gs`

Tambahkan / timpa:
- `v27-tracking.js`
- `v27-tracking.css`

## Setelah upload GitHub
Karena cache PWA dinaikkan ke `v27.1.0`, browser akan mengambil JS/CSS tracking terbaru setelah service worker baru aktif. Jika tampilan lama masih tertahan, tutup tab AutoBudgetin lalu buka ulang sekali.

## Wajib untuk Telegram
Karena `telegram-database-backend.gs` berubah:
1. Buka Apps Script backend AutoBudgetin.
2. Ganti isi script dengan `telegram-database-backend.gs` dari patch ini.
3. Pilih **Deploy → Manage deployments → Edit → New version → Deploy**.
4. Gunakan deployment yang sama supaya URL Web App tetap sama.
5. Di AutoBudgetin tekan **Tes Telegram**.

Data lama v26.1.0 / v27.0.0 tidak dihapus. Tracking tetap memakai localStorage:
`agis_finance_v27_tracking`.
