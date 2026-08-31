# Agis Finance v21.0 — Smart Sync + Smart Insight

## Durable offline transaction outbox
- Pengeluaran baru selalu dicatat dulu ke outbox lokal yang tahan reload.
- Saat koneksi kembali, aplikasi secara eksplisit melakukan sinkronisasi ke Firestore.
- Sinkronisasi memakai Firestore transaction online dan mengecek keberadaan dokumen transaksi terlebih dahulu, sehingga retry tidak memotong/mengembalikan saldo dua kali.
- Penghapusan transaksi juga masuk outbox dan aman untuk retry.
- Badge koneksi menampilkan jumlah pekerjaan yang masih menunggu sinkronisasi.
- Riwayat menandai transaksi lokal dengan `Menunggu sync`.
- Listener cloud tidak menimpa saldo/transaksi optimistik selama outbox belum kosong.

## Smart Insight v21
- Status keuangan: AMAN / WASPADA / KRITIS.
- Batas pengeluaran aman per hari berdasarkan saldo disposable dan sisa hari bulan.
- Rata-rata pengeluaran 7 hari terakhir.
- Prediksi sisa disposable pada akhir bulan berdasarkan pace 7 hari.
- Perbandingan 7 hari terakhir dengan 7 hari sebelumnya.
- Kategori pengeluaran terbesar bulan berjalan.
- Warning limit kategori tetap dipertahankan.

## PWA
- Cache service worker dinaikkan ke `agis-finance-v21-0` agar browser mengambil build baru.
- Update saldo, target tabungan, dan limit juga ikut durable outbox; bukan hanya pengeluaran.
- Input target dan limit dikosongkan setelah berhasil masuk antrean lokal.
