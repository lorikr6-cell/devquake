# Idea: Dart game manager (`darts`)

Status: **idea** · Proposed subdomain: `darts.devquake.com`

## Summary

A game manager for dart clubs. An admin sets up the club's boards and the players on each board
(solo or one against another). Each board has a printable QR code; players scan it and land on
their board's scoring screen. Players enter each dart they throw; an interactive dartboard
highlights where the dart landed, shows both players' scores, and suggests checkouts and the best
next shots.

## Users and access

| Role       | Can                                                                            |
| ---------- | ------------------------------------------------------------------------------ |
| Club admin | Manage the club, boards and players; start matches; print QR codes; fix scores |
| Player     | Open their assigned board (via QR or link) and enter scores during a match     |
| Spectator  | View live scoreboards (optional, read-only)                                    |

Proposed: players open a board with a short-lived match token in the QR link, so casual players
do not need an account. Open question below.

## Core features (MVP)

1. **Club setup**: club name, boards (for example Board 1 to Board 8), player roster.
2. **Match setup**: admin assigns a game type and one or two players (or teams) to a board.
3. **QR codes**: one per board, printable (single or a sheet of all boards). Scanning opens the
   board's current match.
4. **Score entry per dart**: tap the segment on an on-screen dartboard or use a keypad
   (single, double, treble, outer bull 25, bull 50, miss). Undo last dart.
5. **Board visualisation**: the tapped segment is highlighted; the visit (three darts) is shown.
6. **Scoreboard**: both players' remaining scores or marks, averages, darts thrown.
7. **Checkout and next-shot suggestions**: see below.
8. **Match result and history**: winner, legs and sets, per-player statistics.

## Game types (MVP)

| Game                | Rules summary                                                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| X01 (301, 501, 701) | Start at the target and count down to exactly zero. Options: double-out (default), double-in, master-out. Busting (going below zero, to 1 with double-out, or to zero without a valid finish) resets the score to the start of the visit.                                                  |
| Cricket             | Numbers 15 to 20 and the bull. Three marks close a number (single 1, double 2, treble 3). Hitting a number you closed scores points while the opponent has not closed it. Win by closing everything with at least equal points. Variant: cut-throat (points go to opponents, lowest wins). |
| Around the Clock    | Hit 1 to 20 in order, then the bull. Option: doubles only.                                                                                                                                                                                                                                 |
| Shanghai            | Rounds 1 to 7 (or 1 to 20); only the round's number scores. A single, double and treble of the round's number in one visit ("Shanghai") wins instantly.                                                                                                                                    |
| Killer              | Each player gets a random number and must hit its double to become a killer, then removes lives by hitting opponents' doubles. Last player with lives wins.                                                                                                                                |
| Count-Up            | Highest total after a fixed number of rounds (for example 8). Good for practice.                                                                                                                                                                                                           |

Common match options: legs per set, sets per match, who throws first (bull-off or alternate).

## Checkout and next-shot suggestions (X01)

- The highest possible checkout is **170** (T20, T20, bull). Scores **169, 168, 166, 165, 163,
  162 and 159** cannot be finished with three darts.
- For the remaining score and the darts left in the visit, show the recommended finishing route
  (for example 100 = T20, D20) from a standard checkout table, plus one or two alternatives.
- When no finish is possible this visit, suggest a **setup shot** that leaves a preferred double
  (for example leaving 32 = D16 or 40 = D20).
- Respect the match rules (double-out, master-out) when suggesting.

For Cricket, suggest the most valuable target: close numbers the opponent is scoring on first,
otherwise score on numbers you have closed and they have not.

## Board layout reference

Clockwise from the top: 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5.
Rings: double (outer), treble (inner), single areas, outer bull (25) and bull (50).

## Data model (sketch)

- `Club` · `Board` (id, clubId, name, qrToken) · `Player` (id, clubId, name, userId?)
- `Match` (id, boardId, gameType, options, status, startedAt, winnerId)
- `MatchPlayer` (matchId, playerId, order) · `Leg` (id, matchId, number, winnerId)
- `Throw` (id, legId, playerId, visit, dartIndex, segment, multiplier, points, at)

## Routes (sketch)

| Pattern                   | Page or API                             |
| ------------------------- | --------------------------------------- |
| `/`                       | Club dashboard: boards and live matches |
| `/admin/boards`           | Manage boards, print QR codes           |
| `/admin/matches/new`      | Start a match on a board                |
| `/b/:boardToken`          | Board scoring screen (QR target)        |
| `/live/:matchId`          | Read-only live scoreboard               |
| `/api/matches/:id/throws` | Record and undo throws                  |

## Platform capabilities needed

Accounts (admins), database, QR generation, realtime (live scoreboards on multiple devices; can
start with polling).

## Open questions

- Must every player have an account, or is a guest name plus match token enough?
- One club per installation, or many clubs (a multi-club product with club plans)?
- Should the device at the board be a shared tablet, each player's own phone, or both?
- Tournament brackets and league tables: later phase?
