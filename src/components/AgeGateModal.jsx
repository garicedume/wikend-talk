import React, { useState } from 'react';

export default function AgeGateModal({ onConfirmAdult, onOpenLegal }) {
  const [underageBlocked, setUnderageBlocked] = useState(false);

  const handleConfirm = () => {
    sessionStorage.setItem('wikend_age_verified', 'true');
    onConfirmAdult();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.ageCircle}>
          <span style={styles.ageNumber}>18</span>
          <div style={styles.slashLine} />
        </div>

        <div style={styles.content}>
          {!underageBlocked ? (
            <>
              <h2 style={styles.title}>ACCESO RESTRINGIDO</h2>
              <h3 style={styles.subtitle}>¿Eres mayor de edad?</h3>
              <p style={styles.description}>
                Bienvenido a WIKEND Talk. Para disfrutar de esta experiencia de mensajería premium, debes confirmar que tienes <strong>18 años o más</strong>.
              </p>

              <div style={styles.buttonContainer}>
                <button type="button" style={styles.btnNeumorphic} onClick={handleConfirm}>
                  Sí, soy mayor de edad
                </button>
                <button type="button" style={styles.btnNeumorphicSecondary} onClick={() => setUnderageBlocked(true)}>
                  Salir del sitio
                </button>
              </div>

              <p style={styles.termsText}>
                Al ingresar aceptas nuestros términos de servicio y política de privacidad
              </p>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#fff' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛡️</div>
              <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', marginBottom: '10px' }}>Acceso Denegado</h2>
              <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', lineHeight: 1.6, marginBottom: '24px' }}>
                Lo sentimos, pero <strong>WIKEND Talk</strong> es exclusivo para adultos. El acceso está restringido para proteger a nuestra comunidad.
              </p>
              <button 
                type="button" 
                style={styles.btnNeumorphic} 
                onClick={() => window.location.href = 'https://www.google.com'}
              >
                Entendido
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Legal con tamaño de 14px exactos */}
      <footer style={styles.footer}>
        <span style={styles.footerLink} onClick={() => onOpenLegal && onOpenLegal('reglas')}>Aviso Legal</span>
        <span style={styles.dot}>•</span>
        <span style={styles.footerLink} onClick={() => onOpenLegal && onOpenLegal('reglas')}>Términos y Condiciones</span>
        <span style={styles.dot}>•</span>
        <span style={styles.footerLink} onClick={() => onOpenLegal && onOpenLegal('privacidad')}>Política de Privacidad</span>
        <span style={styles.dot}>•</span>
        <span style={styles.footerLink} onClick={() => onOpenLegal && onOpenLegal('cookies')}>Política de Cookies</span>
        <span style={styles.dot}>•</span>
        <span style={styles.designBy}>
          Design by:{' '}
          <a
            href="https://nudesign.agency/"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.agencyLink}
          >
            nudesign.agency
          </a>
        </span>
      </footer>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 9999,
    background: 'linear-gradient(135deg, #0f1026 0%, #1a1c3b 50%, #090a16 100% )',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '30px 20px',
    fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box',
    overflowY: 'hidden' // Diseño Above the Fold sin scroll general
  },
  modalCard: {
    width: '100%',
    maxWidth: '440px',
    background: 'linear-gradient(145deg, #1e2246, #161937)',
    border: '1px solid rgba(115, 128, 242, 0.2)',
    borderRadius: '32px',
    padding: '40px 36px 32px 36px',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    boxSizing: 'border-box',
    margin: 'auto'
  },
  ageCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    background: '#1a1c3b',
    border: '4px solid #ff3b30',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: '20px',
    boxShadow: '8px 8px 16px rgba(5, 6, 15, 0.6), -8px -8px 16px rgba(35, 40, 85, 0.4)',
    boxSizing: 'border-box'
  },
  ageNumber: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#ffffff',
    letterSpacing: '-1px',
    lineHeight: 1
  },
  slashLine: {
    position: 'absolute',
    width: '5px',
    height: '105%',
    background: '#ff3b30',
    transform: 'rotate(38deg)'
  },
  content: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '0.3px',
    marginBottom: '6px'
  },
  subtitle: {
    fontSize: '1.18rem',
    fontWeight: 600,
    color: '#a5b4fc',
    marginBottom: '14px'
  },
  description: {
    fontSize: '0.88rem',
    fontWeight: 400,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: '1.6',
    marginBottom: '26px',
    maxWidth: '340px'
  },
  buttonContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    marginBottom: '20px'
  },
  // Botón Neumorphism principal
  btnNeumorphic: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: '99px',
    background: 'linear-gradient(145deg, #232750, #1b1e41)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.98rem',
    cursor: 'pointer',
    boxShadow: '6px 6px 12px rgba(8, 9, 22, 0.6), -6px -6px 12px rgba(38, 43, 94, 0.4)',
    transition: 'all 0.2s ease'
  },
  // Botón Neumorphism secundario
  btnNeumorphicSecondary: {
    width: '100%',
    padding: '14px 20px',
    borderRadius: '99px',
    background: 'linear-gradient(145deg, #1b1e41, #151733)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 600,
    fontSize: '0.98rem',
    cursor: 'pointer',
    boxShadow: 'inset 4px 4px 8px rgba(8, 9, 22, 0.5), inset -4px -4px 8px rgba(38, 43, 94, 0.3)',
    transition: 'all 0.2s ease'
  },
  termsText: {
    fontSize: '0.72rem',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 1.4,
    maxWidth: '280px'
  },
  footer: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    fontSize: '14px', // 14px exactos
    color: '#818cf8',
    textAlign: 'center',
    padding: '10px 20px',
    boxSizing: 'border-box'
  },
  footerLink: {
    cursor: 'pointer',
    color: '#818cf8',
    fontWeight: 500,
    textDecoration: 'none'
  },
  dot: {
    color: 'rgba(129, 140, 248, 0.5)',
    fontWeight: 700
  },
  designBy: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: 500
  },
  agencyLink: {
    color: '#818cf8',
    fontWeight: 700,
    textDecoration: 'none'
  }
};