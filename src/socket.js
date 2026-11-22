import { io } from 'socket.io-client';

// Forzamos el uso de la variable de entorno de Render, y si no existe localmente usa localhost:5000
const SERVER_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

export const socket = io(SERVER_URL, {
  autoConnect: false,
  path: '/socket.io',
  transports: ['websocket', 'polling']
});