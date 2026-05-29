import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { Lobby } from './pages/Lobby';
import { Game } from './pages/Game';
import { useSocketListeners } from './hooks/useSocket';

function AppRoutes() {
  useSocketListeners();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/game" element={<Game />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
