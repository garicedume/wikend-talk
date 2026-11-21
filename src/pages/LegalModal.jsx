import React, { useState } from 'react';

const LEGAL_CONTENT = {
  reglas: {
    title: 'Aviso Legal y Términos de Uso — WIKEND Talk',
    body: [
      '1. Exclusivo para mayores de 18 años (+18): Queda terminantemente prohibido el registro o uso de la plataforma por menores de edad. Cualquier cuenta detectada será eliminada de inmediato.',
      '2. Cero tolerancia a contenido ilegal: Aunque los mensajes y fotos se borran tras ser leídos, está estrictamente prohibido compartir material ilegal, acoso severo, amenazas reales, extorsión o suplantación de identidad.',
      '3. Respeto en Salas VIP (15 personas): En los grupos de pago (60 monedas / $1 USD), los usuarios pueden silenciar micrófonos o bloquear a otros miembros. El abuso reiterado conlleva la expulsión sin reembolso.',
      '4. Monedas y Accesos: Las monedas adquiridas mediante PayPal o tarjeta son digitales para desbloquear acceso a salas grupales y no son reembolsables una vez utilizadas.'
    ]
  },
  privacidad: {
    title: 'Política de Privacidad (Cero Historial)',
    body: [
      '1. Arquitectura Efímera Real: WIKEND Talk no almacena historiales de conversación. Todo mensaje de texto o fotografía (máx. 5MB) se elimina físicamente de nuestros servidores en el instante en que el destinatario o los miembros activos del grupo lo visualizan.',
      '2. Datos Mínimos de Cuenta: Solo conservamos tu nombre de usuario, contraseña cifrada (hash), fecha de nacimiento verificada (+18), foto de perfil y saldo de monedas.',
      '3. Auto-eliminación por Inactividad (7 Días): Si pasas 7 días consecutivos sin iniciar sesión en WIKEND Talk, nuestro sistema purgará automáticamente tu cuenta, avatar y registros de forma irreversible.',
      '4. Seguridad de Pagos: No almacenamos números de tarjetas. Todas las transacciones son procesadas directamente bajo estándares PCI-DSS por PayPal y Stripe.'
    ]
  },
  cookies: {
    title: 'Política de Cookies',
    body: [
      '1. Cookies Estrictamente Necesarias: Utilizamos almacenamiento local y cookies de sesión cifradas únicamente para recordar tu verificación de mayoría de edad (+18), mantener tu sesión activa si marcas "Remember me" y gestionar la conexión en tiempo real.',
      '2. Cero Rastreo Publicitario: WIKEND Talk no vende tus datos ni utiliza cookies de terceros para rastrear tu actividad fuera de la aplicación.',
      '3. Control del Usuario: Puedes borrar las cookies desde tu navegador en cualquier momento, lo cual cerrará tu sesión actual y volverá a solicitar la verificación de edad.'
    ]
  }
};

export default function LegalModal({ activeSection, onClose }) {
  const [contactSent, setContactSent] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  if (!activeSection) return null;

  const isContact = activeSection === 'contacto';
  const content = LEGAL_CONTENT[activeSection];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.card} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.headerTitle}>
            {isContact ? 'Contacto y Soporte — WIKEND Talk' : content?.title}
          </span>
          <button type="button" onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.body}>
          {!isContact ? (
            content?.body.map((paragraph, idx) => (
              <p key={idx} style={styles.paragraph}>
                {paragraph}
              </p>
            ))
          ) : contactSent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ color: '#5277f7', fontWeight: 700, marginBottom: '8px' }}>¡Mensaje recibido!</p>
              <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                Nuestro equipo de soporte revisará tu consulta y te responderá a la brevedad.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>
                ¿Tienes dudas sobre tus monedas, reportes o funcionamiento de la plataforma? Escríbenos directamente:
              </p>
              <input
                type="email"
                style={styles.input}
                placeholder="Tu correo electrónico"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
              />
              <textarea
                style={styles.textarea}
                rows="4"
                placeholder="Describe tu consulta o reporte..."
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                required
              />
              <button type="submit" style={styles.submitBtn}>
                Enviar mensaje
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    background: 'rgba(0, 0, 107, 0.4)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'Poppins', sans-serif"
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    maxHeight: '85vh',
    background: '#ffffff',
    border: '2px solid #00006b',
    borderRadius: '28px',
    boxShadow: '0 25px 60px rgba(82, 119, 247, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #5277f7 0%, #66ccff 100%)',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #00006b'
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: '1.1rem',
    color: '#ffffff'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '1.3rem',
    fontWeight: 700,
    cursor: 'pointer'
  },
  body: {
    padding: '28px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  paragraph: {
    fontSize: '0.9rem',
    color: '#374151',
    lineHeight: 1.6
  },
  input: {
    width: '100%',
    background: '#f8fafc',
    border: '1.5px solid #00006b',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '0.92rem',
    color: '#1f2937',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    background: '#f8fafc',
    border: '1.5px solid #00006b',
    borderRadius: '14px',
    padding: '12px 16px',
    fontSize: '0.92rem',
    color: '#1f2937',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '99px',
    background: 'linear-gradient(135deg, #5277f7 0%, #66ccff 100%)',
    border: '1.5px solid #00006b',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 6px 15px rgba(82, 119, 247, 0.2)'
  }
};