# AutoBudgetin v28.4.2 — Single Message Finance Center

Patch aman di atas v28.4.1.

## Perubahan
- Navigasi shortcut Telegram mengedit satu pesan Finance Center yang sama (`editMessageText`).
- Ringkasan, Hari ini, Pemakaian, Budget, Tabungan, Durasi, Terbesar, Kategori, kategori detail, Kembali, dan Refresh tidak membuat pesan baru.
- Respons `message is not modified` saat Refresh dianggap sukses.
- Jika edit callback gagal, error hanya tampil sebagai callback alert; backend tidak fallback mengirim pesan baru.
- `/menu`, `/start`, Tes Telegram, dan notifikasi otomatis tetap dapat membuat pesan baru sesuai fungsi mereka.
- Tidak ada perubahan pada transaksi, Auto Budget, Decision Lab/Coach, sync, backup, PWA, atau perhitungan keuangan.
