import React, { useState } from 'react';

export default function SettingsModal({ isOpen, onClose, user, onUpdateUser, onDeleteAccount }) {
  const [newUsername, setNewUsername] = useState(user?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!isOpen) return null;

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      return setFeedback('La foto de perfil no puede superar los 5MB.');
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (newUsername.trim().length < 3) {
      return setFeedback('El nombre de usuario debe tener al menos 3 caracteres.');
    }
    onUpdateUser({
      ...user,
      username: newUsername.trim(),
      avatar: avatarPreview
    });
    setNewPassword('');
    setFeedback('✓ Cambios guardados correctamente.');
    setTimeout(() => setFeedback(''), 2500);
  };

  return (
    <div className="age-gate-overlay" onClick={onClose}>
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: '460px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="glass-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Configuración de Cuenta</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {feedback && (
            <div style={{
              background: feedback.startsWith('✓') ? 'rgba(37, 211, 102, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${feedback.startsWith('✓') ? 'rgba(37, 211, 102, 0.45)' : 'rgba(239, 68, 68, 0.45)'}`,
              padding: '10px',
              borderRadius: '12px',
              fontSize: '0.84rem',
              textAlign: 'center'
            }}>
              {feedback}
            </div>
          )}

          {/* Foto de Perfil */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid var(--accent-wa-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              fontSize: '2rem',
              fontWeight: 700
            }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user?.username?.charAt(0).toUpperCase()
              )}
            </div>

            <label className="btn-glass-secondary" style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem', cursor: 'pointer' }}>
              Cambiar foto de perfil (Máx 5MB)
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                Cambiar nombre de usuario
              </label>
              <input
                type="text"
                className="glass-input"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                Nueva contraseña (dejar vacío para mantener)
              </label>
              <input
                type="password"
                className="glass-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-glass-wa" style={{ marginTop: '4px' }}>
              Guardar Cambios
            </button>
          </form>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '6px 0' }} />

          {/* Zona de Peligro: Borrar cuenta definitiva */}
          <div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.4 }}>
              * Recuerda: si pasas <strong>7 días sin entrar</strong>, tu cuenta se borrará automáticamente. También puedes eliminarla ahora mismo:
            </p>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.45)',
                  color: '#fecaca',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Eliminar cuenta definitiva
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(239, 68, 68, 0.12)', padding: '14px', borderRadius: '14px' }}>
                <p style={{ fontSize: '0.84rem', color: '#fca5a5', textAlign: 'center', fontWeight: 600 }}>
                  ¿Estás seguro? Esta acción es irreversible y perderás tus monedas.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={onDeleteAccount}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      background: '#dc2626',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Sí, borrar todo
                  </button>
                  <button
                    type="button"
                    className="btn-glass-secondary"
                    style={{ flex: 1, padding: '10px' }}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}