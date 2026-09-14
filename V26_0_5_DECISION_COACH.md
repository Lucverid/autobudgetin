# v26.0.5 — Decision Coach & Editable Scenarios

Base: v26.0.4 Stable Nominal Fix.

## Added
- Decision Coach inside Decision Lab for Business Analysis and Credit Simulation.
- Live heuristic score, decision status, concise explanation, and up to 3 priority actions.
- Business coach considers HPP, selling price, margin target, capital gap, net profit, BEP, and payback.
- Credit coach considers installment, DSR, monthly buffer, free cash for DP, comfortable installment limit, and financing premium.
- Responsive coach card for mobile and desktop.

## Saved scenario flow
- Saving a new business/credit scenario now clears the entire input form.
- Selecting a saved scenario loads its values back into the form and enters Edit Mode.
- Saving while in Edit Mode updates the same scenario ID instead of creating a duplicate.
- Preserving IDs keeps Stable+ tracking/realisasi source links intact.
- Cancel/reset exits Edit Mode and clears the form.
- Deleting the scenario currently being edited also clears Edit Mode safely.

## Stability
- Core Firebase/Firestore and Stable+ tracking modules were not rewritten.
- Offline cache bumped to `agis-finance-v26-0-5-decision-coach`.
- v26 Decision Lab JS/CSS are cache-busted at `v=26.0.5`.
- Existing nominal parser fix remains in place.
