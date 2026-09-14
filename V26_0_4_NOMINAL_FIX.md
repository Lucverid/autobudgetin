# v26.0.4 — Decision Lab Nominal Input Fix

- Fix input nominal yang bisa berubah dari `10005` menjadi `1`.
- Field uang sekarang selalu diparse sebagai digit Rupiah; titik dianggap separator ribuan, bukan desimal.
- Parser angka non-uang (margin, tenor, unit, hari) tetap terpisah agar perilakunya tidak berubah.
- Cache PWA dibump supaya perbaikan langsung ikut offline shell setelah update.
- Firebase/Firestore core, Stable+ tracking, dan Feature Switch tidak diubah.
