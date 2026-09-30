# AutoBudgetin v28.4 — Final Stable Patch

Patch ini sengaja minimal agar fitur yang sudah berjalan tetap aman.

## Perubahan
- Menghapus tombol Shortcut Information berbentuk grid di kanan atas halaman Home.
- Header Home dirapikan dan tetap responsif di HP/laptop.
- Telegram Shortcut memakai tombol teks yang lebih clean, tanpa emoji/icon ramai.
- Shortcut Telegram dibuat bertingkat: menu utama + submenu Kategori + Kembali.
- Callback inline Telegram sekarang mengedit pesan yang sama agar tidak spam chat.
- Handler tetap kompatibel dengan tombol/reply keyboard lama: Ringkasan, Pemakaian, Makan, Jajan, Transport, Pemberian, Budget, Daya Tahan, Terbesar, Refresh, dan kategori lain tetap dibaca sebagai text command.
- Webhook setup memvalidasi respons Telegram.
- Cache Service Worker dinaikkan agar UI terbaru tidak tertahan cache lama.

Tidak mengubah formula transaksi, Decision Lab/Coach, Firestore sync, PWA/offline, backup/restore, Auto Budget, atau Auto Usage Duration.
