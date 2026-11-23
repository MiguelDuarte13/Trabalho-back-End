/*
  header-toggle.js
  Páginas públicas acessíveis logado ou não (sobre.html, contato.html):
  mostra o header com sidebar (igual ao resto do app) quando há sessão,
  e o header público (Login/Cadastro) quando não há.
  Depende de sessao.js (carregado antes no HTML).
*/

document.addEventListener("DOMContentLoaded", () => {
  const sidebarLogado = document.getElementById("sidebar-logado");
  const navLogado = document.getElementById("nav-logado");
  const navPublico = document.getElementById("nav-publico");
  if (!sidebarLogado || !navLogado || !navPublico) return;

  const usuario = obterUsuarioLogado();

  // Usa style.display (não o atributo hidden): o CSS do site define
  // "nav { display: flex }" e ".sidebar { ... }" no próprio seletor de tag/classe,
  // que tem prioridade sobre a regra "[hidden]{display:none}" do user-agent.
  if (usuario) {
    sidebarLogado.style.display = "";
    navLogado.style.display = "";
    navPublico.style.display = "none";

    const navNome = document.getElementById("nav-usuario-nome");
    if (navNome) navNome.textContent = `${usuario.nome} · ${usuario.tipo}`;

    // Links que levavam pra index.html (página pública) passam a levar pra home-logado.html
    document.querySelectorAll("[data-home-link]").forEach((el) => {
      el.setAttribute("href", "home-logado.html");
    });
  } else {
    sidebarLogado.style.display = "none";
    navLogado.style.display = "none";
    navPublico.style.display = "";
  }
});
