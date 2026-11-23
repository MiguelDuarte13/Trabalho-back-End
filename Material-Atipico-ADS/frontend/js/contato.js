// ── PÁGINA DE CONTATO ──────────────────────────────────────────
// Salva a mensagem pra fila de revisão do admin (aba "Mensagens" em admin.html).

const CHAVE_MENSAGENS = "ma_mensagens_contato";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-contato");
  if (!form) return;

  form.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const assunto = document.getElementById("assunto").value;
    const mensagem = document.getElementById("mensagem").value.trim();

    if (!nome || !email || !mensagem) {
      mostrarMsg("Preencha nome, email e mensagem.", "erro");
      return;
    }

    const mensagens = JSON.parse(localStorage.getItem(CHAVE_MENSAGENS) || "[]");
    mensagens.push({
      nome: nome,
      email: email,
      assunto: assunto === "Selecione um assunto" ? "" : assunto,
      mensagem: mensagem,
      criadoEm: new Date().toISOString(),
      lida: false,
    });
    localStorage.setItem(CHAVE_MENSAGENS, JSON.stringify(mensagens));

    mostrarMsg("Mensagem enviada! Nossa equipe vai responder em breve.", "sucesso");
    form.reset();
  });

  function mostrarMsg(texto, tipo) {
    const el = document.getElementById("msg-contato");
    if (!el) return;
    el.textContent = texto;
    el.style.color = tipo === "erro" ? "#dc2626" : "#16a34a";
    el.style.fontWeight = "600";
    el.hidden = false;
  }
});
