# AutoBudgetin v26.0.7 STABLE+ — Number Input Stability

Patch ini dibuat di atas v26.0.6 STABLE+.

Perubahan:
- Memperbaiki input nominal di Decision Lab yang sebelumnya bisa berubah dari `1.000` + `0` menjadi `1`.
- Semua field rupiah di Decision Lab sekarang memakai parser digits-only, sama dengan formatter nominal utama AutoBudgetin.
- Profil Perhitungan (gaji, makan, bensin, cicilan, target tabungan) juga memakai jalur input rupiah yang sama.
- Field non-rupiah seperti persen, tenor, unit/hari, hari/bulan tetap memakai parser angka/decimal normal.
- PWA cache dibump ke v26.0.7 agar file Decision Lab baru langsung terambil.

## Aturan input untuk versi selanjutnya
Semua field uang/rupiah wajib memakai **digits-only parsing** sebelum diformat (`10.000`, `100.000`, `1.000.000`, dst). Jangan pernah membaca separator titik Indonesia sebagai decimal saat event `input`.

Nilai regresi yang wajib lolos untuk setiap fitur uang baru:
`999`, `1.000`, `10.000`, `100.000`, `1.000.000`, `2.300.000`, `99.999.999`, `1.000.000.000`.

## Upload ke GitHub
Timpa 3 file berikut di root repo:
- `index.html`
- `service-worker.js`
- `v26-decision-lab.js`

Apps Script tidak perlu diubah/deploy ulang untuk patch ini.
