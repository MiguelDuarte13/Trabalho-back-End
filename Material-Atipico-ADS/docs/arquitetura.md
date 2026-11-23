# Arquitetura — Material Atípico

Todos os diagramas abaixo são [Mermaid](https://mermaid.js.org/) e são renderizados automaticamente pelo GitHub.

## 1. Visão geral (camadas)

O sistema é uma aplicação web **multipágina estática**. Não há servidor na versão entregue: o navegador executa HTML + CSS + JavaScript puro e a persistência fica no `localStorage` / `sessionStorage`. A camada de dados (`sessao.js` + `materiais-store.js`) concentra todas as regras de negócio e é o único código que toca o storage — por isso foi possível escrever o `backend/` como um espelho 1:1 dessas regras.

```mermaid
flowchart TB
    subgraph NAV["Navegador do usuário"]
        direction TB
        subgraph APR["Apresentação — frontend/paginas + css"]
            P1["15 páginas HTML"]
            P2["css/*.css (1 por página)"]
        end
        subgraph CTL["Controladores de página — frontend/js"]
            C1["auth.js · criar.js · admin.js<br/>adminrevisao.js · material.js<br/>detalhesMaterial.js · perfil.js ..."]
        end
        subgraph DAD["Camada de dados e regras — frontend/js"]
            D1["sessao.js<br/>usuários e sessão"]
            D2["materiais-store.js<br/>materiais, favoritos, avaliações"]
        end
        subgraph STO["Armazenamento do navegador"]
            S1[("localStorage<br/>persistente")]
            S2[("sessionStorage<br/>vale só na aba")]
        end
    end
    P1 --> C1
    C1 --> D1
    C1 --> D2
    D1 --> S1
    D1 --> S2
    D2 --> S1

    subgraph SRV["backend/ — API REST (Node + Express)"]
        R["routes.js"] --> DB[("data/db.json")]
    end
    DAD -. "mesmas regras,<br/>versão servidor" .- R
```

## 2. Mapa de navegação (páginas)

```mermaid
flowchart LR
    IDX["index.html<br/>Home pública"] --> LOGIN["login.html<br/>Login / Cadastro"]
    IDX --> SOBRE["sobre.html"]
    IDX --> CONTATO["contato.html"]
    LOGIN -->|login ok| HOME["home-logado.html"]
    HOME --> MAT["material.html<br/>Biblioteca"]
    HOME --> CRIAR["criar.html"]
    HOME --> MEUS["meus-materiais.html"]
    HOME --> SALVOS["materiais-salvos.html"]
    HOME --> PERFIL["perfil.html"]
    HOME --> CONF["configuracoes.html"]
    MAT --> DET["detalhesMaterial.html?id="]
    SALVOS --> DET
    CRIAR -->|enviar| MEUS
    MEUS --> EDIT["editarMaterial.html?id="]
    EDIT --> MEUS
    PERFIL --> CONF
    HOME -. "só Admin" .-> ADMIN["admin.html<br/>Materiais · Mensagens · Usuários"]
    ADMIN --> REV["adminrevisao.html?id="]
    REV -->|aprovar / rejeitar| ADMIN
    CONTATO -. "grava mensagem" .-> ADMIN
```

## 3. Casos de uso

O usuário logado também realiza tudo o que o visitante faz, e o administrador também realiza tudo o que o usuário logado faz.

```mermaid
flowchart TB
    subgraph VIS["Visitante"]
        V1["Ver home, sobre e contato"]
        V2["Enviar mensagem de contato"]
        V3["Cadastrar-se / entrar"]
    end
    subgraph USR["Usuário logado (Educador, Familiar, Terapeuta, Estudante, Outro)"]
        U1["Pesquisar e filtrar a biblioteca"]
        U2["Ver detalhes, avaliar e favoritar"]
        U3["Criar material (vai para aprovação)"]
        U4["Editar e acompanhar meus materiais"]
        U5["Editar perfil, senha e notificações"]
    end
    subgraph ADM["Administrador"]
        A1["Aprovar, rejeitar, bloquear e excluir materiais"]
        A2["Ler mensagens de contato"]
        A3["Bloquear e excluir contas"]
    end
    VIS -->|"login"| USR
    USR -->|"tipo = Admin"| ADM
```

## 4. Dependência de scripts por página

Cada página carrega **sempre** `sessao.js` primeiro; páginas que manipulam materiais carregam também `materiais-store.js`; por fim, o controlador próprio.

```mermaid
flowchart LR
    subgraph LIB["Bibliotecas compartilhadas"]
        SES["sessao.js"]
        STORE["materiais-store.js"]
        HT["header-toggle.js"]
    end
    login.html --> SES --> auth.js
    criar.html --> SES & STORE --> criar.js
    material.html --> SES & STORE --> material.js
    detalhesMaterial.html --> SES & STORE --> detalhesMaterial.js
    meus-materiais.html --> SES & STORE --> meus_materiais.js
    editarMaterial.html --> SES & STORE --> editarMaterial.js
    materiais-salvos.html --> SES & STORE --> materiais-salvos.js
    perfil.html --> SES & STORE --> perfil.js
    configuracoes.html --> SES & STORE --> configuracoes.js
    home-logado.html --> SES & STORE --> home-logado.js
    admin.html --> SES & STORE --> admin.js
    adminrevisao.html --> SES & STORE --> adminrevisao.js
    contato.html --> SES & HT --> contato.js
    sobre.html --> SES & HT --> sobre.js
    index.html --> home.js
```

## 5. Sequência — cadastro e login

```mermaid
sequenceDiagram
    actor U as Usuário
    participant L as login.html
    participant A as auth.js
    participant S as sessao.js
    participant LS as localStorage
    participant SS as sessionStorage
    U->>L: preenche cadastro
    L->>A: clique em "Criar Conta"
    A->>A: valida campos, e-mail, senha ≥ 6, termos
    A->>S: getUsuarios()
    S->>LS: lê ma_usuarios
    alt e-mail já existe
        A-->>U: "Email já cadastrado."
    else novo
        A->>S: salvarUsuarios([...lista, novo])
        S->>LS: grava ma_usuarios
        A-->>U: "Conta criada com sucesso!"
    end
    U->>A: login (e-mail + senha)
    A->>S: getUsuarios()
    alt credenciais inválidas
        A-->>U: "Email ou senha incorretos."
    else conta bloqueada
        A-->>U: "Conta bloqueada pelo administrador."
    else ok
        A->>S: salvarUsuarioLogado(sem senha)
        S->>SS: grava ma_usuario_logado
        A-->>U: redireciona para home-logado.html
    end
```

## 6. Sequência — do envio à publicação de um material

```mermaid
sequenceDiagram
    actor Au as Autor
    actor Ad as Admin
    participant CR as criar.js
    participant ST as materiais-store.js
    participant LS as localStorage
    participant AD as admin.js / adminrevisao.js
    participant VT as material.js (vitrine)
    Au->>CR: preenche formulário + arquivo
    CR->>CR: valida (título, categoria, tipo, descrição ≥ 100, arquivo, declaração)
    CR->>ST: salvarMaterial({status:"pendente"})
    ST->>LS: materialatipico:materiais
    CR-->>Au: "Material enviado para aprovação"
    Ad->>AD: abre admin.html (fila)
    AD->>ST: obterMateriaisCriados()
    Ad->>AD: revisa em adminrevisao.html?id=…
    AD->>ST: atualizarStatusMaterial(id, "aprovado" | "rejeitado")
    ST->>LS: grava novo status
    VT->>ST: obterMateriaisPublicos()
    ST-->>VT: só status == "aprovado" (+ 3 materiais base)
```

## 7. Máquina de estados do material

```mermaid
stateDiagram-v2
    [*] --> pendente: criar.js · salvarMaterial
    pendente --> aprovado: admin aprova
    pendente --> rejeitado: admin rejeita
    aprovado --> bloqueado: admin bloqueia
    bloqueado --> aprovado: admin desbloqueia
    aprovado --> pendente: autor edita (editarMaterialStore)
    rejeitado --> pendente: autor edita e reenvia
    bloqueado --> pendente: autor edita
    pendente --> [*]: admin exclui
    aprovado --> [*]: admin exclui
    rejeitado --> [*]: admin exclui
    bloqueado --> [*]: admin exclui
```

## 8. Arquitetura do `backend/`

A API não é consumida pelo front-end atual (que usa o localStorage), mas implementa as mesmas regras e pode substituir o `materiais-store.js` / `sessao.js` quando o projeto evoluir.

```mermaid
flowchart LR
    CL["Cliente HTTP<br/>(front-end / curl)"] -->|"/api/*  JSON"| APP["app.js<br/>express.json + CORS"]
    APP --> RT["routes.js"]
    RT --> MW["middleware.js<br/>exigirLogin · exigirAdmin"]
    MW --> TK["auth.js<br/>token HMAC-SHA256"]
    RT --> MD["models.js<br/>validação e constantes"]
    RT --> DBM["db.js<br/>scrypt + persistência"]
    DBM --> F[("data/db.json")]
```

### Endpoints

| Grupo | Método e rota | Acesso | Equivalente no front-end |
|---|---|---|---|
| Auth | `POST /api/auth/cadastro` · `POST /api/auth/login` | público | `auth.js` |
| Perfil | `GET/PATCH /api/me` · `PUT /api/me/senha` | logado | `configuracoes.js`, `perfil.js` |
| Materiais | `GET /api/materiais` (aprovados; `?categoria=&tipo=&q=`) | público | `obterMateriaisPublicos` |
| | `GET /api/materiais?meus=true` | logado | `obterMateriaisPorAutor` |
| | `GET /api/materiais/:id` | público se aprovado; dono/admin nos demais | `obterMaterialPorId` |
| | `POST /api/materiais` (entra como `pendente`) | logado | `criar.js` |
| | `PUT /api/materiais/:id` (volta a `pendente`) | dono ou admin | `editarMaterialStore` |
| | `PATCH /api/materiais/:id/status` · `DELETE /api/materiais/:id` | admin | `atualizarStatusMaterial`, `excluirMaterial` |
| Favoritos | `GET /api/favoritos` · `POST /api/favoritos/:id` (alterna) | logado | `alternarFavorito` |
| Avaliações | `GET /api/materiais/:id/avaliacoes` | público | `obterResumoAvaliacoes` |
| | `PUT /api/materiais/:id/avaliacoes` (1 por usuário) | logado | `salvarAvaliacao` |
| Contato | `POST /api/contato` | público | `contato.js` |
| Admin | `GET /api/admin/materiais` · `GET /api/admin/mensagens` · `PATCH /api/admin/mensagens/:id/lida` | admin | `admin.js` |
| | `GET /api/admin/usuarios` · `PATCH …/:email/bloqueio` · `DELETE …/:email` | admin | `admin.js` (aba Usuários) |
