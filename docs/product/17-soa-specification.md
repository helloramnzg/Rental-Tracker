# 17 – SOA Specification

## Electricity Charge

The Statement of Account (SOA) must display the resulting Electricity Charge amount. It must NOT display the electricity usage quantity (kWh) — the SOA is a billing statement, not a meter-reading report.

### Formula

Electricity Charge = Usage × Configured Electricity Rate

This formula still governs the calculation; only the usage quantity is omitted from the printed statement. The electricity rate used must reflect the rate configured in Settings at the time the SOA is generated.

## Amount Due

The "Total Amount Due" shown on the SOA is the balance remaining after payments already recorded for that billing cycle are applied (Total Charges − Amount Paid), not the original gross charge. It is recalculated from the current payment records every time the SOA is generated or regenerated.

## Water Charge

The Statement of Account (SOA) must display a fixed Water Charge of ₱200.00 per tenant.

The Water Charge is automatically included in every billing cycle, is not configurable or editable, and is stored in the generated SOA.
