import express from 'express'
import mongoose from 'mongoose'

import { Addon } from '../../../db/models/addon.js'
import Prettify from '../../../utils/prettify.js'

const router = express.Router()

async function handleRead (req, res) {
  try {
    const { page = 1, limit = 20, sortBy = 'name', order = 'asc' } = req.query;
    const filterQuery = { ...req.query };
    delete filterQuery.page;
    delete filterQuery.limit;
    delete filterQuery.sortBy;
    delete filterQuery.order;
    
    if (filterQuery.killer && mongoose.Types.ObjectId.isValid(filterQuery.killer)) {
      filterQuery.killer = new mongoose.Types.ObjectId(filterQuery.killer);
    }
    const [addons, totalDocuments] = await Promise.all([
      Addon.find(filterQuery)
        .populate('killer')
        .sort({ [sortBy]: order })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Addon.countDocuments(filterQuery)
    ]);
    const totalPages = Math.ceil(totalDocuments / limit);
    res.status(200).send(Prettify._JSON({
      addons,
      pagination: { totalDocuments, totalPages, currentPage: parseInt(page), perPage: parseInt(limit) }
    }));
  } catch (error) {
    res.status(500).send(Prettify._JSON({ error: error.message }));
  }
}

function handleReadOne (req, res) {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send(Prettify._JSON({ error: "ID de complemento inválido." }))
    }
    Addon.findById(id).populate('killer').then(addon => {
        if (!addon) {
            return res.status(404).send(Prettify._JSON({ error: "Complemento não encontrado." }))
        }
        res.status(200).send(Prettify._JSON({ addon: addon }))
    })
    .catch(error => {
        res.status(500).send(Prettify._JSON({ error: error.message }))
    })
}

router.get('/addons', handleRead)

router.get('/addons/:id', handleReadOne)

export default router