# v25.5.8 Clean

- Fix Backup JSON yang sebelumnya tidak membawa Budget Tersimpan / carry-over.
- Carry-over sekarang dibackup lengkap: balance, month, lastDate, dailyBase, dan history.
- Restore via Preview/Import ikut memulihkan carry-over.
- Recovery Target ikut backup/restore.
- Budget Planning + Bill Calendar dipastikan ikut payload backup schema v25.
- Backup lama schema v22-v24 tetap kompatibel; field baru hanya diterapkan jika tersedia.
- Preview restore menampilkan nilai carry-over.
- Cache PWA dinaikkan ke v25.5.8-clean.
