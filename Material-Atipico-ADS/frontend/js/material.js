/* 
   material.js
   (material.html):
*/

document.addEventListener("DOMContentLoaded", () => {
  const usuarioLogado = exigirLogin(); // sessao.js — redireciona pra login.html se não logado
  if (!usuarioLogado) return;

  const navNome = document.getElementById("nav-usuario-nome");
  if (navNome) navNome.textContent = `${usuarioLogado.nome} · ${usuarioLogado.tipo}`;

  const Store = window.MaterialAtipicoStore;
  if (!Store) {
    console.error("materiais-store.js precisa ser carregado antes de material.js");
    return;
  }

  const grid = document.getElementById("materials-grid");
  const resultadosTexto = document.getElementById("resultados-texto");
  const campoBusca = document.getElementById("campo-busca");
  const filtroCategoria = document.getElementById("filtro-categoria");
  const filtroTipo = document.getElementById("filtro-tipo");
  const cartoesCategoria = document.querySelectorAll(".category-card");

  if (!grid) return;

  const estado = {
    busca: "",
    categoria: "",
    tipo: "",
  };

  // Cards de categoria também funcionam como filtro
  cartoesCategoria.forEach((cartao) => {
    cartao.setAttribute("role", "button");
    cartao.setAttribute("tabindex", "0");
    cartao.addEventListener("click", () => alternarCategoria(cartao.dataset.categoria));
    cartao.addEventListener("keydown", (evento) => {
      if (evento.key === "Enter" || evento.key === " ") {
        evento.preventDefault();
        alternarCategoria(cartao.dataset.categoria);
      }
    });
  });

  function alternarCategoria(categoria) {
    // Clicar de novo no card já ativo limpa o filtro de categoria.
    estado.categoria = estado.categoria === categoria ? "" : categoria;
    if (filtroCategoria) filtroCategoria.value = estado.categoria;
    renderizar();
  }

  //  Busca e selects 
  if (campoBusca) {
    campoBusca.addEventListener("input", (evento) => {
      estado.busca = evento.target.value;
      renderizar();
    });
  }

  if (filtroCategoria) {
    filtroCategoria.addEventListener("change", (evento) => {
      estado.categoria = evento.target.value;
      renderizar();
    });
  }

  if (filtroTipo) {
    filtroTipo.addEventListener("change", (evento) => {
      estado.tipo = evento.target.value;
      renderizar();
    });
  }

  //  Clique no coração 
  grid.addEventListener("click", (evento) => {
    const botao = evento.target.closest(".favorite-btn");
    if (!botao) return;

    evento.preventDefault();
    evento.stopPropagation();

    const id = botao.dataset.id;
    const favoritado = Store.alternarFavorito(id);

    botao.classList.toggle("is-active", favoritado);
    botao.setAttribute("aria-pressed", String(favoritado));
    botao.setAttribute("aria-label", favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos");

    const icone = botao.querySelector("i");
    icone.classList.toggle("fa-solid", favoritado);
    icone.classList.toggle("fa-regular", !favoritado);
  });

  // Montagem do HTML de cada card 
  function criarCardHTML(material) {
    const favorito = Store.ehFavorito(material.id);
    const rotuloCategoria = Store.ROTULOS_CATEGORIA[material.categoria] || "Outros";

    const topo = material.capa
      ? `<div class="material-top" style="background-image:url('${material.capa}')"></div>`
      : `<div class="material-top"><div class="material-icon">📖</div></div>`;

    const avaliacao = material.avaliacao
      ? `⭐ ${material.avaliacao}`
      : `🆕 Novo`;

    return `
      <div class="material-card" data-id="${material.id}">
        ${topo}
        <div class="material-content">
          <div class="material-card-header">
            <span class="tag tag--${material.categoria}">${Store.escapeHtml(rotuloCategoria)}</span>
            <button
              type="button"
              class="favorite-btn${favorito ? " is-active" : ""}"
              data-id="${material.id}"
              aria-pressed="${favorito}"
              aria-label="${favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}"
            >
              <i class="fa-${favorito ? "solid" : "regular"} fa-heart"></i>
            </button>
          </div>

          <h3 class="material-title">${Store.escapeHtml(material.titulo)}</h3>

          <p class="material-desc">${Store.escapeHtml(material.descricao)}</p>

          <div class="material-info">
            <span>⬇ ${material.downloads || 0} downloads</span>
            <span>${avaliacao}</span>
          </div>

          <div class="material-footer">
            <span class="time">${Store.tempoRelativo(material.criadoEm)}</span>
            <a href="detalhesMaterial.html?id=${encodeURIComponent(material.id)}" class="view-more">
              Ver mais →
            </a>
          </div>
        </div>
      </div>`;
  }

  // Atualiza a contagem real de itens em cada card de categoria
  function atualizarContadoresCategoria(todosMateriais) {
    cartoesCategoria.forEach((cartao) => {
      const categoria = cartao.dataset.categoria;
      const span = cartao.querySelector(".items");
      if (!span) return;
      const quantidade = todosMateriais.filter((m) => m.categoria === categoria).length;
      span.textContent = `${quantidade} ${quantidade === 1 ? "item" : "itens"}`;
    });
  }

  function atualizarEstadoAtivoCategoria() {
    cartoesCategoria.forEach((cartao) => {
      cartao.classList.toggle("active", cartao.dataset.categoria === estado.categoria);
    });
  }

  // Filtro + render principal 
  function renderizar() {
    const todosMateriais = Store.obterMateriaisPublicos();
    const termo = estado.busca.trim().toLowerCase();

    const filtrados = todosMateriais.filter((material) => {
      const correspondeCategoria = !estado.categoria || material.categoria === estado.categoria;
      const correspondeTipo = !estado.tipo || material.tipo === estado.tipo;
      const correspondeBusca =
        !termo ||
        material.titulo.toLowerCase().includes(termo) ||
        material.descricao.toLowerCase().includes(termo) ||
        (material.tags || []).some((tag) => tag.toLowerCase().includes(termo));

      return correspondeCategoria && correspondeTipo && correspondeBusca;
    });

    grid.innerHTML = filtrados.length
      ? filtrados.map(criarCardHTML).join("")
      : `<div class="empty-state">
           <i class="fa-regular fa-folder-open"></i>
           <p>Nenhum material encontrado com esses filtros.</p>
         </div>`;

    if (resultadosTexto) {
      resultadosTexto.textContent = `${filtrados.length} ${
        filtrados.length === 1 ? "material encontrado" : "materiais encontrados"
      }`;
    }

    atualizarContadoresCategoria(todosMateriais);
    atualizarEstadoAtivoCategoria();
  }

  renderizar();

  // Mantém os cards em dia caso o usuário crie um material em outra aba.
  window.addEventListener("storage", renderizar);
});
