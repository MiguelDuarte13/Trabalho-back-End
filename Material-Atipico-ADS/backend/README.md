# Back-end — API Material Atípico

API REST em **Node.js + Express** que implementa as mesmas regras de negócio do front-end (`frontend/js/sessao.js`, `materiais-store.js` e controladores), com persistência em `data/db.json`.

```bash
npm install
npm start      # http://localhost:3000/api
npm test
```

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | `3000` | porta HTTP |
| `TOKEN_SECRET` | valor de desenvolvimento | segredo de assinatura dos tokens — **defina em produção** |
| `ADMIN_PASSWORD` | `admin123` | senha da conta admin criada na primeira execução |
| `DB_FILE` | `data/db.json` | arquivo de dados |

## Estrutura

| Arquivo | Responsabilidade |
|---|---|
| `src/server.js` | sobe o servidor |
| `src/app.js` | Express, JSON, CORS, tratamento de erros |
| `src/routes.js` | todos os endpoints (agrupados por domínio) |
| `src/middleware.js` | `exigirLogin`, `exigirAdmin` |
| `src/auth.js` | emissão/validação do token `Bearer` (HMAC-SHA256, 8 h) |
| `src/models.js` | constantes (categorias, tipos, status), materiais de fábrica, validações |
| `src/db.js` | leitura/gravação do JSON, hash `scrypt`, seed do admin |
| `test/api.test.js` | testes de integração |

## Exemplo

```bash
curl -s localhost:3000/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@materialatipico.com","senha":"admin123"}'
# → {"token":"...","usuario":{...}}

curl -s localhost:3000/api/materiais                       # vitrine pública
curl -s localhost:3000/api/admin/materiais -H "Authorization: Bearer <token>"
```

A tabela completa de endpoints está em [`../docs/arquitetura.md`](../docs/arquitetura.md#endpoints). Regras principais:

- `POST /api/materiais` sempre cria com `status: "pendente"`; só `PATCH /api/materiais/:id/status` (admin) publica.
- `PUT /api/materiais/:id` (dono ou admin) devolve o material para `pendente`.
- Uma avaliação por usuário e material; a nova substitui a anterior.
- Contas bloqueadas não conseguem logar nem usar tokens já emitidos.
- A senha nunca é devolvida pela API.
