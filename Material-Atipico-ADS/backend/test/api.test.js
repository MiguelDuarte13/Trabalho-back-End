const test = require('node:test');
const assert = require('node:assert');
const os = require('os'); const path = require('path');
process.env.DB_FILE = path.join(os.tmpdir(), `ma-test-${Date.now()}.json`);
const app = require('../src/app');

let base; let server;
test.before(() => new Promise((ok) => { server = app.listen(0, () => { base = `http://localhost:${server.address().port}/api`; ok(); }); }));
test.after(() => server.close());

const call = async (method, url, body, token) => {
  const r = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  const txt = await r.text();
  return { status: r.status, body: txt ? JSON.parse(txt) : null };
};
const DESC = 'x'.repeat(100);

test('fluxo completo: cadastro → envio → aprovação → vitrine → avaliação → favorito', async () => {
  assert.equal((await call('POST', '/auth/cadastro', { nome: 'Maria', email: 'm@e.com', senha: '123', tipo: 'Educador' })).status, 400);
  const c = await call('POST', '/auth/cadastro', { nome: 'Maria', email: 'm@e.com', senha: '123456', tipo: 'Educador' });
  assert.equal(c.status, 201); assert.equal(c.body.senha, undefined);
  assert.equal((await call('POST', '/auth/cadastro', { nome: 'Maria', email: 'm@e.com', senha: '123456', tipo: 'Educador' })).status, 409);
  assert.equal((await call('POST', '/auth/login', { email: 'm@e.com', senha: 'errada' })).status, 401);

  const u = (await call('POST', '/auth/login', { email: 'm@e.com', senha: '123456' })).body.token;
  const a = (await call('POST', '/auth/login', { email: 'admin@materialatipico.com', senha: 'admin123' })).body.token;

  assert.equal((await call('POST', '/materiais', { titulo: 'T', categoria: 'tea', tipo: 'jogo', descricao: 'curta' }, u)).status, 400);
  const m = (await call('POST', '/materiais', { titulo: 'T', categoria: 'tea', tipo: 'jogo', descricao: DESC }, u)).body;
  assert.equal(m.status, 'pendente');

  const publicos = () => call('GET', '/materiais').then((r) => r.body.map((x) => x.id));
  assert.ok(!(await publicos()).includes(m.id), 'pendente não aparece na vitrine');
  assert.equal((await call('GET', `/materiais/${m.id}`)).status, 401);
  assert.equal((await call('PATCH', `/materiais/${m.id}/status`, { status: 'aprovado' }, u)).status, 403);

  assert.equal((await call('PATCH', `/materiais/${m.id}/status`, { status: 'aprovado' }, a)).status, 200);
  assert.ok((await publicos()).includes(m.id));

  const ed = (await call('PUT', `/materiais/${m.id}`, { titulo: 'Novo' }, u)).body;
  assert.equal(ed.status, 'pendente', 'edição volta para pendente');

  await call('PUT', `/materiais/seed-1/avaliacoes`, { estrelas: 5, comentario: 'ótimo' }, u);
  await call('PUT', `/materiais/seed-1/avaliacoes`, { estrelas: 3 }, u);
  const av = (await call('GET', '/materiais/seed-1/avaliacoes')).body;
  assert.equal(av.total, 1); assert.equal(av.media, 3);

  assert.equal((await call('POST', '/favoritos/seed-1', null, u)).body.favorito, true);
  assert.equal((await call('GET', '/favoritos', null, u)).body.length, 1);
  assert.equal((await call('POST', '/favoritos/seed-1', null, u)).body.favorito, false);
});

test('admin: bloqueio de conta, contato e exclusão', async () => {
  const a = (await call('POST', '/auth/login', { email: 'admin@materialatipico.com', senha: 'admin123' })).body.token;
  await call('POST', '/auth/cadastro', { nome: 'Joao', email: 'j@e.com', senha: '123456', tipo: 'Estudante' });
  assert.equal((await call('PATCH', '/admin/usuarios/j@e.com/bloqueio', { bloqueada: true }, a)).status, 200);
  assert.equal((await call('POST', '/auth/login', { email: 'j@e.com', senha: '123456' })).status, 403);

  const msg = (await call('POST', '/contato', { nome: 'X', email: 'x@x.com', mensagem: 'oi' })).body;
  assert.equal((await call('GET', '/admin/mensagens', null, a)).body.length, 1);
  assert.equal((await call('PATCH', `/admin/mensagens/${msg.id}/lida`, null, a)).body.lida, true);
  assert.equal((await call('DELETE', '/admin/usuarios/j@e.com', null, a)).status, 204);
  assert.equal((await call('DELETE', '/materiais/seed-1', null, a)).status, 404);
});
