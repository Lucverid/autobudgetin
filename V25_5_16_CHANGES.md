# v25.5.16

- Fix tombol close Cat After Hours yang tidak responsif.
- Declare thunderTimer, thunderEchoTimer, dan lightningClearTimer untuk strict mode.
- Close overlay sekarang fail-safe: UI ditutup lebih dulu, cleanup audio/scene dibungkus try/catch.
- Close button diberi z-index dan pointer/touch safety untuk mobile.
- Audio/scene cleanup tetap berjalan saat keluar lounge.
