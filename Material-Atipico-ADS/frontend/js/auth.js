// CHAVE_LOGADO, getUsuarios, salvarUsuarios vêm de sessao.js (carregado antes deste script)
sessionStorage.removeItem(CHAVE_LOGADO);

// Exibe uma mensagem de feedback abaixo do formulário
// tipo pode ser 'erro' (vermelho) ou 'sucesso' (verde)
function mostrarMsg(id, texto, tipo) {
  const el = document.getElementById(id);
  el.textContent = texto;
  el.className = 'form-msg ' + tipo;
  el.hidden = false;
}

// ---------- CADASTRO ----------
document.getElementById('btn-cadastro').addEventListener('click', function () {
  const nome     = document.getElementById('cad-nome').value.trim();
  const email    = document.getElementById('cad-email').value.trim();
  const senha    = document.getElementById('cad-senha').value;
  const confirma = document.getElementById('cad-confirma').value;
  const tipo     = document.getElementById('cad-tipo').value;
  const termos   = document.getElementById('termos').checked;

  // Validações básicas
  if (!nome || !email || !senha || !tipo) {
    mostrarMsg('msg-cadastro', 'Preencha todos os campos.', 'erro');
    return;
  }
  if (!document.getElementById('cad-email').checkValidity()) {
    mostrarMsg('msg-cadastro', 'Digite um email válido.', 'erro');
    return;
  }
  if (senha !== confirma) {
    mostrarMsg('msg-cadastro', 'As senhas não coincidem.', 'erro');
    return;
  }
  if (senha.length < 6) {
    mostrarMsg('msg-cadastro', 'Senha deve ter pelo menos 6 caracteres.', 'erro');
    return;
  }
  if (!termos) {
    mostrarMsg('msg-cadastro', 'Aceite os termos para continuar.', 'erro');
    return;
  }

  const usuarios = getUsuarios();

  // Verifica se o email já existe
  if (usuarios.find(u => u.email === email)) {
    mostrarMsg('msg-cadastro', 'Email já cadastrado.', 'erro');
    return;
  }

  // Cria o objeto do novo usuário (seguindo o modelo do usuarios.json)
  const novoUsuario = {
    nome: nome,
    email: email,
    senha: senha,
    tipo: tipo,
    biografia: '',
    criadoEm: new Date().toISOString(),
    notificacoes: {
      materialAprovado: true,
      novasAvaliacoes:  true,
      newsletter:       false
    }
  };

  usuarios.push(novoUsuario);
  salvarUsuarios(usuarios);

  mostrarMsg('msg-cadastro', 'Conta criada com sucesso! Faça login.', 'sucesso');

  // Volta para aba de login após 1.5s
  setTimeout(() => {
    document.getElementById('radio-login').checked = true;
  }, 1500);
});

// ---------- LOGIN ----------
document.getElementById('btn-login').addEventListener('click', function () {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;

  if (!email || !senha) {
    mostrarMsg('msg-login', 'Preencha email e senha.', 'erro');
    return;
  }
  if (!document.getElementById('login-email').checkValidity()) {
    mostrarMsg('msg-login', 'Digite um email válido.', 'erro');
    return;
  }

  const usuarios = getUsuarios();

  // Procura usuário com email E senha correspondentes
  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

  if (!usuario) {
    mostrarMsg('msg-login', 'Email ou senha incorretos.', 'erro');
    return;
  }

  // Conta bloqueada pelo administrador
  if (usuario.bloqueada) {
    mostrarMsg('msg-login', 'Conta bloqueada pelo administrador. Entre em contato com o suporte.', 'erro');
    return;
  }

  // Salva os dados do usuário logado (sem a senha por boa prática)
  const usuarioLogado = {
    nome: usuario.nome,
    email: usuario.email,
    tipo: usuario.tipo,
    biografia: usuario.biografia,
    criadoEm: usuario.criadoEm,
    notificacoes: usuario.notificacoes
  };

  salvarUsuarioLogado(usuarioLogado);

  // Redireciona para a home do usuário logado
  window.location.href = '/paginas/home-logado.html';
});

