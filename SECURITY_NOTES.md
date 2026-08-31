# Security Notes — Agis Finance v24

Agis Finance v24 tetap mempertahankan arsitektur single-user agar deployment yang sudah berjalan tidak rusak. PIN adalah app lock lokal dan bukan enkripsi Firestore.

Untuk rilis multi-user publik, langkah berikutnya adalah menambahkan Firebase Authentication, memigrasikan dokumen agar memiliki `ownerUid`, kemudian menerapkan Firestore Security Rules yang hanya mengizinkan `request.auth.uid == resource.data.ownerUid`. Jangan menerapkan rules seperti itu sebelum migrasi karena data lama dapat langsung tidak terbaca.

v24 menambahkan Health Check yang menandai Firebase Auth sebagai warning sehingga status keamanan ini terlihat di aplikasi, bukan tersembunyi.
