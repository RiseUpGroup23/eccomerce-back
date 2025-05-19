//mailer.ts
// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//     host: 'smtp.envialosimple.email',      // Ej: smtp.gmail.com o mail.tudominio.com
//     port: 465,                         // O usa 465 si tu servidor requiere SSL
//     secure: true,                    // true para puerto 465, false para 587
//     auth: {
//         user: 'R3oMBdmvS6TkE8k68b4afae6@riseup.com.ar',
//         pass: '77RLTCLp8wnBv7VRwN3fnpJ7wK37Myjg',
//     },
// });

// // Verifica la conexión (opcional, útil para debug)
// transporter.verify((error, success) => {
//     if (error) {
//         console.error('Error al conectar con SMTP:', error);
//     } else {
//         console.log('Conexión SMTP exitosa');
//     }
// });

// // Función para enviar email
// const sendEmail = async ({ to, subject, html, text }) => {
//     try {
//         const info = await transporter.sendMail({
//             from: '"Prueba" <R3oMBdmvS6TkE8k68b4afae6@riseup.com.ar>',
//             to,
//             subject,
//             text,
//             html,
//         });

//         console.log('Correo enviado:', info.messageId);
//         return info;
//     } catch (error) {
//         console.error('Error al enviar el correo:', error);
//         throw error;
//     }
// };

const { Transaccional, MailParams } = require("@envialosimple/transaccional");

const estr = new Transaccional("eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE3NDczMzQ3MzMsImV4cCI6NDkwMzAwODMzMiwicm9sZXMiOlsiUk9MRV9BRE1JTiIsIlJPTEVfVVNFUiJdLCJraWQiOiI2ODI2MzY0Y2VlMjg3Y2YwY2EwNGEzOWYiLCJhaWQiOiI2ODI2MWFiN2VlMmQ5ZjI2ZGUwMGU3MGQiLCJ1c2VybmFtZSI6Im5pY29hbWljb25lMUBnbWFpbC5jb20ifQ.h-7Luwxf0IL6_tmOs-GigfxcxunCD-6ZgQENmzm76zCWMrl-wDUmbgEK2Wifurq1P24psSM6B5ApRPNZBn3t356Qms0gpPnIvII3KIq-iv5An8hGlDAbnStHWR7_6SI3yD2FXh2061RF4NG69Y1yp0hM0Lo_1HghxkQh3Tix7sWeDYiCqgitYs_5pim70L_WCvmIGGaPBJyTuzKN28U7pC3JF__CrS3JyQs9wg7FlRtTJiBsM7zGPqXH9U19HhMkkTg07oBa60OEmKYoHI7eEcnzzh0S3b3Mnl-X4xHCl_xhnDWxzwdQJzsdbNEEr8y08uJgphmVB1F55VB5gZxeng");
const params = new MailParams();

const sendEmail = async () => {
    params
        .setFrom('no-reply@mycompany.com', 'MyCompany Notifications')
        .setTo('john.doe@example.com', 'John Doe')
        .setReplyTo('reply@here.com')
        .setSubject('This is a test for {{name}}')
        .setPreviewText('A glimpse of what comes next...')
        .setHtml('<h1>HTML emails are cool, {{name}}</h1>')
        .setText('Text emails are also cool, {{name}}')
        .setContext({ name: 'John' });


    return await estr.mail.send(params);
}

module.exports = { sendEmail };
