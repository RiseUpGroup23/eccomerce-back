const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  link: { type: String, required: true },
  sellingPrice: { type: Number, required: true },
  listPrice: { type: Number },
  variants: [{
    attributes: {
      name: String
    },
    stockByPickup: [{
      pickup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pickup',
        required: true
      },
      quantity: {
        type: Number,
        default: 0
      },
      totalSold: {
        type: Number,
        default: 0
      }
    }]
  }],
  quantity: { type: Number },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategoria', default: null },
  images: [{ type: String }],
  brand: { type: String },

  // Campo real para totalStock
  totalStock: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// --- Post-save hook ---
productoSchema.post('save', function(doc) {
  // `doc` es el documento recién guardado
  const calculated = doc.variants.reduce((acc, variant) => {
    return acc + variant.stockByPickup.reduce((sum, sp) => sum + sp.quantity, 0);
  }, 0);

  // Solo actualizamos si difiere
  if (doc.totalStock !== calculated) {
    // Usamos updateOne para evitar recursión en 'save'
    this.model('Producto')
      .updateOne({ _id: doc._id }, { totalStock: calculated })
      .exec();
  }
});

// --- Post-findOneAndUpdate hook ---
productoSchema.post('findOneAndUpdate', async function(doc) {
  // `doc` es el documento _antes_ del update, así que buscamos el actualizado
  if (!doc) return;
  const updated = await this.model.findById(doc._id);
  if (!updated) return;

  const calculated = updated.variants.reduce((acc, variant) => {
    return acc + variant.stockByPickup.reduce((sum, sp) => sum + sp.quantity, 0);
  }, 0);

  if (updated.totalStock !== calculated) {
    await this.model.updateOne({ _id: doc._id }, { totalStock: calculated });
  }
});

module.exports = mongoose.model('Producto', productoSchema);
