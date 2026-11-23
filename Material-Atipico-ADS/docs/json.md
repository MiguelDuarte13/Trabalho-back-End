# Estrutura dos dados (JSON)

A aplicação guarda **cinco coleções no `localStorage`** e **um objeto no `sessionStorage`**. Os exemplos abaixo foram extraídos do próprio navegador com a aplicação rodando (arquivos completos em [`docs/json/`](json/)). O arquivo original `frontend/data/usuarios.json` documenta apenas a estrutura de usuário.

## 1. Mapa das chaves de armazenamento

```mermaid
flowchart LR
    subgraph LS["localStorage (persiste entre sessões)"]
        K1["ma_usuarios<br/>Array&lt;Usuario&gt;"]
        K2["materialatipico:materiais<br/>Array&lt;Material&gt;"]
        K3["materialatipico:favoritos<br/>Map&lt;email, materialId[]&gt;"]
        K4["materialatipico:avaliacoes<br/>Map&lt;materialId, Avaliacao[]&gt;"]
        K5["ma_mensagens_contato<br/>Array&lt;Mensagem&gt;"]
    end
    subgraph SS["sessionStorage (só na aba)"]
        K6["ma_usuario_logado<br/>Usuario sem senha"]
    end
    F1["sessao.js"] --> K1
    F1 --> K6
    F2["materiais-store.js"] --> K2
    F2 --> K3
    F2 --> K4
    F3["contato.js / admin.js"] --> K5
```

## 2. Modelo de entidades e relacionamentos

As relações são lógicas (por **e-mail** e por **id**), pois o storage não tem chave estrangeira.

```mermaid
erDiagram
    USUARIO ||--o{ MATERIAL : "publica (autorEmail)"
    USUARIO ||--o{ FAVORITO : "salva (chave = email)"
    USUARIO ||--o{ AVALIACAO : "escreve (usuarioId = email)"
    MATERIAL ||--o{ FAVORITO : "é salvo em"
    MATERIAL ||--o{ AVALIACAO : "recebe (chave = materialId)"
    USUARIO {
        string nome
        string email PK
        string senha
        string tipo "Educador | Familiar / Responsável | Terapeuta | Estudante | Outro | Admin"
        string biografia
        string criadoEm "ISO 8601"
        boolean bloqueada "opcional, definido pelo admin"
        object notificacoes "materialAprovado, novasAvaliacoes, newsletter"
    }
    MATERIAL {
        string id PK "m-&lt;tempo&gt;-&lt;aleatorio&gt; ou seed-N"
        string titulo
        string categoria "tea | tdah | dislexia | outros"
        string tipo "atividade | plano | jogo | visual | video"
        string descricao "mínimo 100 caracteres"
        string[] tags
        int downloads
        float avaliacao
        string capa "dataURL ou null"
        string arquivoNome
        string criadoEm "ISO 8601"
        string autor
        string autorEmail FK
        string status "pendente | aprovado | rejeitado | bloqueado"
        string editadoEm "opcional"
        boolean base "true nos 3 materiais de fábrica"
    }
    FAVORITO {
        string usuarioEmail FK
        string[] materialIds
    }
    AVALIACAO {
        string usuarioId FK
        string materialId FK
        int estrelas "1 a 5"
        string comentario
        string criadoEm "ISO 8601"
    }
    MENSAGEM_CONTATO {
        string nome
        string email
        string assunto
        string mensagem
        string criadoEm "ISO 8601"
        boolean lida
    }
```

## 3. Estrutura do JSON de cada chave (visão em árvore)

```mermaid
flowchart LR
    R1["ma_usuarios"] --> A1["[ ]"] --> U["Usuario { }"]
    U --> u1["nome · email · senha · tipo"]
    U --> u2["biografia · criadoEm · bloqueada?"]
    U --> u3["notificacoes { }"] --> u4["materialAprovado · novasAvaliacoes · newsletter"]

    R2["materialatipico:materiais"] --> A2["[ ]"] --> M["Material { }"]
    M --> m1["id · titulo · categoria · tipo · descricao"]
    M --> m2["tags[ ] · downloads · avaliacao · capa"]
    M --> m3["arquivoNome · criadoEm · editadoEm?"]
    M --> m4["autor · autorEmail · status"]

    R3["materialatipico:favoritos"] --> F["{ }"] --> f1["'email' : [ 'materialId', … ]"]
    R4["materialatipico:avaliacoes"] --> V["{ }"] --> v1["'materialId' : [ Avaliacao ]"] --> v2["usuarioId · estrelas · comentario · criadoEm"]
    R5["ma_mensagens_contato"] --> A5["[ ]"] --> C["Mensagem { }"] --> c1["nome · email · assunto · mensagem · criadoEm · lida"]
```

## 4. Exemplos reais

### `ma_usuarios` — [`docs/json/ma_usuarios.json`](json/ma_usuarios.json)
Escrito por `sessao.js` (`seedAdmin`), `auth.js` (cadastro), `configuracoes.js` e `admin.js` (bloqueio / exclusão). A conta `admin@materialatipico.com` é criada automaticamente na primeira visita.
```json
[
  {
    "nome": "Administrador",
    "email": "admin@materialatipico.com",
    "senha": "admin123",
    "tipo": "Admin",
    "biografia": "Conta de administração da plataforma.",
    "criadoEm": "2026-11-23T20:10:00.000Z",
    "notificacoes": {
      "materialAprovado": true,
      "novasAvaliacoes": true,
      "newsletter": false
    }
  },
  {
    "nome": "Maria Silva",
    "email": "maria.silva@email.com",
    "senha": "senha123",
    "tipo": "Educador",
    "biografia": "",
    "criadoEm": "2026-11-23T20:10:00.000Z",
    "notificacoes": {
      "materialAprovado": true,
      "novasAvaliacoes": true,
      "newsletter": false
    }
  }
]
```

### `ma_usuario_logado` (sessionStorage) — [`docs/json/ma_usuario_logado.sessionStorage.json`](json/ma_usuario_logado.sessionStorage.json)
Cópia do usuário **sem a senha**, gravada por `auth.js` no login e removida em `logout()`.
```json
{
  "nome": "Maria Silva",
  "email": "maria.silva@email.com",
  "tipo": "Educador",
  "biografia": "",
  "criadoEm": "2026-11-23T20:10:00.000Z",
  "notificacoes": {
    "materialAprovado": true,
    "novasAvaliacoes": true,
    "newsletter": false
  }
}
```

### `materialatipico:materiais` — [`docs/json/materialatipico_materiais.json`](json/materialatipico_materiais.json)
Escrito por `criar.js`, `editarMaterial.js` e `admin*.js`. Somente materiais criados por usuários ficam aqui; os 3 materiais de fábrica (`seed-1..3`) estão fixos em `materiais-store.js` (`MATERIAIS_BASE`).
```json
[
  {
    "id": "m-lx2k9a-4fz8qd",
    "titulo": "Rotina Visual com Pictogramas",
    "categoria": "tea",
    "tipo": "visual",
    "descricao": "Material elaborado e testado em sala de aula, com instruções claras para educadores e familiares.",
    "tags": [],
    "downloads": 0,
    "avaliacao": 0,
    "capa": null,
    "arquivoNome": "rotina-visual.pdf",
    "criadoEm": "2026-11-23T20:15:00.000Z",
    "autor": "Maria Silva",
    "autorEmail": "maria.silva@email.com",
    "status": "pendente"
  }
]
```

### `materialatipico:favoritos` — [`docs/json/materialatipico_favoritos.json`](json/materialatipico_favoritos.json)
```json
{
  "maria.silva@email.com": [
    "seed-1"
  ]
}
```

### `materialatipico:avaliacoes` — [`docs/json/materialatipico_avaliacoes.json`](json/materialatipico_avaliacoes.json)
Um usuário tem no máximo uma avaliação por material (a nova substitui a antiga).
```json
{
  "seed-1": [
    {
      "usuarioId": "maria.silva@email.com",
      "estrelas": 5,
      "comentario": "Excelente material!",
      "criadoEm": "2026-11-23T20:16:00.000Z"
    }
  ]
}
```

### `ma_mensagens_contato` — [`docs/json/ma_mensagens_contato.json`](json/ma_mensagens_contato.json)
```json
[
  {
    "nome": "Carlos Souza",
    "email": "carlos@email.com",
    "assunto": "",
    "mensagem": "Quero colaborar com materiais para TDAH.",
    "criadoEm": "2026-11-23T20:05:00.000Z",
    "lida": false
  }
]
```

## 5. Diferenças entre o JSON do navegador e o do `backend/`

| Aspecto | Front-end (localStorage) | Back-end (`data/db.json`) |
|---|---|---|
| Senha | texto puro | hash `scrypt` com salt (`salt:hash`) |
| Usuários | `ma_usuarios[]` | `usuarios[]` (+ campo `bloqueada` sempre presente) |
| Materiais | `materialatipico:materiais[]` | `materiais[]` |
| Favoritos / avaliações | mesmos mapas | `favoritos{}` e `avaliacoes{}` com a mesma forma |
| Mensagens | sem `id` | com `id` (`c-…`), usado em `PATCH /admin/mensagens/:id/lida` |
| Sessão | `sessionStorage` | token `Bearer` assinado (HMAC-SHA256, 8 h) |
