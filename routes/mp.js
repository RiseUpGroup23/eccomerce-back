const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const uuid = require('uuid')

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "TEST-2980739470681237-041511-f22e6b0194eb879f65be2875f14bc098-229156870"
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
    const frontOrigin = req?.body?.origin?.endsWith("/") ? req.body.origin.slice(0, -1) : req?.body?.origin
    const backUrl = (req?.protocol?.endsWith("s") ? req?.protocol : (req.protocol + "s")) + '://' + req.get('host');

    const tempOrderId = uuid.v4()

    const body = {
      items: req.body.items.map((item) => ({
        title: item.name,
        quantity: Number(item.quantity),
        unit_price: Number(item.sellingPrice) / 100,
        currency_id: "ARS",
      })),
      back_urls: {
        success: `${frontOrigin}/checkout/orderPlaced`,
        failure: `${frontOrigin}/checkout/orderPlaced`,
      },
      auto_return: "approved",
      notification_url: `${backUrl}/mp/webhook`,
      metadata: req.body,
      external_reference: tempOrderId,
    };

    const preference = new Preference(mp);
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
