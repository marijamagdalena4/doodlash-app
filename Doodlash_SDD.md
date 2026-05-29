# Doodlash — Software Design Document

**Draw-and-Guess Multiplayer Web Game**  
Version 1.1 | For Cursor AI Implementation

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project File Structure](#3-project-file-structure)
4. [Landing Page](#4-landing-page)
5. [Lobby Page](#5-lobby-page)
6. [Game Page](#6-game-page)
7. [Scoring System](#7-scoring-system)
8. [Between-Round Scoreboard](#8-between-round-scoreboard)
9. [Game Round Flow](#9-game-round-flow)
10. [Socket Event Reference — Game Phase](#10-socket-event-reference--game-phase)
11. [Word List](#11-word-list)
12. [Bonus / Extra Features](#12-bonus--extra-features)
13. [UI & Visual Style Guidelines](#13-ui--visual-style-guidelines)
14. [Server-Side Architecture](#14-server-side-architecture)
15. [Environment Variables](#15-environment-variables)
16. [Deployment Guide](#16-deployment-guide)
17. [Notes for Cursor AI Implementation](#17-notes-for-cursor-ai-implementation)
18. [Acceptance Criteria](#18-acceptance-criteria)
19. [Appendix A: Recommended npm Packages](#appendix-a-recommended-npm-packages)

---

## 1. Project Overview

| Field | Value |
|---|---|
| Project Name | Doodlash |
| Type | Real-time multiplayer draw-and-guess web game |
| Max Players | 6 per room |
| Target Deployment | Web (Frontend: Vercel, Backend: Railway) |
| Tech Stack | React 18 + TypeScript (frontend), Node.js + Express + Socket.IO (backend) |

Doodlash is a room-based, real-time multiplayer drawing and guessing game inspired by Skribbl. Players take turns drawing a randomly assigned word or phrase while others race to guess it in a shared chat. The game features a colorful, playful UI, six selectable hand-drawn characters, a landing page, and a full round-based session loop with scoring.

---

## 2. Technology Stack

### 2.1 Frontend

- React 18 + TypeScript (Vite scaffold)
- Socket.IO Client — real-time game events
- Tailwind CSS — utility-first styling
- HTML5 Canvas API — drawing board
- React Router v6 — Landing → Lobby → Game routing
- Zustand — lightweight client state (room, player, game phase)

### 2.2 Backend

- Node.js 20 + Express — HTTP server & REST endpoints
- Socket.IO Server — bidirectional real-time events
- In-memory room/game state (no DB required for v1)
- CORS configured for Vercel frontend origin

### 2.3 Deployment

- Frontend → Vercel (static export via Vite build)
- Backend → Railway (Node Docker container, persistent WebSocket)
- Environment variable: `VITE_SERVER_URL` pointing to Railway URL

---

## 3. Project File Structure

### 3.1 Monorepo Layout

```
doodlash/
  client/                  ← Vite + React + TS frontend
    src/
      components/
        canvas/            ← DrawingCanvas, ToolBar, ColorPicker
        game/              ← GameRoom, WordHint, Timer, PlayerList
        chat/              ← ChatBox, GuessInput
        lobby/             ← LobbyRoom, PlayerSlot, ReadyToggle
        landing/           ← LandingPage, CharacterPicker, PlayButton
        shared/            ← Scoreboard, AvatarIcon, ConfettiOverlay
      hooks/               ← useSocket, useGame, useCanvas, useTimer
      store/               ← Zustand slices (player, room, game)
      types/               ← shared TypeScript interfaces
      pages/               ← Landing.tsx, Lobby.tsx, Game.tsx
      assets/              ← character SVGs, sound fx
      App.tsx
      main.tsx
  server/                  ← Node.js + Express + Socket.IO
    src/
      rooms.ts             ← Room map, CRUD helpers
      game.ts              ← Round logic, scoring, timers
      words.ts             ← Word list (single + phrases)
      socket.ts            ← All socket event handlers
      index.ts             ← Express app + Socket.IO bootstrap
  package.json             ← workspace root
```

---

## 4. Landing Page

**Route:** `/`  
**File:** `client/src/pages/Landing.tsx`

### 4.1 Layout

- Full-viewport colorful hero — gradient background (purple → pink → yellow)
- Centered game logo "DOODLASH" in large, slightly wobbly hand-drawn-style font (Google Font: `Fredoka One` or `Caveat`)
- Tagline below logo: *"Draw it. Guess it. Win it."*
- Character picker row centered below tagline (6 characters)
- Play button below the picker
- Subtle animated doodle elements floating in background (CSS keyframe animations)

### 4.2 Character Picker

6 characters, each is a simple SVG blob-person with a unique solid color fill and hand-drawn stroke (`stroke-width: 3`, `stroke-linejoin: round`). No gradients — flat color only to maintain hand-drawn aesthetic.

| ID | Name | Fill Color | Accent Color | Distinguishing Feature |
|---|---|---|---|---|
| char_1 | Blobby | `#FF6B6B` | `#C0392B` | Round ears |
| char_2 | Ziggy | `#FFD93D` | `#F39C12` | Spiky hair |
| char_3 | Mint | `#6BCB77` | `#27AE60` | Bow on head |
| char_4 | Inky | `#4D96FF` | `#2980B9` | Square glasses |
| char_5 | Lavvy | `#C77DFF` | `#8E44AD` | Long antennae |
| char_6 | Tangy | `#FF9F43` | `#E67E22` | Tiny top hat |

**Character card specs:**
- Size: `140×160px`, white rounded card with drop shadow
- Unselected: normal card with character name below SVG
- Selected: thick colored border (3px, matching character color) + checkmark badge top-right + `scale(1.08)` transform
- Hover: `scale(1.04)` + increased box-shadow

### 4.3 Name Input

- Text input above character picker; placeholder: `"Your name"`
- Max 16 characters, required
- Styled: colorful outlined input, rounded, 2px border in primary purple

### 4.4 Room Code Input (optional)

- Text input below name field; placeholder: `"Room code (optional)"`
- Auto-uppercase; accepts format `AAAA-####` (e.g. `DOOD-4821`)
- If URL contains `?room=DOOD-4821`, pre-fill this field from the query param
- Empty field → **create** a new room on play
- Filled field → **join** that room (server validates it exists and has space)

### 4.5 Play Button

- Label: `"LET'S PLAY!"`
- Disabled + grayed out if no character selected OR name is empty
- Enabled: vivid gradient (purple → pink), bouncy hover animation
- On click:
  1. Emit `join_lobby` with `{ name, characterId, roomCode? }` and wait for server **ack** `{ roomCode, playerId, isHost }`
  2. On success → persist `{ name, characterId, roomCode, playerId }` in Zustand + `sessionStorage`
  3. Navigate to `/lobby?room=<roomCode>`
- On ack error (room full, not found, game in progress) → show toast with server message; stay on landing
- If name or character missing → tooltip: *"Pick a name and character first!"*

---

## 5. Lobby Page

**Route:** `/lobby`  
**File:** `client/src/pages/Lobby.tsx`

### 5.1 Layout

- Header: "Waiting Room" + room code (e.g. `DOOD-4821`)
- 6 player slots grid — filled slots: character avatar + player name + Ready badge
- Empty slots: dashed border placeholder + "Waiting..." label
- Share URL button — copies current URL to clipboard
- "Ready" toggle button per player (only your own slot is interactive)
- "Start Game" button — host only, enabled only when ≥ 2 players are all ready
- Live player count: `"X / 6 players"`
- **Host only:** "Rounds" selector — segmented control: `3` | `5` | `7` (default `5`); emits `set_rounds` on change

### 5.2 Room Join & Rejoin Flow

| Action | How it works |
|---|---|
| **Create room** | Landing play with empty room code → server creates room, first player is **host**, ack returns new `roomCode` |
| **Join room** | Enter code or open share link `https://<app>/lobby?room=DOOD-4821` → landing pre-fills code → play joins that room |
| **Share link** | Lobby "Copy link" copies `window.location.origin + '/lobby?room=' + roomCode` |
| **Direct lobby URL** | `/lobby?room=CODE` without session → redirect to `/?room=CODE` to collect name/character, then re-join |
| **Refresh in lobby** | If `sessionStorage` has valid `roomCode` + `playerId`, auto-emit `rejoin_lobby` on socket connect |
| **Refresh mid-game** | Same `rejoin_lobby`; server sends current phase snapshot (`lobby` \| `playing` \| `scoreboard`) and client routes to `/game` if needed |

**Share URL button** copies the lobby link (not the bare origin).

### 5.3 Socket Events (Lobby)

| Event | Direction | Payload | Description |
|---|---|---|---|
| `join_lobby` | C → S (ack) | `{ name, characterId, roomCode? }` | Create or join room; **ack:** `{ roomCode, playerId, isHost }` or `{ error }` |
| `rejoin_lobby` | C → S (ack) | `{ roomCode, playerId, name, characterId }` | Restore session after refresh; **ack:** same as join or `{ error }` |
| `player_joined` | S → C | `{ players[], hostId }` | Broadcast updated player list |
| `player_left` | S → C | `{ playerId, players[], hostId? }` | Player left lobby; `hostId` present if host transferred |
| `player_ready` | C → S | `{ ready: bool }` | Toggle ready state |
| `ready_update` | S → C | `{ players[] }` | Broadcast updated ready states |
| `set_rounds` | C → S | `{ totalRounds: 3 \| 5 \| 7 }` | Host sets round count (lobby only) |
| `rounds_updated` | S → C | `{ totalRounds }` | Broadcast round setting to room |
| `start_game` | C → S | `{}` | Host starts the game (requires ≥ 2 players, all ready) |
| `game_starting` | S → C | `{ totalRounds }` | Redirect all clients to `/game` |

### 5.4 Edge Cases (Lobby)

| Scenario | Behavior |
|---|---|
| Room full (6 players) | `join_lobby` ack error: `"Room is full"` |
| Invalid room code | ack error: `"Room not found"` |
| Join while game in progress | ack error: `"Game already started"` (reconnect uses `rejoin_lobby` instead) |
| Host leaves lobby | Next joined player (by join order) becomes host; `hostId` broadcast |
| Only 1 player ready | Start Game stays disabled |
| Player leaves before start | Slot freed; ready states unchanged for remaining players |

---

## 6. Game Page

**Route:** `/game`  
**File:** `client/src/pages/Game.tsx`

### 6.1 Overall Layout (Three-column)

| Column | Width | Content |
|---|---|---|
| LEFT | 200px fixed | Player list with scores |
| CENTER | flex-grow | Word hint bar (top) + Drawing canvas (middle) + Chat/guess input (bottom) |
| RIGHT | 200px fixed | Round info panel + drawing status + tool palette (drawer only) |

### 6.2 Word Hint Bar

- Displays blank underscores per letter: `_ _ _ _` (spaces between words preserved)
- Format: `"_ _ _   _ _ _ _ _ _ (3, 6)"` — word count in parentheses on far right
- Random letter reveals: first at 60s, second at 30s
- Active drawer sees actual word in a colored ribbon above the hint bar
- Background: light pastel matching current round color theme

### 6.3 Drawing Canvas

- Size: `800×540px` white canvas (HTML5 Canvas element), responsive scaling on smaller screens
- Background: always solid white
- Only the active drawer can draw; others see a read-only live-synced version
- Canvas cleared at start of each turn
- Drawing data broadcast via socket as compressed delta strokes: `{ x, y, color, size, tool }[]`
- Canvas clear animation: fun wipe effect between turns

### 6.4 Drawing Toolbar (RIGHT column, drawer only)

- **Brush sizes:** Small `4px` | Medium `12px` | Large `28px` — icon buttons
- **Eraser** tool toggle
- **Fill bucket** — flood-fill algorithm on canvas
- **Undo** — last 20 strokes stored **on the drawer’s client**; on undo, drawer emits `canvas_undo` with the updated stroke list; server replaces `room.strokes` and broadcasts to all clients (viewers re-render from stroke list)
- **Clear canvas** — with confirm dialog; emits `canvas_clear`, server clears `room.strokes`

#### Color Palette

24-color grid (6×4), inspired by MS Paint:

| Row | Colors (hex) |
|---|---|
| Row 1 | `#000000` `#FFFFFF` `#808080` `#C0C0C0` `#800000` `#FF0000` |
| Row 2 | `#FF6B6B` `#FF9F43` `#FFD93D` `#6BCB77` `#4D96FF` `#C77DFF` |
| Row 3 | `#E74C3C` `#E67E22` `#F1C40F` `#27AE60` `#2980B9` `#8E44AD` |
| Row 4 | `#2C3E50` `#34495E` `#1ABC9C` `#16A085` `#D35400` `#7F8C8D` |

- Active color shown in a larger swatch below the grid
- Color cells: `28×28px`, rounded corners, hover: `scale(1.2)`, active: white ring

### 6.5 Right Panel Info

- `"✏️ [PlayerName] is drawing!"` — large, colorful, animated text
- Round counter: `"Round 2 / 5"`
- Countdown timer (see §6.7)
- If viewer: `"🔍 Guess the word!"` subtext

### 6.6 Left Panel — Player List

- Players sorted by score (highest first)
- Each entry: character avatar (40px SVG) + name + current round points + total score
- Active drawer has a pencil icon badge
- Correct guessers: green checkmark + animated score increment
- Own player entry highlighted with a subtle background

### 6.7 Timer

- 100 seconds per turn — large circular countdown display
- Color transitions:
  - Green: 100–40s
  - Yellow: 40–15s
  - Red: 15–0s
- Last 10 seconds: timer pulses + subtle tick sound effect
- At 0: round ends, correct answer revealed to all

### 6.8 Chat + Guess Input

- Shared scrollable message log (below canvas, bottom of center column)
- Messages: `player avatar + name + message text + timestamp`
- Correct guess: message replaced with `"🎉 [Name] guessed it!"` in green — actual word NOT shown until round ends
- Active drawer chat: disabled, shows `"You are drawing — no peeking!"` placeholder
- Input: text field + Send button; Enter key submits; max 60 chars
- Guesses are case-insensitive and trimmed; **must match the full answer string** (single word or entire phrase including spaces); partial word matches do NOT score
- Post-correct-guess: player can still chat but guesses no longer score
- Drawer cannot submit guesses (input disabled)

---

## 7. Scoring System

All scoring is computed **server-side** when a correct guess is validated. Scores are cumulative across the whole game.

### 7.1 Guesser Points (single formula)

For each correct guesser, in order of correctness:

1. **Placement base** (by guess order among correct guessers this turn):

| Order | Base points |
|---|---|
| 1st correct | 350 |
| 2nd correct | 280 |
| 3rd+ correct | 220 |

2. **Hint penalty:** If one or more `hint_reveal` events have already fired this turn, use **180** as the base instead of the placement base above.

3. **Time multiplier:** `multiplier = max(0.15, secondsLeft / 100)` — linear decay from 100% at turn start to 15% floor at 0s.

4. **Guesser total:** `round(points) = round(base × multiplier)`.

5. **Fast bonus:** If guess occurs within **10 seconds** of `turn_start` (`secondsLeft ≥ 90`), add **+50** (applied after multiplier).

**Worked example:** 2nd correct guesser, no hints yet, 55s left → base 280 × 0.55 = 154, +0 fast bonus → **154 pts**.

**Worked example:** 1st correct, after 2nd hint, 20s left → base 180 (hint penalty) × 0.20 multiplier → **36 pts**.

### 7.2 Drawer Points

- **+40 pts** per non-drawer player who guessed correctly this turn
- **0 pts** if nobody guessed correctly

### 7.3 Rules

- Each player can score at most **once** per turn (first correct guess only)
- Incorrect guesses award 0
- Streak bonus (+50) is defined in §12.3 (stretch only)

---

## 8. Between-Round Scoreboard

- Displayed for 6 seconds between each drawing turn
- Full-screen overlay with animated entry (slide up)
- All players ranked by total score with round delta (e.g. `+120 pts`)
- Podium style for top 3: gold / silver / bronze icons
- After final round: `"FINAL SCORES"` title + confetti animation + Play Again button
- Play Again: resets game state, returns all to lobby (characters and names preserved)

---

## 9. Game Round Flow

### 9.1 Session Structure

- Default: **5** rounds per game; host selects **3, 5, or 7** in lobby (§5.1) before Start Game
- Each round = every player draws once (one full cycle through `turnOrder`)
- Turn order: randomized at game start, fixed for the session

### 9.2 Turn Flow (per drawer)

1. Server picks a random word/phrase from the word list
2. Word sent privately to drawer via socket (to their socket ID only)
3. All players receive hint structure: word length + blank count
4. 100-second countdown starts server-side; synced to all clients
5. At 60s and 30s: server sends `hint_reveal` exposing one random letter
6. When all non-drawer players guess correctly OR timer hits 0: `round_end` event
7. Server broadcasts correct word + updated scores; scoreboard shown
8. After 6s: next turn begins or game ends

### 9.3 Edge Cases (Game)

| Scenario | Behavior |
|---|---|
| All non-drawers guess correctly before timer ends | End turn immediately; emit `round_end` |
| Timer hits 0 | `round_end` with word revealed; no extra guess points |
| Player disconnects mid-game | Emit `player_disconnected`; if drawer, pause up to **30s** for `rejoin_lobby` (§12.6 stretch); MVP: remove player, skip their remaining turns in order |
| Host disconnects mid-game | **No host actions in-game**; no transfer needed until lobby |
| Player count drops to 1 mid-game | Continue with remaining players; solo player still takes all turns in `turnOrder` |
| Drawer disconnects (MVP) | Skip turn after 5s, pick next drawer, broadcast `turn_start` |
| Drawer disconnects (stretch §12.6) | Hold slot 30s, show `"Waiting for [name]..."` |

---

## 10. Socket Event Reference — Game Phase

| Event Name | Direction | Payload Summary | Purpose |
|---|---|---|---|
| `turn_start` | S → C | `{ drawerId, hintStructure, round }` | Begin a new drawing turn |
| `word_secret` | S → drawer | `{ word }` | Send word to drawer only |
| `draw_stroke` | C → drawer → S → C | `{ points[], color, size, tool }` | Drawer only; server appends to `room.strokes` and broadcasts |
| `canvas_clear` | C → S → C | `{}` | Clear canvas for all |
| `canvas_fill` | C → S → C | `{ x, y, color }` | Flood fill at coordinate |
| `canvas_undo` | C → S → C | `{ strokes: Stroke[] }` | Drawer undid; server replaces turn strokes and syncs all clients |
| `hint_reveal` | S → C | `{ index, letter }` | Reveal a letter in hint |
| `player_guess` | C → S | `{ guess }` | Submit a guess |
| `guess_result` | S → C | `{ correct, playerId, points }` | Guess outcome |
| `chat_message` | S → C | `{ playerId, name, text, ts }` | Chat broadcast |
| `round_end` | S → C | `{ word, scores[] }` | End of turn reveal |
| `game_over` | S → C | `{ finalScores[] }` | Game finished |
| `player_disconnected` | S → C | `{ playerId }` | A player left mid-game |
| `timer_sync` | S → C | `{ secondsLeft }` | Server clock sync every 5s |

---

## 11. Word List

**File:** `server/src/words.ts`  
**Export:** `WORDS: string[]`

- Mix of single words (60%) and short phrases (40%)
- Minimum 150 words in initial list
- Phrases use spaces: `"ice cream"`, `"birthday cake"`, `"solar system"`
- Difficulty tiers: Easy (common objects), Medium (actions/concepts), Hard (abstract)
- Server picks randomly, avoiding repeats within the same game session
- Hint structure for phrases: show word count and per-word letter count, e.g. `_ _ _   _ _ _ _ (3, 4)`

**Sample words:**
> rainbow, volcano, skateboard, homework, thunderstorm, pizza delivery, space rocket, elephant, karate, basketball, haunted house, sunflower, submarine, magic wand, trampoline

---

## 12. Bonus / Extra Features (Stretch — not MVP)

> **MVP scope:** §§1–11, §13–18. Implement §12 only after acceptance criteria pass without these features.

### 12.1 Reaction Emojis

- Viewers can tap quick emoji reactions: 😂 😱 🔥 👏
- Reactions float up over the canvas via CSS animation, visible to all
- Rate limit: max 1 reaction per player per 3 seconds

### 12.2 Drawing Replay

- At round end, word reveal screen plays a 2-second timelapse of the drawing
- Implemented by storing all strokes in order server-side during the turn

### 12.3 Streak Bonus

- 3 correct guesses in a row → `"🔥 On Fire!"` badge + 50 bonus points
- Badge displayed next to player name in the player list

### 12.4 Close Guess Hint

- Guess within Levenshtein distance of 1 from the answer → `"⚡ So close!"` toast shown only to that player (word not revealed)

### 12.5 Sound Effects

- Pop sound on correct guess
- Tick sound for last 10 seconds of timer
- Fanfare on game end
- All sounds toggleable via mute button (🔊/🔇) in top-right corner

### 12.6 Kick / Reconnect

- Disconnected player has 30s to reconnect using same room code
- Slot held; game shows `"Waiting for [name]..."` notice
- After 30s: player removed; turn skipped if they were the drawer

---

## 13. UI & Visual Style Guidelines

### 13.1 Color Palette

| Token | Value | Usage |
|---|---|---|
| `primary` | `#4F46E5` | Buttons, active borders, headings |
| `secondary` | `#7C3AED` | Accents, subheadings |
| `accent-pink` | `#EC4899` | Highlights, hover states |
| `accent-yellow` | `#FFD93D` | Warnings, timer (mid) |
| `success` | `#6BCB77` | Correct guess, ready state |
| `danger` | `#FF6B6B` | Timer (low), errors |
| `bg-game` | `#F0EDFF` | Game page background |
| `bg-card` | `#FFFFFF` | Panels, cards |
| `canvas` | `#FFFFFF` | Drawing surface (always white) |
| `text-primary` | `#1E293B` | Main text |
| `text-muted` | `#64748B` | Secondary text |

Extend Tailwind config with these tokens:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#7C3AED',
        'accent-pink': '#EC4899',
        'accent-yellow': '#FFD93D',
        success: '#6BCB77',
        danger: '#FF6B6B',
        'bg-game': '#F0EDFF',
        'bg-card': '#FFFFFF',
        'text-primary': '#1E293B',
        'text-muted': '#64748B',
      },
    },
  },
}
```

### 13.2 Typography

| Usage | Font |
|---|---|
| Game title / logo | Fredoka One (Google Fonts) — large, round, friendly |
| UI labels and buttons | Nunito (Google Fonts) — semi-bold, rounded |
| Chat / hint text | Nunito Regular |
| Code / word display | `Courier New`, monospace |

### 13.3 Animations

| Element | Animation |
|---|---|
| All interactive elements | `150ms ease` transition on hover/active |
| Scoreboard | Slides up from bottom (`300ms` spring easing) |
| Correct guess | Green flash on message + score number animates up |
| Character select | Bouncy scale on pick (cubic-bezier spring) |
| Background doodles (landing) | Slow float (`8–12s` infinite keyframe loops) |
| Canvas wipe between turns | Horizontal sweep left-to-right (`600ms`) |

### 13.4 Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| Desktop ≥ 1024px | Full 3-column layout |
| Tablet 768–1023px | Right panel collapses into a bottom drawer |
| Mobile < 768px | Not fully supported — show `"Best played on desktop"` notice |

---

## 14. Server-Side Architecture

### 14.1 Room State Shape

```ts
interface Room {
  code: string;                   // e.g. 'DOOD-4821'
  hostId: string;                 // socket.id of host
  players: Player[];
  phase: 'lobby' | 'playing' | 'scoreboard' | 'ended';
  round: number;                  // current round index (1-based)
  totalRounds: number;            // 3 | 5 | 7
  turnOrder: string[];            // socket IDs in draw order
  currentDrawerIndex: number;
  currentWord: string;
  hintReveals: number[];          // indices of revealed letters
  strokes: Stroke[];              // all strokes this turn
  guessedPlayers: Set<string>;   // server-only; socket IDs — do not JSON-serialize; use string[] if persisting
  timer: NodeJS.Timeout | null;
  secondsLeft: number;
  turnStartedAt: number;         // Date.now() at turn_start — used for fast-guess bonus
}
```

### 14.2 Player State Shape

```ts
interface Player {
  id: string;           // socket.id
  name: string;
  characterId: string;  // 'char_1' through 'char_6'
  score: number;
  roundScore: number;   // points earned this turn
  ready: boolean;
  connected: boolean;
  guessStreak: number;
}
```

### 14.3 Room Code Generation

- Format: 4 uppercase alpha chars + hyphen + 4 digits (e.g. `DOOD-4821`)
- Generated with `crypto.randomBytes` to ensure uniqueness
- Checked against existing room map before assigning

---

## 15. Environment Variables

| Variable | Location | Value / Description |
|---|---|---|
| `VITE_SERVER_URL` | `client/.env` | Railway backend URL (e.g. `https://doodlash.up.railway.app`) |
| `PORT` | `server/.env` | Express server port (Railway sets this automatically) |
| `CLIENT_ORIGIN` | `server/.env` | Vercel frontend URL for CORS allowlist |
| `NODE_ENV` | `server/.env` | `production` or `development` |

---

## 16. Deployment Guide

### 16.1 Frontend (Vercel)

1. Push code to GitHub
2. Import repo into Vercel; set Root Directory to `client/`
3. Add environment variable: `VITE_SERVER_URL = https://<railway-domain>`
4. Build command: `npm run build` — Output directory: `dist`

### 16.2 Backend (Railway)

1. New Railway project → Deploy from GitHub repo; Root: `server/`
2. Set env vars: `CLIENT_ORIGIN`, `NODE_ENV=production`
3. Railway auto-assigns `PORT` — ensure server reads `process.env.PORT`
4. Enable "Public Networking" — copy domain to Vercel's `VITE_SERVER_URL`
5. Enable WebSocket support in Railway service settings

---

## 17. Notes for Cursor AI Implementation

**MVP vs stretch:**

| MVP (required) | Stretch (§12) |
|---|---|
| §§1–11, 13–18 | Reactions, replay, streak, close guess, sounds, 30s reconnect |

**Implementation order:**

1. Server room/socket scaffold (`join_lobby` ack, `rejoin_lobby`, room map)
2. Landing page + room code / URL param flow
3. Lobby + host round selector
4. Game canvas + stroke sync
5. Chat/guessing + server scoring (§7.1)
6. Scoreboard + full round loop
7. Stretch features (§12) — only after MVP acceptance criteria pass

**Critical rules:**

- Keep all game-critical logic (timers, scoring, word selection) **server-side** — never trust the client for these
- Use Socket.IO rooms (`socket.join(roomCode)`) to scope all events to a room
- Canvas sync: do **NOT** send raw `ImageData` — always send stroke vectors for efficiency
- Flood-fill runs **client-only** (no canvas state on server); the result is broadcast as a special fill stroke
- Use Zustand for all client state — avoid prop drilling through deep component trees
- All SVG character illustrations should be **inline in the component** (not image files) for easy color theming via props
- Use Socket.IO's built-in acknowledgements (ack callbacks) for `join_lobby` to return the room code to the client
- Timer must be managed **server-side** with `setInterval`; client-side countdown is only a visual fallback, synced every 5s via `timer_sync`
- Route guards: `/lobby` and `/game` require `sessionStorage` player session or valid `rejoin_lobby` ack; otherwise redirect to `/`

---

## 18. Acceptance Criteria

Test each item manually (two browser windows / incognito) before marking MVP complete.

| ID | Criterion |
|---|---|
| AC-1 | Play with empty room code creates a room; lobby shows a `AAAA-####` code |
| AC-2 | Second client joins via `?room=CODE` or typed code; both see the same player list within 1s |
| AC-3 | Share link copies a URL that pre-fills or opens the correct room |
| AC-4 | Start Game disabled until ≥ 2 players are ready; enabled when all ready |
| AC-5 | Host can set rounds to 3, 5, or 7; all clients see the selected value |
| AC-6 | Non-drawer cannot draw; stroke events from non-drawer are ignored server-side |
| AC-7 | Drawer sees secret word; others see blanks only until `round_end` |
| AC-8 | Correct full-phrase or full-word guess awards points per §7.1; partial guesses do not |
| AC-9 | First/second/third correct guessers get different placement bases (350 / 280 / 220) before multiplier |
| AC-10 | Guesser points decrease when less time remains on the timer |
| AC-11 | Drawer gains +40 per correct guesser; 0 if nobody guesses |
| AC-12 | Turn ends early when all non-drawers have guessed correctly |
| AC-13 | `timer_sync` keeps clients within ~2s of server time over a 100s turn |
| AC-14 | Refresh in lobby rejoins same slot via `rejoin_lobby` without creating a duplicate player |
| AC-15 | Play Again after final round returns all players to lobby with names/characters preserved |

---

## Appendix A: Recommended npm Packages

| Package | Use |
|---|---|
| `socket.io` + `socket.io-client` | Real-time bidirectional communication |
| `zustand` | Lightweight React state management |
| `tailwindcss` | Utility-first CSS |
| `react-router-dom` v6 | Client-side routing |
| `canvas-confetti` | Confetti animation on game end |
| `react-hot-toast` | Toast notifications (close guess, disconnect, etc.) |
| `clsx` | Conditional className utility |
| `fast-levenshtein` | Close guess detection (§12.4 stretch only) |

Room codes use Node `crypto.randomBytes` (§14.3) — **not** `nanoid`.

---

*End of Specification — Doodlash v1.1*
