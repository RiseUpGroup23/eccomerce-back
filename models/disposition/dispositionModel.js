const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Esquema para SliderProductsItem
const SliderProductsItemSchema = new Schema({
    itemsPerPage: { type: Number, required: true },
    collectionName: { type: String, required: true },
    type: { type: String, enum: ['category', 'collection', 'default'], required: true },
    idToSearch: { type: String, required: true }
});

// Esquema para LargeSliderItem
const LargeSliderItemSchema = new Schema({
    desktop: { type: String, required: true },
    mobile: { type: String, required: true }
});

// Esquema para BannerGridItem
const BannerGridItemSchema = new Schema({
    text: { type: String, required: true },
    image: { type: String, required: true },
    url: { type: String, required: true }
});

// Esquema para DispositionItem
const DispositionItemSchema = new Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['default', 'sliderProducts', 'largeSlider', 'bannersGrid'], required: true },
    content: {
        type: Schema.Types.Mixed, // Permite almacenar distintos tipos de contenido
        validate: {
            validator: function (value) {
                if (this.type === 'sliderProducts') {
                    return Array.isArray(value) && value.every(item => item.hasOwnProperty('itemsPerPage'));
                }
                if (this.type === 'largeSlider') {
                    return Array.isArray(value) && value.every(item => item.hasOwnProperty('desktop'));
                }
                if (this.type === 'bannersGrid') {
                    return Array.isArray(value) && value.every(item => item.hasOwnProperty('text'));
                }
                return true; // No se valida si el tipo es 'default'
            },
            message: 'El contenido no coincide con el tipo de disposición.'
        }
    }
}, { timestamps: true });

// Modelo para DispositionItem
const DispositionModel = mongoose.model("DispositionItem", DispositionItemSchema);

module.exports = { DispositionModel };
