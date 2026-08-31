# Agis Finance v24.0 — Reliability & Control

## Fitur baru
- Advanced History: search, filter bulan/range tanggal, wallet, kategori, jenis transaksi, serta range nominal.
- Rekonsiliasi saldo: selisih saldo asli dibuat sebagai transaksi `Penyesuaian Saldo` agar jejak perubahan tetap transparan.
- Audit Log lokal untuk transaksi, saldo, limit, goals, recurring, backup/restore, PIN, rekonsiliasi, dan resolusi konflik.
- Conflict-aware sync untuk transaksi, target tabungan, dan recurring. Dokumen v24 memakai `updatedAt`, `version`, dan `deviceId`; konflik lintas perangkat tidak langsung menimpa data dan bisa dipilih `Pakai Cloud` atau `Terapkan Lokal`.
- Health & Sync Control dengan health score, deteksi pending sync lama, sync error, konflik, ID duplikat, transaksi invalid, saldo negatif, target > saldo, PIN, serta status backup.
- Dashboard Home ringkas: status keuangan, sisa aman hari ini, pengeluaran hari ini, progress tabungan, dan status sync.
- PIN hardening: auto-lock configurable (30 detik / 1 / 5 / 15 menit / off) dan cooldown bertingkat yang tetap berlaku setelah reload.
- Backup schema v24. Backup v22 dan v23 tetap dapat direstore melalui migrasi lokal. Audit log ikut backup, PIN tetap tidak ikut.
- Export XLSX menambahkan status konflik, versi record, dan waktu update.

## Catatan keamanan
Firebase Authentication belum diaktifkan otomatis. Health Check akan memperingatkan hal ini. Setup saat ini cocok untuk aplikasi personal/single-user. Mengaktifkan Auth + rules per-user perlu perubahan Firebase Console dan migrasi data, jadi v24 tidak mengubah rules secara diam-diam agar database yang sudah dipakai tidak terkunci.

## Catatan kompatibilitas
- Snapshot lokal baru: `agis_finance_snapshot_v24`.
- Snapshot v23/v22/v21/v20.1 tetap dimigrasikan otomatis.
- Outbox v21 tetap dipakai agar antrean offline lama tidak hilang.
- Conflict detection mulai efektif untuk record yang sudah memiliki metadata v24 (`deviceId/version/updatedAt`). Record lama akan mendapat metadata saat dibuat/diedit di v24.
