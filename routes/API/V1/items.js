import express from 'express';
import mongoose from 'mongoose';
import { Item } from '../../../db/models/item.js';
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
    const [items, totalDocuments] = await Promise.all([
      Item.find(filterQuery)
        .sort({ [sortBy]: order })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Item.countDocuments(filterQuery)
    ]);
    const totalPages = Math.ceil(totalDocuments / limit);
    res.status(200).send(Prettify._JSON({
      items,
      pagination: { totalDocuments, totalPages, currentPage: parseInt(page), perPage: parseInt(limit) }
    }));
  } catch (error) {
    res.status(500).send(Prettify._JSON({ error: error.message }));
  }
}

function handleReadOne (req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).send(Prettify._JSON({ error: "ID de item inválido."}));
  Item.findById(req.params.id).then(data => {
    if (!data) return res.status(404).send(Prettify._JSON({ error: "Item não encontrado."}));
    res.status(200).send(Prettify._JSON({ item: data }));
  });
}

router.get('/items', handleRead);

router.get('/items/:id', handleReadOne);

export default router;