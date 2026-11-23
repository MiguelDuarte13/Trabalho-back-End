// Seletores genéricos do parceiro — sem side-effect se elementos não existirem
document.querySelectorAll('.menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Clique:', link.textContent);
    });
});

document.querySelector('.login-btn')?.addEventListener('click', () => {
    console.log('Login clicado');
});

document.querySelector('.search-btn')?.addEventListener('click', () => {
    console.log('Busca clicada');
});

// ── Integração com sessao.js + materiais-store.js ──
document.addEventListener("DOMContentLoaded", () => {

    // Gate: só admin acessa
    const usuarioLogado = exigirLogin();
    if (!usuarioLogado) return;

    if (!ehAdmin()) {
        alert("Essa página é restrita a administradores.");
        window.location.href = "home-logado.html";
        return;
    }

    // Preenche nome no nav avatar
    const navNome = document.getElementById("nav-usuario-nome");
    if (navNome) navNome.textContent = `${usuarioLogado.nome} · ${usuarioLogado.tipo}`;

    const Store = window.MaterialAtipicoStore;
    const params = new URLSearchParams(window.location.search);
    const materialId = params.get("id");

    if (materialId && Store) {
        const material = Store.obterMaterialPorId(materialId);
        if (material) popularPagina(material, Store);
    }

    // Download do arquivo do material
    const downloadBtn = document.querySelector(".btn-download");
    if (downloadBtn) {
        downloadBtn.addEventListener("click", () => {
            if (materialId && Store) {
                const mat = Store.obterMaterialPorId(materialId);
                if (mat && mat.arquivoNome) {
                    mostrarToast("Download de " + mat.arquivoNome + " iniciado!", "verde");
                    return;
                }
            }
            mostrarToast("Arquivo de demonstração — sem arquivo real disponível.", "verde");
        });
    }

    // Botão Ver Perfil — redireciona para perfil do autor
    const perfilBtn = document.querySelector(".btn-perfil");
    if (perfilBtn) {
        perfilBtn.addEventListener("click", () => {
            window.location.href = "perfil.html";
        });
    }

    carregarPreview(materialId, Store);
});

// Preenche os campos da página com dados reais do material
function popularPagina(material, Store) {
    const rotuloCategoria = Store.ROTULOS_CATEGORIA[material.categoria] || material.categoria;
    const rotuloTipo = Store.ROTULOS_TIPO[material.tipo] || material.tipo;
    const dataFormatada = new Date(material.criadoEm).toLocaleDateString("pt-BR");

    // Título
    const titleEl = document.querySelector(".material-detail h2");
    if (titleEl) titleEl.textContent = material.titulo;

    // Tags
    const tagsEl = document.querySelector(".material-detail .tags");
    if (tagsEl) {
        tagsEl.innerHTML = `
            <span class="tag tag-blue">${Store.escapeHtml(rotuloCategoria)}</span>
            <span class="tag tag-purple">${Store.escapeHtml(rotuloTipo)}</span>
            <span class="tag tag-gray">${dataFormatada}</span>
        `;
    }

    // Descrição
    const secoes = document.querySelectorAll(".material-detail .section");
    if (secoes[0]) {
        const pEl = secoes[0].querySelector("p");
        if (pEl) pEl.textContent = material.descricao || "Sem descrição disponível.";
    }

    // Status atual no botão download
    const downloadBtn = document.querySelector(".btn-download");
    if (downloadBtn && material.arquivoNome) {
        downloadBtn.querySelector
            ? (downloadBtn.childNodes[downloadBtn.childNodes.length - 1].textContent =
                " Download: " + material.arquivoNome + " (somente revisão)")
            : null;
    }

    // Autor
    if (material.autorEmail) {
        const usuarios = getUsuarios();
        const autor = usuarios.find(function(u) { return u.email === material.autorEmail; });
        if (autor) {
            const nomeEl = document.querySelector(".autor-nome");
            const cargoEl = document.querySelector(".autor-cargo");
            const bioEl = document.querySelector(".autor-bio");
            if (nomeEl) nomeEl.textContent = autor.nome;
            if (cargoEl) cargoEl.textContent = autor.tipo || "";
            if (bioEl) bioEl.textContent = autor.biografia || "Sem bio.";
        }

        // Stats do autor
        const matDoAutor = Store.obterMateriaisPorAutor(material.autorEmail);
        const aprovados = matDoAutor.filter(function(m) { return m.status === "aprovado"; }).length;
        const pendentes = matDoAutor.filter(function(m) { return m.status === "pendente"; }).length;

        const statVals = document.querySelectorAll(".stat-val");
        if (statVals[0]) statVals[0].textContent = matDoAutor.length;
        if (statVals[1]) statVals[1].textContent = aprovados;
        if (statVals[2]) statVals[2].textContent = pendentes;
    }
}

function carregarPreview(materialId, Store) {
    const preview = document.querySelector(".preview-inner");
    if (!preview) return;

    if (materialId && Store) {
        const material = Store.obterMaterialPorId(materialId);
        if (material && material.arquivoNome) {
            preview.innerHTML = `
                <div class="preview-icon">
                    <svg width="36" height="36" fill="none" stroke="#7c3aed" stroke-width="1.5" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                    </svg>
                </div>
                <span class="preview-label">${Store.escapeHtml(material.arquivoNome)}</span>
            `;
            return;
        }
    }

    preview.innerHTML = `
        <div class="preview-icon">
            <svg width="36" height="36" fill="none" stroke="#7c3aed" stroke-width="1.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        </div>
        <span class="preview-label">Pré-visualização do Material</span>
    `;
}

function aprovar() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    abrirModal(
        "Aprovar Material",
        "Deseja aprovar este material? Ele ficará visível para todos os usuários.",
        "Aprovar",
        "verde",
        () => {
            if (id && window.MaterialAtipicoStore) {
                window.MaterialAtipicoStore.atualizarStatusMaterial(id, "aprovado");
            }
            fecharModal();
            mostrarToast("Material aprovado com sucesso!", "verde");
            setTimeout(() => {
                window.location.href = "admin.html";
            }, 1500);
        }
    );
}

function rejeitar() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    abrirModal(
        "Rejeitar Material",
        "Deseja rejeitar este material? O autor será notificado.",
        "Rejeitar",
        "vermelho",
        () => {
            if (id && window.MaterialAtipicoStore) {
                window.MaterialAtipicoStore.atualizarStatusMaterial(id, "rejeitado");
            }
            fecharModal();
            mostrarToast("Material rejeitado.", "vermelho");
            setTimeout(() => {
                window.location.href = "admin.html";
            }, 1500);
        }
    );
}

function abrirModal(titulo, mensagem, textoBotao, tipo, callback) {
    fecharModal();

    const overlay = document.createElement("div");
    overlay.id = "mod-overlay";

    overlay.innerHTML = `
        <div class="mod-caixa">
            <h2>${titulo}</h2>
            <p>${mensagem}</p>
            <div class="mod-acoes">
                <button class="modal-btn modal-btn--cinza" id="cancelar">Cancelar</button>
                <button class="modal-btn modal-btn--${tipo}" id="confirmar">${textoBotao}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.classList.add("mod-visible");
    }, 10);

    document.getElementById("cancelar").addEventListener("click", fecharModal);
    document.getElementById("confirmar").addEventListener("click", callback);
}

function fecharModal() {
    const modal = document.getElementById("mod-overlay");
    if (modal) modal.remove();
}

function mostrarToast(mensagem, tipo) {
    const toast = document.createElement("div");
    toast.className = `mod-toast mod-toast--${tipo}`;
    toast.textContent = mensagem;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("mod-toast--visivel");
    }, 50);

    setTimeout(() => {
        toast.classList.remove("mod-toast--visivel");
        setTimeout(() => { toast.remove(); }, 300);
    }, 3000);
}
