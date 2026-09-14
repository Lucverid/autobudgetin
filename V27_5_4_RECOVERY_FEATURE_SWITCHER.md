# v27.5.4 Recovery FS

Feature switcher aman untuk halaman Planning:
- Decision Lab
- Realisasi
- What-if
- Laporan

Budget Planning + Bill Calendar tetap selalu tampil di atas.

Patch ini sengaja ringan:
- `window.nav` tidak diubah atau dibungkus.
- Tidak memakai `v26-feature-switcher.js` lama.
- Tidak memakai MutationObserver permanen.
- Tidak mengubah kalkulasi finance, transaksi, Firebase, Decision Lab, atau tracking.
- Bridge backup dibuat kompatibel dengan nama canonical v27.5.3 dan v27.5.4.
