# v25.3.10 — Live Monthly Health Engine

- Health Pulse score is now deterministic: the same financial data produces the same `/100` value after reload.
- Health Pulse follows the exact monthly Home STATUS source (AMAN / WASPADA / KRITIS), not today's transaction amount.
- Legacy Financial Score rendering can no longer overwrite the visible Health Pulse number.
- Health Pulse updates automatically after `renderAll()` / transaction changes / sync events; reload is no longer required.
- Score bands are locked to status so they cannot contradict each other:
  - AMAN: 80–100
  - WASPADA: 40–79
  - KRITIS: 1–39 while available money still exists
  - END: 0
- New END state when the actual available balance reaches zero or becomes negative.
  - Home STATUS also displays END.
  - Heart animation stops.
  - ECG becomes a flat, static line.
  - If money becomes positive again, the normal pulse resumes automatically.
- No transaction, Telegram, database, planning, backup, or sync logic was changed.
