const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require(process.env.FIREBASE_CREDENTIALS);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
console.log('🔥 Base de Datos Firebase Firestore conectada de forma exitosa');

const { register, login, deleteAccount } = require('./controllers/authController');
const { handleStripeWebhook, handlePayPalWebhook } = require('./controllers/paymentController');
const { purgeInactiveUsers } = require('./jobs/inactivityCleaner');

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Demasiados intentos desde esta IP. Intenta nuevamente en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/auth/register', authLimiter, register);
app.post('/api/auth/login', authLimiter, login);
app.post('/api/auth/delete', authLimiter, deleteAccount);
app.post('/api/payments/stripe', handleStripeWebhook);
app.post('/api/payments/paypal', handlePayPalWebhook);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const ephemeralVault = new Map();
const connectedUsers = new Map();
const reportCounter = new Map();
const roomOccupancy = new Map();

io.on('connection', (socket) => {
  console.log(`[Socket] Conexión segura establecida: ${socket.id}`);

  socket.on('register_online', (userData) => {
    if (!userData || !userData.username) return;

    for (const [id, user] of connectedUsers.entries()) {
      if (user.username === userData.username) {
        connectedUsers.delete(id);
      }
    }

    connectedUsers.set(socket.id, {
      socketId: socket.id,
      username: userData.username,
      photo: userData.photo || null,
      status: 'En línea • Cero historial',
      badge: '+18'
    });
    io.emit('online_users_update', Array.from(connectedUsers.values()));
  });

  socket.on('join_room', (roomId) => {
    if (!roomOccupancy.has(roomId)) {
      roomOccupancy.set(roomId, new Set());
    }

    const roomUsers = roomOccupancy.get(roomId);

    if (roomUsers.size >= 15 && !roomUsers.has(socket.id)) {
      return socket.emit('room_full_error', '⚠️ Este grupo ha alcanzado su capacidad máxima (15/15 personas).');
    }

    roomUsers.add(socket.id);
    socket.join(roomId);

    io.emit('room_occupancy_update', { roomId, count: roomUsers.size });
  });

  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    if (roomOccupancy.has(roomId)) {
      const roomUsers = roomOccupancy.get(roomId);
      roomUsers.delete(socket.id);
      io.emit('room_occupancy_update', { roomId, count: roomUsers.size });
    }
  });

  socket.on('send_ephemeral_message', (payload) => {
    const { roomId, message } = payload;

    if (message.photo && Buffer.byteLength(message.photo, 'utf8') > 5.5 * 1024 * 1024) {
      return socket.emit('security_alert', 'Archivo rechazado: supera el límite estricto de 5MB.');
    }

    ephemeralVault.set(message.id, {
      ...message,
      roomId,
      createdAt: Date.now()
    });

    io.to(roomId).emit('receive_ephemeral_message', message);
  });

  // Señalización de audio para llamada grupal
  socket.on('send_voice_chunk', ({ roomId, audioChunk }) => {
    socket.to(roomId).emit('receive_voice_chunk', { sender: socket.id, audioChunk });
  });

  socket.on('typing', ({ roomId, username, isTyping }) => {
    socket.to(roomId).emit('user_typing', { username, isTyping });
  });

  socket.on('message_read', ({ roomId, messageId }) => {
    if (ephemeralVault.has(messageId)) {
      ephemeralVault.delete(messageId);
    }
    io.to(roomId).emit('message_destroyed', messageId);
  });

  socket.on('report_user', ({ roomId, targetUsername, reason }) => {
    const currentReports = (reportCounter.get(targetUsername) || 0) + 1;
    reportCounter.set(targetUsername, currentReports);

    if (currentReports >= 3) {
      io.to(roomId).emit('user_kicked', {
        username: targetUsername,
        reason: 'Expulsado automáticamente por reportes de moderación.'
      });
      reportCounter.delete(targetUsername);
    }
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    io.emit('online_users_update', Array.from(connectedUsers.values()));

    for (const [roomId, roomUsers] of roomOccupancy.entries()) {
      if (roomUsers.has(socket.id)) {
        roomUsers.delete(socket.id);
        io.emit('room_occupancy_update', { roomId, count: roomUsers.size });
      }
    }
  });
});

setInterval(purgeInactiveUsers, 60 * 60 * 1000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor Blindado WIKEND Talk corriendo en puerto ${PORT}`);
});