# v25.5.15 clean

Audio lifecycle fix:
- keluar lounge langsung hard-silence tanpa fade/delay
- rain source benar-benar di-stop dan dilepas saat lounge ditutup
- AudioContext tidak lagi di-close/suspend setiap close agar tidak race saat buka ulang
- musik lobby dan ambience hujan dipisah lifecycle-nya
- buka lounge selalu memulai musik lobby fresh, lalu mengaktifkan rain ambience jika Rain ON
- session token mencegah callback async dari sesi lama menyalakan/mematikan audio sesi baru
- thunder hanya aktif ketika lounge terbuka + Rain ON
