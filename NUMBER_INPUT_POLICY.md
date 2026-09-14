# Number Input Policy

- Rupiah/money: strip semua karakter non-digit lebih dulu, lalu format dengan locale `id-ID`.
- Jangan parse string terformat seperti `1.0000` dengan `Number()` karena akan terbaca sebagai 1.
- Persentase/rasio/decimal: gunakan parser decimal terpisah.
- Quantity/unit/hari/tenor: gunakan numeric parser biasa, bukan formatter rupiah.
- Setiap fitur baru yang menerima uang harus diuji melewati batas ribuan dan jutaan.
