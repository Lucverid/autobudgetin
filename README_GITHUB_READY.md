# AutoBudgetin v27.5.3 SAFE — GitHub Ready Full Pack

Paket ini dibuat khusus agar bisa di-upload lewat GitHub web tanpa melewati batas jumlah file.

- Fondasi aplikasi: v27.4.0 Stability.
- Fitur v27.5.3 SAFE tetap disertakan.
- Hanya file runtime yang benar-benar dipakai oleh `index.html` / Service Worker yang dimasukkan.
- Changelog lama, test, dan versi Easter Egg lama yang tidak direferensikan sengaja tidak dimasukkan.
- File lama yang masih tertinggal di repository boleh dibiarkan; aplikasi tidak akan memuatnya selama tidak direferensikan.

## Cara upload
1. Ekstrak ZIP.
2. Buka repository GitHub `Lucverid/autobudgetin`.
3. Upload semua file di dalam folder ini ke ROOT repository.
4. Pilih replace/overwrite untuk file dengan nama yang sama, lalu Commit changes.
5. Jangan upload folder pembungkusnya; isi file harus berada sejajar dengan `index.html` di root.

## Apps Script
`telegram-database-backend.gs` adalah source backend Telegram/Google Sheets. File ini boleh disimpan di GitHub, tetapi untuk menjalankan backend tetap harus ditempel/deploy di Google Apps Script bila backend belum menggunakan versi yang kompatibel.
