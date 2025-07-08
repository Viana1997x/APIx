import express from 'express'
import mongoose from 'mongoose'

import { Survivor } from '../../../db/models/character.js'
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
    const [survivors, totalDocuments] = await Promise.all([
      Survivor.find(filterQuery)
        .sort({ [sortBy]: order })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      Survivor.countDocuments(filterQuery)
    ]);
    const totalPages = Math.ceil(totalDocuments / limit);
    res.status(200).send(Prettify._JSON({
      survivors,
      pagination: {
        totalDocuments,
        totalPages,
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    }));
  } catch (error) {
    res.status(500).send(Prettify._JSON({ error: error.message }));
  }
}

function handleReadOne (req, res) {
  const { id } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send(Prettify._JSON({ error: "ID de sobrevivente inválido." }))
  }
  Survivor.findById(id).then(survivor => {
    if (!survivor) {
      return res.status(404).send(Prettify._JSON({ error: "Sobrevivente não encontrado." }))
    }
    res.status(200).send(Prettify._JSON({ survivor: survivor }))
  })
  .catch(error => {
    res.status(500).send(Prettify._JSON({ error: error.message }))
  })
}

router.get('/survivors', handleRead)

router.get('/survivors/:id', handleReadOne)

export default router