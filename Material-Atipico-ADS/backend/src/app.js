const express = require('express');
const routes = require('./routes');

const app = express();
app.use(express.json({ limit: '5mb' })); // capa em dataURL pode ser grande
app.use((req, res, next) => { // CORS simples para o front-end estático
  res.set({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS' });
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.get('/api/saude', (req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ erro: 'Erro interno.' }); });

module.exports = app;
