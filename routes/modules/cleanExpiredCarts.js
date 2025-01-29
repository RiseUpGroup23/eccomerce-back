

const Cart = require('../../models/cart/cartModel');
const Producto = require('../../models/product/productModel');

// Limite de 10 minutos para los carritos
const CART_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutos en milisegundos

// Función para eliminar carritos vencidos y restaurar el stock
const clearExpiredCarts = async () => {
    const expiredCarts = await Cart.find({
        updatedAt: { $lt: new Date(Date.now() - CART_EXPIRATION_TIME) }
    });

    for (const cart of expiredCarts) {
        // Restaurar el stock de los productos en los carritos vencidos
        for (const item of cart.items) {
            const product = await Producto.findById(item.product);
            if (product) {
                product.stock += item.quantity;
                await product.save();
            }
        }

        // Eliminar los carritos vencidos
        await Cart.deleteOne({ _id: cart._id });
    }
};

module.exports = clearExpiredCarts