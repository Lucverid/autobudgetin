# Agis Finance v22.0 — Cashflow

## Fitur baru
- Pemasukan / income dengan kategori: Gaji, Bonus, Penjualan, Refund, Hadiah, Lainnya.
- Transfer antar-wallet (Tunai, Bank, E-Wallet) tanpa dianggap sebagai pemasukan/pengeluaran.
- Edit transaksi Pengeluaran, Pemasukan, dan Transfer langsung dari Riwayat.
- Dashboard Cashflow Bulan Ini: pemasukan, pengeluaran, net cashflow, dan savings rate.
- Filter Riwayat berdasarkan jenis transaksi.
- Export Excel sekarang menggabungkan Pengeluaran, Pemasukan, dan Transfer.

## Offline & sinkronisasi
- Income, transfer, edit, dan delete ikut durable outbox v21.
- Semua perubahan saldo dilakukan optimistik secara lokal saat offline.
- Saat koneksi kembali, operasi diproses satu per satu dengan Firestore transaction.
- Operasi add/edit/delete dirancang idempotent agar retry tidak menggandakan perubahan saldo.
- Snapshot lokal v22 menyimpan expenses, incomes, transfers, wallet, goal, dan limits.
- Snapshot v21 tetap dibaca otomatis untuk migrasi tanpa menghilangkan data lokal lama.

## Smart Insight
- Cashflow bulan berjalan ditampilkan di Smart Insight.
- Pengeluaran 7 hari, prediksi akhir bulan, status Aman/Waspada/Kritis, limit kategori, dan kategori terbesar tetap dipertahankan.
- Transfer antar-wallet tidak memengaruhi statistik cashflow/pengeluaran.

## Catatan database
v22 menambah dua koleksi Firestore baru: `pemasukan` dan `transfer`. Jika Firestore Security Rules project membatasi nama koleksi tertentu, rules perlu mengizinkan kedua koleksi ini agar sinkronisasi berhasil.
