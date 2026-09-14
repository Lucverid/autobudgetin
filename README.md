# AutoBudgetin v26.0.4 STABLE+ — Confirmed Sync + Lab Layout

Patch ini tetap memakai fondasi v26 STABLE+.

## Yang diperbaiki
- Menghapus transport `no-cors` yang sebelumnya bisa menampilkan sukses palsu.
- Apps Script sekarang memberi ACK nyata ke browser lewat hidden form/iframe + postMessage.
- `Sync sekarang` hanya tampil sukses setelah backend benar-benar menerima snapshot.
- `Tes Telegram` hanya sukses setelah Telegram API benar-benar menerima request dari Apps Script.
- Error APP_KEY / BOT_TOKEN / CHAT_ID sekarang muncul apa adanya di aplikasi.
- URL Apps Script yang kepaste dua kali dibersihkan otomatis.
- Saat paste URL Apps Script, field otomatis mengganti isi lama supaya URL tidak menumpuk.
- Auto-sync transaksi tetap berjalan; setelah snapshot diterima backend, notifikasi transaksi diproses.
- Planning dirapikan menjadi: Budget & Tagihan -> Decision Lab -> What-if -> Laporan Tahunan.
- Decision Lab sedikit dipadatkan dan daftar skenario lebih rapi di layar lebar.

## Upload ke GitHub
Timpa file:
- index.html
- service-worker.js
- v24-5-automation.js
- v25-3-3-financial-plan.js
- v26-decision-lab.js
- v26-decision-lab.css

## Apps Script WAJIB
Ganti kode Apps Script dengan `telegram-database-backend.gs`, lalu:
Deploy -> Manage deployments -> Edit -> New version -> Deploy.

Jangan jalankan `setupAgisFinance()` lagi jika database/config lama sudah ada. Script Properties lama (BOT_TOKEN, CHAT_ID, APP_KEY) tetap dipakai.

## Setelah deploy
1. Buka Settings -> Automation & Database.
2. Pastikan URL asli Apps Script berbentuk `https://script.google.com/macros/s/.../exec`.
3. Klik **Simpan & Cek**.
4. Status ideal: `Backend terhubung ✓ · Telegram siap`.
5. Tekan **Tes Telegram**. Kali ini popup sukses berarti backend sudah mengonfirmasi Telegram API.
6. Coba tambah transaksi. Dengan Auto-sync aktif, notif biasanya diproses sekitar 2 detik setelah penyimpanan lokal.
