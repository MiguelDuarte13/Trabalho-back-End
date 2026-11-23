// Token assinado (HMAC-SHA256) no formato  base64url(payload).assinatura
const crypto = require('crypto');
const SEGREDO = process.env.TOKEN_SECRET || 'troque-este-segredo-em-producao';
const VALIDADE_MS = 8 * 60 * 60 * 1000; // 8h

const b64 = (s) => Buffer.from(s).toString('base64url');
const assina = (p) => crypto.createHmac('sha256', SEGREDO).update(p).digest('base64url');

function gerarToken(email) {
  const payload = b64(JSON.stringify({ email, exp: Date.now() + VALIDADE_MS }));
  return `${payload}.${assina(payload)}`;
}

function lerToken(token) {
  const [payload, assinatura] = (token || '').split('.');
  if (!payload || !assinatura) return null;
  const esperada = assina(payload);
  if (assinatura.length !== esperada.length ||
      !crypto.timingSafeEqual(Buffer.from(assinatura), Buffer.from(esperada))) return null;
  const dados = JSON.parse(Buffer.from(payload, 'base64url').toString());
  return dados.exp > Date.now() ? dados : null;
}

module.exports = { gerarToken, lerToken };
