# Snake Leaderboard Spec

This document defines the intended leaderboard feature for the Snake mini-game in `src/components/SnakeGame.tsx`.

## Goal

Add a persistent online leaderboard for Snake that:

- always shows the current global high score in the Snake UI
- lets players open a leaderboard view from inside Snake
- allows score submission when a run qualifies for the global top 10
- prevents duplicate usernames
- filters inappropriate usernames server-side
- works cleanly on Vercel without a separate always-on backend host

## Product Decision

Use **top-10 qualification** instead of **only #1 qualification**.

Reason:

- if only the #1 score can submit, almost no one will ever use the feature after one strong run
- letting any top-10 score submit keeps the feature alive without making it noisy
- the Snake UI can still highlight the overall #1 score as the “Leaderboard High Score”

## Current Relevant Files

- `src/components/SnakeGame.tsx`
  - current local Snake UI and session-only best score
- `src/components/GameCanvas.tsx`
  - launches `SnakeGame` from the secret-room interaction flow
- `src/components/DebugTerminal.tsx`
  - can also launch `SnakeGame` via `play snake`
- `src/game/maps/secretRoom.ts`
  - arcade cabinet interaction source

## Intended UX

### Main Snake Screen

Add these persistent header/display elements:

- `Score: X`
- `Best: Y` (session/local only, keep existing behavior unless intentionally replaced later)
- `Leaderboard High Score: USERNAME - SCORE`
- `View Leaderboard` link/button

### Game Over Flow

When the run ends:

- if the score does **not** qualify for top 10:
  - show normal game-over state
  - keep `Play Again`
  - keep `View Leaderboard`
- if the score **does** qualify for top 10:
  - show a username entry form in the game-over overlay
  - show a message like `Top 10 score! Enter a username to submit`
  - allow submission only once validation passes

### Leaderboard View

A simple overlay or modal opened from `SnakeGame` should show:

- `#1` highlighted prominently with username and score
- rows `#2` through `#10`
- a close button

## Username Rules

Server-side rules:

- trimmed before validation
- normalized to lowercase for uniqueness checks
- stored with original display casing if desired, but uniqueness should be based on normalized form
- length: `3-16`
- no duplicates
- reject blank names

Recommended allowed character set:

- `A-Z`
- `a-z`
- `0-9`
- `_`
- `-`

This stricter rule is intentional. It reduces moderation risk significantly compared with fully open Unicode usernames.

## Moderation

Moderation must happen on the server, not just the client.

Recommended approach:

1. strict allowed-character validation
2. denylist/profanity filtering
3. reserve blocked names such as:
   - `admin`
   - `moderator`
   - `vercel`
   - `zain`
   - any impersonation-sensitive names if desired

Important note:

- “filter inappropriate language in all languages” is not realistically solvable perfectly with a lightweight indie stack
- the best practical version is:
  - strict character rules
  - profanity library/service
  - manual denylist

## Backend Shape

Use Vercel-hosted frontend + Vercel Functions + managed database.

No separate long-running backend host is required.

### API Endpoints

#### `GET /api/snake-leaderboard`

Returns:

```json
{
  "topScore": {
    "username": "Zain",
    "score": 42
  },
  "entries": [
    { "rank": 1, "username": "Zain", "score": 42 },
    { "rank": 2, "username": "Player2", "score": 38 }
  ],
  "cutoffScore": 17
}
```

Behavior:

- `entries` contains at most 10 rows
- `topScore` duplicates rank 1 for convenience in the main Snake UI
- `cutoffScore` is the current 10th-place score, or `null` if fewer than 10 entries exist

#### `POST /api/snake-leaderboard`

Input:

```json
{
  "username": "pharaoh_dev",
  "score": 21
}
```

Validation:

- username valid
- username not already taken
- score is a positive integer
- score qualifies for the current top 10

Responses:

- `201` created on success
- `400` invalid input
- `409` duplicate username
- `422` score did not qualify

## Database Design

Recommended table:

```sql
create table snake_leaderboard_entries (
  id bigserial primary key,
  username text not null,
  username_normalized text not null unique,
  score integer not null,
  created_at timestamptz not null default now()
);
```

Recommended index:

```sql
create index snake_leaderboard_score_idx
on snake_leaderboard_entries (score desc, created_at asc);
```

Ranking rule:

- higher score wins
- earlier `created_at` wins ties

## Client Behavior Details

### On Snake Open

`SnakeGame.tsx` should:

- fetch leaderboard once on mount
- render the inline global high score
- cache the top 10 in local state

### On Game Over

Compute:

- if fewer than 10 entries exist, score qualifies if `score > 0`
- if 10 entries exist, score qualifies if `score > cutoffScore`

Recommended tie rule for submission:

- do **not** allow equal-score submissions into the top 10 by default
- require strictly greater than the current cutoff

This keeps the list stable and avoids awkward tie overflow.

### On Submit Success

- refresh leaderboard data immediately
- update the inline top-score display
- keep the submitted username visible in the leaderboard
- then allow replay

## UI Components To Add Later

Recommended additions:

- `SnakeLeaderboardPanel.tsx`
  - renders top 10 leaderboard overlay
- optional `SnakeScoreSubmit.tsx`
  - username entry section for qualifying runs

You can also keep everything inside `SnakeGame.tsx` if you want the first version to stay compact.

## Suggested Implementation Order

1. Add database + API routes
2. Add leaderboard fetch on `SnakeGame` mount
3. Show inline `Leaderboard High Score`
4. Add `View Leaderboard` overlay
5. Add top-10 qualification logic on game over
6. Add username submission form
7. Add moderation/validation hardening
8. Add polish states:
   - loading
   - submit success
   - duplicate username error
   - profanity rejection
   - score did not qualify

## Error States

Plan for these user-facing errors:

- `Username already taken`
- `Username contains unsupported characters`
- `Username is not allowed`
- `That score no longer qualifies for the top 10`
- `Unable to load leaderboard`
- `Unable to submit score`

## Scope Notes

Not in scope for the first leaderboard version:

- editing usernames
- deleting scores
- multiple entries per username
- live realtime updates via websockets
- anti-cheat beyond basic server validation

## Recommended Future Enhancements

After the first stable version:

- highlight the current player’s submitted row
- show “You placed #N”
- add a crown/ornament to rank 1
- optionally show `today` or `all-time` tabs
- add a tiny admin-only moderation path later if needed
