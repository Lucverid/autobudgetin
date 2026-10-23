# AutoBudgetin v28.8.1 — Blue UI & Balance Layout

- Tema utama biru pada mode terang dan gelap: latar navy/abu terang, tombol dan navigasi biru, kontras teks konsisten.
- Kartu saldo ditata dengan grid. Aturan flex-basis 200px yang menjadi tinggi saat layout berubah menjadi kolom dihapus. Saldo dan tabungan kini berdekatan, tanpa ruang kosong tambahan.
- Header baru dengan logo monogram A, kontrol lebih ringkas, dan margin konsisten. Logo SVG juga dipakai pada splash dan favicon; ikon PNG 192/512 dan nama manifest diperbarui untuk aplikasi terpasang.
- Warna semantik pengeluaran dan lima tingkat kalender tetap mengacu batas budget.
- Riwayat ringkas, Filter lanjutan, ikon aksi kecil, dan kalkulator header dipertahankan.

## Verifikasi
60 pemeriksaan otomatis lolos. Simulasi DOM memeriksa startup, grid saldo, penghapusan flex-basis yang menimbulkan ruang kosong, logo, transaksi, pencarian, pagination, backup/restore dan navigasi demo. Verifikasi visual langsung di perangkat nyata belum tersedia pada sesi ini.

Preview menggunakan data contoh lokal. Situs GitHub Pages, Firebase dan Telegram asli tidak diubah otomatis. Backend Telegram memakai perbaikan audit sebelumnya dan belum diuji kirim ke bot asli.
