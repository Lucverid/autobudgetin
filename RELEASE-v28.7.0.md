# AutoBudgetin v28.7.0 — Responsive & Logic Audit

- Tata letak dashboard memakai grid tanpa nomor baris tetap; kartu baru tidak lagi bertabrakan dengan layout lama. Settings dua kolom desktop dan satu kolom tablet/HP. Wallet, form, modal, dan daftar transaksi lebih fleksibel.
- Kalender tetap memakai hijau, hijau pekat, orange, merah, merah pekat. Dasarnya limit bulanan dibagi jumlah hari bulan yang dipilih; tanpa budget tetap netral.
- Penyesuaian saldo dikeluarkan dari total operasional dan insight. Saldo wallet tetap mengikuti penyesuaian.
- Validasi nominal/tanggal, preservasi metadata saat edit, nominal tabungan maksimal sisa target, dan penjagaan migrasi tabungan lama diperbaiki.
- Budget Rp0 untuk tabungan dihormati; label budget mengikuti periode aktif; tagihan tidak jatuh sebelum tanggal mulai.
- Backend Telegram memproses beberapa transaksi baru per snapshot, mencatat ID yang sudah terkirim, dan mencoba ulang yang gagal. Maksimal 10 notifikasi tiap pemeriksaan; sisa diproses pada sinkronisasi/pemeriksaan berikutnya. Riwayat lama dijadikan baseline saat upgrade agar tidak membanjiri chat.

## Verifikasi
60 pemeriksaan otomatis lulus. Simulasi DOM memeriksa startup, transaksi Rp10.005, saldo setelah sync, batas dana tabungan, pencarian catatan, 2.000 data offline, pagination, periode, ekspor dan restore backup. Simulasi Telegram memeriksa batch, deduplikasi, retry, dan baseline upgrade.

Tampilan terbaru belum diverifikasi lewat browser/perangkat nyata pada sesi ini. Telegram/Firebase asli tidak dipanggil. Uji kirim Telegram sungguhan memerlukan pemasangan ulang backend Apps Script oleh pemilik. Perubahan backend di ZIP belum aktif pada bot asli. Seperti sistem jaringan lain, kegagalan setelah Telegram menerima pesan tetapi sebelum log tercatat masih dapat menyebabkan pengulangan pada retry.

Preview memakai data contoh lokal dan menonaktifkan koneksi asli. Situs GitHub Pages asli tidak diubah.
