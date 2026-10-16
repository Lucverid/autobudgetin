# Hasil pemeriksaan — AutoBudgetin v28.6.4

Diperiksa dari `autobudgetin-main (7).zip` pada 16 Oktober 2026. Ini revisi atas kode yang diunggah; identitas penyimpanan dan konfigurasi Firebase dipertahankan.

## Perbaikan utama

1. **Antrean Sync:** pengiriman sekarang membaca ulang antrean terbaru setelah setiap request, sehingga transaksi yang masuk di tengah pengiriman tidak tertimpa array antrean lama.
2. **Race refresh:** respons server lama dibuang bila ada perubahan lokal sejak request dimulai. Cache Firestore kosong saat startup tidak langsung menghapus mirror transaksi lokal.
3. **Offline:** transaksi, pemasukan, transfer, goals dan recurring disimpan lengkap; pembatasan 1.500 transaksi/300 entri tidak lagi memotong mirror. Kegagalan penyimpanan antrean menghentikan pencatatan; kegagalan snapshot memunculkan peringatan ruang perangkat.
4. **Backup:** schema v28 menyertakan arsip, periode, budget otomatis dan preferensi keuangan. Override export lama dihapus agar hanya ada satu pembentuk backup. PIN dan secret koneksi tidak diekspor.
5. **Restore:** validasi nominal aman, tanggal kalender, wallet, ID duplikat dan format daftar. Restore menunggu antrean kosong dan memakai operasi penggantian snapshot yang bisa diulang setelah kegagalan jaringan; tidak menambahkan nominal saldo dua kali.
6. **Budget:** memakai periode aktif yang sama dengan dashboard. Pembagian nominal menggunakan sisa pembulatan sehingga total alokasi tepat sama dengan budget tersedia. Antrean limit langsung diproses; timer penerapan otomatis tidak menumpuk.
7. **Arsip:** mengikuti pergantian bulan normal, menyediakan pilihan periode manual, dan memperbarui ringkasan bulan lama bila transaksi dikoreksi.
8. **Riwayat:** pencarian mencakup catatan/bucket, 50 baris per halaman, render HTML sekaligus, scroll internal. Ekspor mengikuti seluruh filter dan menyertakan catatan.
9. **Tampilan:** pemilih periode ringkas, kontrol fokus, dukungan pengurangan animasi, kartu dan dialog lebih aman di layar sempit.
10. **PWA:** update cache baru hanya berhasil bila seluruh aset shell tersedia. Respons server non-OK pada kode/navigasi dapat memakai cache terakhir.
11. **Sheets:** snapshot JSON panjang dibagi menjadi potongan 40.000 karakter dan dibaca kembali seluruhnya. Penulisan snapshot diserialkan dengan Script Lock.
12. **Reset:** setelah konfirmasi reset berhasil, arsip dan pengaturan budget tambahan ikut dibersihkan agar data lama tidak muncul lagi dari state lokal.

## Validasi

- `npm test`: 45 pemeriksaan/suite lulus, 0 gagal. Termasuk Decision Lab, nominal 10005, skenario, planning, tracking, safe today, arsip, alokasi budget dan regresi sinkronisasi.
- Chromium lokal dengan Firebase pengganti: startup aplikasi, transaksi 10005 dan saldo setelah Sync, penambahan antrean saat request tertunda, export backup, riwayat 1.650 baris, pagination dan pencarian catatan lulus.
- 25 kombinasi layout: Beranda, Riwayat, Tambah, Planning dan Settings pada lebar 320, 360, 390, 768 dan 1366 piksel tanpa overflow horizontal halaman.
- Restore lewat handler aplikasi mengganti dokumen cloud pengganti dan saldo dengan tepat.
- Buka ulang offline melalui service worker mengembalikan transaksi dan saldo yang disimpan.
- Pemeriksaan sintaks JavaScript dan referensi aset dilakukan pada paket final.

## Batas pemeriksaan

Firebase, Apps Script dan pengiriman Telegram milik pengguna tidak diakses atau diuji langsung. Pengujian browser memakai penyimpanan server pengganti agar tidak mengubah data asli. Pembacaan snapshot panjang Apps Script diuji dengan pengganti Sheet; deployment, izin akun, trigger dan webhook perlu dicek setelah update.

Restore cloud berkelompok, bukan satu transaksi atomik untuk seluruh database. Perangkat lain dapat melihat kondisi parsial sampai Sync selesai; gunakan satu perangkat selama pemulihan. Aplikasi tetap berarsitektur personal single-user seperti sumber; Auth/rules server tidak dimigrasikan dalam revisi ini.

Tidak ada jaminan bebas bug sepenuhnya. Simpan backup sebelum deploy dan uji satu transaksi kecil setelah pemasangan.

## Tambahan v28.6.1 — easter egg kucing

Pembacaan transaksi pet diperbaiki: memakai variabel store aplikasi, bukan mengasumsikan adanya window.store. Sebelumnya reward pakan bisa tidak membaca transaksi walaupun pengeluaran tersimpan.

Tiga tes regresi tambahan mencakup pembacaan store, reward +2 pakan sekali per hari, pengecualian Penyesuaian Saldo, status harian AMAN/KRITIS dan END saat saldo habis. Total suite menjadi 45 lulus.

Pengujian Chromium juga mencakup membuka lounge, Feed mengurangi pakan, buka-tutup berulang tanpa reward ganda, tombol hujan, transisi END dan pemulihan saldo, serta ukuran overlay pada 320/390/768/1366 piksel. Tidak ada runtime error pada skenario tersebut. Kualitas suara musik/guntur tidak dinilai dengan pendengaran, dan hasil ini bukan jaminan semua kombinasi gameplay bebas bug.

## Tambahan v28.6.2 — kalender mengikuti budget bulanan

Warna per tanggal tidak lagi memakai peringkat nominal antarhari. Batas bulanan adalah total batas kategori untuk periode aktif. Untuk bulan lama, aplikasi memakai snapshot batas yang sudah tersimpan; bila tidak tersedia, aplikasi bisa memakai budget planning yang memang tersimpan untuk bulan tersebut, dengan label sumber yang jelas. Batas bulan sekarang tidak dipakai sembarang untuk mewarnai arsip bulan lalu.

Acuan harian = batas bulanan / jumlah hari di bulan yang dipilih. Jumlah transaksi per tanggal dijumlahkan; pemasukan, transfer, dan Penyesuaian Saldo tidak ikut. Level warna: 0 tanpa pengeluaran, 1 sampai 50% acuan harian, 2 sampai 100%, 3 sampai 150%, 4 di atas 150%. Palet biru satu warna dengan intensitas bertingkat di tema gelap dan terang. Total persentase budget bulanan ditampilkan terpisah. Tidak ada klaim bahwa warna adalah penilaian baik/buruk suatu transaksi.

Jika budget belum ada, tidak ada warna intensitas perkiraan; tanggal berpengeluaran hanya diberi titik netral. Detail tanggal menampilkan nominal dan persentase terhadap acuan harian serta batas bulanan. Mengubah budget memperbarui warna, sedangkan menambah pengeluaran pada tanggal lain tidak mengubah skala tanggal sebelumnya.

Enam tes tambahan menguji batas level secara tepat, perubahan budget untuk nominal sama, kondisi tanpa budget, penjumlahan transaksi dan pengecualian penyesuaian, isolasi budget antarbulan, serta Februari tahun biasa/kabisat. Total 51 pemeriksaan/suite lulus. Pengujian browser tambahan membuktikan perubahan level setelah batas diubah, keadaan netral tanpa budget, dan detail persentase. Seluruh skenario browser sebelumnya juga diulang dengan hasil lulus.

## Tambahan v28.6.3 — gradasi merah dan ikon

Palet biru pada v28.6.2 diganti menjadi merah bertingkat sesuai permintaan. Perhitungan acuan harian dari batas bulanan serta ambang 50%/100%/150% tetap. Tema gelap dan terang mempunyai palet merah masing-masing; tanggal tanpa pengeluaran tetap netral.

Ikon kalender, tombol Bulan ini/Bulan lalu/Arsip dan label ringkasan memakai ikon garis Lucide dengan ukuran serta ketebalan konsisten. Versi ini memerlukan update file web saja bila backend versi 28.6.0 atau lebih baru sudah terpasang.

51 tes regresi lulus. Pemeriksaan browser mencakup ulang layout, transaksi, easter egg, warna berbasis budget, detail hari dan offline reload tanpa runtime error. Kartu kalender diperiksa secara visual pada lebar 390 piksel; ikon tampil dan tanggal berpengeluaran memakai merah sesuai levelnya.

## Tambahan v28.6.4 — lima warna sesuai batas pengeluaran

Kalender memakai lima tingkat untuk hari berpengeluaran: hijau sampai 50%, hijau pekat di atas 50–80%, oranye di atas 80–100%, merah di atas 100–150%, merah pekat di atas 150% acuan harian. Acuan harian tetap total batas bulanan / jumlah hari bulan terpilih. Tidak ada pengeluaran tetap netral; tanpa batas yang diketahui tidak ada pewarnaan perkiraan. Legenda ditata grid dengan ikon garis dan ukuran seragam.

Pemeriksaan batas diperkuat: metadata konfigurasi tidak dihitung sebagai uang; batas aktif yang sengaja nol tidak kembali memakai budget planning lama; penerapan budget mengosongkan kategori lama yang tidak ada dalam alokasi baru agar total tidak membengkak; signature penerapan otomatis ikut mempertimbangkan hardBufferPct.

54 pemeriksaan/suite lulus, termasuk nilai tepat 50%, 80%, 100%, 150%, pergantian batas, batas nol, isolasi arsip antarbulan, panjang bulan/kabisat, dan penerapan budget manual 900.000 yang sama di pengaturan dan kalender. Preview privat tetap memakai data contoh tanpa koneksi Firebase atau Telegram asli. Pada revisi ini verifikasi preview mencakup sintaks, referensi aset, isolasi data serta perhitungan lima tingkat; sesi visual browser baru tidak dijalankan.
