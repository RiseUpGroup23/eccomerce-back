const express = require('express');
const router = express.Router();
const Payment = require('../models/payment/paymentModel');  // Asegúrate de que la ruta sea correcta para el modelo de Payment

// Crear un nuevo método de pago
router.post('/create', async (req, res) => {
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
        const payments = await Payment.find();
        res.status(200).json(payments);  // Responde con todos los métodos de pago
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
router.put('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const payment = await Payment.findOneAndUpdate(
            { id },
            {
                active: req.body.active,
                name: req.body.name,
                availability: req.body.availability,
                info: req.body.info,
                icon: req.body.icon
            },
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
router.delete('/:id', async (req, res) => {
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
