const express = require('express');
const router = express.Router();
const { MercadoPagoConfig, Payment } = require('mercadopago');
const { sendEmail } = require("./modules/mailer")

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

router.post('/pruebamail', async (req, res) => {
  const { to, subject, html, text } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: to, subject, html' });
  }

  try {
    const info = await sendEmail({
      toName: "Nico Amicone",
      toEmail: to,
      subject,
      htmlContent: html,
      textContent: text
    });
    res.json({ success: true, info });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error al enviar el correo', detail: error });
  }
});

module.exports = router;
