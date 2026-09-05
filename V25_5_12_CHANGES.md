# v25.5.12 — Audio re-entry fix

- Fix lobby music kadang diam setelah mode hujan aktif lalu lounge ditutup dan dibuka lagi.
- Membatalkan suspend AudioContext tertunda ketika lounge dibuka ulang.
- Memulihkan master gain setelah AudioContext benar-benar resume.
- Mencegah timeout dari sesi lama men-suspend audio sesi baru.
- Rain ambience ikut dipulihkan sesuai status hujan tersimpan.
- Thunder timer dibersihkan saat lounge ditutup supaya tidak ada guntur dari sesi lama.
- Tombol Lobby on/off tetap sinkron dengan status audio sebenarnya.
