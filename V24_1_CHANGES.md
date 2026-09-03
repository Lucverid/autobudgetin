# Agis Finance v24.1 — Carry-over Budget

## Tambahan tanpa mengubah data v24
- Menambahkan **Budget Tersimpan (carry-over)** di Home.
- Sisa jatah harian yang tidak terpakai baru dikreditkan setelah hari berganti.
- Carry-over **tidak menambah batas aman belanja hari berikutnya**; nilainya hanya menjadi indikator dana yang berhasil dihemat.
- Hari berjalan menampilkan **Potensi hari ini** agar nominal belum dihitung dua kali sebelum hari selesai.
- Menambahkan kategori pengeluaran **Keluarga & Pemberian**.
- `Keluarga & Pemberian` tetap masuk ke cashflow/saldo, tetapi tidak mengurangi perhitungan carry-over harian.
- Carry-over disimpan di localStorage terpisah (`agis_finance_carry_over_v24_1`) sehingga snapshot, Firestore, outbox, goals, recurring, audit log, dan conflict handling v24 tidak diubah.
- Ada tombol Reset khusus carry-over; reset tidak mengubah transaksi maupun saldo.

## Kompatibilitas
- Snapshot tetap menggunakan schema v24 dan migrasi lama tetap sama.
- Cache service worker dinaikkan ke `agis-finance-v24-1` agar update PWA termuat.
