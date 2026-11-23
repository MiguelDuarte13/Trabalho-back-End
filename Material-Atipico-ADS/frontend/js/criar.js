// =====================================================
//  PÁGINA: CRIAR MATERIAL
// =====================================================

const usuarioLogado = exigirLogin(); // sessao.js — redireciona pra login.html se não logado

const navNomeCriar = document.getElementById('nav-usuario-nome');
if (navNomeCriar && usuarioLogado) navNomeCriar.textContent = `${usuarioLogado.nome} · ${usuarioLogado.tipo}`;

const Store = window.MaterialAtipicoStore;
let capaDataUrl = null;

// ── Upload de Arquivo (com Drag and Drop) ──
const inputArquivo = document.getElementById("input-arquivo");
const uploadArea   = document.getElementById("upload-area");

// Usuário seleciona o arquivo pelo botão "Selecionar Arquivo"
inputArquivo.addEventListener("change", function () {
  mostrarInfoArquivo(this.files[0], uploadArea);
});

// Drag: enquanto o arquivo está sendo arrastado sobre a área, destaca ela
uploadArea.addEventListener("dragover", function (e) {
  e.preventDefault(); // sem isso o drop não funciona
  uploadArea.classList.add("drag-ativo");
});

// Drag: arquivo saiu da área sem soltar
uploadArea.addEventListener("dragleave", function () {
  uploadArea.classList.remove("drag-ativo");
});

// Drop: arquivo foi solto na área
uploadArea.addEventListener("drop", function (e) {
  e.preventDefault();
  uploadArea.classList.remove("drag-ativo");
  const arquivo = e.dataTransfer.files[0];
  if (arquivo) mostrarInfoArquivo(arquivo, uploadArea);
});


// ── Preview da Imagem de Capa ──
const inputCapa = document.getElementById("input-capa");
const capaArea  = document.querySelector(".capa-area");

inputCapa.addEventListener("change", function () {
  const arquivo = this.files[0];
  if (!arquivo) return;

  // FileReader lê o arquivo localmente e gera uma URL para exibir no <img>
  const leitor = new FileReader();
  leitor.onload = function (e) {
    capaDataUrl = e.target.result;
    capaArea.innerHTML = `<img src="${e.target.result}" style="max-height:150px; border-radius:8px;" alt="Pré-visualização da capa" />`;
  };
  leitor.readAsDataURL(arquivo);
});


// ── Contador de Caracteres na Descrição ──
const campoDescricao = document.getElementById("textarea-descricao");
const contadorChars  = document.getElementById("contador-chars");

campoDescricao.addEventListener("input", function () {
  const total = this.value.length;
  contadorChars.textContent = `${total} / 100 caracteres mínimos`;
  // Verde se atingiu o mínimo, cinza se ainda não
  contadorChars.style.color = total >= 100 ? "green" : "#888";
});


// ── Validação e Envio do Formulário ──
document.getElementById("btn-enviar").addEventListener("click", function () {

  // Coleta os valores dos campos obrigatórios
  const titulo     = document.getElementById("input-titulo").value.trim();
  const categoria  = document.getElementById("select-categoria").value;
  const tipo       = document.getElementById("select-tipo").value;
  const descricao  = document.getElementById("textarea-descricao").value.trim();
  const arquivo    = document.getElementById("input-arquivo").files[0];
  const declaracao = document.getElementById("declaracao-check").checked;

  // Verifica campo por campo — para na primeira falha e avisa o usuário
  if (!titulo) {
    alert("Por favor, preencha o título do material.");
    return;
  }
  if (!categoria) {
    alert("Por favor, selecione uma categoria.");
    return;
  }
  if (!tipo) {
    alert("Por favor, selecione o tipo de material.");
    return;
  }
  if (descricao.length < 100) {
    alert("A descrição precisa ter no mínimo 100 caracteres.");
    return;
  }
  if (!arquivo) {
    alert("Por favor, selecione o arquivo do material.");
    return;
  }
  if (!declaracao) {
    alert("Você precisa marcar a declaração de autoria para continuar.");
    return;
  }

  // Tudo preenchido corretamente! Salva no store real (puxado depois em
  // meus-materiais.html, perfil.html e material.html).
  Store.salvarMaterial({
    id: Store.gerarId("m"),
    titulo,
    categoria,
    tipo,
    descricao,
    tags: [],
    downloads: 0,
    avaliacao: 0,
    capa: capaDataUrl,
    arquivoNome: arquivo.name,
    criadoEm: new Date().toISOString(),
    autor: usuarioLogado.nome,
    autorEmail: usuarioLogado.email,
    status: "pendente",
  });

  alert("Material enviado para aprovação! O administrador irá analisá-lo em breve.");
  window.location.href = "meus-materiais.html";
});


// ── Função auxiliar ──
// Atualiza o texto dentro da área de upload mostrando nome e tamanho do arquivo.
function mostrarInfoArquivo(arquivo, area) {
  if (!arquivo) return;
  const tamanhoMB = (arquivo.size / 1024 / 1024).toFixed(2);
  area.querySelector(".upload-texto").textContent    = `Arquivo: ${arquivo.name}`;
  area.querySelector(".upload-formatos").textContent = `Tamanho: ${tamanhoMB} MB`;
}
