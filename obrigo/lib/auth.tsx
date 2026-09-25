import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { SessaoAtual } from '@gestoroa/shared';
import { api, setAccessToken } from './api';

interface AuthState {
  sessao: SessaoAtual | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  registrar: (input: RegistrarInput) => Promise<void>;
  logout: () => Promise<void>;
  atualizar: () => Promise<void>;
  impersonadoPor: SessaoAtual | null; // sessao do admin enquanto esta "logado como" outro
  impersonar: (usuarioId: string) => Promise<void>;
  voltarAoAdmin: () => Promise<void>;
}

export interface RegistrarInput {
  escritorio: { nome: string; cnpj?: string };
  admin: { nome: string; email: string; senha: string };
}

const AuthContext = createContext<AuthState | null>(null);

// SSO Nauta -> Obrigo sem tela intermediaria (mesma origem; cookies incluidos).
async function ssoSilencioso(): Promise<boolean> {
  try {
    const r = await fetch('/api/sso/gestoroa?json=1', { credentials: 'include', cache: 'no-store' });
    if (!r.ok) return false;
    const { token, action } = (await r.json()) as { token: string; action: string };
    const s = await fetch(action, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ token }),
    });
    return s.ok;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<SessaoAtual | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [impersonadoPor, setImpersonadoPor] = useState<SessaoAtual | null>(null);

  // Ao carregar, tenta restaurar a sessao via refresh cookie. Sem sessao no Obrigo,
  // entra sozinho pelo SSO da Nauta (o usuario ja esta logado na Nauta): pede o token
  // assinado e apresenta na API do Obrigo, que grava o cookie de refresh.
  useEffect(() => {
    (async () => {
      let ok = await api.refresh();
      if (!ok && (await ssoSilencioso())) ok = await api.refresh();
      if (ok) {
        try {
          const s = await api.get<SessaoAtual>('/auth/me');
          setSessao(s);
        } catch {
          setSessao(null);
        }
      }
      setCarregando(false);
    })();
  }, []);

  async function login(email: string, senha: string) {
    const s = await api.post<SessaoAtual>('/auth/login', { email, senha });
    setAccessToken(s.accessToken);
    setSessao(s);
  }

  async function registrar(input: RegistrarInput) {
    const s = await api.post<SessaoAtual>('/auth/registrar', input);
    setAccessToken(s.accessToken);
    setSessao(s);
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => undefined);
    setAccessToken(null);
    setSessao(null);
  }

  async function atualizar() {
    const s = await api.get<SessaoAtual>('/auth/me');
    setSessao((prev) => (prev ? { ...s, accessToken: prev.accessToken } : s));
  }

  // Loga como outro usuario (impersonacao). Guarda a sessao admin atual para poder voltar.
  async function impersonar(usuarioId: string) {
    const alvo = await api.post<SessaoAtual>(`/usuarios/${usuarioId}/impersonar`, {});
    setImpersonadoPor((atual) => atual ?? sessao); // se ja estava impersonando, mantem o admin original
    setAccessToken(alvo.accessToken);
    setSessao(alvo);
  }

  // Volta para a sessao do admin. O refresh cookie continua sendo do admin, entao um
  // refresh restaura um token admin valido mesmo que o guardado tenha expirado.
  async function voltarAoAdmin() {
    const admin = impersonadoPor;
    setImpersonadoPor(null);
    if (admin) {
      setSessao(admin);
      setAccessToken(admin.accessToken);
    }
    await api.refresh().catch(() => undefined);
  }

  return (
    <AuthContext.Provider
      value={{ sessao, carregando, login, registrar, logout, atualizar, impersonadoPor, impersonar, voltarAoAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export function temPermissao(sessao: SessaoAtual | null, flag: string): boolean {
  return !!sessao?.usuario.permissoes?.[flag as never];
}
