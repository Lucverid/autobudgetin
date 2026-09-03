# Agis Finance v25.3.2 — UI Polish & Local Date Fix

- Tetap memakai v25.3 Health Pulse sebagai patokan visual.
- Tetap memakai bottom navigation 5 tombol dari v25.3.1.
- Sapaan dinamis di Home dihapus dari tampilan.
- Hero "Saldo Tersedia" dihapus dari tampilan agar Home lebih bersih.
- Layout desktop Home dibuat eksplisit supaya wallet, overview, Health Pulse, cashflow, weekly review, heatmap, dan chart tidak auto-flow ke posisi yang terasa acak.
- Settings desktop kembali ke 2 kolom agar tidak terlalu padat.
- Memperbaiki bug tanggal transaksi pada zona waktu Indonesia: default tanggal sekarang memakai tanggal lokal, bukan UTC.
- Saat tab Catat Transaksi dibuka setelah pergantian hari, tanggal otomatis ikut hari lokal selama user belum memilih tanggal manual.
- Dampak: pengeluaran yang dicatat sekitar pukul 00:00–06:59 WIB tidak lagi masuk ke tanggal kemarin dan sekarang langsung terbaca sebagai "Keluar Hari Ini".
