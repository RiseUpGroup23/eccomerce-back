const { Transaccional, MailParams } = require("@envialosimple/transaccional");

const estr = new Transaccional("eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3NDc2Njk4NTEsImV4cCI6NDkwMzM0MzQ1MSwicm9sZXMiOlsiUk9MRV9BRE1JTiIsIlJPTEVfVVNFUiJdLCJraWQiOiI2ODJiNTM1YmNhNjlmOTZjYjYwZWIyNDMiLCJhaWQiOiI2ODI2MWFiN2VlMmQ5ZjI2ZGUwMGU3MGQiLCJ1c2VybmFtZSI6Im5pY29hbWljb25lMUBnbWFpbC5jb20ifQ.qwNdtdqbbeT_5Q0a7ASHh_uAaM7w-foPPbN-cZJqJ0rmJvdu3b5ERsC9hox1sEIbEP--_x1HOAcLknOjIXIW4GZrqg9PX2S3BmZuJ4NWe0faos5dOSX2dNFmDb-7pG4CJa9xpu_fNYmq-yIyBLuA9kMkh_24cNVQg3FcewS5r2ZNpRj69yRuuymloKbJpPZs_Q3rfrmpciH7D6U6dUfW8YvJdVBjAYT8vsXZkD_ZIUUqTx4of_ny1FuSJhG4F3IKdSmigjMv3B96ZwH6m5xBLcvEBQ5ewb_LA_x1HGDh0qPHZPoEAGKvLN3s923RmFMg0UvAPwCzgX69QDHIoGafSA");
const params = new MailParams();
const { ConfigModel } = require('../../models/config/configModel');

const thanksEmailTemplate = async ({ order, user }) => {
    const config = await ConfigModel.findOne({});
    const { shopName, email: shopEmail, shopColors } = config;
    const primaryColor = shopColors.primaryColor || '#4CAF50';
    const { orderId, totalAmount, products } = order;
    const { name: customerName } = user;

    if (!products || products.length === 0) {
        throw new Error('El pedido no contiene productos.');
    }

    // Asegurarnos de tener datos completos de producto
    const items = await Promise.all(products.map(async item => {
        let prod = item.product;
        if (!prod.name) {
            prod = await ProductoModel.findById(prod);
            if (!prod) throw new Error(`Producto ${item.product} no encontrado.`);
        }
        return {
            name: prod.name,
            link: prod.link,
            price: prod.sellingPrice,
            quantity: item.quantity,
            variant: item.variant,
            seller: item.seller
        };
    }));

    // Construir filas de la tabla
    const itemsHtml = items.map(i => {
        const variantText = i.variant ? ` (${i.variant})` : '';
        const lineTotal = (i.price * i.quantity).toFixed(2);
        return `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">
        <a href="${i.link}" target="_blank" style="color:${primaryColor};text-decoration:none;">
          ${i.name}${variantText}
        </a>
      </td>
      <td style="padding:8px;text-align:center;border-bottom:1px solid #eee;">${i.quantity}</td>
      <td style="padding:8px;text-align:right;border-bottom:1px solid #eee;">$${lineTotal}</td>
    </tr>`;
    }).join('');

    // Cadena HTML final en una sola línea
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background-color:#f9f9f9;padding:20px;color:#333;"><div style="max-width:600px;margin:auto;background-color:#fff;padding:20px;border-radius:8px;"><h2 style="color:${primaryColor};">Gracias por tu compra en ${shopName}!</h2><p style="font-size:16px;">Hola ${customerName},</p><p style="font-size:16px;">Hemos recibido tu pedido <strong>#${orderId}</strong> y está siendo procesado. Aquí tienes un resumen:</p><h3 style="color:${primaryColor};">Detalles del pedido</h3><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">Producto</th><th style="text-align:center;padding:8px;border-bottom:1px solid #ddd;">Cantidad</th><th style="text-align:right;padding:8px;border-bottom:1px solid #ddd;">Precio</th></tr></thead><tbody>${itemsHtml}</tbody></table><p style="font-size:16px;text-align:right;margin-top:20px;"><strong>Total: $${totalAmount.toFixed(2)}</strong></p><p style="font-size:14px;margin-top:30px;">Si tienes alguna pregunta, responde a este correo o contáctanos a ${shopEmail}.</p><p style="font-size:14px;">¡Gracias por confiar en nosotros!</p><p style="font-size:14px;">– El equipo de ${shopName}</p></div></body></html>`;

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
    const formattedName = shopName?.toLowerCase().trim().split(" ").join("")
    params
        .setFrom(formattedName, shopName)
        .setTo(toEmail, toName)
        .setReplyTo(email)
        .setSubject(subject)
        .setHtml(htmlContent)
        .setText(textContent)
        .setContext({ name: toName });


    return await estr.mail.send(params);
}

module.exports = { sendEmail, thanksEmailTemplate };
