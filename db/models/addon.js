import mongoose from 'mongoose'
const Schema = mongoose.Schema

const addonModel = new Schema({
  name: { type: String, required: true },
  URIName: { type: String, required: true, unique: true },
  iconURL: { type: String, required: true },
  description: { type: String, required: true },
  descriptionText: { type: String, required: true },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'very-rare', 'ultra-rare', 'event', 'promotional']
  },
  killer: { type: Schema.Types.ObjectId, ref: 'killer', required: true }
})

// Adiciona o índice de texto para os campos de nome e descrição
addonModel.index({ name: 'text', descriptionText: 'text' });

export const Addon = mongoose.model('addon', addonModel)