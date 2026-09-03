# v25.3.4 — Balance, Wallet & Telegram Fix

- Restored the **available balance number** on Home.
- Kept the **"Saldo Tersedia" text label removed**.
- Kept all greeting text such as **"Pagi, Agis" / "Halo, Agis" removed**.
- Mobile wallet cards now use a fixed **3-column grid**: Tunai, Bank, and E-Wallet are visible together with no horizontal swipe.
- Wallet cards are slightly smaller on phones so all three fit cleanly.
- Telegram expense notification no longer has the old **Rp50.000 minimum threshold**.
- Every valid new expense (`nominal > 0`) can trigger the backend Telegram notification, using the actual transaction amount.
- Telegram notification marker is now saved **after** the message sends successfully, so a failed send can retry on the next snapshot sync.

## Apps Script update required
Replace the existing Apps Script code with the included `telegram-database-backend.gs`, then create a new deployment version using **Deploy → Manage deployments → Edit → New version → Deploy**. The existing `/exec` URL can remain the same.
