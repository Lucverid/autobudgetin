# AutoBudgetin v28.1.0 — Telegram Finance Center + Responsive Review

## Baru
- Telegram sekarang memiliki inline shortcut berbasis ikon: Ringkasan, Pemakaian, Makan, Jajan, Transport, Pemberian, Budget, Daya Tahan, Transaksi Terbesar, dan Refresh.
- Notifikasi transaksi, pengingat, dan alert menyertakan shortcut Finance Center.
- Command `/menu` atau `/start` menampilkan shortcut.
- Web UI Spending Review diperbarui menjadi Money Review Center dengan KPI, top pemakaian, biaya efektif per hari, dan layout responsif desktop/mobile.
- Auto Budget Engine memiliki progress visual per bucket dan layout konfigurasi yang lebih rapi.
- Cache PWA dinaikkan agar aset v28.1 segera diperbarui.

## Setelah update Code.gs
1. Save script.
2. Deploy > Manage deployments > Edit > New version > Deploy.
3. Dari Google Sheet: Agis Finance > Aktifkan Telegram Shortcut.
4. Pilih Agis Finance > Kirim Menu Telegram untuk tes.

Webhook hanya merespons CHAT_ID yang sudah tersimpan di Script Properties.
