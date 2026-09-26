# My vault

DevQuake app served at `https://myvault.devquake.com` (local: `http://myvault.localhost:3000`). Own
MySQL database (ADR 0007); release to people who do not use the app and DevQuake-wide activity
come from ADR 0022.

People keep private information in **entries** (a note, secret fields and files) encrypted in the
browser with a **vault key** (32 random bytes, shown once) and the answers to **three questions**
(date, text, number, one choice, several choices). An entry is either **private** (no recipients;
the server never has its key) or has **recipients** from the owner's DevQuake referral network,
who get the key by email when the owner has not used DevQuake for N days (and not before an
optional day). Every try to open an entry is logged; 3 wrong tries lock it for 36 hours (the
owner is emailed, sees who tried and what they answered, and can unlock it).

## Routes

| Type | Pattern                 | File                  | Purpose                                                     |
| ---- | ----------------------- | --------------------- | ----------------------------------------------------------- |
| Page | `/`                     | `src/pages/home.tsx`  | Own entries with state; entries released to me              |
| Page | `/new`                  | `src/pages/new.tsx`   | Wizard: content, questions, vault key, recipients           |
| Page | `/entries/:id`          | `src/pages/entry.tsx` | Owner: open/edit, recipients, tries (with answers), unlock  |
| Page | `/open/:id`             | `src/pages/open.tsx`  | Recipients open a released entry (**signed-in route**)      |
| Page | `/help`                 | `src/pages/help.tsx`  | User manual; **public** (ADR 0009)                          |
| API  | `/health`               | `src/api/health.ts`   | Liveness                                                    |
| API  | `/entries`              | `src/api/entries.ts`  | GET own and shared; POST create (ciphertext, never the key) |
| API  | `/entries/:id`          | `src/api/entry.ts`    | GET owner view, PATCH rename, DELETE                        |
| API  | `/entries/:id/release`  | `src/api/release.ts`  | PUT recipients and rule (vault key needed with recipients)  |
| API  | `/entries/:id/content`  | `src/api/content.ts`  | PUT re-encrypted content (key and answers checked)          |
| API  | `/entries/:id/unlock`   | `src/api/unlock.ts`   | POST: owner unlocks                                         |
| API  | `/entries/:id/attempts` | `src/api/attempts.ts` | GET every try (answers of failed ones)                      |
| API  | `/open/:id`             | `src/api/open.ts`     | GET questions and lock state (**signed-in route**)          |
| API  | `/open/:id/attempt`     | `src/api/attempt.ts`  | POST key and answers → ciphertext (**signed-in route**)     |

**Signed-in routes** (`manifest.signedInRoutes`, ADR 0022): any signed-in DevQuake user may reach
them without a subscription (recipients); `entryForOpening` lets only the owner, or a recipient
of a released entry, through.

## Cryptography

- Browser (`lib/crypto.ts`, Web Crypto; tested in Node): content key = HKDF-SHA-256(vault key,
  random salt, info = "devquake-vault-v1" + NUL + the normalised answers); content = AES-256-GCM
  of `VaultContent` JSON (note, secret fields, files as base64; max 6 MB).
- Answers are normalised the same way in browser and server (`lib/model.ts`: dates
  `YYYY-MM-DD`, text folded, numbers canonical, choices as indexes).
- Server (`lib/server-crypto.ts`): answers checked against scrypt (N = 2^15); the key against
  SHA-256 (`key_check`). The vault key is only on the server for entries with recipients, sealed
  with AES-256-GCM under `MYVAULT_MASTER_KEY`; answers of failed tries are sealed the same way for
  the owner's review. Successful tries store no answers.
- Honest limit: with the database **and** the master key, someone could guess weak answers of
  entries with recipients. The app asks owners to make one answer hard to guess.

## Release (scheduled hook, `src/platform.ts`)

Every run (at most every 5 minutes): owners of newly locked entries get an email; for entries with
recipients, the owner's last activity is the later of `ctx.lastActiveAt` (DevQuake-wide: sign-in
and any session use, ADR 0022) and the vault's own `activity` table. `releaseState` (tested):
release when inactive ≥ `inactive_days` (counted from the activity, never before the rule was set)
and the `not_before` day has come; a warning email in the last days (once per inactivity period,
`warned_for`). Release marks `released_at` first, unseals the key and emails every recipient with
`mail.sendToUser(..., { withoutAccess: true })` (`manifest.mailWithoutAccess`).

## Configuration

- `MYVAULT_DB_NAME`, `MYVAULT_DB_USER`, `MYVAULT_DB_PWD` (the host derives `<ID>_DB_*` from the
  app id `myvault`).
- `MYVAULT_MASTER_KEY`: 32 random bytes, base64. Without it the app shows "being set up". Create
  it once and never change it (sealed keys would no longer open):
  `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
- MySQL `max_allowed_packet` ≥ 16 MB (entries up to about 8 MB of ciphertext).

| Migration          | Adds                                                           |
| ------------------ | -------------------------------------------------------------- |
| `0001_myvault.sql` | entries, entry_questions, entry_recipients, attempts, activity |

## Development

```bash
pnpm dev                                   # from the repo root, then http://myvault.localhost:3000
pnpm --filter @devquake/plugin-myvault test
pnpm db:migrate --plugin myvault           # needs MYVAULT_DB_* in the environment
```
