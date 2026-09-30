# AutoBudgetin v28.3.1 — Telegram Test Fix

## Perbaikan utama
- Memperbaiki bug `Tes Telegram` di v28.3. Payload web memiliki field `message` dan sebelumnya keliru dideteksi sebagai update webhook Telegram.
- Request AutoBudgetin dengan field `action` kini diproses lebih dulu dan tetap memerlukan APP_KEY.
- Webhook Telegram hanya diterima bila payload benar-benar memiliki struktur Telegram Update.
- Label pesan tes diperbarui ke v28.3.1.

## Deploy
`telegram-database-backend.gs` wajib disalin ke `Code.gs`, simpan, lalu Deploy > Manage deployments > Edit > New version > Deploy.
