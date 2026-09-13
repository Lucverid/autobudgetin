# AutoBudgetin v27.5.0 — Intelligence Patch

Base yang direkomendasikan: **v27.4.0 Stability**.

## Yang baru

1. **Target penjualan adaptif**
   - Setelah minimal 3 hari penjualan tercatat, AutoBudgetin membaca sampai 7 hari data terakhir.
   - Menampilkan saran target pcs/hari jika ritme aktual berbeda cukup jauh.
   - User tetap harus menekan tombol untuk menerapkan target baru; histori penjualan lama tidak diubah.
   - Perubahan target dicatat di `targetAdjustments` dan ikut backup.

2. **Profit aktual per hari**
   - `profit = omzet aktual - (HPP/unit × pcs terjual)`.
   - Ditampilkan pada tanggal terpilih, ringkasan 7 hari, chart Profit, dan Telegram CRUD penjualan.
   - Label menggunakan "laba setelah biaya produk" agar tidak disalahartikan sebagai laba bersih setelah semua biaya tetap.

3. **Calendar heatmap**
   - Intensitas tanggal mengikuti performa pcs terhadap target aktif.
   - Tetap mempertahankan klik tanggal, CRUD, pcs, dan omzet.

4. **Ringkasan 7 hari**
   - Total pcs, omzet, laba setelah biaya produk, target harian tercapai, hari terbaik/terendah, dan perubahan ritme BEP.
   - Dibuat collapsible supaya halaman tetap lega.
   - Telegram mengirim ringkasan bisnis tiap **Minggu sekitar pukul 20.00** melalui hourly trigger yang sudah ada.

5. **Faktor penjualan**
   - Pilihan: Normal, Ramai, Promo, Hujan, Libur/Event, Stok terbatas, Lainnya.
   - Faktor ikut CRUD penjualan, backup, offline, snapshot database, dan notifikasi Telegram.
   - Insight membaca faktor yang paling sering muncul pada hari di atas rata-rata tanpa mengklaim sebab-akibat secara pasti.

6. **Indikator keamanan cicilan**
   - Status: Aman / Mulai berat / Berisiko.
   - Utamanya melihat saldo bebas sekarang setelah seluruh target cicilan aktif, lalu mempertimbangkan rasio cicilan terhadap pemasukan bulan berjalan jika tersedia.
   - Backend Telegram memberi warning bulanan bila kondisi masuk kategori berisiko.

## File yang perlu ditimpa di GitHub

- `index.html`
- `service-worker.js`
- `v27-tracking.js`
- `v27-tracking.css`

## Telegram — WAJIB update Apps Script

File backend berubah:

- `telegram-database-backend.gs`

Tempel seluruh isi file tersebut ke project Google Apps Script yang sama, lalu:

**Deploy → Manage deployments → Edit → New version → Deploy**

Tidak perlu membuat Sheet baru atau setup ulang token/chat ID/App Key jika backend lama sudah berfungsi.

## Backup & Offline

Field baru disimpan di object v27 yang sama, jadi mekanisme Backup/Restore schema v27 yang sudah ada otomatis membawanya. `v27-tracking.js` dan `v27-tracking.css` v27.5.0 juga sudah masuk app-shell Service Worker.

Telegram tetap memerlukan internet. Saat offline, CRUD dan data tracking tetap disimpan lokal; auto-sync mengirim snapshot setelah koneksi kembali jika Auto-sync aktif.

## Validasi sebelum paket dibuat

- Planning/layout regression: **6/6 passed**
- `v27-tracking.js`: syntax check passed
- `service-worker.js`: syntax check passed
- Apps Script backend: syntax check passed
- Runtime state migration + target adaptif + chart Profit: passed
- Perhitungan pesan ringkasan mingguan Telegram: passed
- Static checks backup/restore v27 + offline cache + semua fitur baru: passed
