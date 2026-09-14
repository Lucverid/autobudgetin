# AutoBudgetin v26.0.9 STABLE+ — Scenario Flow

Patch lanjutan dari v26.0.8.

## Yang berubah

### Decision Lab
- Setelah skenario bisnis disimpan, form langsung dibersihkan untuk skenario baru.
- Setelah simulasi kredit disimpan, form langsung dibersihkan.
- Tekan skenario/simulasi tersimpan untuk memuat kembali datanya.
- Saat skenario tersimpan dibuka, tombol berubah menjadi **Simpan perubahan**.
- Menyimpan saat mode edit memperbarui skenario yang sama, tidak membuat duplikat.
- ID skenario dipertahankan saat edit supaya referensi Realisasi tetap konsisten.
- Perbaikan input Rupiah digits-only dari v26.0.7 tetap dipertahankan.

### Realisasi & Tracking
- Input uang sekarang memakai pemisah ribuan Indonesia secara langsung:
  - Omzet aktual
  - Biaya restock aktual
  - Nominal pembayaran cicilan
  - Target keuntungan bisnis
- Contoh: `73000` tampil menjadi `73.000`, `1000000` menjadi `1.000.000`.
- Perubahan dibuat sebagai add-on kecil `v26-tracking-money-format.js`; core tracking stabil tidak diubah.

## Upload ke GitHub
Timpa/upload 4 file berikut:
1. `index.html`
2. `service-worker.js`
3. `v26-decision-lab.js`
4. `v26-tracking-money-format.js`

Apps Script tidak perlu redeploy.
