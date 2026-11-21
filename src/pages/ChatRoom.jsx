import React, { useState, useRef, useEffect } from 'react';
import { socket } from '../socket';

export default function ChatRoom({ activeChat, currentUser, onBack }) {
  const roomId = activeChat.type === 'group'
    ? activeChat.data.id
    : [currentUser.username, activeChat.data.username].sort().join('_');

  const [messages, setMessages] = useState([
    {
      id: 'sys-welcome',
      sender: 'Sistema',
      text: `Bienvenido a ${activeChat.data.name || activeChat.data.username}. Destrucción física automatizada: los mensajes y fotos se borran de la RAM al instante de ser vistos.`,
      type: 'system'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isBlurred, setIsBlurred] = useState(false);

  const [typingUsers, setTypingUsers] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const processedMessageIds = useRef(new Set());

  const emojis = ['🔥', '😂', '🍻', '😎', '💯', '🚀', '👀', '💬', '✨', '💀', '🤫', '💸'];

  // Protección Anti-Captura: difumina la pantalla si la ventana pierde el foco
  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Conexión en tiempo real a la sala y auto-destrucción automatizada
  useEffect(() => {
    socket.emit('join_room', roomId);

    const onReceiveMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      if (msg.sender !== currentUser.username && msg.type !== 'system') {
        if (!processedMessageIds.current.has(msg.id)) {
          processedMessageIds.current.add(msg.id);
          setTimeout(() => {
            socket.emit('message_read', { roomId, messageId: msg.id });
          }, 1500);
        }
      }
    };

    const onMessageDestroyed = (messageId) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    };

    const onUserTyping = ({ username, isTyping }) => {
      if (username === currentUser.username) return;
      setTypingUsers((prev) => {
        if (isTyping) {
          return prev.includes(username) ? prev : [...prev, username];
        }
        return prev.filter((u) => u !== username);
      });
    };

    const onUserKicked = ({ username, reason }) => {
      if (username === currentUser.username) {
        alert(reason);
        onBack();
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), sender: 'Moderación', text: `🚫 ${username}: ${reason}`, type: 'system' }
        ]);
      }
    };

    const onSecurityAlert = (alertMsg) => alert(alertMsg);

    socket.on('receive_ephemeral_message', onReceiveMessage);
    socket.on('message_destroyed', onMessageDestroyed);
    socket.on('user_typing', onUserTyping);
    socket.on('user_kicked', onUserKicked);
    socket.on('security_alert', onSecurityAlert);

    return () => {
      socket.emit('leave_room', roomId);
      socket.off('receive_ephemeral_message', onReceiveMessage);
      socket.off('message_destroyed', onMessageDestroyed);
      socket.off('user_typing', onUserTyping);
      socket.off('user_kicked', onUserKicked);
      socket.off('security_alert', onSecurityAlert);
    };
  }, [roomId, currentUser.username, onBack]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return alert('La foto supera el límite máximo permitido de 5MB.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1080;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const webpDataUrl = canvas.toDataURL('image/webp', 0.8);
        setSelectedPhoto(webpDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    socket.emit('typing', { roomId, username: currentUser.username, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', { roomId, username: currentUser.username, isTyping: false });
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedPhoto) return;

    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: currentUser.username,
      text: inputText,
      photo: selectedPhoto,
      type: 'user'
    };

    socket.emit('send_ephemeral_message', { roomId, message: newMessage });
    socket.emit('typing', { roomId, username: currentUser.username, isTyping: false });
    setInputText('');
    setSelectedPhoto(null);
    setShowEmojiPicker(false);
  };

  const handleBlockAndReport = (targetUsername) => {
    const action = window.confirm(
      `¿Deseas BLOQUEAR y REPORTAR a "${targetUsername}"?\n\nDejarás de ver sus mensajes al instante y el sistema de moderación revisará su cuenta.`
    );
    if (action) {
      setBlockedUsers((prev) => [...prev, targetUsername]);
      socket.emit('report_user', {
        roomId,
        targetUsername,
        reason: 'Bloqueo y reporte de usuario desde sala'
      });
      alert(`Usuario "${targetUsername}" bloqueado y reportado correctamente.`);
    }
  };

  const visibleMessages = messages.filter((msg) => !blockedUsers.includes(msg.sender));

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background: '#090c0e',
        color: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        filter: isBlurred ? 'blur(18px)' : 'none',
        transition: 'filter 0.2s ease',
        userSelect: 'none',
        boxSizing: 'border-box'
      }}
    >
      {/* Cabecera del Chat Estilo App Pro */}
      <div style={{
        width: '100%',
        height: '72px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        background: '#0d1318',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        boxSizing: 'border-box',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#e5e7eb',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Volver
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
              color: '#052e16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1rem'
            }}>
              {(activeChat.data.name || activeChat.data.username || 'W').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
                {activeChat.data.name || activeChat.data.username}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#25d366' }}>
                {typingUsers.length > 0
                  ? `✍️ ${typingUsers.join(', ')} está escribiendo...`
                  : activeChat.type === 'group'
                  ? '👥 Sala VIP (15 máx) • Destrucción en RAM'
                  : '🟢 Chat privado • Destrucción en RAM'}
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Grupo y Privados */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {activeChat.type === 'private' && (
            <button
              type="button"
              onClick={() => handleBlockAndReport(activeChat.data.username)}
              style={{
                padding: '8px 14px',
                borderRadius: '10px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#fca5a5',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              🚫 Bloquear / Reportar
            </button>
          )}

          {activeChat.type === 'group' && (
            <>
              <button
                type="button"
                onClick={() => setMicMuted(!micMuted)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: micMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: micMuted ? '#fca5a5' : '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {micMuted ? '🔇 Mic Apagado' : '🎙️ Llamada Grupal'}
              </button>

              <button
                type="button"
                onClick={() => setDeafened(!deafened)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: deafened ? 'rgba(239,68,68,0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: deafened ? '#fca5a5' : '#fff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {deafened ? '🔕 Silenciado' : '🔊 Escuchando'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cuerpo del Chat (Ancho Completo y Burbujas Pro) */}
      <main style={{
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        boxSizing: 'border-box',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          flex: 1,
          background: '#111b21',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '65vh'
        }}>
          {/* Mensajes */}
          <div style={{
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            paddingRight: '8px'
          }}>
            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === currentUser.username ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  background: msg.type === 'system'
                    ? 'rgba(255, 255, 255, 0.04)'
                    : msg.sender === currentUser.username
                    ? '#005c4b'
                    : '#202c33',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.72rem', color: msg.sender === currentUser.username ? '#a7f3d0' : '#25d366', fontWeight: 600 }}>
                    {msg.sender}
                  </span>
                  {msg.type !== 'system' && msg.sender !== currentUser.username && (
                    <button
                      type="button"
                      onClick={() => handleBlockAndReport(msg.sender)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#fca5a5',
                        fontSize: '0.68rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      🚫 Bloquear
                    </button>
                  )}
                </div>

                {msg.text && <p style={{ fontSize: '0.9rem', lineHeight: 1.4, wordBreak: 'break-word', color: '#e5e7eb' }}>{msg.text}</p>}

                {msg.photo && (
                  <div style={{ marginTop: '8px' }} onContextMenu={(e) => e.preventDefault()}>
                    <img
                      src={msg.photo}
                      alt="Efímera"
                      draggable="false"
                      style={{
                        width: '100%',
                        maxHeight: '260px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        pointerEvents: 'none'
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Vista Previa WebP */}
          {selectedPhoto && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.4)', padding: '10px 14px', borderRadius: '12px', marginTop: '12px', border: '1px solid rgba(37,211,102,0.3)' }}>
              <span style={{ fontSize: '0.8rem', color: '#25d366' }}>🛡️ Imagen WebP protegida (máx 5MB) lista para enviar</span>
              <button type="button" onClick={() => setSelectedPhoto(null)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 600 }}>✕ Quitar</button>
            </div>
          )}

          {/* Selector de Emojis */}
          {showEmojiPicker && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', background: '#0d1318', padding: '12px', borderRadius: '14px', marginTop: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setInputText((prev) => prev + emoji)}
                  style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Formulario de Entrada Inferior Estilo Telegram */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                padding: '12px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              😀
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                padding: '12px 14px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
              title="Tomar foto con cámara o subir WebP (Máx 5MB)"
            >
              📷
            </button>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />

            <input
              type="text"
              placeholder={deafened ? 'Estás silenciado en la sala...' : 'Escribe un mensaje efímero...'}
              value={inputText}
              onChange={handleInputChange}
              style={{
                flex: 1,
                background: '#202c33',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />

            <button
              type="submit"
              style={{
                background: '#25d366',
                border: 'none',
                color: '#052e16',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
              }}
            >
              Enviar
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}