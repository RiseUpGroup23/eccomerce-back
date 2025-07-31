const express = require('express');
const router = express.Router();
const Payment = require('../models/payment/paymentModel');  // Asegúrate de que la ruta sea correcta para el modelo de Payment
const auth = require('../middlewares/auth');

// Crear un nuevo método de pago
router.post('/create', auth, async (req, res) => {
    try {
        const newPayment = new Payment(req.body);

        await newPayment.save();
        res.status(201).json(newPayment);  // Responde con el método de pago creado
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al crear el método de pago' });
    }
});

// Obtener todos los métodos de pago
router.get('/', async (req, res) => {
    try {
        // Verificar si ya existen los métodos de pago predeterminados
        const existingPayments = await Payment.find();

        // Si no existen, crearlos por defecto
        if (existingPayments.length === 0) {
            const defaultPayments = [
                {
                    id: "toSet",
                    name: "Acordar con el vendedor", // Aquí puedes agregar un nombre o descripción
                    active: true,
                    createdAt: new Date(), // Agrega la fecha de creación
                    updatedAt: new Date()  // Fecha de actualización
                },
                {
                    id: "bankTransfer",
                    name: "Transferencia",
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: "mercadoPago",
                    name: "Tarjeta de crédito / Débito",
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: "promisory",
                    name: "Pago contraentrega",
                    active: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            // Insertar los métodos de pago predeterminados
            await Payment.insertMany(defaultPayments);
        }

        // Obtener todos los métodos de pago y devolverlos
        const payments = await Payment.find();
        res.status(200).json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los métodos de pago' });
    }
});

// Obtener un método de pago por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const payment = await Payment.findOne({ id });

        if (!payment) {
            return res.status(404).json({ message: 'Método de pago no encontrado' });
        }

        res.status(200).json(payment);  // Responde con el método de pago encontrado
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener el método de pago' });
    }
});

// Actualizar un método de pago por ID
router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;

    try {
        const payment = await Payment.findOneAndUpdate(
            { id },
            req.body,
            { new: true }
        );

        if (!payment) {
            return res.status(404).json({ message: 'Método de pago no encontrado' });
        }

        res.status(200).json(payment);  // Responde con el método de pago actualizado
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar el método de pago' });
    }
});

// Eliminar un método de pago por ID
router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;

    try {
        const payment = await Payment.findOneAndDelete({ id });

        if (!payment) {
            return res.status(404).json({ message: 'Método de pago no encontrado' });
        }

        res.status(200).json({ message: 'Método de pago eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el método de pago' });
    }
});

module.exports = router;
