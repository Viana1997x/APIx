import express from 'express'
import mongoose from 'mongoose'

import { survivorPerk } from '../../../db/models/perk.js'
import Prettify from '../../../utils/prettify.js'

const router = express.Router()

// --- GET (Ler Todos com Paginação e Ordenação) ---
async function handleRead (req, res) {
  try {
    const { page = 1, limit = 20, sortBy = 'name', order = 'asc' } = req.query;

    const filterQuery = { ...req.query };
    delete filterQuery.page;
    delete filterQuery.limit;
    delete filterQuery.sortBy;
    delete filterQuery.order;

    const [perks, totalDocuments] = await Promise.all([
      survivorPerk.find(filterQuery)
        .populate('character')
        .sort({ [sortBy]: order })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      survivorPerk.countDocuments(filterQuery)
    ]);

    const totalPages = Math.ceil(totalDocuments / limit);

    res.status(200).send(Prettify._JSON({
      perks,
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

// --- GET (Ler Um por ID) ---
function handleReadOne (req, res) {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send(Prettify._JSON({ error: "ID de perk inválido." }))
    }

    survivorPerk.findById(id).populate('character').then(perk => {
        if (!perk) {
            return res.status(404).send(Prettify._JSON({ error: "Perk de sobrevivente não encontrada." }))
        }
        res.status(200).send(Prettify._JSON({ perk: perk }))
    })
    .catch(error => {
        res.status(500).send(Prettify._JSON({ error: error.message }))
    })
}


 
router.get('/survivor_perks', handleRead)

 
router.get('/survivor_perks/:id', handleReadOne)

export default router