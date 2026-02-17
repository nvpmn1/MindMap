import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { OptimizedNeuralBackground } from '@/components/OptimizedNeuralBackground';

import { authApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { trackProductEvent } from '@/lib/productMetrics';
import { useAuthStore } from '@/stores/authStore';

type FixedAccount = {
  key: string;
  display_name: string;
  email: string;
  color: string;
  role: string;
};

// Local fallback (backend also exposes /api/auth/accounts).
const FALLBACK_ACCOUNTS: FixedAccount[] = [
  {
    key: 'guilherme',
    display_name: 'Guilherme Oliveira',
    email: 'gui_oliveira.16@hotmail.com',
    color: '#06E5FF',
    role: 'admin',
  },
  {
    key: 'helen',
    display_name: 'Helen',
    email: 'helen23m@gmail.com',
    color: '#06FFD0',
    role: 'member',
  },
  {
    key: 'pablo',
    display_name: 'Pablo',
    email: 'pablorfcosta@gmail.com',
    color: '#0D99FF',
    role: 'member',
  },
];

const LOGIN_STEP_TIMEOUT_MS = 12000;

function roleLabel(role: string): string {
  if (role === 'admin') return 'Admin';
  return 'Member';
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const setFromMe = useAuthStore((s) => s.setFromMe);

  const passwordRef = useRef<HTMLInputElement>(null);

  const [accounts, setAccounts] = useState<FixedAccount[]>(FALLBACK_ACCOUNTS);
  const [selectedKey, setSelectedKey] = useState<string>(FALLBACK_ACCOUNTS[0].key);
  const [email, setEmail] = useState(FALLBACK_ACCOUNTS[0].email);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const selectedAccount = useMemo(() => {
    return accounts.find((a) => a.key === selectedKey) || accounts[0];
  }, [accounts, selectedKey]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const resp = await authApi.listFixedAccounts();
        if (!resp.success || !Array.isArray(resp.data)) return;

        const next = resp.data as any as FixedAccount[];
        if (cancelled || next.length === 0) return;

        setAccounts(next);
        setSelectedKey(next[0].key);
        setEmail(next[0].email);
      } catch {
        // keep fallback
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function selectAccount(account: FixedAccount) {
    setSelectedKey(account.key);
    setEmail(account.email);
    setStatus(null);
    trackProductEvent('login_account_selected', { key: account.key });
    setTimeout(() => passwordRef.current?.focus(), 0);
  }

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      setStatus('Digite um email valido.');
      return;
    }
    if (password.length < 1) {
      setStatus('Digite sua senha.');
      passwordRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setStatus(null);

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        }),
        LOGIN_STEP_TIMEOUT_MS,
        'Tempo limite ao autenticar. Verifique sua conexao e tente novamente.'
      );

      if (error || !data?.session) {
        throw new Error(error?.message || 'Email ou senha invalidos');
      }

      const accessToken = data.session.access_token;
      const me = await withTimeout(
        authApi.getMeWithToken(accessToken),
        LOGIN_STEP_TIMEOUT_MS,
        'Tempo limite ao carregar seu perfil. Tente novamente em alguns segundos.'
      );
      if (!me.success || !(me.data as any)?.user) {
        await supabase.auth.signOut();
        throw new Error(me.error?.message || 'Falha ao carregar perfil');
      }

      setFromMe(me.data as any);
      trackProductEvent('login_success', { method: 'password' });

      toast.success('Bem-vindo!', { duration: 2500 });
      navigate('/dashboard');
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : 'Falha no login';
      const isNetworkTimeout =
        rawMessage.includes('Tempo limite') || rawMessage.includes('Failed to connect');
      const msg = isNetworkTimeout
        ? 'Nao foi possivel validar seu login agora. Tente novamente e, se persistir, desative extensoes de navegador/bloqueadores.'
        : rawMessage;

      setStatus(msg);
      trackProductEvent('login_failed', { reason: rawMessage });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center relative overflow-hidden">
      <OptimizedNeuralBackground />

      <div className="relative z-20 w-full max-w-xl px-4 py-10">
        {/* Login card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative"
          >
            <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-r from-cyan-500/10 via-emerald-500/5 to-amber-500/10 blur-2xl" />

            <div className="relative rounded-3xl border border-white/[0.10] bg-[#070B13]/70 backdrop-blur-2xl shadow-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  MindMap Hub
                </div>
                <div className="text-[11px] text-slate-500">Acesso fechado</div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Acesso</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white tracking-tight">Entrar</h2>
                </div>
                {selectedAccount && (
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Conta selecionada</div>
                    <div className="text-sm font-semibold text-white">{selectedAccount.display_name}</div>
                  </div>
                )}
              </div>

              {/* Account selector */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {accounts.map((a) => {
                  const selected = a.key === selectedKey;
                  return (
                    <button
                      key={a.key}
                      type="button"
                      data-testid={`account-${a.key}`}
                      onClick={() => selectAccount(a)}
                      className={
                        [
                          'group relative text-left rounded-2xl border p-3 transition-all',
                          'bg-white/[0.02] hover:bg-white/[0.04]',
                          selected
                            ? 'border-cyan-400/50 ring-2 ring-cyan-400/15'
                            : 'border-white/[0.08] hover:border-white/[0.14]',
                        ].join(' ')
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl border border-white/[0.10] overflow-hidden flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${a.color}22, rgba(255,255,255,0.04))`,
                          }}
                        >
                          <span className="text-sm font-bold text-white">
                            {(a.display_name || a.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{a.display_name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{a.email}</div>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">{roleLabel(a.role)}</span>
                        <span
                          className={
                            selected
                              ? 'text-[10px] font-semibold text-cyan-300'
                              : 'text-[10px] text-slate-500 group-hover:text-slate-400'
                          }
                        >
                          Selecionar
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    Email
                  </label>
                  <Input
                    data-testid="login-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    Senha
                  </label>
                  <div className="relative">
                    <Input
                      ref={passwordRef}
                      data-testid="login-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className="pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  data-testid="login-submit"
                  loading={isLoading}
                  className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 border-0 shadow-lg shadow-cyan-500/20"
                >
                  <span className="flex items-center justify-center gap-2">
                    Entrar
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Button>

                {status && (
                  <div className="text-xs text-slate-200 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3">
                    {status}
                  </div>
                )}

                <div className="text-[11px] text-slate-500 leading-relaxed">
                  Ambiente em <span className="text-slate-300 font-semibold">modo contas fixas</span>. Clique em uma
                  conta para preencher o email.
                </div>
              </form>
            </div>
          </motion.div>
      </div>
    </div>
  );
}
