# AutoBudgetin v26.0.6 STABLE+

Patch ini dibuat dari file v26.0.5 yang saat ini ada di branch `main`.

## Yang baru
- Feature Switcher di halaman Planning: Decision Lab / Realisasi / What-if / Laporan / Semua.
- Pilihan fitur terakhir disimpan di perangkat.
- Budget & Tagihan dipindah ke bagian atas Planning; Laporan Tahunan masuk ke pilihan Laporan.
- Realisasi tetap memakai modul tracking stabil yang sudah ada dan hanya dirender saat dibuka.
- Apps Script auto-sync langsung mencoba lagi saat internet kembali.
- Firebase outbox tetap di-flush saat reconnect.
- Retry Apps Script: langsung, lalu sekitar 4 detik dan 12 detik bila percobaan sebelumnya gagal.
- Saat PWA kembali dari background dan sync sudah lama, dilakukan pengecekan/sync ulang.

## Upload ke GitHub
Timpa / upload 5 file berikut ke root repo:
- index.html
- service-worker.js
- v24-5-automation.js
- v26-feature-switcher.js
- v26-feature-switcher.css

Tidak perlu mengubah Apps Script backend untuk patch ini.
