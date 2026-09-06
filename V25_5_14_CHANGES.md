# V25.5.14

- Fix audio lounge tetap terdengar setelah overlay ditutup.
- Saat Cat After Hours ditutup, seluruh Web Audio graph sekarang dihancurkan (`AudioContext.close()`), bukan hanya dimute/suspend.
- Semua oscillator, rain loop, thunder timer, gain node, dan pending audio node dihentikan dan diputus.
- Saat lounge dibuka lagi, AudioContext dibuat baru sehingga musik mulai fresh.
- Tambah safety guard: jika overlay kehilangan class `open` lewat navigasi/DOM, audio otomatis dihancurkan.
- Tambah cleanup pada pagehide/beforeunload.
