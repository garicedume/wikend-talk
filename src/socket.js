import { io } from 'socket.io-client';

// Detecta automáticamente si hay una variable de entorno o usa el host actual de la página
const SERVER_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export const socket = io(SERVER_URL, {
  autoConnect: false,
  path: '/socket.io',
  transports: ['websocket', 'polling']
});