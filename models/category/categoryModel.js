const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' }], // Subcategorías como referencias
    categoryLink: { type: String, unique: true }, // El campo categoryLink será un enlace único
}, { timestamps: true });

// Middleware para generar el categoryLink
categorySchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('name') || this.isModified('subcategories')) {
        // Iniciar el categoryLink con el nombre de la categoría
        let parentLink = ''; // Inicializar el link de la categoría padre (puede ser vacío si no tiene subcategorías)

        // Si tiene subcategorías, buscamos el link de la categoría padre
        if (this.subcategories && this.subcategories.length > 0) {
            const subcategoryLinks = await mongoose.model('Categoria').find({ 
                '_id': { $in: this.subcategories }
            }).select('categoryLink'); // Obtener los categoryLink de las subcategorías

            // Concatena los enlaces de todas las subcategorías
            parentLink = subcategoryLinks.map(sub => sub.categoryLink).join('/');
        }

        // Generar el categoryLink final
        this.categoryLink = `${parentLink ? parentLink + '/' : ''}${this.name.toLowerCase().replace(/\s+/g, '-')}`;
    }
    next();
});

module.exports = mongoose.model('Categoria', categorySchema);
