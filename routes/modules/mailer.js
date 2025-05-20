const { Transaccional, MailParams } = require("@envialosimple/transaccional");

const estr = new Transaccional("eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3NDc2NzY1NjUsImV4cCI6NDkwMzM1MDE2NSwicm9sZXMiOlsiUk9MRV9BRE1JTiIsIlJPTEVfVVNFUiJdLCJraWQiOiI2ODJiNmQ5NTNiMWYxNThjMmQwOWMzMmUiLCJhaWQiOiI2ODI2MWFiN2VlMmQ5ZjI2ZGUwMGU3MGQiLCJ1c2VybmFtZSI6Im5pY29hbWljb25lMUBnbWFpbC5jb20ifQ.s6Lh8DHhGtFveR1iaAxJZF1stBfTHDC1CEKcRvQN4fTzuD1sYVOOeTwa9cmpDxqL8yIUbIzB6y__GfnxKnPHv1JR3bZwNpeb00jbT32BOHTqIFqC129wGqRNlQniSO_5WEQuGHT9bZW-8bdVcQyIId5ZpZPjW-zUf_neJZVt0oTq90EaVrG498xHIRQ-XK9HU5c6iPyBkNG-26zV7GMdWLK5vb7vp-HzneibbJo-tgeMNGd5K0kKc0mjiJrT-GihKQmkP4aUxHEfenB5N-T1yOTAD2GlBv3_xq9OAHQx1Mamu2Vhlso7heZdlskubxul-0oIwlfRRtnkDhm51hXc0A");
const params = new MailParams();
const { ConfigModel } = require('../../models/config/configModel');
const Product = require('../../models/product/productModel');

const thanksEmailTemplate = async ({ order, user }) => {
    const config = await ConfigModel.findOne({});
    const { shopName, email: shopEmail, shopColors, customization: { logo } } = config;
    const primaryColor = shopColors.get('primaryColor') || 'lightgray';
    const { orderId, totalAmount, products } = order;
    const { name: customerName } = user;

    if (!products || products.length === 0) {
        throw new Error('El pedido no contiene productos.');
    }

    // Asegurarnos de tener datos completos de producto
    const items = await Promise.all(products.map(async item => {
        let prod = item.product;
        if (!prod.name) {
            prod = await Product.findById(prod);
            if (!prod) throw new Error(`Producto ${item.product} no encontrado.`);
        }
        return {
            name: prod.name,
            link: prod.link,
            price: prod.sellingPrice,
            quantity: item.quantity,
            variant: item.variant,
            seller: item.seller,
            image: prod.images[0]
        };
    }));

    // Construir filas de la tabla
    const itemsHtml = items.map(i => {
        const lineTotal = ((i.price * i.quantity) / 100).toFixed(2);
        const imgSrc = i.image || 'https://upload.wikimedia.org/wikipedia/commons/0/0a/No-image-available.png';
        return `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:8px;">
        <img 
          src="${imgSrc}" 
          alt="${i.name}" 
          style="width:40px;height:40px;object-fit:contain;border-radius:4px;" 
          onerror="this.onerror=null;this.src='https://upload.wikimedia.org/wikipedia/commons/0/0a/No-image-available.png';"
        >
        <span style="color:${primaryColor};font-size:14px;">
          <a href="${i.link}" target="_blank" style="color:${primaryColor};text-decoration:none;">
            ${i.name}
          </a>
        </span>
      </td>
      <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;font-size:14px;">${i.quantity}</td>
      <td style="padding:8px;text-align:right;border-bottom:1px solid #eee;font-size:14px;">$${lineTotal}</td>
    </tr>`;
    }).join('');

    // Cadena HTML final en una sola línea
    const html = `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Pedido</title>
    </head>
    <body style="margin:0;padding:20px;background-color:#f9f9f9;font-family:Arial,sans-serif;color:#333;">
      <div style="max-width:600px;width:100%;margin:0 auto;background-color:#fff;padding:20px;border-radius:8px;">
        <!-- Logo -->
        ${logo ? `<div style="text-align:center;margin-bottom:20px;">
          <img 
            src="${logo}" 
            alt="${shopName} logo" 
            style="max-width:150px;width:100%;height:auto;background-color:#fff;padding:4px;border-radius:4px;"
          >
        </div>` : ''}
        <h2 style="margin:0 0 16px;color:${primaryColor};font-size:24px;">¡Gracias por tu compra en ${shopName}!</h2>
        <p style="font-size:16px;margin:0 0 16px;">Hola ${customerName},</p>
        <p style="font-size:16px;margin:0 0 24px;">
          Hemos recibido tu pedido <strong>#${orderId}</strong> y está siendo procesado. Aquí tienes un resumen:
        </p>

        <h3 style="margin:0 0 8px;color:${primaryColor};font-size:18px;">Detalles del pedido</h3>
        <div style="overflow-x:auto;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <thead>
              <tr>
                <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">Producto</th>
                <th style="text-align:center;padding:8px;border-bottom:1px solid #ddd;">Cantidad</th>
                <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd;">Precio</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>

        <p style="font-size:16px;text-align:right;margin:0 0 24px;">
          <strong>Total: $${(totalAmount / 100).toFixed(2)}</strong>
        </p>

        ${shopEmail ? `<p style="font-size:14px;margin:0 0 16px;">
          Si tienes alguna pregunta, responde a este correo o contáctanos en <a href="mailto:${shopEmail}" style="color:${primaryColor};text-decoration:none;">${shopEmail}</a>.
        </p>`: ""}
        <p style="font-size:14px;margin:0;">¡Gracias por confiar en nosotros!</p>
        <p style="font-size:14px;margin:8px 0 0;">– El equipo de ${shopName}</p>
      </div>
    </body>
  </html>
  `.replace(/\s{2,}/g, ' ').trim();

    return html;
};

const sendEmail = async ({
    toEmail,
    toName,
    subject,
    htmlContent,
    textContent
}) => {
    const config = await ConfigModel.findOne({})
    const { shopName, email } = config
    const formattedEmail = shopName?.toLowerCase().trim().split(" ").join("") + "@riseup.com.ar"
    params
        .setFrom(formattedEmail, shopName)
        .setTo(toEmail, toName)
        .setReplyTo(email || formattedEmail)
        .setSubject(subject)
        .setHtml(htmlContent)
        .setText(textContent)
        .setContext({ name: toName });


    return await estr.mail.send(params);
}

module.exports = { sendEmail, thanksEmailTemplate };
