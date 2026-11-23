const { lerToken } = require('./auth');
const store = require('./db');

// Equivalente a exigirLogin() do sessao.js
function exigirLogin(req, res, next) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  const dados = m && lerToken(m[1]);
  const usuario = dados && store.db.usuarios.find((u) => u.email === dados.email);
  if (!usuario) return res.status(401).json({ erro: 'Não autenticado.' });
  if (usuario.bloqueada) return res.status(403).json({ erro: 'Conta bloqueada pelo administrador.' });
  req.usuario = usuario;
  next();
}

// Equivalente a ehAdmin() do sessao.js
function exigirAdmin(req, res, next) {
  if (req.usuario.tipo !== 'Admin') return res.status(403).json({ erro: 'Restrito a administradores.' });
  next();
}

module.exports = { exigirLogin, exigirAdmin };
