import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './App.css';
import AgeGateModal from './components/AgeGateModal';
import AuthScreen from './pages/AuthScreen';
import LegalModal from './pages/LegalModal';
import Lobby from './pages/Lobby';
import SettingsModal from './pages/SettingsModal';
import ChatRoom from './pages/ChatRoom';
import StoreModal from './pages/StoreModal';
import { socket } from './socket';

export default function App() {
  const [isAdult, setIsAdult] = useState(() => sessionStorage.getItem('wikend_age_verified') === 'true');
  
  // Lógica de sesión real: Verifica tanto en localStorage (permanente) como sessionStorage (temporal)
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('wikend_current_user') || sessionStorage.getItem('wikend_current_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [legalSection, setLegalSection] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);

  const [coins, setCoins] = useState(0);
  const [unlockedGroups, setUnlockedGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null);

  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit('register_online', { username: user.username });
    } else {
      localStorage.removeItem('wikend_current_user');
      sessionStorage.removeItem('wikend_current_user');
      socket.disconnect();
    }
    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Manejo de autenticación exitosa recibiendo la bandera real de "Mantener sesión"
  const handleAuthSuccess = (userData, rememberMe) => {
    setUser(userData);
    if (rememberMe) {
      localStorage.setItem('wikend_current_user', JSON.stringify(userData));
      sessionStorage.removeItem('wikend_current_user');
    } else {
      sessionStorage.setItem('wikend_current_user', JSON.stringify(userData));
      localStorage.removeItem('wikend_current_user');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wikend_current_user');
    sessionStorage.removeItem('wikend_current_user');
    setUser(null);
    setCoins(0);
    setUnlockedGroups([]);
    setActiveChat(null);
  };

  const handleUnlockGroup = (group) => {
    if (coins < group.cost) {
      alert(`Necesitas ${group.cost} monedas ($1 USD) para entrar a "${group.name}". Abriendo la tienda rápida...`);
      return setStoreOpen(true);
    }
    setCoins((prev) => prev - group.cost);
    setUnlockedGroups((prev) => [...prev, group.id]);
    setActiveChat({ type: 'group', data: group });
  };

  const handleDeleteAccount = () => {
    setSettingsOpen(false);
    handleLogout();
    alert('Tu cuenta y todos sus datos han sido eliminados definitivamente.');
  };

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ''}>
      {!isAdult && (
        <AgeGateModal 
          onConfirmAdult={() => setIsAdult(true)} 
          onOpenLegal={(section) => setLegalSection(section)}
        />
      )}

      {!user ? (
        <AuthScreen
          onAuthSuccess={(userData, rememberMe) => handleAuthSuccess(userData, rememberMe)}
          onOpenLegal={(section) => setLegalSection(section)}
        />
      ) : activeChat ? (
        <ChatRoom
          activeChat={activeChat}
          currentUser={user}
          onBack={() => setActiveChat(null)}
        />
      ) : (
        <Lobby
          user={user}
          coins={coins}
          unlockedGroups={unlockedGroups}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenStore={() => setStoreOpen(true)}
          onEnterChat={(chatObj) => setActiveChat(chatObj)}
          onUnlockGroup={handleUnlockGroup}
          onLogout={handleLogout}
        />
      )}

      <StoreModal
        isOpen={storeOpen}
        onClose={() => setStoreOpen(false)}
        coins={coins}
        onBuyCoins={(amount) => {
          setCoins((prev) => prev + amount);
          setStoreOpen(false);
          alert(`¡Recarga exitosa! Se han acreditado ${amount} monedas a tu billetera.`);
        }}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        onUpdateUser={(updated) => setUser(updated)}
        onDeleteAccount={handleDeleteAccount}
      />

      <LegalModal activeSection={legalSection} onClose={() => setLegalSection(null)} />
    </GoogleOAuthProvider>
  );
}