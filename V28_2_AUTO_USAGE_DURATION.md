# AutoBudgetin v28.2.0 — Automatic Usage Duration

## Perubahan utama

- Input manual **“Dipakai berapa hari?”** diganti menjadi checkbox **“Hitung durasi otomatis”**.
- Saat checkbox aktif, satu pembayaran dihitung dari tanggal transaksi sampai transaksi berikutnya untuk kebutuhan yang sama.
- Kebutuhan yang sama dicocokkan dari **keterangan** yang dinormalisasi (contoh `Bensin`, `bensin`, dan `BENSIN` dianggap sama).
- Jika keterangan kosong, sistem fallback ke **kategori + jenis pemakaian**.
- Transaksi terbaru yang belum punya pembelian berikutnya ditandai **“berjalan”** dan durasinya bertambah mengikuti tanggal saat aplikasi dibuka.
- Transaksi berikutnya tidak wajib ikut dicentang; keberadaannya tetap dapat menjadi batas akhir transaksi sebelumnya yang sedang dihitung.
- Money Review Center, riwayat transaksi, Weekly Money Review, notifikasi Telegram, dan shortcut **⏳ Daya Tahan** membaca durasi otomatis yang sama.
- Data `usageDays` lama tetap dibaca sebagai data legacy agar histori v28.0/v28.1 tidak hilang.

## Contoh

- 1 Sep: Bensin Rp30.000, checkbox aktif.
- 6 Sep: beli Bensin lagi.
- Pembayaran 1 Sep otomatis menjadi **5 hari**, biaya efektif **Rp6.000/hari**.
- Pembayaran 6 Sep yang checkbox-nya aktif mulai dihitung lagi sampai pembelian Bensin berikutnya.

## Catatan pencocokan

Agar hasil paling akurat, gunakan keterangan yang konsisten untuk barang/kebutuhan yang ingin dibandingkan, misalnya `Bensin`, `Telur`, `Beras`, `Galon`, atau nama langganan tertentu.

## Deploy

1. Update file web ke GitHub Pages.
2. Ganti isi `Code.gs` Apps Script dengan `telegram-database-backend.gs` v28.2.
3. Deploy ulang Web App sebagai **New version** pada deployment lama.
4. Shortcut Telegram yang sudah dipasang tidak perlu dibuat ulang bila webhook tetap memakai deployment URL yang sama. Jalankan **Tes Telegram** untuk memastikan backend v28.2 aktif.

## Validasi

- Syntax `index.html` inline JS: lulus.
- Syntax `v28-auto-budget-review.js`: lulus.
- Syntax backend Apps Script (V8-compatible JS): lulus.
- Regression suite utama lama: **21/21 lulus**.
- Test baru Auto Usage Duration: **lulus** (termasuk kasus 1 Sep → 6 Sep = 5 hari dan transaksi aktif yang masih berjalan).
