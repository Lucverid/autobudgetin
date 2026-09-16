# v26.0.9 — Stability & Safe Today

## Safe Today
Sebelumnya `safeDaily` dihitung dari saldo bebas saat ini, padahal saldo itu sudah berkurang oleh pengeluaran hari ini. Setelah itu UI masih mengurangi `spentToday` sekali lagi, sehingga jatah hari ini menyusut dua kali.

Sekarang:

`batas total hari ini = (saldo bebas saat ini + pengeluaran hari ini) / sisa hari termasuk hari ini`

`Aman Hari Ini = max(0, batas total hari ini - pengeluaran hari ini)`

Contoh 10 hari tersisa, uang bebas awal hari Rp1.000.000:
- Sebelum belanja: batas Rp100.000, Aman Hari Ini Rp100.000.
- Setelah belanja Rp30.000: batas tetap Rp100.000, Aman Hari Ini Rp70.000.
- Setelah total belanja Rp100.000: Aman Hari Ini Rp0.

## Safety
Tidak ada schema migration, collection rename, reset, atau penghapusan localStorage/Firestore. Perubahan hanya kalkulasi tampilan/summary serta strategi cache PWA.
