# AutoBudgetin v28.8.0 — Refined UI

- Tema terang/gelap baru: warna netral dengan aksen hijau, border dan sudut konsisten, bobot huruf lebih tenang, kontras tombol Ringkas/Lengkap diperbaiki.
- Saldo diberi label jelas; ukuran nominal, kartu wallet, dan ringkasan diseragamkan. Tiga wallet tetap terlihat tanpa scroll.
- Riwayat baru: pencarian ringkas, periode dan jenis transaksi di depan; wallet, kategori, rentang tanggal, nominal ditempatkan dalam Filter lanjutan (tertutup awal). Label input lebih jelas.
- Statistik riwayat dipisahkan menjadi tiga kolom: jumlah, masuk, keluar. Daftar transaksi memakai ikon arah yang kecil serta tombol edit/hapus ukuran konsisten.
- Kalkulator dipindahkan ke header beranda dan riwayat, sehingga tidak menutupi data. Lima tombol navigasi tetap tersedia dengan bentuk lebih sederhana.
- Panel Periode aktif dan banner preview tetap dihapus. Skala kalender serta logika transaksi, tabungan, arsip, dan Telegram tetap memakai hasil audit sebelumnya.

## Verifikasi
60 pemeriksaan otomatis lolos; simulasi DOM memeriksa startup, filter, transaksi, ikon baris, pembukaan Filter lanjutan yang tetap terjaga setelah render, kalkulator, pencarian, pagination, backup/restore, serta navigasi lima halaman di demo. Demo tetap memakai data lokal dan koneksi asli dinonaktifkan.

Verifikasi visual di browser/perangkat nyata belum tersedia pada sesi ini. ZIP berisi versi untuk GitHub Pages; situs dan bot asli tidak diperbarui otomatis.
