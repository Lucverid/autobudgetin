# Agis Finance v24.2 — Momentum & Recovery

## Fitur baru
- No-Spend Streak: menghitung hari berturut-turut tanpa pengeluaran konsumtif pada bulan berjalan. Kategori `Keluarga & Pemberian` dan `Penyesuaian Saldo` tidak memutus streak.
- Recovery Target: target pemulihan buffer yang progress-nya mengambil carry-over yang sudah benar-benar terkumpul setelah hari berganti. Target hanya metadata lokal dan tidak memindahkan saldo.
- Projected End-of-Month Balance: proyeksi sisa saldo akhir bulan berdasarkan rata-rata pengeluaran 7 hari yang sudah dipakai Smart Insight.

## Kompatibilitas
- Seluruh fitur v24 dan v24.1 tetap dipertahankan.
- Snapshot utama tetap `agis_finance_snapshot_v24` dan format Firestore/outbox tidak diubah.
- Recovery Target disimpan terpisah di localStorage (`agis_finance_recovery_target_v24_2`).
- Cache PWA dinaikkan ke `agis-finance-v24-2` agar update terambil tanpa mengubah data pengguna.
