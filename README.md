# AutoBudgetin v26.0.3 — Apps Script CORS Hotfix

Patch ini hanya memperbaiki koneksi GitHub Pages -> Google Apps Script yang menampilkan `Failed to fetch` walau Web App `/exec` bisa dibuka normal.

Upload/timpa 3 file:
- index.html
- service-worker.js
- v24-5-automation.js

Tidak perlu mengubah Apps Script backend lagi. Tetap gunakan URL Web App asli `https://script.google.com/macros/s/.../exec`, bukan URL redirect `script.googleusercontent.com`.

Catatan: Apps Script dipanggil dengan mode `no-cors`, jadi browser tidak dapat membaca body respons. UI akan menampilkan `Permintaan sync dikirim`; konfirmasi keberhasilan dengan melihat timestamp/snapshot di Google Sheets atau pesan tes di Telegram.
