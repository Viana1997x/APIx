import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const itemSchema = new Schema({
  name: { type: String, required: true, unique: true },
  itemType: { type: String, required: true },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'very-rare', 'ultra-rare', 'event', 'promotional']
  },
  description: { type: String },
  descriptionText: { type: String },
  generalDescription: { type: String },
  iconURL: { type: String }
});

// Adiciona o índice de texto para os campos de nome e descrições
itemSchema.index({ name: 'text', descriptionText: 'text', generalDescription: 'text' });

export const Item = mongoose.model('item', itemSchema);