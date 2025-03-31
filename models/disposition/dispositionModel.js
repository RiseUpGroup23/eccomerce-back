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
    items: {
        type: [DispositionItemSchema],
        default: function () {
            return [
                {
                    title: "Demo banner",
                    type: "largeSlider",
                    content: [
                        {
                            "desktop": "https://static.vecteezy.com/system/resources/previews/006/828/785/non_2x/paper-art-shopping-online-on-smartphone-and-new-buy-sale-promotion-pink-backgroud-for-banner-market-ecommerce-women-concept-free-vector.jpg",
                            "mobile": "https://img.pikbest.com/backgrounds/20210618/creative-technology-smart-style-mobile-promotion-banner-template_6021593.jpg!bw700"
                        }
                    ]
                }
            ];
        }
    }
}, { timestamps: true });


// Modelo para DispositionModel
const DispositionModel = mongoose.model("Disposition", DispositionSchema);

module.exports = { DispositionModel };
