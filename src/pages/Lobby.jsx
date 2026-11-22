import React, { useState, useEffect, useRef } from 'react';
import wikendLogo from '../assets/wikentalk_logo.svg';
import { io } from 'socket.io-client';

const SERVER_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
const socket = io(SERVER_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

const INITIAL_GROUPS = [
  { id: 'g1', name: 'La Zona Cero', tag: 'Sin Filtros', desc: 'Zona ultra confidencial donde absolutamente todo se dice sin censura previa y nada queda grabado en historiales permanentes. Solo para mentes abiertas.', active: 0, max: 15 },
  { id: 'g2', name: 'After Hours', tag: 'Nocturno', desc: 'El coro nocturno definitivo para hablar sin reloj, compartir vivencias de madrugada y debatir sobre cualquier locura hasta que amanezca.', active: 0, max: 15 },
  { id: 'g3', name: 'Sin Evidencia', tag: 'Efímero', desc: 'Confesiones salvajes, anécdotas ocultas y disparates protegidos bajo llave digital y destrucción inmediata en memoria RAM.', active: 0, max: 15 },
  { id: 'g4', name: 'El Bunker del Relajo', tag: 'Humor', desc: 'Refugio exclusivo para los que aguantan alta presión, bromas pesadas, buen humor y cero sensibilidad a flor de piel.', active: 0, max: 15 },
  { id: 'g5', name: 'Modo Avión', tag: 'Chill', desc: 'Espacio de desconexión total del bullicio del mundo exterior, charlas relajadas y vibras tranquilas para recargar energías.', active: 0, max: 15 },
  { id: 'g6', name: 'Círculo Clandestino', tag: 'Exclusivo', desc: 'Charlas profundas, misterios ocultos y debates clandestinos de madrugada en total libertad y sin ningún tipo de filtros morales.', active: 0, max: 15 },
  { id: 'g7', name: 'Código Abierto', tag: 'Debate', desc: 'Discusiones intensas, técnicas y apasionadas sobre cualquier temática real, tecnología, conspiraciones y dilemas modernos.', active: 0, max: 15 },
  { id: 'g8', name: 'Esquina Oscura', tag: 'Anónimo', desc: 'Historias urbanas tenebrosas, leyendas callejeras y misterios sin resolver contados por los propios protagonistas del asfalto.', active: 0, max: 15 },
  { id: 'g9', name: 'Zona de Fuego', tag: 'Intenso', desc: 'Debates calientes y opiniones frontales sin rodeos, sin diplomacia de etiqueta y con argumentos directos al mentón.', active: 0, max: 15 },
  { id: 'g10', name: 'Último Trago', tag: 'Social', desc: 'Espacio de camaradería y relajación total antes de cerrar la noche, brindar virtualmente y pasar un rato ameno entre amigos.', active: 0, max: 15 },
];

export default function Lobby({
  user,
  onOpenSettings,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('groups');
  const [groups, setGroups] = useState(INITIAL_GROUPS);
  const [realOnlineUsers, setRealOnlineUsers] = useState([]);
  const [activeChat, setActiveChat] = useState({ type: 'group', data: INITIAL_GROUPS[0] });
  const [searchTerm, setSearchTerm] = useState('');

  // Estados del chat activo
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Detección de pantalla móvil y control de vista activa en celular
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat' | 'info'

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Obtener la foto real del usuario (soporta photo, photoURL o avatar) con respaldo de iniciales
  const currentUserPhoto = user?.photo || user?.photoURL || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.username || 'U')}&background=f3cf1f&color=161517&bold=true`;

  const roomId = activeChat.type === 'group'
    ? activeChat.data.id
    : [user.username, activeChat.data.username].sort().join('_');

  useEffect(() => {
    if (user && user.username) {
      socket.emit('register_online', { 
        username: user.username,
        photo: user.photo || user.photoURL || user.avatar || null
      });
    }

    socket.emit('join_room', roomId);

    const onReceiveMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      if (msg.sender !== user.username && msg.type !== 'system') {
        setTimeout(() => {
          socket.emit('message_read', { roomId, messageId: msg.id });
        }, 60000);
      }
    };

    const onMessageDestroyed = (messageId) => {
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    };

    const onOnlineUsers = (users) => {
      const others = users.filter((u) => u.username !== user?.username);
      setRealOnlineUsers(others);
    };

    const onRoomOccupancy = ({ roomId: rId, count }) => {
      setGroups((prev) =>
        prev.map((g) => (g.id === rId ? { ...g, active: count } : g))
      );
    };

    socket.on('receive_ephemeral_message', onReceiveMessage);
    socket.on('message_destroyed', onMessageDestroyed);
    socket.on('online_users_update', onOnlineUsers);
    socket.on('room_occupancy_update', onRoomOccupancy);

    return () => {
      socket.emit('leave_room', roomId);
      socket.off('receive_ephemeral_message', onReceiveMessage);
      socket.off('message_destroyed', onMessageDestroyed);
      socket.off('online_users_update', onOnlineUsers);
      socket.off('room_occupancy_update', onRoomOccupancy);
    };
  }, [roomId, user]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return alert('La foto supera el límite máximo de 5MB.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1080;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        setSelectedPhoto(canvas.toDataURL('image/webp', 0.8));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !selectedPhoto) return;

    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: user.username,
      senderPhoto: user?.photo || user?.photoURL || user?.avatar || null,
      text: inputText,
      photo: selectedPhoto,
      type: 'user'
    };

    socket.emit('send_ephemeral_message', { roomId, message: newMessage });
    setInputText('');
    setSelectedPhoto(null);
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = realOnlineUsers.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showCol1 = !isMobile || mobileView === 'list';
  const showCol2 = !isMobile || mobileView === 'chat';
  const showCol3 = !isMobile || mobileView === 'info';

  return (
    <div style={{
      width: '100vw',
      height: '100dvh',
      background: '#161517',
      color: '#f3f4f6',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
      overflow: 'hidden'
    }}>
      {/* Barra Superior */}
      <nav style={{
        width: '100%',
        height: '68px',
        borderBottom: '2px solid #f3cf1f',
        background: '#161517',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMobile ? '0 12px' : '0 24px',
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
          <img src={wikendLogo} alt="WIKEND Talk" style={{ height: isMobile ? '32px' : '40px', width: 'auto' }} />
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(255, 42, 149, 0.15)',
            color: '#ff2a95',
            border: '1px solid #ff2a95'
          }}>
            +18 Privado
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
          {/* Perfil de usuario con foto real clickeable para abrir Ajustes */}
          <div
            onClick={onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              background: 'rgba(243, 207, 31, 0.1)',
              padding: isMobile ? '4px 10px' : '6px 14px',
              borderRadius: '99px',
              border: '1px solid #f3cf1f',
              transition: 'all 0.2s ease'
            }}
            title="Haz clic para ver Ajustes"
          >
            <img
              src={currentUserPhoto}
              alt={user.username}
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=f3cf1f&color=161517&bold=true`;
              }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #ff2a95'
              }}
            />
            <span style={{
              fontSize: '0.9rem',
              color: '#f3cf1f',
              fontWeight: 700,
              maxWidth: isMobile ? '85px' : 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.username}
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            style={{
              background: 'rgba(255, 42, 149, 0.15)',
              border: '1px solid #ff2a95',
              color: '#ff2a95',
              padding: isMobile ? '8px 10px' : '8px 14px',
              borderRadius: '10px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255, 42, 149, 0.2)'
            }}
          >
            {isMobile ? '🚪' : '🚪 Salir'}
          </button>
        </div>
      </nav>

      {/* Contenedor Principal de 3 Columnas Full-Width */}
      <div style={{
        width: '100%',
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        {/* COLUMNA 1: Lista de Grupos */}
        {showCol1 && (
          <aside style={{
            width: isMobile ? '100%' : '360px',
            background: '#161517',
            borderRight: isMobile ? 'none' : '2px solid rgba(243, 207, 31, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: '0',
            boxSizing: 'border-box'
          }}>
            {/* Pestañas de Navegación */}
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('groups')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: activeTab === 'groups' ? '2px solid #ff2a95' : '1px solid rgba(255,255,255,0.1)',
                  background: activeTab === 'groups' ? '#f3cf1f' : 'rgba(255,255,255,0.04)',
                  color: activeTab === 'groups' ? '#161517' : '#9ca3af',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'groups' ? '0 4px 12px rgba(255, 42, 149, 0.3)' : 'none'
                }}
              >
                👥 Grupos ({groups.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: activeTab === 'users' ? '2px solid #ff2a95' : '1px solid rgba(255,255,255,0.1)',
                  background: activeTab === 'users' ? '#f3cf1f' : 'rgba(255,255,255,0.04)',
                  color: activeTab === 'users' ? '#161517' : '#9ca3af',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'users' ? '0 4px 12px rgba(255, 42, 149, 0.3)' : 'none'
                }}
              >
                💬 Conectados ({realOnlineUsers.length})
              </button>
            </div>

            {/* Buscador */}
            <div style={{ padding: '12px 16px' }}>
              <input
                type="text"
                placeholder={activeTab === 'groups' ? 'Buscar grupos...' : 'Buscar usuarios...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  background: '#090c0e',
                  border: '1px solid #f3cf1f',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Listado de Grupos */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeTab === 'groups' ? (
                filteredGroups.map((group) => {
                  const isSelected = activeChat.type === 'group' && activeChat.data.id === group.id;
                  const isFull = group.active >= group.max;
                  return (
                    <div
                      key={group.id}
                      onClick={() => {
                        if (isFull) return alert('⚠️ Sala llena (15/15)');
                        setActiveChat({ type: 'group', data: group });
                        setMessages([]);
                        if (isMobile) setMobileView('chat');
                      }}
                      style={{
                        background: isSelected ? 'rgba(243, 207, 31, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected ? '2px solid #ff2a95' : '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        position: 'relative',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: isFull ? '#ff2a95' : '#161517',
                        color: isFull ? '#fff' : '#f3cf1f',
                        border: '1px solid #f3cf1f',
                        padding: '3px 8px',
                        borderRadius: '99px',
                        fontSize: '0.7rem',
                        fontWeight: 800
                      }}>
                        {group.active}/{group.max}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                          src={`/grupos_fotos/${group.name}.jpg`}
                          alt={group.name}
                          onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=f3cf1f&color=161517`; }}
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #f3cf1f',
                            flexShrink: 0
                          }}
                        />
                        <div style={{ overflow: 'hidden', paddingRight: '40px' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f3cf1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {group.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: '2px' }}>
                            {group.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                filteredUsers.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '0.82rem' }}>
                    Nadie más conectado ahora mismo.
                  </div>
                ) : (
                  filteredUsers.map((person) => {
                    const isSelected = activeChat.type === 'direct' && activeChat.data.socketId === person.socketId;
                    const personPhoto = person.photo || person.photoURL || person.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.username)}&background=f3cf1f&color=161517&bold=true`;
                    return (
                      <div
                        key={person.socketId}
                        onClick={() => {
                          setActiveChat({ type: 'direct', data: person });
                          setMessages([]);
                          if (isMobile) setMobileView('chat');
                        }}
                        style={{
                          background: isSelected ? 'rgba(243, 207, 31, 0.15)' : 'transparent',
                          border: isSelected ? '2px solid #ff2a95' : '1px solid transparent',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={personPhoto}
                            alt={person.username}
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.username)}&background=f3cf1f&color=161517&bold=true`;
                            }}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #ff2a95',
                              flexShrink: 0
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f3cf1f' }}>
                              {person.username}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#ff2a95' }}>
                              ● En línea
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </aside>
        )}

        {/* COLUMNA 2: Zona Central de Conversación */}
        {showCol2 && (
          <section style={{
            flex: 1,
            width: isMobile ? '100%' : 'auto',
            background: '#090c0e',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: isMobile ? 'none' : '2px solid rgba(243, 207, 31, 0.2)',
            boxSizing: 'border-box'
          }}>
            {/* Cabecera del Chat Activo */}
            <div style={{
              height: '68px',
              background: '#161517',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: isMobile ? '0 12px' : '0 20px',
              flexShrink: 0,
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setMobileView('list')}
                    style={{
                      background: 'rgba(243, 207, 31, 0.15)',
                      border: '1px solid #f3cf1f',
                      color: '#f3cf1f',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    ←
                  </button>
                )}
                <img
                  src={
                    activeChat.type === 'group'
                      ? `/grupos_fotos/${activeChat.data.name}.jpg`
                      : (activeChat.data.photo || activeChat.data.photoURL || activeChat.data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.data.username || 'U')}&background=f3cf1f&color=161517`)
                  }
                  alt="Avatar"
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=Chat&background=f3cf1f&color=161517`; }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #f3cf1f',
                    flexShrink: 0
                  }}
                />
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f3cf1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeChat.data.name || activeChat.data.username}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#ff2a95', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeChat.type === 'group' ? '👥 Sala VIP (15 máx) • Destrucción en RAM' : '🟢 Chat Privado • Destrucción en RAM'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setMobileView('info')}
                    style={{
                      background: 'rgba(255, 42, 149, 0.15)',
                      border: '1px solid #ff2a95',
                      color: '#ff2a95',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="Ver descripción y normas"
                  >
                    ℹ️
                  </button>
                )}

                {activeChat.type === 'group' && (
                  <button
                    type="button"
                    onClick={() => alert('🎙️ Conectando a la llamada vocal grupal...')}
                    style={{
                      background: '#f3cf1f',
                      border: '2px solid #ff2a95',
                      color: '#161517',
                      padding: isMobile ? '8px 10px' : '8px 16px',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(243, 207, 31, 0.3)'
                    }}
                  >
                    {isMobile ? '🎙️' : '🎙️ Llamada Grupal'}
                  </button>
                )}
              </div>
            </div>

            {/* Historial de Mensajes (Con Foto real y Nombre de quien escribe) */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: isMobile ? '14px' : '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {messages.map((msg) => {
                const isMe = msg.sender === user.username;
                const msgAvatar = isMe
                  ? currentUserPhoto
                  : (msg.senderPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender)}&background=f3cf1f&color=161517&bold=true`);

                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: isMobile ? '85%' : '70%',
                      background: isMe ? '#ff2a95' : '#161517',
                      border: '1px solid #f3cf1f',
                      borderRadius: '14px',
                      padding: '12px 16px',
                      color: isMe ? '#fff' : '#f3cf1f',
                      fontSize: '0.88rem',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <img
                        src={msgAvatar}
                        alt={msg.sender}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender)}&background=f3cf1f&color=161517&bold=true`;
                        }}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '1px solid #f3cf1f'
                        }}
                      />
                      <span style={{ fontSize: '0.75rem', color: isMe ? '#ffe4e6' : '#ff2a95', fontWeight: 700 }}>
                        {msg.sender}
                      </span>
                    </div>

                    {msg.text && <div style={{ wordBreak: 'break-word', paddingLeft: '32px' }}>{msg.text}</div>}
                    {msg.photo && (
                      <div style={{ marginTop: '8px', paddingLeft: '32px' }} onContextMenu={(e) => e.preventDefault()}>
                        <img
                          src={msg.photo}
                          alt="Efímera"
                          draggable="false"
                          style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '8px', pointerEvents: 'none' }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Vista previa de foto */}
            {selectedPhoto && (
              <div style={{ padding: '8px 20px', background: '#161517', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3cf1f' }}>
                <span style={{ fontSize: '0.78rem', color: '#f3cf1f', fontWeight: 700 }}>🛡️ Imagen WebP protegida (máx 5MB) lista</span>
                <button type="button" onClick={() => setSelectedPhoto(null)} style={{ background: 'none', border: 'none', color: '#ff2a95', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}>✕ Quitar</button>
              </div>
            )}

            {/* Formulario Inferior de Envío */}
            <form onSubmit={handleSendMessage} style={{
              padding: isMobile ? '10px 12px' : '14px 20px',
              background: '#161517',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: isMobile ? '8px' : '10px',
              alignItems: 'center',
              flexShrink: 0,
              boxSizing: 'border-box'
            }}>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                style={{
                  background: '#f3cf1f',
                  border: '1px solid #ff2a95',
                  color: '#161517',
                  padding: isMobile ? '10px 12px' : '10px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 800,
                  flexShrink: 0
                }}
                title="Adjuntar foto (Máx 5MB)"
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
                placeholder="Escribe un mensaje efímero..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 0,
                  background: '#090c0e',
                  border: '1px solid #f3cf1f',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />

              <button
                type="submit"
                style={{
                  background: '#ff2a95',
                  border: '2px solid #f3cf1f',
                  color: '#fff',
                  padding: isMobile ? '10px 16px' : '10px 22px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 42, 149, 0.4)',
                  flexShrink: 0
                }}
              >
                Enviar
              </button>
            </form>
          </section>
        )}

        {/* COLUMNA 3: Panel Derecho (Descripción extendida y Normas) */}
        {showCol3 && (
          <aside style={{
            width: isMobile ? '100%' : '320px',
            background: '#161517',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px',
            boxSizing: 'border-box',
            flexShrink: 0,
            overflowY: 'auto'
          }}>
            {isMobile && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => setMobileView('chat')}
                  style={{
                    background: 'rgba(243, 207, 31, 0.15)',
                    border: '1px solid #f3cf1f',
                    color: '#f3cf1f',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ← Volver al chat
                </button>
              </div>
            )}

            <img
              src={
                activeChat.type === 'group'
                  ? `/grupos_fotos/${activeChat.data.name}.jpg`
                  : (activeChat.data.photo || activeChat.data.photoURL || activeChat.data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeChat.data.username || 'W')}&background=f3cf1f&color=161517`)
              }
              alt="Avatar"
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=W&background=f3cf1f&color=161517`; }}
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #f3cf1f',
                marginBottom: '12px',
                boxShadow: '0 0 20px rgba(243, 207, 31, 0.4)'
              }}
            />
            
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f3cf1f', marginBottom: '4px', textAlign: 'center' }}>
              {activeChat.data.name || activeChat.data.username}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#ff2a95', marginBottom: '20px', fontWeight: 700 }}>
              ● Cifrado de extremo a extremo
            </p>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Descripción del grupo (Textos largos) */}
              <div style={{ background: 'rgba(243, 207, 31, 0.08)', border: '1px solid #f3cf1f', padding: '12px', borderRadius: '12px', fontSize: '0.8rem' }}>
                <div style={{ color: '#ff2a95', marginBottom: '4px', fontWeight: 800 }}>Descripción del Grupo</div>
                <div style={{ color: '#fff', lineHeight: 1.4 }}>
                  {activeChat.data.desc || 'Sala privada de chat efímero cifrado en RAM con estrictas normas de moderación.'}
                </div>
              </div>

              {/* Aforo y Capacidad */}
              <div style={{ background: 'rgba(255, 42, 149, 0.08)', border: '1px solid #ff2a95', padding: '12px', borderRadius: '12px', fontSize: '0.8rem' }}>
                <div style={{ color: '#f3cf1f', marginBottom: '4px', fontWeight: 800 }}>Aforo / Capacidad</div>
                <div style={{ color: '#fff', fontWeight: 700 }}>
                  {activeChat.type === 'group' ? 'Máximo 15 Personas' : 'Chat Privado 1 a 1'}
                </div>
              </div>

              {/* 5 Normas de Seguridad */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(243, 207, 31, 0.3)', padding: '12px', borderRadius: '12px', fontSize: '0.78rem' }}>
                <div style={{ color: '#f3cf1f', marginBottom: '6px', fontWeight: 800, textAlign: 'center', textTransform: 'uppercase' }}>
                  ⚠️ Normas de Seguridad (Expulsión Automática)
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', color: '#e5e7eb', lineHeight: 1.3 }}>
                  <li><b>Regla 1:</b> No faltarle al respeto a nadie.</li>
                  <li><b>Regla 2:</b> No Nude ni Menores de edad.</li>
                  <li><b>Regla 3:</b> Cero acoso, spam o enlaces externos maliciosos.</li>
                  <li><b>Regla 4:</b> Mantener la privacidad de los miembros del chat.</li>
                  <li><b>Regla 5:</b> Respetar la dinámica efímera y los límites de la sala.</li>
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}