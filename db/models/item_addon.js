import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const itemAddonSchema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  descriptionText: { type: String, required: true },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'very-rare', 'ultra-rare', 'event', 'promotional']
  },
  iconURL: { type: String },
  itemType: { type: String, required: true } 
});

// Adiciona o índice de texto para os campos de nome e descrição
itemAddonSchema.index({ name: 'text', descriptionText: 'text' });

export const ItemAddon = mongoose.model('itemAddon', itemAddonSchema);