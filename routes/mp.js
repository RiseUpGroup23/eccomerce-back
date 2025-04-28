const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment } = require('mercadopago');

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || "APP_USR-2980739470681237-041511-dd3fddadddfccba8c4ebfccfc70d1cd2-229156870"
});

const payment = new Payment(mp);
router.post('/create-payment', async (req, res) => {
  const { token, transaction_amount, installments, payer } = req.body;

  try {
    const response = await payment.create({
      body: {
        token,
        transaction_amount: Number(transaction_amount),
        installments: Number(installments),
        payer
      }
    });

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

module.exports = router;
