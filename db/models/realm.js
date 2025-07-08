// db/models/realm.js
import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const realmSchema = new Schema({
  name: { type: String, required: true, unique: true },
  iconURL: { type: String }
});

export const Realm = mongoose.model('realm', realmSchema);