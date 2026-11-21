import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import wikendLogo from '../assets/wikentalk_logo.svg';
import imageInicio from '../assets/image_inicio.svg';
import imageCrearCuenta from '../assets/image_crearcuenta.svg';

const RECAPTCHA_SITE_KEY = '6LcrbyUuAAAAAJU6XO_a1WsBUbBsx5LiyUxBnJ7r';

export default function AuthScreen({ onAuthSuccess, onOpenLegal }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const [acceptConditions, setAcceptConditions] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const hasMinLength = password.length >= 10;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[\W_]/.test(password);

  useEffect(() => {
    const scriptId = 'recaptcha-v2-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = "https://www.google.com/recaptcha/api.js?hl=es";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    window.onCaptchaChange = (token) => {
      setRecaptchaToken(token);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (username.trim().length < 3) {
      return setError('El nombre de usuario debe tener al menos 3 caracteres.');
    }

    if (isRegister) {
      if (password !== repeatPassword) {
        return setError('Las contraseñas no coinciden.');
      }
      if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
        return setError('La contraseña debe cumplir con todos los requisitos de seguridad.');
      }
      if (!day || !month || !year) {
        return setError('Por favor, selecciona tu fecha de nacimiento completa.');
      }

      const birthDate = new Date(`${year}-${month}-${day}`);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 18) {
        return setError('Acceso restringido. Debes ser mayor de 18 años para registrarte.');
      }

      if (!acceptConditions) {
        return setError('Debes leer y aceptar las condiciones de privacidad y uso para continuar.');
      }
    }

    if (!recaptchaToken) {
      return setError('Por favor, completa la verificación "No soy un robot".');
    }

    setLoading(true);
    const endpoint = isRegister ? 'http://localhost:5000/api/auth/register' : 'http://localhost:5000/api/auth/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ocurrió un error en la autenticación.');
      }

      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Fondo con marcas de agua masivas de emojis de mensajería (Estilo Telegram) */}
      <div style={styles.watermarkBg} aria-hidden="true">
        <span style={{...styles.floatingEmoji, top: '5%', left: '4%'}}>💬</span>
        <span style={{...styles.floatingEmoji, top: '12%', left: '90%'}}>✈️</span>
        <span style={{...styles.floatingEmoji, top: '22%', left: '15%'}}>✉️</span>
        <span style={{...styles.floatingEmoji, top: '32%', left: '82%'}}>🔒</span>
        <span style={{...styles.floatingEmoji, top: '45%', left: '6%'}}>😊</span>
        <span style={{...styles.floatingEmoji, top: '52%', left: '88%'}}>✏️</span>
        <span style={{...styles.floatingEmoji, top: '68%', left: '10%'}}>💭</span>
        <span style={{...styles.floatingEmoji, top: '75%', left: '85%'}}>💬</span>
        <span style={{...styles.floatingEmoji, top: '88%', left: '18%'}}>🛡️</span>
        <span style={{...styles.floatingEmoji, top: '92%', left: '76%'}}>✈️</span>
        <span style={{...styles.floatingEmoji, top: '18%', left: '46%'}}>✉️</span>
        <span style={{...styles.floatingEmoji, top: '82%', left: '50%'}}>😊</span>
        <span style={{...styles.floatingEmoji, top: '38%', left: '48%'}}>💬</span>
      </div>

      <header style={styles.header}>
        <div style={styles.brandWrapper}>
          <img src={wikendLogo} alt="WIKEND Talk" style={styles.logoImg} />
        </div>
      </header>

      <main style={styles.mainContent}>
        {/* Columna Izquierda: Ilustración desplazada hacia la izquierda en armonía con el logo */}
        <div style={styles.leftCol}>
          <img 
            src={isRegister ? imageCrearCuenta : imageInicio} 
            alt="Ilustración WIKEND Talk" 
            style={styles.illustration} 
          />
        </div>

        {/* Columna Derecha: Tarjeta Azul Corporativa Rectangular (ligeramente elevada) */}
        <div style={styles.rightCol}>
          <div style={styles.modalCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                {isRegister ? 'Únete a la comunidad' : '¡Hola de nuevo!'}
              </h2>
              <p style={styles.cardSubtitle}>
                {isRegister ? 'Crea tu perfil gratis en segundos' : 'Entra y empieza a chatear con tus amigos'}
              </p>
            </div>

            {error && (
              <div style={styles.errorBanner}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  style={styles.inputField}
                  placeholder="Tu nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <input
                  type="password"
                  style={styles.inputField}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {isRegister && (
                <>
                  <div style={styles.inputGroup}>
                    <input
                      type="password"
                      style={styles.inputField}
                      placeholder="Confirma tu contraseña"
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.passwordRulesBox}>
                    <span style={{ color: hasMinLength ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>{hasMinLength ? '✓' : '•'} Mínimo 10 caracteres</span>
                    <span style={{ color: hasUpper ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>{hasUpper ? '✓' : '•'} Una mayúscula</span>
                    <span style={{ color: hasLower ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>{hasLower ? '✓' : '•'} Una minúscula</span>
                    <span style={{ color: hasNumber ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>{hasNumber ? '✓' : '•'} Un número</span>
                    <span style={{ color: hasSpecial ? '#ffffff' : 'rgba(255,255,255,0.7)' }}>{hasSpecial ? '✓' : '•'} Un símbolo especial</span>
                  </div>

                  <div style={styles.dateLabel}>Fecha de nacimiento (mayor de +18)</div>
                  <div style={styles.dateSelectorsRow}>
                    <select 
                      style={styles.dateSelect} 
                      value={day} 
                      onChange={(e) => setDay(e.target.value)}
                      required
                    >
                      <option value="">Día v</option>
                      {[...Array(31)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>

                    <select 
                      style={styles.dateSelect} 
                      value={month} 
                      onChange={(e) => setMonth(e.target.value)}
                      required
                    >
                      <option value="">Mes v</option>
                      <option value="1">Enero</option>
                      <option value="2">Febrero</option>
                      <option value="3">Marzo</option>
                      <option value="4">Abril</option>
                      <option value="5">Mayo</option>
                      <option value="6">Junio</option>
                      <option value="7">Julio</option>
                      <option value="8">Agosto</option>
                      <option value="9">Septiembre</option>
                      <option value="10">Octubre</option>
                      <option value="11">Noviembre</option>
                      <option value="12">Diciembre</option>
                    </select>

                    <select 
                      style={styles.dateSelect} 
                      value={year} 
                      onChange={(e) => setYear(e.target.value)}
                      required
                    >
                      <option value="">Año v</option>
                      {[...Array(100)].map((_, i) => {
                        const yr = new Date().getFullYear() - i;
                        return <option key={yr} value={yr}>{yr}</option>;
                      })}
                    </select>
                  </div>
                </>
              )}

              {/* Botón de Google forzado al 100% de ancho mediante escala de contenedor */}
              <div style={styles.googleBtnWrapper}>
                <div style={styles.googleInnerScaler}>
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      fetch('http://localhost:5000/api/auth/google', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token: credentialResponse.credential })
                      })
                      .then(res => res.json())
                      .then(data => {
                        if (data.user) onAuthSuccess(data.user);
                        else setError('Error al autenticar con Google');
                      })
                      .catch(() => setError('Error de red con Google'));
                    }}
                    onError={() => setError('Falló el inicio de sesión con Google')}
                    useOneTap
                  />
                </div>
              </div>

              {isRegister && (
                <div style={styles.termsContainer}>
                  <input
                    type="checkbox"
                    checked={acceptConditions}
                    onChange={(e) => setAcceptConditions(e.target.checked)}
                    style={styles.checkbox}
                    required
                  />
                  <span 
                    style={styles.termsLink} 
                    onClick={() => onOpenLegal('privacidad')}
                  >
                    Acepto las reglas y privacidad de Wikend Talk
                  </span>
                </div>
              )}

              {!isRegister && (
                <div style={styles.extraOptionsRow}>
                  <label style={styles.rememberLabel}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={styles.checkboxSmall}
                    />
                    Mantener sesión
                  </label>
                  <button type="button" onClick={() => onOpenLegal('contacto')} style={styles.forgotButton}>
                    ¿olvidaste tu clave?
                  </button>
                </div>
              )}

              <div style={styles.recaptchaWrapper}>
                <div 
                  className="g-recaptcha" 
                  data-sitekey={RECAPTCHA_SITE_KEY}
                  data-callback="onCaptchaChange"
                ></div>
              </div>

              {/* Botón principal con Neumorphism elegante */}
              <button type="submit" disabled={loading} style={styles.primaryButton}>
                {loading ? 'Procesando...' : isRegister ? 'Crear mi cuenta' : 'Entrar a chatear'}
              </button>
            </form>

            <div style={styles.switchContainer}>
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                style={styles.switchButton}
              >
                {isRegister ? '¿Ya eres miembro? Inicia sesión aquí' : '¿Nuevo en Wikend Talk? Regístrate gratis'}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Legal con tamaño de 12px exactos */}
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
  container: {
    width: '100vw',
    height: '100dvh',
    background: 'linear-gradient(135deg, #e5e9ff 0%, #ffffff 100%)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    fontFamily: "'Poppins', sans-serif",
    boxSizing: 'border-box',
    overflow: 'hidden',
    position: 'relative'
  },
  watermarkBg: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: '3.2rem',
    opacity: 0.08,
    userSelect: 'none'
  },
  header: {
    width: '100%',
    padding: 'clamp(6px, 1.2vh, 14px) 4% 0 4%', // Alineado más a la izquierda para armonizar con la ilustración
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
    zIndex: 1
  },
  brandWrapper: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '1.5%' // Ajuste fino hacia el eje izquierdo
  },
  logoImg: {
    height: 'clamp(38px, 6vh, 68px)',
    width: 'auto'
  },
  mainContent: {
    width: '100%',
    maxWidth: '1800px',
    margin: '0 auto',
    flex: 1,
    minHeight: 0,
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 410px)',
    gap: 'clamp(20px, 4vw, 50px)',
    padding: '0 4% clamp(4px, 1vh, 10px) 4%',
    alignItems: 'center',
    boxSizing: 'border-box',
    overflow: 'hidden',
    zIndex: 1
  },
  leftCol: {
    display: 'flex',
    justifyContent: 'flex-start', // Movido hacia el lado del logo
    alignItems: 'center',
    width: '100%',
    paddingLeft: '2%' // Desplazamiento adicional hacia la izquierda para alinear con el brand
  },
  illustration: {
    width: 'auto',
    maxWidth: '100%',
    maxHeight: 'calc(100dvh - 130px)',
    height: 'auto',
    objectFit: 'contain'
  },
  rightCol: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    minWidth: 0,
    transform: 'translateY(-10px)' // Ligeramente elevado para evitar cualquier corte inferior
  },
  modalCard: {
    width: '100%',
    maxWidth: '400px',
    background: 'linear-gradient(180deg, #5277f7 0%, #4668e8 100%)',
    border: '2px solid #00006b',
    borderRadius: '28px',
    padding: 'clamp(14px, 2.2vh, 26px) clamp(18px, 2.2vw, 30px)',
    boxShadow: '0 24px 50px rgba(82, 119, 247, 0.28)',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  cardHeader: {
    marginBottom: 'clamp(6px, 1.2vh, 12px)',
    textAlign: 'center'
  },
  cardTitle: {
    fontSize: 'clamp(1.1rem, 2.2vh, 1.5rem)',
    fontWeight: 800,
    color: '#ffffff',
    marginBottom: 'clamp(2px, 0.3vh, 3px)'
  },
  cardSubtitle: {
    fontSize: 'clamp(0.7rem, 1.1vh, 0.85rem)',
    color: 'rgba(255, 255, 255, 0.9)'
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    color: '#fee2e2',
    padding: 'clamp(4px, 0.7vh, 7px) 12px',
    borderRadius: '10px',
    fontSize: 'clamp(0.68rem, 1.05vh, 0.8rem)',
    marginBottom: 'clamp(5px, 0.9vh, 8px)',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'clamp(5px, 1vh, 10px)'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputField: {
    width: '100%',
    backgroundColor: '#ffffff',
    border: '1px solid #00006b',
    borderRadius: '99px',
    padding: 'clamp(8px, 1.3vh, 12px) 18px',
    fontSize: 'clamp(0.78rem, 1.15vh, 0.9rem)',
    color: '#1f2937',
    outline: 'none',
    boxSizing: 'border-box'
  },
  passwordRulesBox: {
    background: 'rgba(0, 0, 107, 0.2)',
    padding: 'clamp(4px, 0.7vh, 6px) 12px',
    borderRadius: '10px',
    fontSize: 'clamp(0.64rem, 0.9vh, 0.72rem)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  dateLabel: {
    fontSize: 'clamp(0.68rem, 1vh, 0.78rem)',
    color: '#ffffff',
    fontWeight: 600,
    marginTop: '1px'
  },
  dateSelectorsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '6px'
  },
  dateSelect: {
    backgroundColor: '#ffffff',
    border: '1px solid #00006b',
    borderRadius: '10px',
    padding: 'clamp(5px, 1vh, 8px)',
    fontSize: 'clamp(0.72rem, 1.05vh, 0.82rem)',
    color: '#1f2937',
    outline: 'none',
    cursor: 'pointer'
  },
  googleBtnWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'clamp(2px, 0.4vh, 4px) 0',
    boxSizing: 'border-box'
  },
  googleInnerScaler: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transform: 'scale(1.12)',
    transformOrigin: 'center',
    margin: '3px 0'
  },
  termsContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: 'clamp(2px, 0.4vh, 4px) 0'
  },
  checkbox: {
    accentColor: '#5277f7',
    cursor: 'pointer',
    width: '15px',
    height: '15px'
  },
  termsLink: {
    fontSize: 'clamp(0.7rem, 1.05vh, 0.82rem)',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  recaptchaWrapper: {
    display: 'flex',
    justifyContent: 'center',
    margin: 'clamp(2px, 0.4vh, 4px) 0',
    zoom: 0.8
  },
  primaryButton: {
    width: '100%',
    padding: 'clamp(10px, 1.3vh, 13px)',
    borderRadius: '99px',
    background: 'linear-gradient(145deg, #ffffff, #f0f4ff)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    color: '#5277f7',
    fontWeight: 700,
    fontSize: 'clamp(0.8rem, 1.15vh, 0.95rem)',
    cursor: 'pointer',
    boxShadow: '4px 4px 12px rgba(0, 0, 107, 0.2), -4px -4px 12px rgba(255, 255, 255, 0.6)',
    transition: 'all 0.15s ease',
    boxSizing: 'border-box'
  },
  extraOptionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 'clamp(0.7rem, 1.05vh, 0.8rem)',
    color: '#ffffff',
    padding: '0 4px'
  },
  rememberLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer'
  },
  checkboxSmall: {
    accentColor: '#5277f7',
    cursor: 'pointer'
  },
  forgotButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 'inherit',
    textDecoration: 'underline'
  },
  switchContainer: {
    textAlign: 'center',
    marginTop: 'clamp(6px, 1vh, 10px)',
    paddingTop: 'clamp(5px, 0.9vh, 9px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.2)'
  },
  switchButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: 'clamp(0.74rem, 1.05vh, 0.85rem)',
    fontWeight: 700,
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  footer: {
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'clamp(8px, 1.5vw, 16px)',
    fontSize: '12px', // <--- Tamaño ajustado exactamente a 12px
    color: '#5277f7',
    textAlign: 'center',
    padding: 'clamp(4px, 1vh, 10px) 20px',
    flexShrink: 0,
    boxSizing: 'border-box',
    zIndex: 1
  },
  footerLink: {
    cursor: 'pointer',
    color: '#5277f7',
    fontWeight: 500,
    textDecoration: 'none'
  },
  dot: {
    color: '#5277f7',
    fontWeight: 700
  },
  designBy: {
    color: '#5277f7',
    fontWeight: 500
  },
  agencyLink: {
    color: '#5277f7',
    fontWeight: 700,
    textDecoration: 'none'
  }
};