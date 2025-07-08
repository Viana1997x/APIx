// const perkJobs = require('./jobs/perk_jobs')
// const schedule = require('node-schedule')
import DBI from './db/db.js'
import express from 'express'
import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import { statsModel } from './db/models/stats.js'
import mongoSanitize from 'express-mongo-sanitize'
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import imageProxyRouter from './routes/image_proxy.js';
import jobsRouter from './routes/jobs.js';

// Use router provided by the routes in V1
import V1Router from './routes/API/V1.js'
/// ///////////////////////////

/// ///////////////////////////
//          Stats           //
import statsRouter from './routes/stats.js'

const app = express()
const port = process.env.PORT || 1987

// Open connection if not already connected
DBI.initConnection()

app.use(bodyParser.urlencoded({ extended: true }))

// Allow Cross-origin
app.use(cors())
app.use('/api/jobs', jobsRouter);

app.use('/api/image-proxy', imageProxyRouter);

// Use Express compression
app.use(compression())

// Sanitize all user input for MongoDB
// Removes $ and . characters from user-supplied input in the following places:
// - req.body
// - req.params
// - req.headers
// - req.query
app.use(mongoSanitize())

// --- NOVA SEÇÃO: CONFIGURAÇÃO DO SWAGGER ---

// Define as opções para o swagger-jsdoc
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Dead by Daylight API',
      version: '1.0.0',
      description: 'Uma API completa com dados do jogo Dead by Daylight, raspados da Fandom Wiki.',
      contact: {
        name: 'Techial',
        url: 'https://github.com/Techial/DBD-Database'
      },
    },
    servers: [
      {
        url: 'http://localhost:1987' // Altere para a URL do seu servidor de produção se necessário
      }
    ]
  },
  // Caminho para os arquivos que contêm a documentação da API (suas rotas)
  apis: ['./routes/API/V1/*.js']
};

const swaggerDocs = swaggerJSDoc(swaggerOptions);
// Cria uma nova rota '/api-docs' para servir a documentação interativa
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- FIM DA SEÇÃO DO SWAGGER ---

// Middleware for setting header response to JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json') // Set header response to JSON, to prevent it from trying to render HTML in data
  return next() // Goto next middleware / route
})

// Middleware for recording number of queries handled
// by application
//
// NO INFORMATION ABOUT USER IS STORED
app.use(async (req, res, next) => {
  const path = req.path // Record path now in case next Middleware changs it somehow
  next() // Go to next Middleware

  // Record Global stats
  statsModel.updateOne({ name: '*' }, {
    $inc: { queries: 1 },
    lastUpdated: new Date() // new Date() instead of Date.now() so it will work with toLocaleString()
  }, { upsert: true }).exec()

  if (path === '*') { return } // Don't record local stats for Global

  // Record endpoint stats
  statsModel.updateOne({ name: path }, {
    $inc: { queries: 1 },
    lastUpdated: new Date() // new Date() instead of Date.now() so it will work with toLocaleString()
  }, { upsert: true }).exec()
})

/// ///////////////////////////
//          V1 API          //
app.use(
  V1Router
)
app.use(
  statsRouter() // Query Stats
)

// Open listening port for Express
app.listen(port, () => {
  console.log(`Webserver started on port ${port}`)
})
