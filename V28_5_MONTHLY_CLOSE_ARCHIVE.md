# AutoBudgetin v28.5.0 — Monthly Close & Archive

Baseline: v28.4.2 Single Message Finance Center.

## Baru
- Arsip bulanan non-destruktif: transaksi mentah tidak dipindah/dihapus.
- Snapshot ringkasan bulan lama disimpan lokal dan ikut snapshot Automation.
- Perbandingan 7 hari, 14 hari, dan month-to-date terhadap rentang tanggal yang sama bulan sebelumnya.
- Persentase serta selisih nominal per bucket penggunaan.
- Monthly Close untuk menandai periode selesai tanpa menghapus histori.
- Saldo awal periode dapat dikonfirmasi/update per wallet.
- Bulan baru tetap fresh karena dashboard inti memakai bulan kalender aktif.
- Arsip historis bisa dibuka kembali untuk review.
- Telegram Finance Center mendapat shortcut Perbandingan dan tetap single-message.

## Safety
Data lama tetap berada di store/Firestore/backup. Arsip hanya metadata ringkasan tambahan di localStorage `agis_finance_monthly_archive_v28_5`.
