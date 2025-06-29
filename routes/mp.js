const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "APP_USR-2980739470681237-041511-dd3fddadddfccba8c4ebfccfc70d1cd2-229156870"
});

const payment = new Payment(mp);
router.post('/create-payment', async (req, res) => {
  try {
    const response = await payment.create({ body: req.body });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error creando pago:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 🔔 Webhook para recibir notificaciones
router.post('/webhook', async (req, res) => {
  try {
    console.log('Webhook recibido:', req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Error en webhook:', error.message);
    res.sendStatus(500);
  }
});

router.post("/create-preference", async (req, res) => {
  try {
    const frontOrigin = req.body.origin.endsWith("/") ? req.body.origin.slice(0, -1) : req.body.origin
    const backUrl = (req.protocol.endsWith("s") ? req.protocol : (req.protocol + "s")) + '://' + req.get('host');
    console.log("noti url", `${backUrl}/mercadopago/webhook`);

    const body = {
      items: [
        {
          title: req.body.name,
          quantity: Number(req.body.quantity),
          unit_price: Number(req.body.price),
          currency_id: "ARS",
        },
      ],
      back_urls: {
        success: `${frontOrigin}/reserva-confirmada`,
        failure: `${frontOrigin}/reserva-error`,
      },
      auto_return: "approved",
      notification_url: `${backUrl}/mercadopago/webhook`,
      metadata: req.body,
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    res.json({
      id: result.id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
