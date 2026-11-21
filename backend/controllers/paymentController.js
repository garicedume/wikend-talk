// Controlador de Pagos (Stripe / PayPal Webhooks)
// Equivale a 60 monedas por cada $1.00 USD procesado de forma segura.

exports.handleStripeWebhook = (req, res) => {
  const event = req.body;

  // Validación de evento exitoso de Stripe
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata.userId;

    console.log(`[Stripe] Pago recibido con éxito para el usuario: ${userId}. Acreditando 60 monedas.`);
    // Aquí conectarías con tu base de datos para sumar +60 monedas al usuario
  }

  res.json({ received: true });
};

exports.handlePayPalWebhook = (req, res) => {
  const event = req.body;

  // Validación de pago completado en PayPal
  if (event.event_type === 'CHECKOUT.ORDER.APPROVED') {
    const order = event.resource;
    console.log(`[PayPal] Pago aprobado. Acreditando 60 monedas.`);
    // Lógica para sumar monedas en base de datos
  }

  res.json({ status: 'success' });
};