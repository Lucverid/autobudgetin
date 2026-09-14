# AutoBudgetin v26.0.5 STABLE+ — Reliable Sync

Hotfix untuk koneksi Apps Script/Telegram di atas v26.0.4.

## GitHub
Timpa:
- index.html
- service-worker.js
- v24-5-automation.js

## Apps Script
Ganti kode dengan `telegram-database-backend.gs`, lalu Deploy > Manage deployments > Edit > New version > Deploy.
Jangan jalankan setupAgisFinance lagi jika secret lama sudah tersimpan.

## Perubahan
- Menghapus konfirmasi iframe/postMessage yang tidak reliabel pada Apps Script sandbox.
- POST dikirim ke Apps Script, backend menyimpan receipt hasil nyata.
- Frontend mengambil receipt via JSONP GET yang tidak bergantung CORS.
- Tes Telegram hanya sukses jika Telegram API benar-benar berhasil.
- Error APP_KEY / BOT_TOKEN / CHAT_ID / Telegram API dikembalikan ke UI.
- Layout Decision Lab dari v26.0.4 tetap dipertahankan.
