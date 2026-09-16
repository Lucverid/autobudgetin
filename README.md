# AutoBudgetin v26.0.9 STABLE+ — Stability & Safe Today

Patch stabilitas dari v26.0.8 STABLE+. Tidak ada migrasi schema dan tidak ada penghapusan data.

## Yang diperbaiki
- **Aman Hari Ini** tidak lagi menghitung pengeluaran hari ini dua kali. Batas total harian direkonstruksi dari saldo bebas saat ini + pengeluaran hari ini, lalu `Aman Hari Ini` menampilkan sisa jatah hari tersebut.
- Snapshot Automation/Telegram memakai definisi batas aman harian yang sama dengan Home.
- Versi halaman dan cache PWA diselaraskan ke v26.0.9.
- Service Worker lebih tahan partial deploy: satu asset gagal tidak menggagalkan seluruh update cache.
- Asset JS/CSS memakai network-first saat online dan cache fallback saat offline, sehingga deploy baru lebih cepat terbaca tanpa mengorbankan offline mode.
- Registrasi Service Worker memakai `updateViaCache: none` dan meminta pengecekan update saat aplikasi dibuka.

## Data yang tidak diubah
Patch ini **tidak mengubah** nama collection Firestore, key localStorage data utama, transaksi, pemasukan, transfer, wallet, goal, limit, planning, Decision Lab, Decision Coach, tracking, outbox offline, backup, atau konfigurasi Telegram/Apps Script.

## Deploy dari VS Code
Project ini static dan tidak membutuhkan build. Jalankan dari terminal VS Code pada clone repository AutoBudgetin:

```powershell
git status
git add .
git commit -m "AutoBudgetin v26.0.9 stability"
git push origin main
```

Jika GitHub Pages repository disetel ke **Deploy from a branch → main / root**, push tersebut sudah cukup. Apps Script tidak perlu deploy ulang untuk patch web ini.
