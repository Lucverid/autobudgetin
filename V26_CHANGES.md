# Agis Finance AI v26.0 — Decision Lab

## Fitur baru

- **Analisis Bisnis** di halaman Planning:
  - modal tersedia, alat/persiapan, biaya tetap, dan stok awal;
  - rincian HPP per unit (bahan, kemasan, tenaga kerja, operasional, lainnya);
  - omzet, laba kotor, laba bersih, margin, BEP unit/hari, dan estimasi balik modal;
  - rekomendasi harga berdasarkan target margin;
  - status kelayakan dengan alasan dan penyimpanan maksimal 25 skenario terbaru.
- **Simulasi Kredit** di halaman Planning:
  - harga tunai, DP, admin/asuransi, bunga tahunan, tenor, serta metode flat atau anuitas;
  - cicilan bulanan, total pembayaran, biaya kredit, rasio utang, sisa gaji, dan batas cicilan nyaman;
  - memeriksa DP terhadap uang bebas setelah target tabungan dan Safe Floor;
  - status Aman, Perlu Hati-hati, atau Berisiko dengan alasan yang spesifik.
- **Profil Perhitungan** di Settings:
  - gaji, makan, bensin/transportasi, kebutuhan wajib lain, cicilan aktif, dan target tabungan;
  - tombol untuk mengambil budget Makan & Minum, Transportasi, dan Tagihan dari Budget Planning bulan berjalan.

## Data dan kompatibilitas

- Draft dan skenario disimpan offline di perangkat.
- Backup JSON schema v26 menyertakan profil serta seluruh skenario Decision Lab.
- Restore tetap kompatibel dengan backup schema v22–v25.
- Snapshot database Google Sheets ikut membawa data v26.
- Cache PWA diperbarui agar modul baru tersedia secara offline.

## UI/UX

- Decision Lab memakai dua tab agar halaman Planning tetap ringkas.
- Grid menyesuaikan 1–3 kolom berdasarkan lebar layar.
- Tidak menambah ikon navigasi bawah sehingga area sentuh di HP tetap lega.
- Mendukung tema gelap/terang, Privacy Blur, reduced motion, dan layar sempit hingga 350 px.
