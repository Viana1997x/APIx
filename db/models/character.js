import mongoose from 'mongoose'
const Schema = mongoose.Schema

const survivorModel = new Schema({
  name: { type: String, required: true, unique: true },
  URIName: { type: String, required: true, unique: true },
  iconURL: { type: String, required: true },
  link: { type: String, required: true },
  lore: { type: String }
})

const killerModel = new Schema({
  name: { type: String, required: true, unique:true },
  killerName: { type: String, required: true, unique: true },
  URIName: { type: String, required: true, unique: true },
  iconURL: { type: String, required: true },
  link: { type: String, required: true },
  difficulty: {
    type: String,
    enum: ['Easy', 'Moderate', 'Hard', 'Very Hard']
  },
  lore: { type: String },
  power: { type: String }
})

// Adiciona o índice de texto
killerModel.index({ name: 'text', killerName: 'text', power: 'text', lore: 'text' });
survivorModel.index({ name: 'text', lore: 'text' });

export const Survivor = mongoose.model('survivor', survivorModel)
export const Killer = mongoose.model('killer', killerModel)