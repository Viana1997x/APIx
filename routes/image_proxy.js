// routes/imageProxy.js

import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/', async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).send('URL da imagem é obrigatória.');
  }

  // Medida de segurança: Garante que estamos buscando apenas imagens da wikia
  if (!imageUrl.startsWith('https://static.wikia.nocookie.net')) {
      return res.status(403).send('Domínio não autorizado para proxy.');
  }

  try {
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream' // MUITO IMPORTANTE: para lidar com dados binários (imagens)
    });

    // Repassa os headers da imagem original (como Content-Type) para a nossa resposta
    res.setHeader('Content-Type', response.headers['content-type']);

    // Envia o stream da imagem diretamente como resposta
    response.data.pipe(res);

  } catch (error) {
    console.error('Erro no proxy de imagem:', error.message);
    res.status(500).send('Falha ao buscar a imagem.');
  }
});

export default router;