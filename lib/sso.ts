import crypto from 'crypto'

// Gera o token de SSO para entrar no Obrigô (GestorOA) sem novo login.
// Formato compacto autoassinado (HMAC-SHA256): "<payloadb64url>.<sigb64url>".
// O Obrigô valida com o mesmo segredo (server/src/lib/ssoToken.ts).

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function signSsoToken(
  payload: { email: string; nome?: string | null; role?: string | null },
  secret: string,
  ttlSec = 120,
): string {
  const agora = Math.floor(Date.now() / 1000)
  const body = {
    email: payload.email,
    nome: payload.nome ?? undefined,
    role: payload.role ?? undefined,
    iat: agora,
    exp: agora + ttlSec,
  }
  const data = b64url(Buffer.from(JSON.stringify(body)))
  const sig = b64url(crypto.createHmac('sha256', secret).update(data).digest())
  return `${data}.${sig}`
}
