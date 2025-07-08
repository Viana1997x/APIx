import express from 'express'
import mongoose from 'mongoose'

import { Killer } from '../../../db/models/character.js'
import Prettify from '../../../utils/prettify.js'

const router = express.Router()

// --- GET (Ler Todos com Paginação e Ordenação) ---
async function handleRead (req, res) {
  try {
    // 1. Extrai os parâmetros da URL, com valores padrão
    const { page = 1, limit = 20, sortBy = 'name', order = 'asc' } = req.query;

    // 2. Cria um objeto de filtro com os outros parâmetros da query
    const filterQuery = { ...req.query };
    delete filterQuery.page;
    delete filterQuery.limit;
    delete filterQuery.sortBy;
    delete filterQuery.order;

    // 3. Executa duas consultas ao mesmo tempo para eficiência
    const [killers, totalDocuments] = await Promise.all([
      // Primeira consulta: busca os dados da página atual
      Killer.find(filterQuery)
        .sort({ [sortBy]: order })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit)),
      // Segunda consulta: conta o total de documentos que correspondem ao filtro
      Killer.countDocuments(filterQuery)
    ]);

    // 4. Calcula os metadados da paginação
    const totalPages = Math.ceil(totalDocuments / limit);

    // 5. Envia a resposta completa com dados e metadados
    res.status(200).send(Prettify._JSON({
      killers,
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
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send(Prettify._JSON({ error: "ID de assassino inválido." }));
  }

  Killer.findById(id).then(killer => {
    if (!killer) {
      return res.status(404).send(Prettify._JSON({ error: "Assassino não encontrado." }));
    }
    res.status(200).send(Prettify._JSON({ killer: killer }));
  })
  .catch(error => {
    res.status(500).send(Prettify._JSON({ error: error.message }));
  });
}

router.get('/killers', handleRead)

router.get('/killers/:id', handleReadOne)

export default router