// Persistência em arquivo JSON (equivalente server-side do localStorage do front-end).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ARQUIVO = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'db.json');

function hashSenha(senha, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function confereSenha(senha, armazenado) {
  const [salt, hash] = armazenado.split(':');
  const calc = crypto.scryptSync(senha, salt, 64);
  return crypto.timingSafeEqual(calc, Buffer.from(hash, 'hex'));
}

function vazio() {
  return { usuarios: [], materiais: [], favoritos: {}, avaliacoes: {}, mensagens: [] };
}

function carregar() {
  let db;
  try { db = JSON.parse(fs.readFileSync(ARQUIVO, 'utf8')); } catch { db = vazio(); }
  // Seed idempotente do administrador (igual ao seedAdmin() do sessao.js)
  if (!db.usuarios.some((u) => u.tipo === 'Admin')) {
    db.usuarios.push({
      nome: 'Administrador',
      email: 'admin@materialatipico.com',
      senha: hashSenha(process.env.ADMIN_PASSWORD || 'admin123'),
      tipo: 'Admin',
      biografia: 'Conta de administração da plataforma.',
      criadoEm: new Date().toISOString(),
      bloqueada: false,
      notificacoes: { materialAprovado: true, novasAvaliacoes: true, newsletter: false },
    });
  }
  return db;
}

let db = carregar();

function salvar() {
  fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true });
  fs.writeFileSync(ARQUIVO, JSON.stringify(db, null, 2));
}

module.exports = { get db() { return db; }, salvar, hashSenha, confereSenha };
