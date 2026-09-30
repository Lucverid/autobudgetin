# AutoBudgetin v28.5.2 — Active Period Fix

- Monthly Close sekarang menyimpan `activePeriod` eksplisit.
- Menutup September otomatis membuka Oktober walau tanggal perangkat masih 30 September.
- Dashboard cashflow bulanan membaca periode aktif, bukan selalu bulan kalender perangkat.
- `Keluar Hari Ini` tetap berdasarkan tanggal nyata agar tidak menghitung transaksi masa depan sebagai hari ini.
- Jika periode aktif berbeda dari bulan kalender, catatan kartu menampilkan total pengeluaran periode aktif.
- Heatmap otomatis diarahkan ke periode baru saat Monthly Close.
- Data mentah tidak dipindahkan atau dihapus; arsip dan perbandingan tetap kompatibel.
