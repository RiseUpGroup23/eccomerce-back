const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }], // Subcategorías como referencias
    categoryLink: { type: String, unique: true } // El campo categoryLink será un enlace único
}, { timestamps: true });

// Middleware para generar el categoryLink
categorySchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('name') || this.isModified('subcategories')) {
        // Si tiene subcategorías, concatenamos sus links
        let parentLink = ''; // El link de la categoría padre (puede ser vacío si no tiene subcategorías)
        if (this.subcategories && this.subcategories.length > 0) {
            const parentCategory = await mongoose.model('Categoria').findById(this.subcategories[0]);
            if (parentCategory) {
                parentLink = parentCategory.categoryLink;
            }
        }

        // El link de esta categoría se genera concatenando la jerarquía
        this.categoryLink = `${parentLink ? parentLink + '/' : ''}${this.name.toLowerCase().replace(/\s+/g, '-')}`;
    }
    next();
});

module.exports = mongoose.model('Categoria', categorySchema);
