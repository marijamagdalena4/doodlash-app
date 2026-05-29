import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socket.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', game: 'doodlash' });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  registerSocketHandlers(io, socket);
});

httpServer.listen(PORT, () => {
  console.log(`Doodlash server running on port ${PORT}`);
});
