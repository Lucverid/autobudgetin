# v25.3.6 — Health Pulse Sync + Balance Hierarchy

- Financial Health heart animation now follows the live Financial Score continuously.
  - Healthy score: calmer heartbeat and ECG motion.
  - Cukup: medium pace.
  - Waspada: faster pace.
  - Kritis: fastest pace.
- Condition label and pulse state are re-synced whenever the score changes.
- Balance and savings are no longer side-by-side.
  - Main balance stays large on top.
  - `Tabungan Rp ...` sits directly underneath on the same visual axis.
  - Mobile is centered; desktop aligns both lines cleanly to the left.
  - Long amounts scale/clip safely instead of breaking the layout.
- Wallet, transaction history, Telegram reminders, planning, data, offline mode and sync logic are unchanged.
