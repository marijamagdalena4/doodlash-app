# Doodlash

Draw-and-guess multiplayer web game. React + Socket.IO client, Node + Express + Socket.IO server.

## Local development

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Copy env files:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

## Project structure

- `client/` — Vite + React + TypeScript + Tailwind
- `server/` — Express + Socket.IO (authoritative game logic)

## Deployment

### Frontend (Vercel)

1. Import repo; set **Root Directory** to `client/`
2. Set `VITE_SERVER_URL` to your Railway backend URL
3. Build: `npm run build`, output: `dist`

### Backend (Railway)

1. Deploy from `server/` directory
2. Set `CLIENT_ORIGIN` to your Vercel URL
3. Enable public networking and WebSockets
4. Use the provided `Dockerfile` or Node start command: `npm run start`

## How to play

1. Open the app, enter your name, pick a character
2. Leave room code empty to **create** a room, or enter a code to **join**
3. Share the lobby link with friends (up to 6 players)
4. Everyone clicks **Ready**; host sets rounds (3/5/7) and **Start Game**
5. Take turns drawing; others guess in chat

## MVP acceptance

See `Doodlash_SDD.md` §18 for the full AC-1–AC-15 checklist.
