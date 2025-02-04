const moment = require('moment-timezone');
const Cart = require('../../models/cart/cartModel');
const Producto = require('../../models/product/productModel');

// Límite de 10 minutos para los carritos
const CART_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutos en milisegundos

// Función para eliminar carritos vencidos y restaurar el stock
const clearExpiredCarts = async () => {
    // Obtener la fecha actual en la zona horaria de Argentina
    const currentDate = moment.tz('America/Argentina/Buenos_Aires').toDate();

    // Buscar carritos que han expirado según la zona horaria de Argentina
    const expiredCarts = await Cart.find({
        updatedAt: { $lt: new Date(currentDate.getTime() - CART_EXPIRATION_TIME) }
    });

    for (const cart of expiredCarts) {
        // Restaurar el stock de los productos en los carritos vencidos
        for (const item of cart.items) {
            const product = await Producto.findById(item.product);
            if (product) {
                // Buscar la variante específica
                const variant = product.variants.id(item.variant);
                if (variant) {
                    // Buscar el stock de la sucursal específica
                    const stockEntry = variant.stockByPickup.find(sp => sp.pickup.equals(item.pickup));
                    if (stockEntry) {
                        // Restaurar el stock
                        stockEntry.quantity += item.quantity;
                        await product.save();
                    }
                }
            }
        }

        // Eliminar los carritos vencidos
        await Cart.deleteOne({ _id: cart._id });
    }
};

module.exports = clearExpiredCarts;