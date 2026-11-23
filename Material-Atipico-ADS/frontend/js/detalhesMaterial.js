/* detalhesMaterial.js
   --------------------------------------------------------------------------
   "Detalhes do Material" (detalhesMaterial.html):
*/

document.addEventListener("DOMContentLoaded", () => {
  const usuarioLogado = exigirLogin(); // sessao.js — redireciona pra login.html se não logado
  if (!usuarioLogado) return;

  const navNome = document.getElementById("nav-usuario-nome");
  if (navNome) navNome.textContent = `${usuarioLogado.nome} · ${usuarioLogado.tipo}`;

  const Store = window.MaterialAtipicoStore;
  if (!Store) {
    console.error("materiais-store.js precisa ser carregado antes de detalhesMaterial.js");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const idParam = params.get("id");

  // Sem id na URL -> mostra o material de exemplo (seed-1).
  // Com id na URL que não existe -> mostra estado de "não encontrado".
  const idAlvo = idParam || "seed-1";
  const material = Store.obterMaterialPorId(idAlvo);

  if (!material) {
    mostrarMaterialNaoEncontrado(idAlvo);
    return;
  }

  // Material pendente/rejeitado só é visível pro autor e pro admin —
  // pro resto da comunidade ele "não existe" até ser aprovado.
  const ehDono = material.autorEmail === usuarioLogado.email;
  if (material.status && material.status !== "aprovado" && !ehDono && !ehAdmin()) {
    mostrarMaterialEmAnalise(material.status);
    return;
  }

  let estrelaSelecionada = 0;

  renderizarCabecalho(material);
  renderizarFavorito(material.id);
  renderizarAutor(material);
  renderizarAcoesAdmin(material);

  // Botão de favoritar no detalhe
  function renderizarFavorito(materialId) {
    const btn = document.getElementById("fav-btn-detalhe");
    const icon = document.getElementById("fav-icon-detalhe");
    if (!btn || !icon) return;

    function atualizar() {
      const favoritado = Store.ehFavorito(materialId);
      btn.classList.toggle("is-active", favoritado);
      icon.className = favoritado ? "fa-solid fa-heart" : "fa-regular fa-heart";
      btn.setAttribute("aria-label", favoritado ? "Remover dos favoritos" : "Favoritar material");
      btn.title = favoritado ? "Remover dos favoritos" : "Favoritar material";
    }

    atualizar();

    btn.addEventListener("click", () => {
      Store.alternarFavorito(materialId);
      atualizar();
    });
  }
  renderizarResumoAvaliacoes(material.id);
  renderizarComentarios(material.id);
  renderizarEstrelasInput(material.id);
  configurarEnvio(material.id);

  // Cartão "Autor do Material" — antes mostrava sempre "Maria Silva" fixo
  function renderizarAutor(material) {
    const nomeEl = document.getElementById("author-nome");
    const tipoEl = document.getElementById("author-tipo");
    const bioEl = document.getElementById("author-bio");
    const statMateriaisEl = document.getElementById("author-stat-materiais");
    const statAvaliacaoEl = document.getElementById("author-stat-avaliacao");
    const visitarLink = document.getElementById("author-visitar-link");

    const autorEmail = material.autorEmail;
    const registro = autorEmail ? getUsuarios().find((u) => u.email === autorEmail) : null;

    const nome = material.autor || (registro && registro.nome) || "Equipe MaterialAtípico";
    const tipo = (registro && registro.tipo) || (autorEmail ? "" : "Equipe MaterialAtípico");
    const bio = registro
      ? registro.biografia || "Esse usuário ainda não escreveu uma bio."
      : "Conteúdo oficial da plataforma MaterialAtípico.";

    if (nomeEl) nomeEl.textContent = nome;
    if (tipoEl) tipoEl.textContent = tipo || "—";
    if (bioEl) bioEl.textContent = bio;

    const materiaisDoAutor = autorEmail ? Store.obterMateriaisPorAutor(autorEmail) : [];
    if (statMateriaisEl) statMateriaisEl.textContent = autorEmail ? materiaisDoAutor.length : "—";

    const avaliacoes = materiaisDoAutor
      .map((m) => Store.obterResumoAvaliacoes(m.id))
      .filter((r) => r.total > 0);
    const media = avaliacoes.length
      ? avaliacoes.reduce((soma, r) => soma + r.media, 0) / avaliacoes.length
      : null;
    if (statAvaliacaoEl) statAvaliacaoEl.textContent = media ? `${media.toFixed(1)} ★` : "—";

    if (visitarLink) {
      // Só dá pra "visitar perfil" quando o autor é o próprio usuário logado
      // (a plataforma ainda não tem visualização pública do perfil de outros usuários).
      visitarLink.style.display = autorEmail && autorEmail === usuarioLogado.email ? "" : "none";
    }
  }

  // Cartão de ações de admin (bloquear/desbloquear/excluir) — só pra quem é admin
  function renderizarAcoesAdmin(material) {
    const card = document.getElementById("admin-acoes-card");
    if (!card) return;

    if (!ehAdmin() || material.base) {
      card.style.display = "none";
      return;
    }

    card.style.display = "";

    const btnBloquear = document.getElementById("btn-admin-bloquear");
    const btnExcluir = document.getElementById("btn-admin-excluir");
    const bloqueado = material.status === "bloqueado";

    btnBloquear.textContent = bloqueado ? "✅ Desbloquear material" : "🚫 Bloquear material";
    btnBloquear.classList.toggle("btn-bloquear", !bloqueado);
    btnBloquear.classList.toggle("btn-desbloquear", bloqueado);

    btnBloquear.onclick = () => {
      Store.atualizarStatusMaterial(material.id, bloqueado ? "aprovado" : "bloqueado");
      window.location.reload();
    };

    btnExcluir.onclick = () => {
      if (!confirm(`Excluir "${material.titulo}" definitivamente? Essa ação não pode ser desfeita.`)) return;
      Store.excluirMaterial(material.id);
      alert("Material excluído.");
      window.location.href = "material.html";
    };
  }

  // Cabeçalho
  function renderizarCabecalho(material) {
    const tituloEl = document.getElementById("material-titulo");
    if (tituloEl) tituloEl.textContent = material.titulo;

    const tagsEl = document.getElementById("material-tags");
    if (tagsEl) {
      const categoriaLabel = Store.ROTULOS_CATEGORIA[material.categoria] || "Outros";
      const tipoLabel = Store.ROTULOS_TIPO[material.tipo] || "Material";
      const dataFormatada = new Date(material.criadoEm).toLocaleDateString("pt-BR");

      tagsEl.innerHTML = `
        <span class="tag purple">${Store.escapeHtml(categoriaLabel)}</span>
        <span class="tag purple">${Store.escapeHtml(tipoLabel)}</span>
        <span class="tag gray">${dataFormatada}</span>
      `;
    }

    const descEl = document.getElementById("material-descricao");
    if (descEl) {
      let html = `<p class="description">${Store.escapeHtml(material.descricao)}</p>`;
      if (material.instrucoes) {
        html += `<p class="description"><strong>Instruções de uso:</strong> ${Store.escapeHtml(material.instrucoes)}</p>`;
      }
      descEl.innerHTML = html;
    }

    const downloadBtn = document.getElementById("download-btn");
    if (downloadBtn) {
      downloadBtn.textContent = material.arquivoNome
        ? `⬇ Baixar Material (${material.arquivoNome})`
        : "⬇ Baixar Material (PDF)";
    }

    document.title = `${material.titulo} – MaterialAtípico`;
  }

  //Resumo de avaliações
  function renderizarResumoAvaliacoes(materialId) {
    const resumo = Store.obterResumoAvaliacoes(materialId);

    const mediaEl = document.getElementById("rating-media");
    const estrelasEl = document.getElementById("rating-estrelas");
    const contagemEl = document.getElementById("rating-contagem");
    const barsEl = document.getElementById("rating-bars");

    if (mediaEl) mediaEl.textContent = resumo.total ? resumo.media.toFixed(1) : "—";
    if (estrelasEl) estrelasEl.textContent = textoEstrelas(resumo.media);
    if (contagemEl) {
      contagemEl.textContent = `${resumo.total} ${resumo.total === 1 ? "avaliação" : "avaliações"}`;
    }

    if (barsEl) {
      barsEl.innerHTML = [5, 4, 3, 2, 1]
        .map((valor) => {
          const quantidade = resumo.distribuicao[valor] || 0;
          const porcentagem = resumo.total ? Math.round((quantidade / resumo.total) * 100) : 0;
          return `
            <div class="bar-item">
              <span>${valor} ★</span>
              <div class="bar"><div class="fill" style="width:${porcentagem}%"></div></div>
              <span class="count">${quantidade}</span>
            </div>`;
        })
        .join("");
    }
  }

  // Comentários 
  function renderizarComentarios(materialId) {
    const lista = document.getElementById("lista-comentarios");
    if (!lista) return;

    const avaliacoes = Store.obterAvaliacoes(materialId)
      .slice()
      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

    if (!avaliacoes.length) {
      lista.innerHTML = `<p class="comentario-vazio">Ainda não há avaliações para este material. Seja o primeiro a avaliar!</p>`;
      return;
    }

    const usuarioAtual = Store.obterUsuarioLogado();

    lista.innerHTML = avaliacoes
      .map((avaliacao) => {
        const ehVoce = avaliacao.usuarioId === usuarioAtual;
        const nome = ehVoce ? "Você" : `Usuário ${avaliacao.usuarioId.slice(-4).toUpperCase()}`;
        const textoComentario = avaliacao.comentario
          ? `<p class="comment-text">${Store.escapeHtml(avaliacao.comentario)}</p>`
          : `<p class="comment-text comment-text--vazio">Avaliou sem deixar comentário.</p>`;

        return `
          <div class="comment">
            <div class="comment-header">
              <div class="avatar"></div>
              <div>
                <div class="comment-user">${Store.escapeHtml(nome)}</div>
                <div class="comment-time">${Store.tempoRelativo(avaliacao.criadoEm)} · ${textoEstrelas(avaliacao.estrelas)}</div>
              </div>
            </div>
            ${textoComentario}
          </div>`;
      })
      .join("");
  }

  // Estrelas do formulário 
  function renderizarEstrelasInput(materialId) {
    const container = document.getElementById("review-stars");
    if (!container) return;

    const avaliacaoExistente = Store.obterAvaliacaoDoUsuario(materialId);
    estrelaSelecionada = avaliacaoExistente ? avaliacaoExistente.estrelas : 0;

    container.innerHTML = "";
    for (let valor = 1; valor <= 5; valor++) {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "estrela-input";
      botao.dataset.valor = String(valor);
      botao.setAttribute("aria-label", `${valor} ${valor === 1 ? "estrela" : "estrelas"}`);
      botao.setAttribute("aria-pressed", "false");
      botao.textContent = "★";

      botao.addEventListener("mouseenter", () => pintarEstrelas(valor));
      botao.addEventListener("focus", () => pintarEstrelas(valor));
      botao.addEventListener("click", () => {
        estrelaSelecionada = valor;
        pintarEstrelas(valor);
        atualizarRotuloEstrelas(valor);
        esconderAviso();
      });

      container.appendChild(botao);
    }

    container.addEventListener("mouseleave", () => pintarEstrelas(estrelaSelecionada));

    pintarEstrelas(estrelaSelecionada);
    atualizarRotuloEstrelas(estrelaSelecionada);

    const comentarioEl = document.getElementById("avaliacao-comentario");
    if (avaliacaoExistente && comentarioEl) {
      comentarioEl.value = avaliacaoExistente.comentario || "";
      atualizarRotuloEstrelas(estrelaSelecionada, true);
    }
  }

  function pintarEstrelas(ate) {
    document.querySelectorAll("#review-stars .estrela-input").forEach((botao) => {
      const valor = Number(botao.dataset.valor);
      botao.classList.toggle("preenchida", valor <= ate);
      botao.setAttribute("aria-pressed", String(valor === ate));
    });
  }

  function atualizarRotuloEstrelas(valor, jaAvaliou) {
    const label = document.getElementById("review-stars-label");
    if (!label) return;
    if (!valor) {
      label.textContent = "Toque em uma estrela para avaliar";
    } else {
      const sufixo = jaAvaliou ? " (sua avaliação atual)" : "";
      label.textContent = `Sua nota: ${valor} ${valor === 1 ? "estrela" : "estrelas"}${sufixo}`;
    }
  }

  // Envio do formulário de avaliação
  function configurarEnvio(materialId) {
    const botaoEnviar = document.getElementById("btn-enviar-avaliacao");
    const comentarioEl = document.getElementById("avaliacao-comentario");
    if (!botaoEnviar) return;

    botaoEnviar.addEventListener("click", () => {
      if (!estrelaSelecionada) {
        mostrarAviso("Selecione de 1 a 5 estrelas antes de enviar.", "erro");
        return;
      }

      Store.salvarAvaliacao(materialId, estrelaSelecionada, comentarioEl ? comentarioEl.value : "");

      mostrarAviso("Avaliação enviada! Obrigado por contribuir.", "sucesso");
      renderizarResumoAvaliacoes(materialId);
      renderizarComentarios(materialId);
      atualizarRotuloEstrelas(estrelaSelecionada, true);

      const textoOriginal = botaoEnviar.textContent;
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = "Avaliação enviada!";
      setTimeout(() => {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = textoOriginal;
      }, 1800);
    });
  }

  function mostrarAviso(texto, tipo) {
    const avisoEl = document.getElementById("aviso-avaliacao");
    if (!avisoEl) return;
    avisoEl.hidden = false;
    avisoEl.textContent = texto;
    avisoEl.className = `aviso-avaliacao aviso-avaliacao--${tipo}`;
  }

  function esconderAviso() {
    const avisoEl = document.getElementById("aviso-avaliacao");
    if (avisoEl) avisoEl.hidden = true;
  }

  //Texto "★★★☆☆" representando a nota (0 a 5) 
  function textoEstrelas(media) {
    const arredondado = Math.round(media);
    let texto = "";
    for (let i = 1; i <= 5; i++) {
      texto += i <= arredondado ? "★" : "☆";
    }
    return texto;
  }

  // Estado de "material não encontrado" (id inválido) 
  function mostrarMaterialNaoEncontrado(idAlvo) {
    const tituloEl = document.getElementById("material-titulo");
    if (tituloEl) tituloEl.textContent = "Material não encontrado";

    const tagsEl = document.getElementById("material-tags");
    if (tagsEl) tagsEl.innerHTML = "";

    const descEl = document.getElementById("material-descricao");
    if (descEl) {
      descEl.innerHTML = `<p class="description">Não encontramos um material com o id "${Store.escapeHtml(
        idAlvo
      )}". Ele pode ter sido removido, ou o link usado está incorreto.</p>`;
    }

    ["download-btn", "rating-card", "review-box"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    const ratingCard = document.querySelector(".rating-card");
    if (ratingCard) ratingCard.style.display = "none";

    const comentariosCard = document.querySelector(".comments-card");
    if (comentariosCard) comentariosCard.style.display = "none";

    const authorCard = document.querySelector(".author-card");
    if (authorCard) authorCard.style.display = "none";
  }

  // Estado de "material ainda em análise" (pendente/rejeitado/bloqueado, visto por quem não é dono/admin)
  function mostrarMaterialEmAnalise(status) {
    const tituloEl = document.getElementById("material-titulo");
    if (tituloEl) tituloEl.textContent = status === "bloqueado" ? "Material bloqueado" : "Material em análise";

    const tagsEl = document.getElementById("material-tags");
    if (tagsEl) tagsEl.innerHTML = "";

    const descEl = document.getElementById("material-descricao");
    if (descEl) {
      const texto =
        status === "bloqueado"
          ? "Esse material foi bloqueado pelo administrador e não está mais disponível publicamente."
          : "Esse material ainda está em análise pelo administrador e não está disponível publicamente.";
      descEl.innerHTML = `<p class="description">${texto}</p>`;
    }

    ["download-btn"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });

    const ratingCard = document.querySelector(".rating-card");
    if (ratingCard) ratingCard.style.display = "none";

    const comentariosCard = document.querySelector(".comments-card");
    if (comentariosCard) comentariosCard.style.display = "none";

    const authorCard = document.querySelector(".author-card");
    if (authorCard) authorCard.style.display = "none";
  }
});
