# AutoBudgetin v28.4.1 — Telegram Callback Fix

Patch aman dari v28.4.0.

- Tes Telegram sekarang sekaligus menyinkronkan webhook ke Apps Script Web App URL `/exec` yang sedang tersimpan di AutoBudgetin.
- Backend memverifikasi `getWebhookInfo` setelah `setWebhook`.
- Reply keyboard lama dihapus otomatis agar tidak menumpuk dengan Inline Shortcut Center.
- Inline shortcut tetap menggunakan callback query dan handler v28.4.
- Tidak mengubah transaksi, wallet, Decision Lab/Coach, Auto Budget, durasi, backup, atau database schema.
