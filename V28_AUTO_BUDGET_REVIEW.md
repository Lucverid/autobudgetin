# AutoBudgetin v28.0.0 — Auto Budget & Spending Review

## Baru
- Auto Budget Engine memakai pemasukan kategori **Gaji** bulan berjalan sebagai sumber utama.
- Gaji manual dipakai sebagai fallback jika belum ada transaksi Gaji.
- Opsi memasukkan Bonus ke sumber budget.
- Tabungan otomatis dipisahkan lebih dulu, lalu sisa uang dibagi ke bucket: Makan Pokok, Jajan, Transportasi, Tagihan, Pemberian, Belanja, Hiburan, dan Lainnya.
- Bobot setiap bucket bisa diubah tanpa mengubah histori lama.
- Budget Planning lama tetap terisi otomatis dan hard limit lama tetap kompatibel.
- Transaksi pengeluaran baru bisa menyimpan `budgetBucket` dan `usageDays`.
- Spending Review memperlihatkan uang dipakai ke mana dan biaya efektif per hari untuk pembelian berdurasi.
- History menampilkan bucket, keterangan, durasi manfaat, dan biaya per hari jika tersedia.

## Telegram
- Format pengeluaran baru memakai ikon dan informasi yang lebih spesifik.
- Menampilkan bucket, tujuan, wallet, tanggal, dan durasi manfaat.
- Daily reminder menampilkan breakdown pemakaian per bucket.
- Weekly Money Review menampilkan breakdown 7 hari dan "daya tahan pembelian".

## Compatibility
- Data transaksi lama tidak dimigrasi atau dipecah.
- Transaksi lama dipetakan ke bucket secara aman dari kategori/keterangan.
- v25 Budget Planning, limits, Firestore, offline outbox, Decision Lab/Coach, dan Tracking tetap dipertahankan.
