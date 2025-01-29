const Producto = require('../../models/product/productModel');
const Cart = require('../../models/cart/cartModel');

// Función para obtener la cantidad de un producto en los carritos
const quantityInCarts = async (productId) => {
    try {
        // Buscar todos los carritos que contengan el producto
        const carts = await Cart.find({
            'items.product': productId // Filtrar carritos que tengan ese producto
        })
        // Sumar la cantidad de ese producto en todos los carritos
        let totalQuantity = 0;

        carts.forEach(cart => {
            const item = cart.items.find(item => item.product.toString() === productId.toString());
           
            if (item) {
                totalQuantity += item.quantity; // Sumar la cantidad de ese producto en este carrito
            }
        });

        return totalQuantity;
    } catch (error) {
        console.error('Error al obtener la cantidad del producto en los carritos:', error);
        throw new Error('No se pudo obtener la cantidad del producto en los carritos');
    }
};

module.exports = quantityInCarts;
