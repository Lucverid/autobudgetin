# Agis Finance v25.3.5 — Smart Telegram Reminder

## UI
- Angka saldo utama tetap tampil tanpa label "Saldo Tersedia".
- Tabungan sekarang diposisikan sejajar dengan angka saldo utama.
- Wallet Tunai / Bank / E-Wallet tetap 3 kolom tanpa horizontal scroll.
- Tampilan dasar tetap mengikuti v25.3 Health Pulse.

## Catat transaksi
- Menambahkan kolom Keterangan/Catatan opsional (contoh: makan siang, bensin).
- Catatan disimpan ke pengeluaran, pemasukan, dan transfer.
- Catatan juga bisa diedit dari riwayat transaksi.

## Telegram
- Notifikasi pengeluaran menampilkan nominal, kategori, keterangan, wallet, dan tanggal.
- Notifikasi menunjukkan total keluar hari ini dibanding batas aman harian.
- Bot memberi peringatan jika batas aman harian terlewati atau satu transaksi memakai porsi besar jatah harian.
- Bot memberi peringatan jika hard limit kategori terlewati, target alokasi terlewati, atau target alokasi sudah >=80%.
- Pengingat malam otomatis sekitar pukul 20.00: pengeluaran hari ini, batas/sisa aman, saldo tersedia, tabungan, dan tagihan terdekat.
- Reminder tagihan H-3, H-1, dan hari H tetap aktif.
- Weekly Review Senin pagi tetap aktif.
- `notifyOnce_` sekarang baru menandai notifikasi setelah Telegram berhasil menerima pesan, sehingga kegagalan kirim bisa dicoba lagi.
- Ditambahkan fungsi `installReminderTrigger()` untuk mengaktifkan ulang trigger hourly tanpa menghapus config/secret.

## Upgrade backend
Setelah mengganti `telegram-database-backend.gs`, deploy Web App sebagai New version lalu jalankan `installReminderTrigger()` sekali dari Apps Script editor (atau menu Agis Finance setelah reload Sheet).
