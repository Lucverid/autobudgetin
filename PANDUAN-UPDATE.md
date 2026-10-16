# Panduan update AutoBudgetin v28.6.4

## 1. Sebelum upload

Buka aplikasi lama dengan koneksi internet. Tunggu antrean Sync selesai lalu unduh Backup JSON melalui Settings → Backup & Restore. Simpan backup tersebut.

Update web tidak membutuhkan Restore, Reset Semua Data, atau penghapusan data browser. Data yang tersimpan tetap memakai key dan collection lama.

## 2. GitHub Pages

1. Ekstrak ZIP.
2. Buka folder `autobudgetin-main`.
3. Upload seluruh ISI folder ke root repository AutoBudgetin yang sama. `index.html` harus sejajar dengan `service-worker.js`, bukan masuk folder bertingkat.
4. Commit perubahan dan tunggu GitHub Pages selesai deploy. Pengaturan Pages tetap memakai branch/folder yang sebelumnya.
5. Buka URL aplikasi yang sama saat online, tunggu beberapa detik sampai cache lengkap, lalu tutup dan buka kembali. Judul halaman sekarang menampilkan v28.6.2.
6. Pastikan saldo/riwayat sesuai sebelum mencatat transaksi baru. Uji offline setelah aplikasi pernah dibuka online dan cache siap.

Tidak perlu mengubah konfigurasi Firebase. Offline pertama kali tetap membutuhkan unduhan seluruh aset saat online; browser masih dapat menghapus penyimpanan jika ruang perangkat habis atau data situs dibersihkan.

## 3. Apps Script — ikut diperbarui pada paket ini

1. Buka project Apps Script AutoBudgetin yang SUDAH dipakai.
2. Ganti kode backend dengan isi `telegram-database-backend.gs` dari ZIP ini.
3. Simpan. Pilih **Deploy → Manage deployments → Edit → New version → Deploy** pada deployment yang sama agar URL /exec tetap.
4. Token bot, CHAT_ID dan APP_KEY di Script Properties tetap dipakai. Jangan menjalankan setupAgisFinance lagi karena fungsi setup mengatur ulang sheet.
5. Dari aplikasi, buka Automation & Database → Sync sekarang. Setelah sukses, jalankan Tes Telegram dan coba shortcut.

Backend baru menyimpan snapshot panjang dalam beberapa sel; backend lama perlu diperbarui agar bisa membaca format baru tersebut.

## 4. Backup dan Restore

Backup baru memakai schema v28 dan menyertakan arsip, periode aktif, budget otomatis, planning dan Decision Lab. PIN dan secret Telegram tidak dimasukkan ke backup. Backup format lama tetap diterima bila isinya valid.

Restore sengaja mengganti data ke kondisi backup: saldo mengikuti backup; transaksi, goals dan recurring cloud yang tidak ada di backup akan dihapus. Dialog konfirmasi menjelaskan tindakan ini. Gunakan Restore hanya untuk pemulihan, bukan saat update biasa.

Antrean Sync harus kosong sebelum Restore. Backup diperiksa sebelum data diganti. Jika offline, pemulihan lokal dibuat dan operasi cloud disimpan dalam antrean. Pemulihan cloud dilakukan per kelompok maksimum 400 operasi; bila koneksi putus, operasi tetap mengantre dan diulang tanpa menambahkan saldo dua kali. Selama proses berjalan gunakan satu perangkat/tab dan tunggu antrean kosong sebelum melanjutkan dari perangkat lain.

## 5. Periode dan riwayat

Pemilih periode ada di Beranda. Tombol Bulan ini kembali ke kalender saat ini; periode normal mengikuti pergantian bulan otomatis. Periode yang dipilih manual tetap dipertahankan. Tutup bulan mengarsipkan ringkasan dan memajukan periode, bukan menghapus transaksi.

Riwayat menampilkan 50 transaksi per halaman. Pencarian juga membaca catatan dan bucket. Ringkasan filter dan ekspor Excel tetap memakai seluruh hasil filter, bukan hanya halaman yang terlihat.

## Warna kalender berbasis budget

Batas bulanan adalah total batas kategori yang diatur. Bila bulan lama tidak mempunyai snapshot batas, sumber alternatifnya adalah budget planning yang tersimpan untuk bulan itu, dan sumbernya ditulis di kartu.

Contoh: batas Rp900.000 di bulan 30 hari menghasilkan acuan Rp30.000/hari. Pengeluaran tanggal tertentu sampai Rp15.000 memakai biru paling tipis; sampai Rp30.000 level 2; sampai Rp45.000 level 3; lebih dari Rp45.000 level 4. Ini ukuran pemakaian acuan budget, bukan otomatis penilaian transaksi buruk.

Persentase total bulanan ada di ringkasan kalender. Tanpa budget, tanggal tetap netral dengan titik bila ada pengeluaran. Klik tanggal untuk nominal dan persentasenya. Perubahan versi 28.6.1 → 28.6.2 hanya perlu update web; kode Apps Script sama. Jika masih memakai versi sebelum 28.6.0, ikuti langkah update Apps Script di atas juga.

## v28.6.3

Upload file web versi ini untuk memperoleh gradasi merah dan ikon garis kalender yang seragam. Rumus budget sama dengan v28.6.2. Jika backend v28.6.0 atau lebih baru sudah terpasang, Apps Script tidak perlu diperbarui lagi.

## Skala warna v28.6.4

Acuan harian = total batas pengeluaran kategori per bulan / jumlah hari. Contoh batas Rp900.000 dalam bulan 30 hari menghasilkan Rp30.000 per hari.

| Pemakaian acuan harian | Warna | Contoh nominal |
| --- | --- | --- |
| Lebih dari 0–50% | Hijau | sampai Rp15.000 |
| Lebih dari 50–80% | Hijau pekat | di atas Rp15.000 sampai Rp24.000 |
| Lebih dari 80–100% | Oranye | di atas Rp24.000 sampai Rp30.000 |
| Lebih dari 100–150% | Merah | di atas Rp30.000 sampai Rp45.000 |
| Lebih dari 150% | Merah pekat | di atas Rp45.000 |

Hari tanpa pengeluaran tetap netral. Persentase total bulan ditampilkan terpisah. Setelah mengubah budget, tekan Simpan & Terapkan; kalender akan membaca batas terbaru. Untuk versi backend 28.6.0 atau lebih baru, cukup update file web.
