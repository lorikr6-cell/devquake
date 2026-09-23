# Idea: Utility bill manager (`bills`)

Status: **idea** · Proposed subdomain: `bills.devquake.com`

## Summary

A private tool for sharing utility costs at an address (for example a shared flat or a family
house). Members submit their meter readings or consumption per utility, see their history, and
see whether the main bill and their own share have been paid, including whether they paid too
much or too little.

## Users and access

Access is strict: there is no public sign-up.

| Role           | Can                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------- |
| Platform admin | Everything; creates bills admins                                                         |
| Bills admin    | Create addresses and utilities, invite and remove users, enter bills, record payments    |
| Member         | Only addresses they belong to: submit consumption, view history, view bills and balances |

- Users are invited by an admin (email invitation) and assigned to one or more addresses.
- Every change to readings, bills and payments is written to an audit log.

## Core features (MVP)

1. **Addresses**: name, street address, members.
2. **Utilities per address**: electricity, gas, water, heating, internet or custom; each with a
   unit (kWh, m³, flat fee) and a split method.
3. **Consumption submissions**: a member submits a meter reading (or a consumption value) for a
   utility, address and period. Consumption is derived from the previous reading.
4. **Consumption history**: per member and utility; table and chart per period.
5. **Main bill**: admin enters the provider's bill (period, amount, due date) and marks it paid
   or unpaid.
6. **Person's share**: calculated from the split method; shows the amount due per member.
7. **Payments and balance**: record what each member paid; show **paid**, **unpaid**,
   **overpaid** (credit) or **underpaid** (debt), with the difference carried to the next period.

### Split methods

| Method         | How the share is calculated                                  |
| -------------- | ------------------------------------------------------------ |
| By consumption | Share proportional to each member's submitted consumption    |
| Equal          | Bill divided equally between members                         |
| Fixed percent  | Admin sets a percentage per member                           |
| Hybrid         | Fixed part split equally, variable part split by consumption |

## Later

- Photo of the meter attached to a reading.
- Reminders before due dates and for missing readings (email or push).
- Export to CSV or PDF per period.
- Multiple currencies (default RON).

## Data model (sketch)

- `Address` (id, name, street) · `AddressMember` (addressId, userId, role)
- `Utility` (id, addressId, type, unit, splitMethod, splitConfig)
- `Reading` (id, utilityId, userId, periodStart, periodEnd, value, submittedAt)
- `Bill` (id, utilityId, periodStart, periodEnd, amount, dueDate, paidAt)
- `Share` (billId, userId, amountDue) · `Payment` (id, billId, userId, amount, paidAt)
- `AuditEntry` (id, userId, action, entity, before, after, at)

## Routes (sketch)

| Pattern                       | Page or API                                 |
| ----------------------------- | ------------------------------------------- |
| `/`                           | Dashboard: my addresses and open balances   |
| `/addresses/:id`              | Address overview: utilities, bills, members |
| `/addresses/:id/readings/new` | Submit a reading                            |
| `/addresses/:id/history`      | Consumption history                         |
| `/admin`                      | Admin: addresses, users, invitations        |
| `/api/readings`               | Create and list readings                    |
| `/api/bills/:id/payments`     | Record payments                             |

## Platform capabilities needed

Accounts, per-plugin roles, database, email (invitations and reminders), audit logging.

## Open questions

- Does each member have an individual meter, or is only the main meter read?
- How is a rounding difference handled when shares do not add up exactly to the bill?
- Can a member see other members' consumption at the same address, or only totals?
