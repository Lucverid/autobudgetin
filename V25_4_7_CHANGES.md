# V25.4.7 Changes

- Kucing tidak lagi memakai emoji statis yang digeser.
- Kucing dibuat dari bagian DOM/CSS terpisah: badan, kepala, telinga, ekor, dan empat kaki.
- Animasi jalan memiliki langkah kaki bergantian, bob badan, gerak kepala, telinga, dan ekor.
- Mode kejar tikus memakai gait lebih cepat dan gerak badan berbeda.
- Tikus juga diganti dari emoji menjadi karakter CSS yang bergerak.
- Gerak posisi memakai delta-time + easing velocity agar lebih halus dan tidak kaku/device-dependent.
- Animasi pat-pat dan tidur dibuat khusus.
- Musik, slider volume, hujan, purr, dan fitur v25.4.6 tetap dipertahankan.
- Cache service worker dinaikkan ke v25.4.7.
