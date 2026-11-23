document.addEventListener("DOMContentLoaded", () => {

    const usuarioLogado = exigirLogin(); // sessao.js — redireciona pra login.html se não logado
    if (!usuarioLogado) return;

    const Store = window.MaterialAtipicoStore;

    const nomePerfil = document.querySelector(".profile-info h1");
    if (nomePerfil) nomePerfil.textContent = usuarioLogado.nome;

    const bioPerfil = document.querySelector(".profile-bio");
    if (bioPerfil) bioPerfil.textContent = usuarioLogado.biografia || "Adicione uma bio nas configurações.";

    const navNome = document.getElementById("nav-usuario-nome");
    if (navNome) navNome.textContent = `${usuarioLogado.nome} · ${usuarioLogado.tipo}`;

    let meusMateriais = Store.obterMateriaisPorAutor(usuarioLogado.email);
    const favoritos = Store.obterFavoritos();

    // ── Estatísticas reais ──
    const totalDownloads = meusMateriais.reduce((soma, m) => soma + (m.downloads || 0), 0);
    const avaliacoes = meusMateriais
        .map((m) => Store.obterResumoAvaliacoes(m.id))
        .filter((r) => r.total > 0);
    const mediaGeral = avaliacoes.length
        ? avaliacoes.reduce((soma, r) => soma + r.media, 0) / avaliacoes.length
        : null;

    const elMateriais = document.getElementById("stat-materiais-postados");
    if (elMateriais) elMateriais.textContent = meusMateriais.length;

    const elDownloads = document.getElementById("stat-downloads");
    if (elDownloads) elDownloads.textContent = totalDownloads;

    const elAvaliacao = document.getElementById("stat-avaliacao");
    if (elAvaliacao) elAvaliacao.textContent = mediaGeral ? mediaGeral.toFixed(1) : "—";

    const elSalvos = document.getElementById("stat-salvos");
    if (elSalvos) elSalvos.textContent = favoritos.size;

    // ── Lista de materiais postados pelo usuário ──
    const lista = document.getElementById("materials-list");
    const rotulosStatus = { aprovado: "Aprovado", pendente: "Pendente", rejeitado: "Reprovado", bloqueado: "Bloqueado" };

    function renderizarLista() {
        if (!lista) return;

        meusMateriais = Store.obterMateriaisPorAutor(usuarioLogado.email);

        if (!meusMateriais.length) {
            lista.innerHTML = `<p style="color:#888;">Você ainda não postou nenhum material. <a href="criar.html">Crie o primeiro!</a></p>`;
            return;
        }

        lista.innerHTML = meusMateriais
            .map((material) => {
                const rotuloCategoria = Store.ROTULOS_CATEGORIA[material.categoria] || "Outros";
                const resumo = Store.obterResumoAvaliacoes(material.id);
                const status = material.status || "pendente";
                const avaliacaoTexto = resumo.total
                    ? `<span><i class="fa-solid fa-star"></i> ${resumo.media.toFixed(1)}</span>`
                    : `<span><i class="fa-regular fa-star"></i> Sem avaliações</span>`;

                // Travar/destravar só faz sentido pra material aprovado (já visível ao público)
                // ou já travado (pra poder reverter). Pendente/rejeitado nem aparecem na vitrine.
                let botaoTravar = "";
                if (status === "aprovado") {
                    botaoTravar = `<button class="btn-action btn-action--travar" data-acao="travar">Travar material</button>`;
                } else if (status === "bloqueado") {
                    botaoTravar = `<button class="btn-action btn-action--destravar" data-acao="destravar">Destravar material</button>`;
                }

                return `
                  <div class="material-item" data-id="${material.id}">
                    <div class="material-icon">
                        <i class="fa-solid fa-book-open"></i>
                    </div>
                    <div class="material-details">
                        <h3>${Store.escapeHtml(material.titulo)}</h3>
                        <p class="material-category">Categoria: ${Store.escapeHtml(rotuloCategoria)}</p>
                        <div class="material-meta">
                            <span><i class="fa-solid fa-download"></i> ${material.downloads || 0} downloads</span>
                            ${avaliacaoTexto}
                        </div>
                    </div>
                    <div class="material-actions">
                        <span class="status ${status}">${rotulosStatus[status] || status}</span>
                        <button class="btn-action" data-acao="ver">Ver</button>
                        <button class="btn-action btn-action--editar" data-acao="editar">Editar</button>
                        ${botaoTravar}
                    </div>
                  </div>`;
            })
            .join("");

        lista.querySelectorAll('[data-acao="ver"]').forEach((botao) => {
            botao.addEventListener("click", () => {
                const id = botao.closest(".material-item").dataset.id;
                window.location.href = `detalhesMaterial.html?id=${encodeURIComponent(id)}`;
            });
        });

        lista.querySelectorAll('[data-acao="editar"]').forEach((botao) => {
            botao.addEventListener("click", () => {
                const id = botao.closest(".material-item").dataset.id;
                window.location.href = `editarMaterial.html?id=${encodeURIComponent(id)}`;
            });
        });

        lista.querySelectorAll('[data-acao="travar"], [data-acao="destravar"]').forEach((botao) => {
            botao.addEventListener("click", () => {
                const id = botao.closest(".material-item").dataset.id;
                const novoStatus = botao.dataset.acao === "travar" ? "bloqueado" : "aprovado";
                Store.atualizarStatusMaterial(id, novoStatus);
                renderizarLista();
            });
        });

        aplicarFiltros();
    }

    const addMaterialBtn = document.querySelector(".add-material-btn");
    if (addMaterialBtn) {
        addMaterialBtn.addEventListener("click", () => {
            window.location.href = "criar.html";
        });
    }

    const filtroStatus = document.querySelector(".filter-select");
    const campoBusca = document.querySelector(".nav-search-input");

    function aplicarFiltros() {
        const texto = campoBusca?.value.toLowerCase().trim() || "";
        const statusSelecionado = filtroStatus?.value.toLowerCase() || "todos";

        document.querySelectorAll(".material-item").forEach((item) => {
            const titulo = item.querySelector("h3")?.textContent.toLowerCase() || "";
            const categoria = item.querySelector(".material-category")?.textContent.toLowerCase() || "";
            const status = item.querySelector(".status")?.textContent.toLowerCase().trim() || "";

            const passouBusca = texto === "" || titulo.includes(texto) || categoria.includes(texto);

            let passouStatus = false;
            switch (statusSelecionado) {
                case "todos":
                    passouStatus = true;
                    break;
                case "aprovados":
                    passouStatus = status === "aprovado";
                    break;
                case "pendentes":
                    passouStatus = status === "pendente";
                    break;
                case "reprovados":
                    passouStatus = status === "reprovado";
                    break;
            }

            item.style.display = passouBusca && passouStatus ? "flex" : "none";
        });
    }

    if (filtroStatus) filtroStatus.addEventListener("change", aplicarFiltros);
    if (campoBusca) campoBusca.addEventListener("keyup", aplicarFiltros);

    renderizarLista();

    const paginaAtual = window.location.pathname.split("/").pop();
    document.querySelectorAll(".sidebar-item").forEach((link) => {
        const href = link.getAttribute("href");
        if (href === paginaAtual) link.classList.add("active");
    });

});
