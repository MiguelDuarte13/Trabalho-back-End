/*
  sessao.js
  Fonte única de verdade para usuários e sessão.
  Usado por: auth.js (login.html) e por toda página logada
  (home-logado, criar, meus-materiais, perfil, configuracoes, material,
  detalhesMaterial, materiais-salvos).
*/

const CHAVE_USUARIOS = 'ma_usuarios';
const CHAVE_LOGADO   = 'ma_usuario_logado';

// Lista completa de usuários cadastrados (localStorage = persiste entre sessões)
function getUsuarios() {
  return JSON.parse(localStorage.getItem(CHAVE_USUARIOS) || '[]');
}

function salvarUsuarios(lista) {
  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(lista));
}

// Usuário da aba atual (sessionStorage = some ao fechar a aba / trocar de conta)
function obterUsuarioLogado() {
  return JSON.parse(sessionStorage.getItem(CHAVE_LOGADO) || 'null');
}

function salvarUsuarioLogado(usuario) {
  sessionStorage.setItem(CHAVE_LOGADO, JSON.stringify(usuario));
}

// Bloqueia a página se não houver usuário logado; redireciona para login.
function exigirLogin() {
  const usuario = obterUsuarioLogado();
  if (!usuario) {
    window.location.href = 'login.html';
    return null;
  }
  return usuario;
}

// Atualiza campos do usuário logado tanto na sessão atual quanto na lista
// persistida (ma_usuarios), casando pelo email.
function atualizarUsuarioLogado(patch) {
  const atual = obterUsuarioLogado();
  if (!atual) return null;

  const usuarios = getUsuarios();
  const indice = usuarios.findIndex((u) => u.email === atual.email);
  if (indice !== -1) {
    usuarios[indice] = { ...usuarios[indice], ...patch };
    salvarUsuarios(usuarios);
  }

  const novoLogado = { ...atual, ...patch };
  delete novoLogado.senha; // sessão nunca guarda senha
  salvarUsuarioLogado(novoLogado);
  return novoLogado;
}

function logout() {
  sessionStorage.removeItem(CHAVE_LOGADO);
  window.location.href = 'login.html';
}

function ehAdmin() {
  const usuario = obterUsuarioLogado();
  return !!usuario && usuario.tipo === 'Admin';
}

// Garante que sempre exista uma conta admin pra acessar o painel de aprovação.
// Idempotente: só cria se ainda não tiver nenhum usuário com tipo 'Admin'.
function seedAdmin() {
  const usuarios = getUsuarios();
  if (usuarios.some((u) => u.tipo === 'Admin')) return;

  usuarios.push({
    nome: 'Administrador',
    email: 'admin@materialatipico.com',
    senha: 'admin123',
    tipo: 'Admin',
    biografia: 'Conta de administração da plataforma.',
    criadoEm: new Date().toISOString(),
    notificacoes: { materialAprovado: true, novasAvaliacoes: true, newsletter: false },
  });
  salvarUsuarios(usuarios);
}
seedAdmin();

// Esconde o item "Admin" da sidebar pra quem não é admin (roda em toda página logada).
document.addEventListener('DOMContentLoaded', () => {
  const linkAdmin = document.getElementById('sidebar-admin-link');
  if (linkAdmin && !ehAdmin()) linkAdmin.remove();
});
