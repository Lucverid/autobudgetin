# v25.3.8 — Daily Health State

- Health Pulse sekarang memakai satu sumber kondisi yang sama: rasio pengeluaran hari ini terhadap batas aman harian.
- Tempo heartbeat/ECG tetap dinamis seperti v25.3.7.
- Angka `/100` tidak lagi tertahan di Financial Score lama; sekarang ikut berubah setelah pengeluaran hari ini berubah.
- Label SEHAT / CUKUP / WASPADA / KRITIS mengikuti skor harian yang tampil.
- Warna heart, angka, label, dan garis ECG mengikuti status yang sama.
- Kurva skor harian:
  - 0% batas terpakai ≈ 100/100
  - 50% ≈ 70/100
  - 100% = 40/100
  - >100% masuk KRITIS dan terus turun sampai 0.
- Tidak mengubah transaksi, history, wallet, Telegram, reminder, Financial Plan, backup, atau database.
- PWA cache: agis-finance-v25-3-8.
