/*
  editarMaterial.js
  Edição de material existente pelo próprio autor.
  Depende de sessao.js e materiais-store.js.
*/

document.addEventListener("DOMContentLoaded", () => {

    const usuarioLogado = exigirLogin();
    if (!usuarioLogado) return;

    const Store = window.MaterialAtipicoStore;
    const navNome = document.getElementById("nav-usuario-nome");
    if (navNome) navNome.textContent = `${usuarioLogado.nome} · ${usuarioLogado.tipo}`;

    // ── Carrega material da URL ──
    const params = new URLSearchParams(window.location.search);
    const materialId = params.get("id");

    if (!materialId) {
        alert("Material não encontrado.");
        window.location.href = "meus-materiais.html";
        return;
    }

    const material = Store.obterMaterialPorId(materialId);

    // Só o autor ou admin pode editar
    if (!material || (material.autorEmail !== usuarioLogado.email && !ehAdmin())) {
        alert("Você não tem permissão para editar este material.");
        window.location.href = "meus-materiais.html";
        return;
    }

    // ── Preenche campos ──
    const rotulosStatus = {
        pendente: "Pendente",
        aprovado: "Aprovado",
        rejeitado: "Rejeitado",
        bloqueado: "Bloqueado"
    };
    const status = material.status || "pendente";

    const badgeEl = document.getElementById("editar-status-badge");
    if (badgeEl) {
        badgeEl.textContent = rotulosStatus[status] || status;
        badgeEl.className = `status ${status}`;
    }

    // Aviso só aparece quando material está aprovado (já publicado)
    const avisoEl = document.getElementById("editar-aviso-publicado");
    if (avisoEl && status === "aprovado") {
        avisoEl.hidden = false;
    }

    document.getElementById("editar-titulo").value   = material.titulo || "";
    document.getElementById("editar-descricao").value = material.descricao || "";
    document.getElementById("editar-tags").value      = (material.tags || []).join(", ");
    document.getElementById("editar-instrucoes").value = material.instrucoes || "";

    // Selects — precisa setar após opções já existirem
    setSelect("editar-categoria", material.categoria);
    setSelect("editar-tipo",      material.tipo);
    setSelect("editar-faixa-min", material.faixaMin || "4-6 anos");
    setSelect("editar-faixa-max", material.faixaMax || "7-10 anos");

    // Arquivo atual
    if (material.arquivoNome) {
        const blocoArquivo = document.getElementById("editar-arquivo-atual");
        blocoArquivo.hidden = false;
        document.getElementById("editar-arquivo-nome").textContent = material.arquivoNome;
        document.getElementById("editar-arquivo-info").textContent = "PDF · arquivo enviado anteriormente";
    }

    // Capa atual
    if (material.capa) {
        const capaArea = document.getElementById("editar-capa-area");
        capaArea.innerHTML = `<img src="${material.capa}" style="max-height:120px;border-radius:8px;" alt="Capa atual" />
            <p class="editar-upload-txt">Substituir imagem de capa</p>
            <label class="editar-btn-upload" for="editar-input-capa">Escolher nova imagem</label>
            <input type="file" id="editar-input-capa" accept=".jpg,.jpeg,.png,.webp" hidden />`;
    }

    // ── Contador de descrição ──
    const descricaoEl = document.getElementById("editar-descricao");
    const descHint    = document.getElementById("editar-descricao-hint");
    descricaoEl.addEventListener("input", () => {
        const n = descricaoEl.value.length;
        descHint.textContent = `${n} / 100 caracteres mínimos`;
        descHint.style.color = n >= 100 ? "#16a34a" : "#9ca3af";
    });

    // ── Upload de novo arquivo ──
    let novoArquivo = null;
    document.getElementById("editar-input-arquivo").addEventListener("change", function () {
        novoArquivo = this.files[0];
        if (novoArquivo) {
            const areaEl = document.getElementById("editar-upload-area");
            areaEl.querySelector(".editar-upload-txt").textContent =
                `Arquivo: ${novoArquivo.name}`;
        }
    });

    // ── Upload de nova capa ──
    let novaCapaDataUrl = null;
    document.addEventListener("change", (e) => {
        if (e.target.id === "editar-input-capa") {
            const arquivo = e.target.files[0];
            if (!arquivo) return;
            const leitor = new FileReader();
            leitor.onload = (ev) => {
                novaCapaDataUrl = ev.target.result;
                const capaArea = document.getElementById("editar-capa-area");
                const img = capaArea.querySelector("img");
                if (img) img.src = novaCapaDataUrl;
            };
            leitor.readAsDataURL(arquivo);
        }
    });

    // ── Envio do formulário ──
    document.getElementById("editar-form").addEventListener("submit", (e) => {
        e.preventDefault();

        const titulo    = document.getElementById("editar-titulo").value.trim();
        const categoria = document.getElementById("editar-categoria").value;
        const tipo      = document.getElementById("editar-tipo").value;
        const descricao = document.getElementById("editar-descricao").value.trim();
        const faixaMin  = document.getElementById("editar-faixa-min").value;
        const faixaMax  = document.getElementById("editar-faixa-max").value;
        const tagsRaw   = document.getElementById("editar-tags").value;
        const instrucoes = document.getElementById("editar-instrucoes").value.trim();

        if (!titulo) {
            alert("Preencha o título do material.");
            return;
        }
        if (!categoria) {
            alert("Selecione uma categoria.");
            return;
        }
        if (!tipo) {
            alert("Selecione o tipo de material.");
            return;
        }
        if (descricao.length < 100) {
            alert("A descrição precisa ter no mínimo 100 caracteres.");
            return;
        }

        const tags = tagsRaw
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        const camposAtualizados = {
            titulo,
            categoria,
            tipo,
            descricao,
            tags,
            instrucoes,
            faixaMin,
            faixaMax,
        };

        if (novoArquivo)    camposAtualizados.arquivoNome = novoArquivo.name;
        if (novaCapaDataUrl) camposAtualizados.capa = novaCapaDataUrl;

        Store.editarMaterialStore(materialId, camposAtualizados);

        // Exibe popup de sucesso
        const overlay = document.getElementById("editar-popup-overlay");
        overlay.style.display = "flex";
    });

    // ── Popup OK → volta pra meus materiais ──
    document.getElementById("editar-popup-ok").addEventListener("click", () => {
        window.location.href = "meus-materiais.html";
    });

    // Fecha popup ao clicar fora
    document.getElementById("editar-popup-overlay").addEventListener("click", (e) => {
        if (e.target === e.currentTarget) {
            window.location.href = "meus-materiais.html";
        }
    });

    function setSelect(id, valor) {
        const el = document.getElementById(id);
        if (!el || !valor) return;
        const opt = el.querySelector(`option[value="${valor}"]`);
        if (opt) el.value = valor;
    }
});
