const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Esquema para DispositionItem
const DispositionItemSchema = new Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['default', 'sliderProducts', 'largeSlider', 'bannersGrid'], required: true },
    content: {
        type: Schema.Types.Mixed, // Permite almacenar distintos tipos de contenido sin validación
    }
}, { timestamps: true });

// Esquema para DispositionModel
const DispositionSchema = new Schema({
    items: [DispositionItemSchema]  // Array de DispositionItems
}, { timestamps: true });

// Modelo para DispositionModel
const DispositionModel = mongoose.model("Disposition", DispositionSchema);

module.exports = { DispositionModel };
