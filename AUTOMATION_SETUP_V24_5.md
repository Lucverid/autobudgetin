# Agis Finance v24.5 — Notifikasi Otomatis Gratis + Database Google Sheets

Versi ini memakai **Google Sheets + Google Apps Script + Telegram Bot API**. Tidak perlu mengaktifkan Cloud Billing dan tidak perlu kartu kredit. Apps Script menjalankan pengecekan terjadwal setiap jam, jadi notifikasi tetap dapat terkirim walaupun PWA sedang ditutup.

> Catatan penting: layanan gratis pihak ketiga punya kuota dan kebijakan yang dapat berubah. Karena itu tidak ada cara teknis untuk menjamin "gratis selamanya" 100%. Arsitektur ini sengaja tidak membutuhkan billing, dan seluruh data tetap bisa dibackup JSON supaya mudah dipindahkan bila suatu hari layanan berubah.

## Setup sekali saja

1. Buat Google Sheet baru, misalnya **Agis Finance Database**.
2. Buka **Extensions → Apps Script**.
3. Hapus kode contoh lalu copy seluruh isi `telegram-database-backend.gs`.
4. Save. Jalankan fungsi `setupAgisFinance()` sekali dan berikan permission.
5. Kembali ke Sheet. Buka tab **Config**:
   - B2 = Telegram BOT_TOKEN
   - B3 = Telegram CHAT_ID
   - B4 = APP_KEY buatan sendiri (password acak panjang)
6. Menu **Agis Finance → Simpan secret dari Config**. BOT_TOKEN dan APP_KEY akan dipindahkan ke Script Properties.
7. Apps Script → **Deploy → New deployment → Web app**.
   - Execute as: Me
   - Who has access: Anyone
8. Copy Web App URL (`.../exec`).
9. Di PWA buka **Settings → Automation & Database**, tempel URL dan APP_KEY yang sama.
10. Tekan **Simpan**, **Sync sekarang**, lalu **Tes Telegram**.

## Cara kerja

- Setiap ada perubahan data, PWA mengirim snapshot ke Apps Script setelah jeda singkat.
- Google Sheet membuat tabel yang bisa dibaca langsung: Expenses, Incomes, Transfers, Goals, Recurring, dan Snapshot.
- Trigger Apps Script memeriksa kondisi setiap jam tanpa perlu membuka PWA.
- Notifikasi dideduplikasi supaya warning yang sama tidak spam.
- Weekly Review otomatis dijadwalkan Senin sekitar jam 08:00 sesuai timezone project Apps Script. Set timezone project ke **Asia/Jakarta**.

## Backup / Import / Hapus

Di Settings tersedia **Database Manager**:
- Backup JSON: menyimpan salinan portable data aplikasi.
- Preview Import: membaca isi file dulu, menampilkan ringkasan + transaksi terbaru, baru tombol Terapkan muncul.
- Hapus DB Sheets: hanya membersihkan mirror Google Sheets, data aplikasi/Firestore tidak ikut hilang.
- Reset Semua Data: menghapus state aplikasi dan mengantrikan penghapusan ke Firestore. Ada konfirmasi dua tahap dan wajib mengetik `HAPUS`.

Sebaiknya selalu **Backup JSON sebelum Reset Semua Data**.
