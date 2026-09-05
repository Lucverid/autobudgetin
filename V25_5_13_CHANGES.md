# v25.5.13

- Closing Cat After Hours now hard-mutes all lounge audio immediately.
- AudioContext suspends shortly after close to prevent audio leaking outside the easter egg.
- Reopening the easter egg resumes audio and starts the lobby music fresh.
- Rain ambience stops together with the lounge.
- Pending thunder/lightning callbacks are canceled on close, preventing stray thunder after the overlay is gone.
- Service worker cache bumped to v25.5.13.
