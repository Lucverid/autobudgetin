# Autobudgetin v25.4.2

- Spending Heatmap: setiap tanggal bisa ditap/klik untuk melihat total pengeluaran hari itu.
- Backup & Restore: Backup JSON + Restore/Import disatukan; import selalu menampilkan preview sebelum diterapkan.
- Database Manager diringkas menjadi Database & Reset (Hapus DB Sheets + Reset Semua Data) agar tidak duplikatif.
- Bill Calendar Telegram: reminder harian H-7, H-6, H-5, H-4, H-3, H-2, H-1, dan Hari H.
- Service worker cache dinaikkan ke v25.4.2 supaya asset versi lama tidak terus dipakai setelah deploy.

Catatan: perubahan Telegram ada di `telegram-database-backend.gs`, sehingga Apps Script harus diperbarui/deploy ulang selain deploy GitHub Pages.
