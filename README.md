# AutoBudgetin v27.5.1 — Reliability Hotfix

Perbaikan dari audit repo v27.5.0:

- Backup JSON tidak lagi bisa ditimpa exporter schema v26; Tracking v27 ikut backup.
- Saat koneksi kembali online, outbox + snapshot Apps Script otomatis disinkron ulang sehingga notif Telegram yang tertunda bisa diproses.
- Factory Reset juga menghapus Planning v25, Decision Lab v26, Tracking v27, carry-over, dan recovery target.
- Penjualan 0 pcs sekarang valid untuk menandai hari buka tetapi tidak ada penjualan; kalender dan target adaptif membacanya sebagai data nyata.
- Restock punya biaya aktual. Jika dikosongkan, biaya otomatis memakai qty × HPP. Biaya restock menambah modal berjalan sehingga BEP/target keuntungan tidak terlalu optimistis.
- CRUD restock (tambah/edit/hapus) masuk notif Telegram.
- Duplicate ID feature switcher dibersihkan.
- Regression test cache lama diperbarui + test reliability v27 ditambahkan.

## Deploy
Timpa file patch di GitHub. Karena backend Telegram berubah, `telegram-database-backend.gs` wajib ditempel ke Apps Script lalu deploy New version.

## File yang perlu ditimpa di GitHub
1. `index.html`
2. `service-worker.js`
3. `v24-5-automation.js`
4. `v25-features.js`
5. `v27-tracking.js`

## Apps Script
6. `telegram-database-backend.gs` — tempel ke Apps Script, lalu **Deploy → Manage deployments → Edit → New version → Deploy**.

Tidak perlu mengubah BOT_TOKEN, CHAT_ID, APP_KEY, atau file CSS.
