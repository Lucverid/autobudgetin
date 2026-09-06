# v25.5.17 Stability Fix

Fokus: stabilitas, tanpa fitur gameplay baru.

- Fix scheduler guntur saat masuk ulang lounge dengan Rain masih ON.
- Guntur sekarang dijadwalkan hanya setelah sesi audio lounge berhasil aktif.
- Audio guard membersihkan source stale walau flag audio tidak sinkron.
- Pindah tab/browser background mematikan audio; kembali ke tab dengan lounge masih terbuka memulai sesi audio baru.
- Hapus bug reward Rp0 pagi hari yang sebelumnya bisa meng-full-kan vitality internal.
- Vitality internal khusus hunger/revive; hati HUD tetap mengikuti kondisi finansial.
- Teks jalan kucing sekarang rain-aware dan tidak menyebut hujan ketika Rain OFF.
- Legacy setGoal dibuat fail-safe jika #goal-input sudah tidak ada.
- Cache PWA dinaikkan ke agis-finance-v25-5-17-clean.

Tambahan audit core:
- Fix final exportBackup wrapper v25 yang sebelumnya menimpa backup lengkap dan membuang carry-over + Recovery Target.
- Snapshot backend sekarang ikut membawa carry-over, Recovery Target, dan audit.
- Edit Bill Calendar sekarang mempertahankan kategori lama, tidak balik ke Tagihan saat edit.
- Reset Semua Data sekarang juga membersihkan Budget Tersimpan/carry-over, Recovery Target, dan planning lokal.
- Fix Reset Semua Data agar sidecar tidak ikut terhapus kalau user membatalkan konfirmasi pada kondisi data utama kosong.
- StartMusic failure sekarang hard-clean semua node/timer supaya tidak ada audio ghost jika WebAudio error di tengah startup.
