# AutoBudgetin v28.6.1

Revisi dari ZIP yang diunggah, mencakup transaksi, sinkronisasi, offline, backup/restore, periode bulanan, riwayat, budget dan tampilan responsif.

Aplikasi statis: tidak perlu npm install atau build untuk deployment. Buka melalui HTTP/HTTPS, bukan membuka index.html langsung sebagai file.

Baca **PANDUAN-UPDATE.md** untuk langkah pemasangan dan **HASIL-PEMERIKSAAN.md** untuk rincian perbaikan serta batas pengujian.

## Pengujian lokal

Dengan Node.js terpasang, jalankan `npm test` dari folder ini. Tes tidak memerlukan paket tambahan dan tidak menghubungi Firebase/Telegram asli.

## Struktur

- `index.html`: aplikasi dan transaksi utama.
- `finance-core.js`: validasi backup, tanggal, preferensi dan pembagian nominal budget.
- `v28-6-refinement.js/.css`: pemilih periode, finishing responsif dan penanganan input.
- `service-worker.js`: cache aplikasi untuk offline.
- `telegram-database-backend.gs`: backend Apps Script/Sheets/Telegram.
- `tests/`: pengujian regresi. File versi lama tetap disertakan sebagai referensi; yang berjalan mengikuti index.html dan service worker.
