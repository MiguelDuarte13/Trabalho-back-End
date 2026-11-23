const usuarioLogado = exigirLogin(); // sessao.js — redireciona pra login.html se não logado

if (usuarioLogado) {

const Store = window.MaterialAtipicoStore;

// ── Saudação com o nome real do usuário ──
const heroSaudacao = document.getElementById('hero-saudacao');
if (heroSaudacao) heroSaudacao.textContent = `Olá, ${usuarioLogado.nome}!`;

const navNome = document.getElementById('nav-usuario-nome');
if (navNome) navNome.textContent = `${usuarioLogado.nome} · ${usuarioLogado.tipo}`;

// ── Grid de materiais reais (puxados do materiais-store) ──
const grid = document.getElementById('materiais-grid');
const contagemEl = document.getElementById('materiais-contagem');

const navSearch      = document.querySelector('.nav-search-input');
const sectionSearch  = document.querySelector('.search-input-wrap input');
const categorySelect = document.getElementById('filtro-categoria');
const typeSelect      = document.getElementById('filtro-tipo');

function criarCardHTML(material) {
  const rotuloCategoria = Store.ROTULOS_CATEGORIA[material.categoria] || 'Outros';
  return `
    <div class="material-card">
      <div class="material-thumb">
        <i class="fa-solid fa-book-open" style="font-size: 40px; color: #7C3AED;"></i>
      </div>
      <div class="material-body">
        <span class="material-tag tag-${material.categoria}">${Store.escapeHtml(rotuloCategoria)}</span>
        <h3>${Store.escapeHtml(material.titulo)}</h3>
        <p>${Store.escapeHtml(material.descricao)}</p>
        <div class="material-footer">
          <span class="material-time">${Store.tempoRelativo(material.criadoEm)}</span>
          <a href="detalhesMaterial.html?id=${encodeURIComponent(material.id)}" class="ver-mais">Ver mais →</a>
        </div>
      </div>
    </div>`;
}

function filtrarCards() {
  if (!grid) return;

  const texto     = (navSearch?.value || sectionSearch?.value || '').toLowerCase().trim();
  const categoria = categorySelect?.value || '';
  const tipo      = typeSelect?.value || '';

  const todos = Store.obterMateriaisPublicos();
  const filtrados = todos.filter((material) => {
    const okTexto     = !texto || material.titulo.toLowerCase().includes(texto) || material.descricao.toLowerCase().includes(texto);
    const okCategoria = !categoria || material.categoria === categoria;
    const okTipo      = !tipo || material.tipo === tipo;
    return okTexto && okCategoria && okTipo;
  });

  const destaque = filtrados.slice(0, 6);
  grid.innerHTML = destaque.length
    ? destaque.map(criarCardHTML).join('')
    : `<p style="color:#888;">Nenhum material encontrado.</p>`;

  if (contagemEl) {
    contagemEl.textContent = `${filtrados.length} ${filtrados.length === 1 ? 'material encontrado' : 'materiais encontrados'}`;
  }
}

navSearch?.addEventListener('input', filtrarCards);
sectionSearch?.addEventListener('input', filtrarCards);
categorySelect?.addEventListener('change', filtrarCards);
typeSelect?.addEventListener('change', filtrarCards);

filtrarCards();

}
