/*
  admin.js
  Painel de administração (admin.html): fila de aprovação de materiais
  + caixa de mensagens recebidas pelo formulário de contato.
  Depende de sessao.js e materiais-store.js (carregados antes no HTML).
*/

const CHAVE_MENSAGENS = "ma_mensagens_contato";

document.addEventListener("DOMContentLoaded", () => {
  const usuarioLogado = exigirLogin(); // sessao.js — redireciona pra login.html se não logado
  if (!usuarioLogado) return;

  if (!ehAdmin()) {
    alert("Essa página é restrita a administradores.");
    window.location.href = "home-logado.html";
    return;
  }

  const navNome = document.getElementById("nav-usuario-nome");
  if (navNome) navNome.textContent = `${usuarioLogado.nome} · ${usuarioLogado.tipo}`;

  const Store = window.MaterialAtipicoStore;

  // ── Abas (Materiais / Mensagens / Usuários) ──
  const abaBtnMateriais = document.getElementById("aba-btn-materiais");
  const abaBtnMensagens = document.getElementById("aba-btn-mensagens");
  const abaBtnUsuarios  = document.getElementById("aba-btn-usuarios");
  const abaMateriais    = document.getElementById("aba-materiais");
  const abaMensagens    = document.getElementById("aba-mensagens");
  const abaUsuarios     = document.getElementById("aba-usuarios");

  function mostrarAba(nome) {
    abaMateriais.hidden = nome !== "materiais";
    abaMensagens.hidden = nome !== "mensagens";
    abaUsuarios.hidden  = nome !== "usuarios";
    abaBtnMateriais.classList.toggle("active", nome === "materiais");
    abaBtnMensagens.classList.toggle("active", nome === "mensagens");
    abaBtnUsuarios.classList.toggle("active",  nome === "usuarios");
  }

  abaBtnMateriais.addEventListener("click", () => mostrarAba("materiais"));
  abaBtnMensagens.addEventListener("click", () => mostrarAba("mensagens"));
  abaBtnUsuarios.addEventListener("click",  () => { mostrarAba("usuarios"); renderUsuarios(); });

  // ── MATERIAIS: fila de aprovação ──
  const rotulosStatus = { pendente: "Pendente", aprovado: "Aprovado", rejeitado: "Rejeitado", bloqueado: "Bloqueado" };

  function materiaisSubmetidos() {
    // Só materiais enviados por usuário (exclui o catálogo "de fábrica" da plataforma)
    return Store.obterMateriaisCriados();
  }

  function linhaMaterialHTML(material) {
    const status = material.status || "pendente";
    const rotuloCategoria = Store.ROTULOS_CATEGORIA[material.categoria] || material.categoria;
    const rotuloTipo = Store.ROTULOS_TIPO[material.tipo] || material.tipo;
    const data = new Date(material.criadoEm).toLocaleDateString("pt-BR");

    let acoesStatus = "";
    if (status === "pendente") {
      acoesStatus = `
        <button type="button" class="aprovar" data-id="${material.id}" data-acao="aprovar" title="Aprovar"><i class="fa-solid fa-check"></i></button>
        <button type="button" class="rejeitar" data-id="${material.id}" data-acao="rejeitar" title="Rejeitar"><i class="fa-solid fa-xmark"></i></button>`;
    } else if (status === "bloqueado") {
      acoesStatus = `<button type="button" class="desbloquear" data-id="${material.id}" data-acao="desbloquear" title="Desbloquear"><i class="fa-solid fa-lock-open"></i></button>`;
    } else if (status === "aprovado") {
      acoesStatus = `<button type="button" class="bloquear" data-id="${material.id}" data-acao="bloquear" title="Bloquear"><i class="fa-solid fa-lock"></i></button>`;
    }

    const acoes = `
      ${acoesStatus}
      <button type="button" class="excluir" data-id="${material.id}" data-acao="excluir" title="Excluir"><i class="fa-solid fa-trash"></i></button>`;

    return `
      <tr class="row row${status.charAt(0).toUpperCase() + status.slice(1)}">
        <td>
          <div class="materialInfo">
            <div class="materialIcone"></div>
            <span>${Store.escapeHtml(material.titulo)}</span>
          </div>
        </td>
        <td data-label="Autor"><i class="fa-regular fa-user iconAutor"></i> ${Store.escapeHtml(material.autor || "Desconhecido")}</td>
        <td data-label="Categoria">${Store.escapeHtml(rotuloCategoria)}</td>
        <td data-label="Tipo">${Store.escapeHtml(rotuloTipo)}</td>
        <td data-label="Data"><i class="fa-regular fa-calendar iconData"></i> ${data}</td>
        <td data-label="Status"><span class="status ${status}">${rotulosStatus[status]}</span></td>
        <td data-label="Ações">
          <div class="acoes">
            <a href="adminrevisao.html?id=${encodeURIComponent(material.id)}"><button type="button" class="visualizar" title="Visualizar"><i class="fa-regular fa-eye"></i></button></a>
            ${acoes}
          </div>
        </td>
      </tr>`;
  }

  function renderMateriais() {
    const materiais = materiaisSubmetidos();
    const tbody = document.getElementById("tbody-materiais");

    tbody.innerHTML = materiais.length
      ? materiais.map(linhaMaterialHTML).join("")
      : `<tr class="row"><td colspan="7" style="text-align:center; color:#888; padding: 24px;">Nenhum material enviado ainda.</td></tr>`;

    tbody.querySelectorAll("[data-acao]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const id = botao.dataset.id;
        const acao = botao.dataset.acao;

        if (acao === "excluir") {
          const material = materiais.find((m) => m.id === id);
          if (!confirm(`Excluir "${material ? material.titulo : "esse material"}" definitivamente? Essa ação não pode ser desfeita.`)) return;
          Store.excluirMaterial(id);
          renderMateriais();
          return;
        }

        const statusPorAcao = { aprovar: "aprovado", rejeitar: "rejeitado", bloquear: "bloqueado", desbloquear: "aprovado" };
        Store.atualizarStatusMaterial(id, statusPorAcao[acao]);
        renderMateriais();
      });
    });

    atualizarContadores(materiais);
  }

  function atualizarContadores(materiais) {
    const total = materiais.length;
    const pendentes = materiais.filter((m) => (m.status || "pendente") === "pendente").length;
    const aprovados = materiais.filter((m) => m.status === "aprovado").length;
    const rejeitados = materiais.filter((m) => m.status === "rejeitado").length;

    document.getElementById("label-filtroTodos").textContent = `Todos (${total})`;
    document.getElementById("label-filtroPendentes").textContent = `Pendentes (${pendentes})`;
    document.getElementById("label-filtroAprovados").textContent = `Aprovados (${aprovados})`;
    document.getElementById("label-filtroRejeitados").textContent = `Rejeitados (${rejeitados})`;

    document.getElementById("topo-pendentes-count").textContent = pendentes;
    document.getElementById("status-total").textContent = total;
    document.getElementById("status-pendentes").textContent = pendentes;
    document.getElementById("status-aprovados").textContent = aprovados;
    document.getElementById("status-rejeitados").textContent = rejeitados;
  }

  // ── MENSAGENS DE CONTATO ──
  function obterMensagens() {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_MENSAGENS) || "[]");
    } catch (erro) {
      return [];
    }
  }

  function salvarMensagens(lista) {
    localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify(lista));
  }

  function linhaMensagemHTML(mensagem, indice) {
    const data = new Date(mensagem.criadoEm).toLocaleDateString("pt-BR");
    return `
      <tr class="row">
        <td data-label="De">
          <strong>${Store.escapeHtml(mensagem.nome)}</strong><br>
          <small>${Store.escapeHtml(mensagem.email)}</small>
        </td>
        <td data-label="Assunto">${Store.escapeHtml(mensagem.assunto || "—")}</td>
        <td data-label="Mensagem">${Store.escapeHtml(mensagem.mensagem)}</td>
        <td data-label="Data"><i class="fa-regular fa-calendar iconData"></i> ${data}</td>
        <td data-label="Status"><span class="status ${mensagem.lida ? "aprovado" : "pendente"}">${mensagem.lida ? "Lida" : "Não lida"}</span></td>
        <td data-label="Ações">
          <div class="acoes">
            ${mensagem.lida ? "" : `<button type="button" class="aprovar" data-indice="${indice}" title="Marcar como lida"><i class="fa-solid fa-check"></i></button>`}
          </div>
        </td>
      </tr>`;
  }

  function renderMensagens() {
    const mensagens = obterMensagens().slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
    const tbody = document.getElementById("tbody-mensagens");

    tbody.innerHTML = mensagens.length
      ? mensagens.map(linhaMensagemHTML).join("")
      : `<tr class="row"><td colspan="6" style="text-align:center; color:#888; padding: 24px;">Nenhuma mensagem recebida ainda.</td></tr>`;

    tbody.querySelectorAll("[data-indice]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const todas = obterMensagens();
        const ordenadas = todas.slice().sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
        const alvo = ordenadas[Number(botao.dataset.indice)];
        const indiceReal = todas.indexOf(alvo);
        if (indiceReal !== -1) {
          todas[indiceReal].lida = true;
          salvarMensagens(todas);
        }
        renderMensagens();
      });
    });

    const naoLidas = mensagens.filter((m) => !m.lida).length;
    const badge = document.getElementById("badge-mensagens-nao-lidas");
    if (naoLidas > 0) {
      badge.textContent = naoLidas;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  renderMateriais();
  renderMensagens();

  // ── USUÁRIOS ──────────────────────────────────────────────────

  function iniciais(nome) {
    return (nome || "?")
      .split(" ")
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("");
  }

  function renderUsuarios() {
    const tbody = document.getElementById("tbody-usuarios");
    if (!tbody) return;

    const usuarios = getUsuarios(); // sessao.js

    // Atualiza badge com total
    const badge = document.getElementById("badge-usuarios-count");
    if (badge) {
      badge.textContent = usuarios.length;
      badge.hidden = usuarios.length === 0;
    }

    if (!usuarios.length) {
      tbody.innerHTML = `<tr class="row"><td colspan="7" style="text-align:center;color:#888;padding:24px;">Nenhum usuário cadastrado ainda.</td></tr>`;
      return;
    }

    tbody.innerHTML = usuarios
      .map((usuario, indice) => {
        const bloqueada = !!usuario.bloqueada;
        const materiaisDoUsuario = Store ? Store.obterMateriaisPorAutor(usuario.email) : [];
        const cadastro = usuario.criadoEm
          ? new Date(usuario.criadoEm).toLocaleDateString("pt-BR")
          : "—";

        return `
          <tr class="row">
            <td>
              <div class="usuario-info">
                <div class="usuario-avatar">${Store.escapeHtml(iniciais(usuario.nome))}</div>
                <span>${Store.escapeHtml(usuario.nome)}</span>
              </div>
            </td>
            <td data-label="Email">${Store.escapeHtml(usuario.email)}</td>
            <td data-label="Tipo">${Store.escapeHtml(usuario.tipo || "—")}</td>
            <td data-label="Cadastro"><i class="fa-regular fa-calendar iconData"></i> ${cadastro}</td>
            <td data-label="Status">
              <span class="status ${bloqueada ? "conta-bloqueada" : "conta-ativa"}">
                ${bloqueada ? "Bloqueado" : "Ativo"}
              </span>
            </td>
            <td data-label="Materiais">${materiaisDoUsuario.length}</td>
            <td data-label="Ações">
              <div class="acoes">
                <button type="button" class="ver-perfil" data-email="${Store.escapeHtml(usuario.email)}" data-acao="ver" title="Ver perfil">
                  <i class="fa-regular fa-eye"></i>
                </button>
                <button type="button" class="${bloqueada ? "desbloquear" : "bloquear"}" data-email="${Store.escapeHtml(usuario.email)}" data-acao="${bloqueada ? "desbloquear" : "bloquear"}" title="${bloqueada ? "Desbloquear conta" : "Bloquear conta"}">
                  <i class="fa-solid fa-${bloqueada ? "lock-open" : "lock"}"></i>
                </button>
                <button type="button" class="excluir" data-email="${Store.escapeHtml(usuario.email)}" data-nome="${Store.escapeHtml(usuario.nome)}" data-acao="excluir" title="Excluir conta">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>`;
      })
      .join("");

    tbody.querySelectorAll("[data-acao]").forEach((botao) => {
      botao.addEventListener("click", () => {
        const email = botao.dataset.email;
        const acao = botao.dataset.acao;

        if (acao === "ver") {
          const u = getUsuarios().find((x) => x.email === email);
          if (u) abrirPerfilModal(u);
          return;
        }

        if (acao === "bloquear" || acao === "desbloquear") {
          const bloqueada = acao === "bloquear";
          const lista = getUsuarios().map((u) =>
            u.email === email ? { ...u, bloqueada } : u
          );
          salvarUsuarios(lista);
          renderUsuarios();
          return;
        }

        if (acao === "excluir") {
          const nome = botao.dataset.nome;
          if (!confirm(`Excluir a conta de "${nome}" definitivamente? Essa ação não pode ser desfeita.`)) return;
          const lista = getUsuarios().filter((u) => u.email !== email);
          salvarUsuarios(lista);
          renderUsuarios();
        }
      });
    });
  }

  function abrirPerfilModal(usuario) {
    const modal = document.getElementById("modal-perfil-usuario");
    if (!modal) return;

    document.getElementById("modal-perfil-iniciais").textContent = iniciais(usuario.nome);
    document.getElementById("modal-perfil-nome").textContent = usuario.nome;
    document.getElementById("modal-perfil-tipo").textContent = usuario.tipo || "";
    document.getElementById("modal-perfil-email").textContent = usuario.email;
    document.getElementById("modal-perfil-bio").textContent =
      usuario.biografia || "Sem bio.";
    document.getElementById("modal-perfil-materiais").textContent =
      Store ? Store.obterMateriaisPorAutor(usuario.email).length : 0;
    document.getElementById("modal-perfil-cadastro").textContent = usuario.criadoEm
      ? new Date(usuario.criadoEm).toLocaleDateString("pt-BR")
      : "—";

    modal.style.display = "flex";
  }

  const modalPerfil = document.getElementById("modal-perfil-usuario");
  const fecharModalPerfil = document.getElementById("modal-perfil-fechar");
  if (fecharModalPerfil) {
    fecharModalPerfil.addEventListener("click", () => {
      modalPerfil.style.display = "none";
    });
  }
  if (modalPerfil) {
    modalPerfil.addEventListener("click", (e) => {
      if (e.target === modalPerfil) modalPerfil.style.display = "none";
    });
  }

});
