const mongoose = require('mongoose');

// Función para eliminar acentos
function removeAccents(str) {
    const accents = [
        { base: 'a', letters: /á|à|ã|â|ä|å/g },
        { base: 'e', letters: /é|è|ê|ë/g },
        { base: 'i', letters: /í|ì|î|ï/g },
        { base: 'o', letters: /ó|ò|õ|ô|ö/g },
        { base: 'u', letters: /ú|ù|û|ü/g },
        { base: 'n', letters: /ñ/g },
        { base: 'c', letters: /ç/g }
    ];

    // Reemplazar los caracteres acentuados
    accents.forEach(acc => {
        str = str.replace(acc.letters, acc.base);
    });

    return str;
}

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String },
    subcategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subcategoria' }], // Subcategorías como referencias
    categoryLink: { type: String, unique: true }, // El campo categoryLink será un enlace único para la categoría
}, { timestamps: true });

// Middleware para generar el categoryLink para la categoría principal
categorySchema.pre('save', async function (next) {
    if (this.isNew || this.isModified('name')) {
        // Eliminar los acentos del nombre de la categoría
        const nameWithoutAccents = removeAccents(this.name);

        // Generar el categoryLink directamente a partir del nombre de la categoría sin acentos
        this.categoryLink = nameWithoutAccents.toLowerCase().replace(/\s+/g, '-'); // Reemplazar espacios por guiones y convertir a minúsculas
    }
    next();
});

module.exports = mongoose.model('Categoria', categorySchema);
