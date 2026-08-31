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
