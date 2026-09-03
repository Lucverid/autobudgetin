# Telegram Notifications — Agis Finance v24.4

Integrasi memakai Cloudflare Worker sebagai relay agar `TELEGRAM_BOT_TOKEN` tidak pernah ditaruh di `index.html` / browser / GitHub Pages.

## 1. Buat bot Telegram
1. Chat `@BotFather` di Telegram.
2. Jalankan `/newbot`, ikuti instruksi, lalu simpan token bot.
3. Kirim satu pesan ke bot yang baru dibuat.
4. Dapatkan Chat ID milikmu. Cara termudah saat setup pribadi: buka endpoint `getUpdates` bot secara lokal/pribadi dan baca `message.chat.id`. Jangan commit token atau hasil respons yang mengandung data pribadi ke repository.

## 2. Deploy relay gratis di Cloudflare Workers
1. Buat Worker baru di Cloudflare.
2. Tempel isi `telegram-worker.js` ke Worker.
3. Di Worker Settings > Variables and Secrets buat:
   - `TELEGRAM_BOT_TOKEN` (Secret)
   - `TELEGRAM_CHAT_ID` (Secret atau Variable)
   - `APP_KEY` (Secret; buat string acak panjang)
4. Deploy Worker dan salin URL `https://....workers.dev`.

## 3. Hubungkan aplikasi
Buka Agis Finance > Settings > Telegram Notifications:
- Relay URL = URL Worker
- App Key = nilai yang sama dengan `APP_KEY`
- Pilih jenis notif yang diinginkan
- Simpan, lalu tekan `Tes Telegram`.

## Notifikasi v24.4
- Anomaly spending: transaksi jauh di atas pola 14–30 hari terakhir.
- Safe Floor warning: saldo tersedia turun di bawah batas minimum.
- Weekly Review: ringkasan 7 hari terakhir, dikirim sekali per minggu ketika aplikasi dibuka/aktif.
- Recovery Target selesai.
- Financial Score kritis (<40).

## Catatan penting
GitHub Pages/PWA tidak bisa menjalankan JavaScript ketika browser benar-benar tertutup. Karena itu Weekly Review dan pengecekan kondisi dikirim saat aplikasi dibuka/aktif. Untuk notifikasi terjadwal penuh walau aplikasi tidak pernah dibuka, backend perlu membaca data finance (mis. Cloudflare Worker + Firestore service integration), yang sengaja tidak diaktifkan di v24.4 supaya kredensial database tetap sederhana dan aman.
