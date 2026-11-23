const express = require('express');
const store = require('./db');
const { gerarToken } = require('./auth');
const { exigirLogin, exigirAdmin } = require('./middleware');
const M = require('./models');

const r = express.Router();
const db = () => store.db;
const todosMateriais = () =>
  [...db().materiais, ...M.MATERIAIS_BASE].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
const achar = (id) => todosMateriais().find((m) => m.id === id);
const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

/* ───────────── AUTENTICAÇÃO (auth.js) ───────────── */
r.post('/auth/cadastro', (req, res) => {
  const { nome, email, senha, tipo } = req.body;
  if (!nome || !email || !senha || !tipo) return res.status(400).json({ erro: 'Preencha todos os campos.' });
  if (!emailValido(email)) return res.status(400).json({ erro: 'Digite um email válido.' });
  if (senha.length < 6) return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres.' });
  if (!M.TIPOS_USUARIO.includes(tipo)) return res.status(400).json({ erro: `Tipo inválido (${M.TIPOS_USUARIO.join(', ')}).` });
  if (db().usuarios.some((u) => u.email === email)) return res.status(409).json({ erro: 'Email já cadastrado.' });

  const novo = {
    nome: nome.trim(), email: email.trim(), senha: store.hashSenha(senha), tipo, biografia: '',
    criadoEm: new Date().toISOString(), bloqueada: false,
    notificacoes: { materialAprovado: true, novasAvaliacoes: true, newsletter: false },
  };
  db().usuarios.push(novo);
  store.salvar();
  res.status(201).json(M.usuarioPublico(novo));
});

r.post('/auth/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Preencha email e senha.' });
  const u = db().usuarios.find((x) => x.email === email);
  if (!u || !store.confereSenha(senha, u.senha)) return res.status(401).json({ erro: 'Email ou senha incorretos.' });
  if (u.bloqueada) return res.status(403).json({ erro: 'Conta bloqueada pelo administrador. Entre em contato com o suporte.' });
  res.json({ token: gerarToken(u.email), usuario: M.usuarioPublico(u) });
});

/* ───────────── PERFIL / CONFIGURAÇÕES (configuracoes.js, perfil.js) ───────────── */
r.get('/me', exigirLogin, (req, res) => res.json(M.usuarioPublico(req.usuario)));

r.patch('/me', exigirLogin, (req, res) => {
  const { nome, tipo, biografia, notificacoes } = req.body;
  if (tipo !== undefined && !M.TIPOS_USUARIO.includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido.' });
  const u = req.usuario;
  if (nome !== undefined) u.nome = String(nome).trim();
  if (tipo !== undefined) u.tipo = tipo;
  if (biografia !== undefined) u.biografia = String(biografia);
  if (notificacoes) u.notificacoes = { ...u.notificacoes, ...notificacoes };
  store.salvar();
  res.json(M.usuarioPublico(u));
});

r.put('/me/senha', exigirLogin, (req, res) => {
  const { senhaAtual, novaSenha } = req.body;
  if (!senhaAtual || !novaSenha) return res.status(400).json({ erro: 'Preencha todos os campos de senha.' });
  if (!store.confereSenha(senhaAtual, req.usuario.senha)) return res.status(401).json({ erro: 'Senha atual incorreta.' });
  if (novaSenha.length < 6) return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 6 caracteres.' });
  req.usuario.senha = store.hashSenha(novaSenha);
  store.salvar();
  res.status(204).end();
});

/* ───────────── MATERIAIS (materiais-store.js, criar.js, editarMaterial.js) ───────────── */
// Vitrine pública: só aprovados. ?meus=true → materiais do usuário logado (qualquer status).
r.get('/materiais', (req, res, next) => {
  if (req.query.meus === 'true') return exigirLogin(req, res, () =>
    res.json(todosMateriais().filter((m) => m.autorEmail === req.usuario.email)));
  let lista = todosMateriais().filter((m) => m.status === 'aprovado');
  const { categoria, tipo, q } = req.query;
  if (categoria) lista = lista.filter((m) => m.categoria === categoria);
  if (tipo) lista = lista.filter((m) => m.tipo === tipo);
  if (q) lista = lista.filter((m) => `${m.titulo} ${m.descricao}`.toLowerCase().includes(String(q).toLowerCase()));
  res.json(lista);
});

// Fila de revisão (adminrevisao.js / admin.js): todos os materiais enviados por usuários
r.get('/admin/materiais', exigirLogin, exigirAdmin, (req, res) => {
  const { status } = req.query;
  res.json(db().materiais.filter((m) => !status || m.status === status));
});

r.get('/materiais/:id', (req, res) => {
  const m = achar(req.params.id);
  if (!m) return res.status(404).json({ erro: 'Material não encontrado.' });
  if (m.status !== 'aprovado') {
    // pendente/rejeitado/bloqueado: só o dono ou o admin enxergam
    return exigirLogin(req, res, () => {
      if (req.usuario.tipo !== 'Admin' && req.usuario.email !== m.autorEmail)
        return res.status(403).json({ erro: 'Material indisponível.' });
      res.json(m);
    });
  }
  res.json(m);
});

r.post('/materiais', exigirLogin, (req, res) => {
  const erros = M.validarMaterial(req.body);
  if (erros.length) return res.status(400).json({ erros });
  const b = req.body;
  const material = {
    id: M.gerarId('m'), titulo: b.titulo.trim(), categoria: b.categoria, tipo: b.tipo, descricao: b.descricao.trim(),
    tags: Array.isArray(b.tags) ? b.tags : [], downloads: 0, avaliacao: 0, capa: b.capa || null,
    arquivoNome: b.arquivoNome || null, criadoEm: new Date().toISOString(),
    autor: req.usuario.nome, autorEmail: req.usuario.email, status: 'pendente', // sempre entra na fila de aprovação
  };
  db().materiais.unshift(material);
  store.salvar();
  res.status(201).json(material);
});

// Editar volta o material para "pendente" (editarMaterialStore)
r.put('/materiais/:id', exigirLogin, (req, res) => {
  const i = db().materiais.findIndex((m) => m.id === req.params.id);
  if (i === -1) return res.status(404).json({ erro: 'Material não encontrado.' });
  const atual = db().materiais[i];
  if (atual.autorEmail !== req.usuario.email && req.usuario.tipo !== 'Admin')
    return res.status(403).json({ erro: 'Sem permissão para editar este material.' });
  const erros = M.validarMaterial(req.body, { parcial: true });
  if (erros.length) return res.status(400).json({ erros });
  const { titulo, categoria, tipo, descricao, tags, capa, arquivoNome } = req.body;
  const campos = Object.fromEntries(Object.entries({ titulo, categoria, tipo, descricao, tags, capa, arquivoNome })
    .filter(([, v]) => v !== undefined));
  db().materiais[i] = { ...atual, ...campos, status: 'pendente', editadoEm: new Date().toISOString() };
  store.salvar();
  res.json(db().materiais[i]);
});

// Moderação (admin): aprovar | rejeitar | bloquear | desbloquear(=aprovado)
r.patch('/materiais/:id/status', exigirLogin, exigirAdmin, (req, res) => {
  if (!M.STATUS.includes(req.body.status)) return res.status(400).json({ erro: `Status inválido (${M.STATUS.join(', ')}).` });
  const m = db().materiais.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ erro: 'Material não encontrado.' });
  m.status = req.body.status;
  store.salvar();
  res.json(m);
});

r.delete('/materiais/:id', exigirLogin, exigirAdmin, (req, res) => {
  const antes = db().materiais.length;
  db().materiais = db().materiais.filter((m) => m.id !== req.params.id);
  if (db().materiais.length === antes) return res.status(404).json({ erro: 'Material não encontrado (materiais base não podem ser excluídos).' });
  store.salvar();
  res.status(204).end();
});

/* ───────────── FAVORITOS (materiais-salvos.js) ───────────── */
r.get('/favoritos', exigirLogin, (req, res) => {
  const ids = new Set(db().favoritos[req.usuario.email] || []);
  res.json(todosMateriais().filter((m) => ids.has(m.id)));
});

r.post('/favoritos/:id', exigirLogin, (req, res) => { // alterna (alternarFavorito)
  if (!achar(req.params.id)) return res.status(404).json({ erro: 'Material não encontrado.' });
  const set = new Set(db().favoritos[req.usuario.email] || []);
  set.has(req.params.id) ? set.delete(req.params.id) : set.add(req.params.id);
  db().favoritos[req.usuario.email] = [...set];
  store.salvar();
  res.json({ favorito: set.has(req.params.id) });
});

/* ───────────── AVALIAÇÕES (detalhesMaterial.js) ───────────── */
r.get('/materiais/:id/avaliacoes', (req, res) => {
  const lista = db().avaliacoes[req.params.id] || [];
  const distribuicao = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  lista.forEach((a) => { distribuicao[a.estrelas]++; });
  const total = lista.length;
  res.json({ media: total ? lista.reduce((s, a) => s + a.estrelas, 0) / total : 0, total, distribuicao, avaliacoes: lista });
});

// 1 avaliação por usuário/material: a nova substitui a antiga (salvarAvaliacao)
r.put('/materiais/:id/avaliacoes', exigirLogin, (req, res) => {
  if (!achar(req.params.id)) return res.status(404).json({ erro: 'Material não encontrado.' });
  const estrelas = Math.min(5, Math.max(1, Math.round(Number(req.body.estrelas))));
  if (Number.isNaN(estrelas)) return res.status(400).json({ erro: 'Informe estrelas de 1 a 5.' });
  const nova = { usuarioId: req.usuario.email, estrelas, comentario: String(req.body.comentario || '').trim(), criadoEm: new Date().toISOString() };
  const resto = (db().avaliacoes[req.params.id] || []).filter((a) => a.usuarioId !== req.usuario.email);
  db().avaliacoes[req.params.id] = [nova, ...resto];
  store.salvar();
  res.json(nova);
});

/* ───────────── CONTATO (contato.js / admin.js) ───────────── */
r.post('/contato', (req, res) => {
  const { nome, email, assunto, mensagem } = req.body;
  if (!nome || !email || !mensagem) return res.status(400).json({ erro: 'Preencha nome, email e mensagem.' });
  const msg = { id: M.gerarId('c'), nome, email, assunto: assunto || '', mensagem, criadoEm: new Date().toISOString(), lida: false };
  db().mensagens.push(msg);
  store.salvar();
  res.status(201).json(msg);
});

r.get('/admin/mensagens', exigirLogin, exigirAdmin, (req, res) =>
  res.json([...db().mensagens].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))));

r.patch('/admin/mensagens/:id/lida', exigirLogin, exigirAdmin, (req, res) => {
  const m = db().mensagens.find((x) => x.id === req.params.id);
  if (!m) return res.status(404).json({ erro: 'Mensagem não encontrada.' });
  m.lida = true;
  store.salvar();
  res.json(m);
});

/* ───────────── GESTÃO DE USUÁRIOS (admin.js, aba Usuários) ───────────── */
r.get('/admin/usuarios', exigirLogin, exigirAdmin, (req, res) =>
  res.json(db().usuarios.map((u) => ({
    ...M.usuarioPublico(u),
    totalMateriais: todosMateriais().filter((m) => m.autorEmail === u.email).length,
  }))));

r.patch('/admin/usuarios/:email/bloqueio', exigirLogin, exigirAdmin, (req, res) => {
  const u = db().usuarios.find((x) => x.email === req.params.email);
  if (!u) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  if (u.email === req.usuario.email) return res.status(400).json({ erro: 'Você não pode bloquear a própria conta.' });
  u.bloqueada = !!req.body.bloqueada;
  store.salvar();
  res.json(M.usuarioPublico(u));
});

r.delete('/admin/usuarios/:email', exigirLogin, exigirAdmin, (req, res) => {
  if (req.params.email === req.usuario.email) return res.status(400).json({ erro: 'Você não pode excluir a própria conta.' });
  const antes = db().usuarios.length;
  db().usuarios = db().usuarios.filter((u) => u.email !== req.params.email);
  if (db().usuarios.length === antes) return res.status(404).json({ erro: 'Usuário não encontrado.' });
  store.salvar();
  res.status(204).end();
});

module.exports = r;
