import express from 'express';
import mongoose from 'mongoose';
import { ItemAddon } from '../../../db/models/item_addon.js';
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
    const [item_addons, totalDocuments] = await Promise.all([
      ItemAddon.find(filterQuery)
        .sort({ [sortBy]: order })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      ItemAddon.countDocuments(filterQuery)
    ]);
    const totalPages = Math.ceil(totalDocuments / limit);
    res.status(200).send(Prettify._JSON({
      item_addons,
      pagination: { totalDocuments, totalPages, currentPage: parseInt(page), perPage: parseInt(limit) }
    }));
  } catch (error) {
    res.status(500).send(Prettify._JSON({ error: error.message }));
  }
}

function handleReadOne (req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send(Prettify._JSON({ error: "ID de complemento de item inválido."}));
  ItemAddon.findById(req.params.id).then(data => {
    if (!data) return res.status(404).send(Prettify._JSON({ error: "Complemento de item não encontrado."}));
    res.status(200).send(Prettify._JSON({ item_addon: data }));
  });
}

router.get('/item_addons', handleRead);

router.get('/item_addons/:id', handleReadOne);

export default router;