import express from 'express';
import mongoose from 'mongoose';
import { Map } from '../../../db/models/map.js';
import Prettify from '../../../utils/prettify.js';

const router = express.Router();

async function handleRead (req, res) {
  try {
    const { page = 1, limit = 20, sortBy = 'name', order = 'asc' } = req.query;
    const filterQuery = { ...req.query };
    delete filterQuery.page;
    delete filterQuery.limit;
    delete filterQuery.sortBy;
    delete filterQuery.order;

    if (filterQuery.realm && mongoose.Types.ObjectId.isValid(filterQuery.realm)) {
      filterQuery.realm = new mongoose.Types.ObjectId(filterQuery.realm);
    }
    const [maps, totalDocuments] = await Promise.all([
      Map.find(filterQuery)
        .populate('realm')
        .sort({ [sortBy]: order })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Map.countDocuments(filterQuery)
    ]);
    const totalPages = Math.ceil(totalDocuments / limit);
    res.status(200).send(Prettify._JSON({
      maps,
      pagination: { totalDocuments, totalPages, currentPage: parseInt(page), perPage: parseInt(limit) }
    }));
  } catch (error) {
    res.status(500).send(Prettify._JSON({ error: error.message }));
  }
}

function handleReadOne (req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).send(Prettify._JSON({ error: "ID de mapa inválido." }));
  }
  Map.findById(req.params.id).populate('realm').then(data => {
    if (!data) return res.status(404).send(Prettify._JSON({ error: "Mapa não encontrado." }));
    res.status(200).send(Prettify._JSON({ map: data }));
  }).catch(err => res.status(500).send(Prettify._JSON({ error: err.message })));
}

router.get('/maps', handleRead);

router.get('/maps/:id', handleReadOne);

export default router;