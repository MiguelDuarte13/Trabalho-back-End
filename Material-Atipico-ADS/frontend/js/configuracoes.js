// ── CONFIGURAÇÕES ──────────────────────────────────────────────
// Depende de sessao.js (carregado antes no HTML).

var usuarioLogado = exigirLogin();

window.onload = function () {
    if (!usuarioLogado) return;
    carregarDadosPerfil();
    carregarNotificacoes();
};


// ── INFORMAÇÕES PESSOAIS ────────────────────────────────────────

function carregarDadosPerfil() {
    document.getElementById("nome").value = usuarioLogado.nome;
    document.getElementById("email").value = usuarioLogado.email;
    document.getElementById("tipo").value = usuarioLogado.tipo;
    document.getElementById("bio").value = usuarioLogado.biografia || "";

    var navNome = document.getElementById("nav-usuario-nome");
    if (navNome) navNome.textContent = usuarioLogado.nome + " · " + usuarioLogado.tipo;

    atualizarHeaderPerfil();
    atualizarEstatisticas();
}

// Header estático no topo da página (profile-info) — mostrava "Maria Silva" fixo
function atualizarHeaderPerfil() {
    var nomeHeader = document.querySelector(".profile-info h1");
    if (nomeHeader) nomeHeader.textContent = usuarioLogado.nome;

    var bioHeader = document.querySelector(".profile-bio");
    if (bioHeader) bioHeader.textContent = usuarioLogado.biografia || "Adicione uma bio abaixo.";
}

function atualizarEstatisticas() {
    var Store = window.MaterialAtipicoStore;
    if (!Store) return;

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

    var elSalvos = document.getElementById("stat-salvos");
    if (elSalvos) elSalvos.textContent = Store.obterFavoritos().size;
}

function salvarDadosPerfil() {
    var nome = document.getElementById("nome").value;
    var email = document.getElementById("email").value;
    var tipo = document.getElementById("tipo").value;
    var bio = document.getElementById("bio").value;

    if (nome.trim() === "" || email.trim() === "") {
        alert("Nome e email não podem ficar em branco.");
        return;
    }

    usuarioLogado = atualizarUsuarioLogado({
        nome: nome,
        email: email,
        tipo: tipo,
        biografia: bio
    });

    atualizarHeaderPerfil();

    var navNome = document.getElementById("nav-usuario-nome");
    if (navNome) navNome.textContent = usuarioLogado.nome + " · " + usuarioLogado.tipo;

    alert("Alterações salvas com sucesso!");
}


// ── ALTERAR SENHA ───────────────────────────────────────────────

function alterarSenha() {
    var senhaAtual = document.getElementById("senha-atual").value;
    var novaSenha = document.getElementById("nova-senha").value;
    var confirmarSenha = document.getElementById("confirmar-senha").value;

    if (senhaAtual === "" || novaSenha === "" || confirmarSenha === "") {
        alert("Preencha todos os campos de senha.");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        alert("A nova senha e a confirmação não coincidem.");
        return;
    }

    if (novaSenha.length < 6) {
        alert("A nova senha deve ter pelo menos 6 caracteres.");
        return;
    }

    var usuarios = getUsuarios();
    var registro = usuarios.find(function (u) { return u.email === usuarioLogado.email; });

    if (!registro || registro.senha !== senhaAtual) {
        alert("Senha atual incorreta.");
        return;
    }

    registro.senha = novaSenha;
    salvarUsuarios(usuarios);

    alert("Senha alterada com sucesso!");

    document.getElementById("senha-atual").value = "";
    document.getElementById("nova-senha").value = "";
    document.getElementById("confirmar-senha").value = "";
}


// ── NOTIFICAÇÕES ────────────────────────────────────────────────

function carregarNotificacoes() {
    var notif = usuarioLogado.notificacoes;
    if (!notif) return;

    var checkboxes = document.querySelectorAll(".checkbox-group input[type='checkbox']");

    if (checkboxes[0] !== undefined) checkboxes[0].checked = notif.materialAprovado;
    if (checkboxes[1] !== undefined) checkboxes[1].checked = notif.novasAvaliacoes;
    if (checkboxes[2] !== undefined) checkboxes[2].checked = notif.newsletter;
}

function salvarNotificacoes() {
    var checkboxes = document.querySelectorAll(".checkbox-group input[type='checkbox']");

    var notif = {
        materialAprovado: checkboxes[0].checked,
        novasAvaliacoes: checkboxes[1].checked,
        newsletter: checkboxes[2].checked
    };

    usuarioLogado = atualizarUsuarioLogado({ notificacoes: notif });

    alert("Preferências salvas com sucesso!");
}


// ── LIGA OS BOTÕES ──────────────────────────────────────────────

var botoes = document.querySelectorAll(".btn-primary");

// Botão 1 → Salvar Informações Pessoais
if (botoes[0] !== undefined) {
    botoes[0].onclick = function () {
        salvarDadosPerfil();
    };
}

// Botão 2 → Alterar Senha
if (botoes[1] !== undefined) {
    botoes[1].onclick = function () {
        alterarSenha();
    };
}

// Botão 3 → Salvar Preferências de Notificação
if (botoes[2] !== undefined) {
    botoes[2].onclick = function () {
        salvarNotificacoes();
    };
}
