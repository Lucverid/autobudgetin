# V25.5.5 Pupil Fix

- Menghapus pupil HTML/CSS yang mengambang di atas sprite.
- Pupil sekarang digambar langsung ke setiap frame sprite idle, walk, run, dan pet.
- Posisi pupil mengikuti posisi mata asli di masing-masing frame, jadi tidak lepas saat animasi bergerak.
- Menghapus logic gaze overlay yang menyebabkan pupil bergeser keluar mata.
- Cache service worker dinaikkan ke v25.5.5-clean.
