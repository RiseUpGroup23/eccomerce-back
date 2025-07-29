const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser'); 

dotenv.config();

const app = express();

const corsOptions = {
    origin: '*', 
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions)); 
app.use(express.json());
app.use(cookieParser()); 

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://alejoguzmanx:MMv1znUOUveFgUWD@ecommerce.pvrv7.mongodb.net/ecommerce?retryWrites=true&w=majority")
    .then(() => console.log('Conexión a MongoDB exitosa'))
    .catch((err) => console.error('Error conectando a MongoDB:', err));

const configRouter = require("./routes/config");
const productosRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/user');
const collectionRoutes = require('./routes/collection');
const pickupRoutes = require('./routes/pickup');
const transportRoutes = require('./routes/transport');
const dispositionRoutes = require('./routes/disposition');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');
const cloudinaryRoutes = require('./routes/cloudinary');
const ordersRoutes = require('./routes/orders');
const paymentsRoutes = require('./routes/payments');
const mpRoutes = require('./routes/mp');
const auth = require('./Middlewares/authMiddleware');

app.use("/", configRouter);
app.use('/products', productosRoutes);
app.use('/category', categoryRoutes);
app.use('/cart', cartRoutes);
app.use('/user', userRoutes);
app.use('/collection', collectionRoutes);
app.use('/pickup', pickupRoutes);
app.use('/transport', transportRoutes);
app.use('/disposition', dispositionRoutes);
app.use('/search', searchRoutes);
app.use('/admin', auth, adminRoutes);
app.use('/cloudinary', cloudinaryRoutes);
app.use('/orders', ordersRoutes);
app.use('/payments', paymentsRoutes);
app.use('/mp', mpRoutes);

app.get('/', (req, res) => {
    res.send('luz verde');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
