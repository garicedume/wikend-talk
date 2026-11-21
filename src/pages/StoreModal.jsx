import React from 'react';

export default function StoreModal({ isOpen, onClose, coins, onBuyCoins }) {
  if (!isOpen) return null;

  const packs = [
    { id: 'p1', coins: 60, price: '$1.00 USD', popular: false },
    { id: 'p2', coins: 300, price: '$4.50 USD', popular: true },
    { id: 'p3', coins: 700, price: '$10.00 USD', popular: false },
  ];

  return (
    <div className="age-gate-overlay" onClick={onClose}>
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: '440px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Tienda WIKEND Talk</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Saldo actual: 🪙 {coins} Monedas</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {packs.map((pack) => (
            <div
              key={pack.id}
              style={{
                background: pack.popular ? 'rgba(37, 211, 102, 0.12)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${pack.popular ? 'rgba(37, 211, 102, 0.4)' : 'var(--glass-border)'}`,
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🪙 {pack.coins} Monedas
                  {pack.popular && (
                    <span style={{ fontSize: '0.65rem', background: '#25d366', color: '#000', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                      POPULAR
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Acceso a salas VIP (Equivalente a {pack.price})
                </div>
              </div>

              <button
                type="button"
                onClick={() => onBuyCoins(pack.coins)}
                className="btn-glass-wa"
                style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem' }}
              >
                Comprar {pack.price}
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.4 }}>
          🔒 Pagos seguros procesados mediante Webhooks cifrados bajo normativas PCI-DSS (Stripe / PayPal).
        </p>
      </div>
    </div>
  );
}
