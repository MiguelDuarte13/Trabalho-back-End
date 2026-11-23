// Constantes e funções de domínio (espelham materiais-store.js)
const CATEGORIAS = ['tea', 'tdah', 'dislexia', 'outros'];
const TIPOS = ['atividade', 'plano', 'jogo', 'visual', 'video'];
const STATUS = ['pendente', 'aprovado', 'rejeitado', 'bloqueado'];
const TIPOS_USUARIO = ['Educador', 'Familiar / Responsável', 'Terapeuta', 'Estudante', 'Outro'];

// Materiais "de fábrica" (idênticos ao MATERIAIS_BASE do front-end)
const MATERIAIS_BASE = [
  { id: 'seed-1', titulo: 'Atividade de Alfabetização para TEA', categoria: 'tea', tipo: 'atividade',
    descricao: 'Atividades visuais e exercícios de associação para alfabetização.', tags: ['alfabetização', 'tea'],
    downloads: 145, avaliacao: 4.5, capa: null, criadoEm: '2026-06-21T16:33:00', autor: 'Equipe MaterialAtípico', status: 'aprovado', base: true },
  { id: 'seed-2', titulo: 'Jogo de Memória Adaptado', categoria: 'tdah', tipo: 'jogo',
    descricao: 'Jogo de memória com elementos visuais para auxiliar concentração.', tags: ['memória', 'concentração', 'tdah'],
    downloads: 98, avaliacao: 4.8, capa: null, criadoEm: '2026-06-21T15:33:00', autor: 'Equipe MaterialAtípico', status: 'aprovado', base: true },
  { id: 'seed-3', titulo: 'Leitura Adaptada para Dislexia', categoria: 'dislexia', tipo: 'visual',
    descricao: 'Textos com fontes especiais e espaçamento adaptado.', tags: ['leitura', 'dislexia'],
    downloads: 203, avaliacao: 4.7, capa: null, criadoEm: '2026-06-21T13:33:00', autor: 'Equipe MaterialAtípico', status: 'aprovado', base: true },
];

const gerarId = (p = 'm') => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// Nunca devolve a senha
const usuarioPublico = ({ senha, ...resto }) => resto;

function validarMaterial(b, { parcial = false } = {}) {
  const erros = [];
  const exige = (c, ok, msg) => { if (!parcial || b[c] !== undefined) if (!ok) erros.push(msg); };
  exige('titulo', typeof b.titulo === 'string' && b.titulo.trim(), 'Título obrigatório.');
  exige('categoria', CATEGORIAS.includes(b.categoria), `Categoria inválida (${CATEGORIAS.join(', ')}).`);
  exige('tipo', TIPOS.includes(b.tipo), `Tipo inválido (${TIPOS.join(', ')}).`);
  exige('descricao', typeof b.descricao === 'string' && b.descricao.trim().length >= 100, 'Descrição precisa ter no mínimo 100 caracteres.');
  return erros;
}

module.exports = { CATEGORIAS, TIPOS, STATUS, TIPOS_USUARIO, MATERIAIS_BASE, gerarId, usuarioPublico, validarMaterial };
