# v25.3.9 — Monthly Status Health Sync

- Health Pulse tidak lagi memakai pengeluaran hari ini sebagai sumber kondisi.
- Sumber Health Pulse sekarang sama persis dengan kartu STATUS Home (`buildSmartInsight`): AMAN / WASPADA / KRITIS.
- Label Health Pulse sekarang juga AMAN / WASPADA / KRITIS; label CUKUP tidak lagi bisa bertentangan dengan status utama.
- Skor /100 dinamis tetapi selalu berada di band status yang benar:
  - AMAN: 80–100
  - WASPADA: 45–79
  - KRITIS: 0–39
- Warna heart, ECG, angka, label, dan tempo semuanya mengikuti status/pace bulanan yang sama.
- Tidak ada perubahan pada transaksi, saldo, Telegram, reminder, database, backup, atau Financial Plan.
