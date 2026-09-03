# v25.3.7 — Daily Pulse Sync

Fokus versi ini hanya memperbaiki Health Pulse tanpa mengubah fitur lain.

- Angka + label Kondisi Keuangan tetap berasal dari Financial Score.
- Kecepatan detak jantung dan garis ECG sekarang mengikuti pemakaian batas aman HARI INI.
- 0–50% batas aman: detak tenang.
- 50–80%: mulai lebih aktif.
- 80–100%: cepat / mendekati batas.
- >100%: paling cepat, dan terus meningkat sampai batas visual maksimum.
- Health Pulse langsung memperbarui tempo saat `Keluar Hari Ini` atau `Aman Hari Ini` berubah, termasuk setelah transaksi, sync Firestore, dan mode offline.
- Tidak ada perubahan pada transaksi, history, wallet, Telegram, reminder, Planning, backup, atau database.
