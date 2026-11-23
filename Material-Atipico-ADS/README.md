# Material Atípico

Plataforma colaborativa para **compartilhar materiais educacionais adaptados** para pessoas atípicas (TEA, TDAH, dislexia e outras necessidades). Educadores, familiares e terapeutas publicam materiais, a equipe de administração revisa e aprova, e a comunidade pesquisa, avalia e salva o que for útil.

Projeto da disciplina de **Análise e Desenvolvimento de Sistemas (ADS)**.

## O que o sistema faz

| Perfil | Funcionalidades |
|---|---|
| **Visitante** | Ver home, sobre e contato; enviar mensagem de contato; cadastrar-se e entrar |
| **Usuário** (Educador, Familiar/Responsável, Terapeuta, Estudante, Outro) | Pesquisar e filtrar a biblioteca por categoria e tipo; ver detalhes; **avaliar** (1–5 estrelas + comentário) e **favoritar**; **criar**, editar e acompanhar o status dos próprios materiais; editar perfil, senha e notificações |
| **Administrador** | Fila de moderação (**aprovar, rejeitar, bloquear, excluir** materiais); caixa de mensagens de contato; **bloquear/excluir contas** |

Fluxo central: todo material enviado entra como `pendente` → o admin aprova ou rejeita → só os `aprovados` aparecem na vitrine pública. Editar um material volta o status para `pendente`.

## Estrutura do repositório

```
Material-Atipico-ADS/
├── frontend/                 Código do front-end (HTML, CSS e JS puro)
│   ├── index.html            Home pública
│   ├── paginas/              14 páginas internas (login, biblioteca, criar, admin…)
│   ├── css/                  Estilos (um arquivo por página + style.css global)
│   ├── js/                   Controladores de página + camada de dados (sessao.js, materiais-store.js)
│   ├── images/               Fotos da equipe
│   └── data/usuarios.json    Documentação do formato de usuário
├── backend/                  Código do back-end (API REST em Node.js + Express)
│   ├── src/                  app, rotas, modelos, auth, middleware, persistência
│   └── test/                 Testes automatizados (node:test)
└── docs/
    ├── arquitetura.md        Diagramas de arquitetura (camadas, navegação, casos de uso, sequências, estados, API)
    ├── json.md               Diagramas e exemplos do JSON (ER, chaves de storage, estrutura em árvore)
    ├── telas.md              Prints das 18 telas com explicação e caminho do código
    ├── json/                 Exemplos reais de JSON extraídos do navegador
    └── img/telas/            Capturas de tela
```

## Documentação

| Seção | Arquivo |
|---|---|
| 🏗️ Diagramas da arquitetura | [`docs/arquitetura.md`](docs/arquitetura.md) |
| 🧾 Diagramas do JSON | [`docs/json.md`](docs/json.md) |
| 🖥️ Prints das telas, explicações e caminhos do código | [`docs/telas.md`](docs/telas.md) |
| 📁 Código do front-end | [`frontend/`](frontend/) |
| 📁 Código do back-end | [`backend/`](backend/) |

## Como executar

### Front-end (versão entregue)

As páginas usam caminhos absolutos (`/js/sessao.js`), então a pasta `frontend/` precisa ser a **raiz** do servidor:

```bash
cd frontend
python3 -m http.server 8000      # ou: npx serve .
# abra http://localhost:8000
```

Conta de administrador (criada automaticamente): `admin@materialatipico.com` / `admin123`.

### Back-end (API)

```bash
cd backend
npm install
npm start          # http://localhost:3000/api/saude
npm test           # 2 testes de integração cobrindo o fluxo completo
```

Variáveis opcionais: `PORT`, `TOKEN_SECRET`, `ADMIN_PASSWORD`, `DB_FILE`. Detalhes e lista de endpoints em [`backend/README.md`](backend/README.md).

## Tecnologias

- **Front-end:** HTML5, CSS3, JavaScript (ES6+) sem frameworks, Font Awesome via CDN.
- **Persistência no navegador:** `localStorage` (usuários, materiais, favoritos, avaliações, mensagens) e `sessionStorage` (sessão).
- **Back-end:** Node.js 18+, Express 4, persistência em arquivo JSON, hash de senha com `scrypt`, token assinado com HMAC-SHA256.
- **Diagramas:** Mermaid (renderizado nativamente pelo GitHub).

## Estado atual e limitações

- O **front-end é independente**: toda a lógica e os dados vivem no navegador (`localStorage`). Dados não são compartilhados entre usuários/dispositivos.
- O **back-end é uma implementação de referência** das mesmas regras de negócio (mesmo modelo de dados e mesmo fluxo de status). **Ainda não está conectado ao front-end**; a integração consiste em trocar as chamadas de `sessao.js` e `materiais-store.js` por `fetch` aos endpoints descritos em [`docs/arquitetura.md`](docs/arquitetura.md#endpoints).
- No front-end as senhas ficam em **texto puro** no `localStorage` e a conta admin tem senha fixa — aceitável para protótipo acadêmico, **não** para produção. O back-end já usa hash e token.
- Upload de arquivos é simulado: o front guarda apenas o nome do arquivo (e a capa como `dataURL`).

## Equipe

Veja a página [Sobre nós](docs/telas.md#02-sobre) e os perfis do GitHub listados em [Contato](docs/telas.md#03-contato).
