import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const mapSchema = new Schema({
  name: { type: String, required: true, unique: true },
  // Novo campo para agrupar variações (ex: "Torre de Carvão")
  mapGroupName: { type: String, required: true }, 
  imageURLs: [{ type: String }],
  realm: { type: Schema.Types.ObjectId, ref: 'realm', required: true }
});

export const Map = mongoose.model('map', mapSchema);