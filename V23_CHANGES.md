# Agis Finance v23.0 — Vault

## Fitur baru
- Multi-goal tabungan: beberapa target sekaligus, progress, deadline, edit, hapus, dan tambah dana yang disisihkan.
- Migrasi target tabungan lama ke `Tabungan Utama` agar perilaku Saldo Tersedia tetap konsisten.
- Transaksi rutin mingguan / bulanan untuk Pengeluaran dan Pemasukan.
- Recurring memakai ID occurrence deterministik agar reload/retry tidak menggandakan transaksi.
- PIN Lock 4–6 digit lokal dengan PBKDF2-SHA256 + random salt. PIN tidak pernah dikirim ke Firestore.
- Tombol lock manual dan auto-lock setelah app ditinggal >30 detik.
- Backup JSON dan Restore. Backup mencakup wallet, transaksi, limit, goals, dan recurring; PIN sengaja dikecualikan.

## Offline & sinkronisasi
- Goals dan recurring ikut durable outbox sehingga bisa dibuat/diedit saat offline.
- Dua collection Firestore baru: `goals` dan `recurring`.
- Transaksi rutin yang jatuh tempo saat offline langsung dibuat lokal dan masuk antrean sync.
- Restore memakai operasi set tanpa mengubah saldo ulang, sehingga saldo final dari backup tidak terkena double-count.
- Snapshot lokal dinaikkan ke v23 dan tetap membaca snapshot v22/v21 sebagai migrasi.

## Smart Insight
- Smart Insight menampilkan progress target tabungan terdekat dan nominal yang masih kurang.

## Catatan keamanan
PIN adalah application lock untuk privasi kasual, bukan enkripsi data. Orang yang punya akses penuh ke storage/devtools browser masih dapat membaca data lokal.
