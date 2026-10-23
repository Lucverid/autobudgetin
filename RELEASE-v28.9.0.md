# AutoBudgetin v28.9.0 — Floating Calculator & Icons

- Ikon garis diseragamkan: ukuran, ketebalan, latar dan jarak. Emoji pada tombol klasifikasi serta form wallet diganti ikon garis/label. Logo aplikasi diperbarui menjadi simbol wallet, termasuk SVG header/splash dan PNG ikon PWA.
- Kalkulator kembali mengambang di kanan. Tombol pembuka dan panel (lewat header/grip) bisa digeser memakai Pointer Events untuk mouse/touch/pen. Posisi disimpan lokal; tetap dibatasi layar dan disesuaikan saat ukuran/visual viewport berubah. Geser tidak dianggap klik. Dukungan tombol panah, keyboard angka, Enter, Backspace dan Escape.
- Perhitungan mendukung hasil negatif, kelanjutan dari hasil, prioritas kali/bagi, desimal, dan representasi ilmiah dari hasil kecil/besar. Pembagian nol dan ekspresi tidak lengkap ditolak. Tidak memakai eval.
- Tombol sama dengan tidak lagi menimpa nominal draft. Tombol Gunakan nominal mengisi form secara eksplisit, hanya untuk rupiah positif dan aman; pembulatan pecahan diberi keterangan. Ini tidak menyimpan transaksi atau mengubah wallet.
- Aturan drag global lama yang menimpa document.onmousemove/ontouchmove dihapus. Kalkulator tidak bisa diseret keluar layar.

## Verifikasi
64 pemeriksaan otomatis lulus. Browser QA memakai data contoh: desktop 1363px dan viewport iframe 390/320px; tema terang/gelap; buka/tutup; geser tombol/panel; batas layar; hasil negatif dan lanjut hitung; nominal draft Rp123.000 tidak berubah ketika menghitung 7×8; Gunakan Rp56 mengisi draft; halaman Riwayat/Planning/Pengaturan pada lebar 320px tidak overflow horizontal. Pengujian ini bukan uji perangkat fisik/touch nyata.

Regresi keuangan: penyesuaian saldo vs pengeluaran, pembagian budget, heatmap berdasarkan limit bulanan, validasi backup/restore, antrean sync, tabungan dan Telegram menggunakan simulasi pada suite yang sama. Tidak ada pengiriman Telegram atau perubahan Firebase asli. Situs GitHub Pages asli tidak diperbarui otomatis.
