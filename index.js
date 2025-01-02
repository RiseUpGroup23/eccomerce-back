const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://alejoguzmanx:MMv1znUOUveFgUWD@ecommerce.pvrv7.mongodb.net/ecommerce?retryWrites=true&w=majority")
    .then(() => console.log('Conexión a MongoDB exitosa'))
    .catch((err) => console.error('Error conectando a MongoDB:', err));

const configRouter = require("./routes/config");
const productosRoutes = require('./routes/product');
const categoryRoutes = require('./routes/category');
const cartRoutes = require('./routes/cart');
const userRoutes = require('./routes/user');

app.use("/", configRouter);
app.use('/products', productosRoutes);
app.use('/category', categoryRoutes);
app.use('/cart', cartRoutes);
app.use('/user', userRoutes);



app.get('/', (req, res) => {
    res.send('luz verde');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
