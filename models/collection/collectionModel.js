const mongoose = require('mongoose');

// Esquema de colección
const collectionSchema = new mongoose.Schema(
    {
        collectionId: {
            type: Number,
            unique: true
        },
        title: {
            type: String,
            required: true
        },
        products: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Producto'
        }] // Referencia a productos
    },
    { timestamps: true }
);

// Middleware para generar un collectionId único e incremental
collectionSchema.pre('save', async function (next) {
    if (this.isNew) {
        // Buscar el último collectionId utilizado
        const lastCollection = await mongoose.model('Collection').findOne().sort({ collectionId: -1 });

        // Si existe, incrementamos el collectionId en 1
        this.collectionId = lastCollection ? lastCollection.collectionId + 1 : 1;
    }
    next();
});

module.exports = mongoose.model('Collection', collectionSchema);
