// ── MATERIAIS SALVOS ──
// Depende de sessao.js e materiais-store.js (carregados antes no HTML).

window.onload = function () {
    var usuarioLogado = exigirLogin();
    if (!usuarioLogado) return;

    var Store = window.MaterialAtipicoStore;

    var nomeEl = document.querySelector(".profile-info h1");
    if (nomeEl) nomeEl.textContent = usuarioLogado.nome;

    var bioEl = document.querySelector(".profile-bio");
    if (bioEl) bioEl.textContent = usuarioLogado.biografia || "Adicione uma bio nas configurações.";

    var navNome = document.getElementById("nav-usuario-nome");
    if (navNome) navNome.textContent = usuarioLogado.nome + " · " + usuarioLogado.tipo;

    var meusMateriais = Store.obterMateriaisPorAutor(usuarioLogado.email);
    var totalDownloads = meusMateriais.reduce(function (soma, m) { return soma + (m.downloads || 0); }, 0);
    var avaliacoes = meusMateriais
        .map(function (m) { return Store.obterResumoAvaliacoes(m.id); })
        .filter(function (r) { return r.total > 0; });
    var mediaGeral = avaliacoes.length
        ? avaliacoes.reduce(function (soma, r) { return soma + r.media; }, 0) / avaliacoes.length
        : null;

    var elMateriais = document.getElementById("stat-materiais-postados");
    if (elMateriais) elMateriais.textContent = meusMateriais.length;

    var elDownloads = document.getElementById("stat-downloads");
    if (elDownloads) elDownloads.textContent = totalDownloads;

    var elAvaliacao = document.getElementById("stat-avaliacao");
    if (elAvaliacao) elAvaliacao.textContent = mediaGeral ? mediaGeral.toFixed(1) : "—";

    renderizarCards(Store);
};

function renderizarCards(Store) {
    var grid = document.querySelector(".saved-grid");
    if (!grid) return;

    var favoritos = Store.obterFavoritos();
    var elSalvos = document.getElementById("stat-salvos");
    if (elSalvos) elSalvos.textContent = favoritos.size;

    if (favoritos.size === 0) {
        grid.innerHTML = "<div class='saved-vazio'><i class='fa-regular fa-bookmark'></i><p>Nenhum material salvo ainda.</p><p class='saved-vazio-dica'>Clique no ❤ de qualquer material para salvar aqui.</p></div>";
        return;
    }

    var todos = Store.obterTodosMateriais();
    var materiais = todos.filter(function (m) { return favoritos.has(m.id); });

    grid.innerHTML = "";

    materiais.forEach(function (material) {
        var categoria = material.categoria || "outros";
        var rotuloCategoria = Store.ROTULOS_CATEGORIA[categoria] || "Outros";
        var resumo = Store.obterResumoAvaliacoes(material.id);
        var avaliacaoTexto = resumo.total
            ? "<span class='saved-rating'>⭐ " + resumo.media.toFixed(1) + "</span>"
            : "";

        var card = document.createElement("div");
        card.className = "saved-card";
        card.dataset.id = material.id;

        card.innerHTML =
            "<div class='saved-top saved-top--" + categoria + "'>" +
                "<div class='saved-icon-circle'>" +
                    "<i class='fa-solid fa-book-open'></i>" +
                "</div>" +
            "</div>" +
            "<div class='saved-content'>" +
                "<div class='saved-card-header'>" +
                    "<span class='saved-tag saved-tag--" + categoria + "'>" + Store.escapeHtml(rotuloCategoria) + "</span>" +
                    "<button class='btn-favorito' title='Remover dos salvos'>" +
                        "<i class='fa-solid fa-heart'></i>" +
                    "</button>" +
                "</div>" +
                "<h3>" + Store.escapeHtml(material.titulo) + "</h3>" +
                "<p class='saved-desc'>" + Store.escapeHtml(material.descricao || "") + "</p>" +
                "<div class='saved-meta'>" +
                    "<span><i class='fa-solid fa-download'></i> " + (material.downloads || 0) + " downloads</span>" +
                    avaliacaoTexto +
                "</div>" +
                "<div class='saved-footer'>" +
                    "<span class='saved-author'>" + Store.escapeHtml(material.autor || "Equipe MaterialAtípico") + "</span>" +
                    "<a href='detalhesMaterial.html?id=" + encodeURIComponent(material.id) + "' class='saved-ver-mais'>Ver material →</a>" +
                "</div>" +
            "</div>";

        grid.appendChild(card);
    });

    grid.querySelectorAll(".btn-favorito").forEach(function (botao) {
        botao.onclick = function () {
            var id = botao.closest(".saved-card").dataset.id;
            Store.alternarFavorito(id);
            renderizarCards(Store);
        };
    });
}
