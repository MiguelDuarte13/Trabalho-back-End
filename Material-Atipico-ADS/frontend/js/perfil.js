// =====================================================
//  PÁGINA: PERFIL
//  Depende de sessao.js e materiais-store.js (carregados antes no HTML).
// =====================================================

const usuarioLogado = exigirLogin();

if (usuarioLogado) {
  const Store = window.MaterialAtipicoStore;

  document.getElementById("perfil-nome").textContent = usuarioLogado.nome;
  document.getElementById("perfil-subtitulo").textContent = `${usuarioLogado.tipo} · ${usuarioLogado.email}`;
  document.getElementById("perfil-bio").textContent =
    usuarioLogado.biografia || "Esse usuário ainda não escreveu uma bio.";

  const navNome = document.getElementById("nav-usuario-nome");
  if (navNome) navNome.textContent = `${usuarioLogado.nome} · ${usuarioLogado.tipo}`;

  // ── Materiais publicados pelo usuário ──
  const meusMateriais = Store.obterMateriaisPorAutor(usuarioLogado.email);

  const totalDownloads = meusMateriais.reduce((soma, m) => soma + (m.downloads || 0), 0);
  const avaliacoes = meusMateriais
    .map((m) => Store.obterResumoAvaliacoes(m.id))
    .filter((r) => r.total > 0);
  const mediaGeral = avaliacoes.length
    ? avaliacoes.reduce((soma, r) => soma + r.media, 0) / avaliacoes.length
    : null;

  document.getElementById("stat-materiais").textContent = meusMateriais.length;
  document.getElementById("stat-downloads").textContent = formatarNumero(totalDownloads);
  document.getElementById("stat-avaliacao").textContent = mediaGeral ? mediaGeral.toFixed(1) : "—";
  document.getElementById("stat-anos").textContent = textoTempoDeConta(usuarioLogado.criadoEm);

  // ── Grid de materiais publicados ──
  const grid = document.getElementById("perfil-materiais-grid");
  if (grid) {
    grid.innerHTML = meusMateriais.length
      ? meusMateriais.map(criarCardHTML).join("")
      : `<p style="color:#888;">Nenhum material publicado ainda.</p>`;
  }

  function criarCardHTML(material) {
    const rotuloCategoria = Store.ROTULOS_CATEGORIA[material.categoria] || "Outros";
    const resumo = Store.obterResumoAvaliacoes(material.id);
    const avaliacaoTexto = resumo.total ? `⭐ ${resumo.media.toFixed(1)}` : "🆕 Novo";

    return `
      <div class="material-card">
        <div class="material-thumb">
          <div class="thumb-icon">
            <svg width="34" height="34" fill="none" stroke="#7C22D8" stroke-width="2" viewBox="0 0 24 24">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
            </svg>
          </div>
        </div>
        <div class="material-content">
          <span class="tag">${Store.escapeHtml(rotuloCategoria)}</span>
          <h3>${Store.escapeHtml(material.titulo)}</h3>
          <div class="material-footer">
            <div class="downloads">↓ ${material.downloads || 0} Downloads</div>
            <div class="rating">${avaliacaoTexto}</div>
          </div>
        </div>
      </div>`;
  }
}

// Formata números grandes em formato abreviado (1200 → "1.2k", 1000000 → "1M")
function formatarNumero(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

// Transforma a data de cadastro do usuário em "Novo", "Xm" ou "X+" (anos)
function textoTempoDeConta(criadoEmIso) {
  if (!criadoEmIso) return "Novo";
  const diffMs = Date.now() - new Date(criadoEmIso).getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);

  if (diffDias < 30) return "Novo";
  const diffMeses = Math.floor(diffDias / 30);
  if (diffMeses < 12) return `${diffMeses}m`;
  return `${Math.floor(diffMeses / 12)}+`;
}
