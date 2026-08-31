# Agis Finance AI v20.0

Perubahan utama:

- Semua dependency frontend dan Firebase memakai file lokal; tidak lagi bergantung CDN untuk membuka app shell.
- Service Worker benar-benar diregistrasikan dari `index.html`.
- App shell, library lokal, manifest, dan icon dipre-cache untuk penggunaan offline.
- Manifest tidak lagi mengambil icon dari internet.
- Firebase lokal v8.10.1 digunakan secara konsisten dengan file yang sudah ada di repo.
- IndexedDB persistence aktif dengan multi-tab synchronization.
- Tambah transaksi dan hapus transaksi memakai Firestore atomic write batch agar perubahan saldo + record transaksi satu paket.
- Write bisa masuk antrean cache Firestore saat offline dan sinkron kembali ketika jaringan tersedia.
- Badge Online/Offline sekarang mengikuti status jaringan browser.
- Kalkulator tidak lagi memakai `eval()`.
- Theme disimpan ke localStorage.
- Output transaksi yang dimasukkan ke HTML di-escape untuk mengurangi risiko HTML injection.

Catatan: Firestore tetap membutuhkan koneksi internet untuk sinkronisasi ke cloud. Mode offline berarti UI/app shell dan data cache lokal dapat tetap dipakai; perubahan akan dikirim ke Firestore setelah koneksi kembali.

## v20.1 patch

- Menambahkan local snapshot fallback (`localStorage`) untuk wallet, target tabungan, limit, dan transaksi terakhir agar reload saat offline tidak kembali menampilkan saldo Rp 0.
- Firestore persistence sekarang diselesaikan lebih dulu sebelum realtime listeners dipasang.
- Update saldo memakai formatter ribuan Indonesia (contoh `1.250.000`).
- Kolom update saldo otomatis diisi dari saldo wallet terbaru saat halaman Settings dibuka.
- Setelah `Simpan Saldo`, aplikasi langsung kembali ke halaman Home dan ikon Home kembali aktif.
- Operasi transaksi/saldo memakai optimistic local mirror agar UI dan reload offline langsung mencerminkan perubahan terbaru.
- Service worker cache dinaikkan ke `agis-finance-v20-1` agar browser mengambil patch terbaru.

## v20.2 patch

- Kolom Update Saldo otomatis dikosongkan setelah `Simpan Saldo`, sebelum kembali ke Home.
- Input Target Tabungan sekarang memakai pemisah ribuan Indonesia saat diketik.
- Input Limit Bulanan sekarang memakai pemisah ribuan Indonesia saat diketik.
- Parsing Target Tabungan dan Limit disamakan dengan input saldo agar nilai seperti `1.500.000` tersimpan sebagai `1500000`.
- Service worker cache dinaikkan ke `agis-finance-v20-2`.
