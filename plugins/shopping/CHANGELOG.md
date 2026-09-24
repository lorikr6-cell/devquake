# Changelog: Shared shopping lists

## 0.1.0

- Own MySQL database (ADR 0007) with lists, members, invites, stores and items.
- Lists with a currency; items with quantity, unit, price per unit and description; totals per
  store, still-to-buy and whole-list totals; shopping mode; clear done items.
- Stores with name, type, location and description; store types from a catalogue (food,
  home improvement, electronics, apparel, health and beauty), filled in automatically for
  well-known chains.
- Sharing by invite link, code and QR (revocable), and by adding people from the owner's
  DevQuake referral network (`ctx.people`).
- Live-ish updates: open lists poll the list version every 4 seconds.
- Platform hooks: admin dashboard stats and account deletion.
