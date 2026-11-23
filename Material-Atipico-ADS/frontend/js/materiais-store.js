/* 
   materiais-store.js
   (material.html) 
*/

(function (global) {
  "use strict";

  const CHAVE_MATERIAIS = "materialatipico:materiais";
  const CHAVE_LOGADO = "ma_usuario_logado"; // mesma chave usada pelo auth.js/sessao.js
  const CHAVE_FAVORITOS = "materialatipico:favoritos";
  const CHAVE_AVALIACOES = "materialatipico:avaliacoes";

  const ROTULOS_CATEGORIA = {
    tea: "TEA",
    tdah: "TDAH",
    dislexia: "Dislexia",
    outros: "Outros",
  };

  const ROTULOS_TIPO = {
    atividade: "Atividade",
    plano: "Plano de aula",
    jogo: "Jogo educativo",
    visual: "Apoio visual",
    video: "Vídeo",
  };

  // Materiais que já vêm "de fábrica" na biblioteca (os 3 cards originais do layout). 
  const MATERIAIS_BASE = [
    {
      id: "seed-1",
      titulo: "Atividade de Alfabetização para TEA",
      categoria: "tea",
      tipo: "atividade",
      descricao: "Atividades visuais e exercícios de associação para alfabetização.",
      tags: ["alfabetização", "tea"],
      downloads: 145,
      avaliacao: 4.5,
      capa: null,
      criadoEm: "2026-06-21T16:33:00",
      autor: "Equipe MaterialAtípico",
      status: "aprovado",
      base: true,
    },
    {
      id: "seed-2",
      titulo: "Jogo de Memória Adaptado",
      categoria: "tdah",
      tipo: "jogo",
      descricao: "Jogo de memória com elementos visuais para auxiliar concentração.",
      tags: ["memória", "concentração", "tdah"],
      downloads: 98,
      avaliacao: 4.8,
      capa: null,
      criadoEm: "2026-06-21T15:33:00",
      autor: "Equipe MaterialAtípico",
      status: "aprovado",
      base: true,
    },
    {
      id: "seed-3",
      titulo: "Leitura Adaptada para Dislexia",
      categoria: "dislexia",
      tipo: "visual",
      descricao: "Textos com fontes especiais e espaçamento adaptado.",
      tags: ["leitura", "dislexia"],
      downloads: 203,
      avaliacao: 4.7,
      capa: null,
      criadoEm: "2026-06-21T13:33:00",
      autor: "Equipe MaterialAtípico",
      status: "aprovado",
      base: true,
    },
  ];

  function leituraSegura(chave) {
    try {
      const bruto = localStorage.getItem(chave);
      return bruto ? JSON.parse(bruto) : [];
    } catch (erro) {
      console.warn("[materiais-store] não foi possível ler", chave, erro);
      return [];
    }
  }

  function escritaSegura(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (erro) {
      console.warn("[materiais-store] não foi possível salvar", chave, erro);
      return false;
    }
  }

  /* Retorna apenas os materiais criados (sem os "base"). */
  function obterMateriaisCriados() {
    return leituraSegura(CHAVE_MATERIAIS);
  }

  /* Salva um novo material no localStorage (usado pela página criar.html). */
  function salvarMaterial(material) {
    const lista = obterMateriaisCriados();
    lista.unshift(material);
    const ok = escritaSegura(CHAVE_MATERIAIS, lista);
    return { material, salvo: ok };
  }

  /* Atualiza o status (pendente/aprovado/rejeitado/bloqueado) de um material criado por usuário. */
  function atualizarStatusMaterial(id, novoStatus) {
    const lista = obterMateriaisCriados();
    const indice = lista.findIndex((material) => material.id === id);
    if (indice === -1) return null;

    lista[indice] = { ...lista[indice], status: novoStatus };
    escritaSegura(CHAVE_MATERIAIS, lista);
    return lista[indice];
  }

  /* Edita campos de um material criado por usuário e volta status pra "pendente". */
  function editarMaterialStore(id, campos) {
    const lista = obterMateriaisCriados();
    const indice = lista.findIndex((material) => material.id === id);
    if (indice === -1) return null;

    lista[indice] = { ...lista[indice], ...campos, status: "pendente", editadoEm: new Date().toISOString() };
    escritaSegura(CHAVE_MATERIAIS, lista);
    return lista[indice];
  }

  /* Remove um material definitivamente (ação de admin). Materiais "base" não podem ser excluídos. */
  function excluirMaterial(id) {
    const lista = obterMateriaisCriados();
    const restante = lista.filter((material) => material.id !== id);
    if (restante.length === lista.length) return false;

    escritaSegura(CHAVE_MATERIAIS, restante);
    return true;
  }

  /* Retorna TODOS os materiais (inclui pendente/rejeitado — uso interno/admin/dono). */
  function obterTodosMateriais() {
    return [...obterMateriaisCriados(), ...MATERIAIS_BASE].sort(
      (a, b) => new Date(b.criadoEm) - new Date(a.criadoEm)
    );
  }

  /* Retorna só os materiais aprovados (vitrine pública: home, material.html). */
  function obterMateriaisPublicos() {
    return obterTodosMateriais().filter((material) => material.status === "aprovado");
  }

  /* Materiais enviados por usuários, aguardando revisão do admin. */
  function obterMateriaisPendentes() {
    return obterMateriaisCriados().filter((material) => material.status === "pendente");
  }

  /* Busca um único material pelo id (detalhesMaterial.html). */
  function obterMaterialPorId(id) {
    return obterTodosMateriais().find((material) => material.id === id) || null;
  }

  /* Gera um id curto e aleatório. */
  function gerarId(prefixo = "m") {
    return `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /*
    Retorna o id do usuário logado (o email, vindo da sessão real criada
    pelo auth.js/sessao.js). Se ninguém estiver logado (página sem gate),
    usa "anonimo" como fallback para não quebrar favoritos/avaliações.
   */
  function obterUsuarioLogado() {
    const usuario = JSON.parse(sessionStorage.getItem(CHAVE_LOGADO) || 'null');
    return usuario ? usuario.email : "anonimo";
  }

  /* Retorna os materiais (criados + base) postados por um autor específico. */
  function obterMateriaisPorAutor(autorEmail) {
    return obterTodosMateriais().filter((material) => material.autorEmail === autorEmail);
  }

  /* Lê o mapa inteiro { usuario_id: [materialId, ...] }*/
  function obterMapaFavoritos() {
    const bruto = leituraSegura(CHAVE_FAVORITOS);


    if (Array.isArray(bruto)) {
      const usuarioId = obterUsuarioLogado();
      const migrado = { [usuarioId]: bruto };
      escritaSegura(CHAVE_FAVORITOS, migrado);
      return migrado;
    }

    return bruto && typeof bruto === "object" ? bruto : {};
  }

  /* Retorna os favoritos (Set de ids de material) do usuário logado atual. */
  function obterFavoritos() {
    const usuarioId = obterUsuarioLogado();
    const mapa = obterMapaFavoritos();
    return new Set(mapa[usuarioId] || []);
  }

  function ehFavorito(materialId) {
    return obterFavoritos().has(materialId);
  }

  /* Alterna o favorito de um material para o usuário logado atual e retorna o novo estado (true/false). */
  function alternarFavorito(materialId) {
    const usuarioId = obterUsuarioLogado();
    const mapa = obterMapaFavoritos();
    const favoritosDoUsuario = new Set(mapa[usuarioId] || []);

    if (favoritosDoUsuario.has(materialId)) {
      favoritosDoUsuario.delete(materialId);
    } else {
      favoritosDoUsuario.add(materialId);
    }

    mapa[usuarioId] = [...favoritosDoUsuario];
    escritaSegura(CHAVE_FAVORITOS, mapa);
    return favoritosDoUsuario.has(materialId);
  }

  // Avaliações (estrelas + comentário) 

  function obterMapaAvaliacoes() {
    const bruto = leituraSegura(CHAVE_AVALIACOES);
    return bruto && typeof bruto === "object" && !Array.isArray(bruto) ? bruto : {};
  }

  /* Retorna a lista de avaliações { usuarioId, estrelas, comentario, criadoEm } de um material. */
  function obterAvaliacoes(materialId) {
    const mapa = obterMapaAvaliacoes();
    return mapa[materialId] || [];
  }

  /* Retorna a avaliação que o usuário logado atual já fez nesse material  */
  function obterAvaliacaoDoUsuario(materialId) {
    const usuarioId = obterUsuarioLogado();
    return obterAvaliacoes(materialId).find((avaliacao) => avaliacao.usuarioId === usuarioId) || null;
  }

  /*
    Salva a avaliação (1 a 5 estrelas + comentário opcional) do usuário logado
    para um material. Se o usuário já tinha avaliado esse material antes, a
    avaliação antiga é substituída (não acumula avaliação duplicada).
   */
  function salvarAvaliacao(materialId, estrelas, comentario) {
    const usuarioId = obterUsuarioLogado();
    const mapa = obterMapaAvaliacoes();
    const listaAtual = mapa[materialId] || [];
    const listaSemAAntigaDoUsuario = listaAtual.filter((avaliacao) => avaliacao.usuarioId !== usuarioId);

    const novaAvaliacao = {
      usuarioId,
      estrelas: Math.min(5, Math.max(1, Math.round(estrelas))),
      comentario: (comentario || "").trim(),
      criadoEm: new Date().toISOString(),
    };

    mapa[materialId] = [novaAvaliacao, ...listaSemAAntigaDoUsuario];
    escritaSegura(CHAVE_AVALIACOES, mapa);
    return novaAvaliacao;
  }

  /* Calcula média */
  function obterResumoAvaliacoes(materialId) {
    const avaliacoes = obterAvaliacoes(materialId);
    const distribuicao = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let soma = 0;

    avaliacoes.forEach((avaliacao) => {
      soma += avaliacao.estrelas;
      distribuicao[avaliacao.estrelas] = (distribuicao[avaliacao.estrelas] || 0) + 1;
    });

    const total = avaliacoes.length;
    return {
      media: total ? soma / total : 0,
      total,
      distribuicao,
    };
  }

  // Converte 
  function tempoRelativo(isoString) {
    const diffMs = Date.now() - new Date(isoString).getTime();
    if (Number.isNaN(diffMs)) return "";

    const diffSeg = Math.floor(diffMs / 1000);
    if (diffSeg < 60) return "agora mesmo";

    const diffMin = Math.floor(diffSeg / 60);
    if (diffMin < 60) return `${diffMin}min atrás`;

    const diffHoras = Math.floor(diffMin / 60);
    if (diffHoras < 24) return `${diffHoras}h atrás`;

    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias < 30) return `${diffDias}d atrás`;

    const diffMeses = Math.floor(diffDias / 30);
    if (diffMeses < 12) return `${diffMeses} ${diffMeses === 1 ? "mês" : "meses"} atrás`;

    const diffAnos = Math.floor(diffMeses / 12);
    return `${diffAnos} ${diffAnos === 1 ? "ano" : "anos"} atrás`;
  }

  function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto ?? "";
    return div.innerHTML;
  }

  global.MaterialAtipicoStore = {
    ROTULOS_CATEGORIA,
    ROTULOS_TIPO,
    obterTodosMateriais,
    obterMateriaisPublicos,
    obterMateriaisPendentes,
    obterMaterialPorId,
    obterMateriaisCriados,
    obterMateriaisPorAutor,
    salvarMaterial,
    atualizarStatusMaterial,
    editarMaterialStore,
    excluirMaterial,
    obterUsuarioLogado,
    obterFavoritos,
    ehFavorito,
    alternarFavorito,
    obterAvaliacoes,
    obterAvaliacaoDoUsuario,
    salvarAvaliacao,
    obterResumoAvaliacoes,
    gerarId,
    tempoRelativo,
    escapeHtml,
  };
})(window);
