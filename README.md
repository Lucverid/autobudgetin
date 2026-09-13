# AutoBudgetin v27.5.2 — Emergency Recovery Hotfix

Hotfix untuk regresi setelah v27.5.1:
- mencegah cloud kosong menimpa state lokal yang masih berisi data;
- menyimpan last-good local snapshot sebelum overwrite;
- jika snapshot utama kosong, mencoba recovery copy/legacy snapshot;
- memperkeras bottom navigation di mobile;
- mencegah feature-sheet transparan menangkap tap saat tidak dibuka;
- bump cache PWA dan cache-buster asset penting ke v27.5.2.

Upload hanya `index.html` dan `service-worker.js`. Backend Telegram tidak berubah, jadi Apps Script tidak perlu deploy ulang.

PENTING: jangan Clear site data / Hapus data situs sebelum mencoba hotfix ini, karena recovery membaca localStorage lama.
