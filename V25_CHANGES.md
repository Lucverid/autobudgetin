# Agis Finance v25.0 — Stability & Planning

## Fitur utama
- Budget Planning bulanan per kategori dengan progress realisasi otomatis.
- Bill Calendar untuk tagihan sekali/bulanan dan jatuh tempo 45 hari ke depan.
- Yearly Report: pemasukan, pengeluaran, net, kategori terbesar, dan grafik 12 bulan.
- Telegram backend dapat mengingatkan tagihan H-3, H-1, dan hari H.
- Budget dan Bills ikut snapshot Google Sheets dan Backup JSON schema v25.

## Fokus stabilitas
- Format backup dinaikkan ke schema v25 dan tetap kompatibel dari v22.
- Planning tetap tersimpan lokal/offline lalu ikut backend snapshot saat sync.
- Tambahan self-check v25 untuk memeriksa struktur planning dan konfigurasi backend.
- PWA cache dinaikkan ke `agis-finance-v25-0`.

## Catatan upgrade backend
Ganti isi Apps Script dengan `telegram-database-backend.gs` versi v25, lalu Deploy > Manage deployments > Edit > New version > Deploy. URL `/exec` tidak perlu diganti.
