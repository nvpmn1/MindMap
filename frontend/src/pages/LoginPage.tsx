import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Mail, Shield, Users, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsListUnderline, TabsTriggerUnderline } from '@/components/ui/tabs';
import { OptimizedNeuralBackground } from '@/components/OptimizedNeuralBackground';

import { authApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { getAllUserProfiles } from '@/lib/userProfiles';
import { trackProductEvent } from '@/lib/productMetrics';
import { useAuthStore } from '@/stores/authStore';

type LoginTab = 'email' | 'demo';

const ENABLE_PROFILE_LOGIN = import.meta.env.VITE_ENABLE_PROFILE_LOGIN === 'true';

export function LoginPage() {
  const navigate = useNavigate();
  const setFromMe = useAuthStore((s) => s.setFromMe);
  const loginWithProfile = useAuthStore((s) => s.loginWithProfile);

  const [tab, setTab] = useState<LoginTab>(ENABLE_PROFILE_LOGIN ? 'demo' : 'email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const profilesWithAvatars = useMemo(() => {
    const users = getAllUserProfiles();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      color: user.color,
      description: user.description || '',
      icon: user.name === 'Guilherme' ? Zap : user.name === 'Helen' ? Users : Shield,
      avatarUrl: user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`,
    }));
  }, []);

  const selectedProfileData = profilesWithAvatars.find((p) => p.id === selectedProfile);

  async function handleSendLink() {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) {
      setStatus('Digite um email valido.');
      return;
    }

    setIsLoading(true);
    setStatus(null);
    try {
      const resp = await authApi.sendMagicLink(normalized);
      if (!resp.success) {
        throw new Error(resp.error?.message || 'Falha ao enviar link');
      }
      setStatus('Link enviado. Abra seu email e clique no link para entrar.');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Falha ao enviar link');
    } finally {
      setIsLoading(false);
    }
  }

  // Optional fallback if your Supabase template is configured to send an OTP code.
  async function handleVerifyOtp() {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) {
      setStatus('Digite um email valido.');
      return;
    }
    if (token.trim().length < 6) {
      setStatus('Digite o codigo (minimo 6 caracteres).');
      return;
    }

    setIsLoading(true);
    setStatus(null);
    try {
      const resp = await authApi.verifyOtp(normalized, token.trim());
      if (!resp.success || !(resp.data as any)?.session?.access_token || !(resp.data as any)?.session?.refresh_token) {
        throw new Error(resp.error?.message || 'Falha ao verificar codigo');
      }

      const session = (resp.data as any).session;
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      const me = await authApi.getMe();
      if (!me.success || !(me.data as any)?.user) {
        throw new Error(me.error?.message || 'Falha ao carregar perfil');
      }
      setFromMe(me.data as any);
      trackProductEvent('login_success', { method: 'otp' });

      navigate('/dashboard');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Falha ao verificar codigo');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectProfile(profileId: string) {
    setSelectedProfile(profileId);
    const selected = profilesWithAvatars.find((p) => p.id === profileId);
    trackProductEvent('login_profile_selected', {
      profileId,
      profileName: selected?.name,
    });
  }

  async function handleDemoLogin() {
    if (!ENABLE_PROFILE_LOGIN) return;
    if (!selectedProfile || !selectedProfileData) return;

    setIsLoading(true);
    setStatus(null);
    try {
      loginWithProfile({
        id: selectedProfileData.id,
        email: selectedProfileData.email,
        display_name: selectedProfileData.name,
        avatar_url: selectedProfileData.avatarUrl,
        color: selectedProfileData.color,
      });
      trackProductEvent('login_success', { method: 'demo-profile' });
      navigate('/dashboard');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Falha no login demo');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center relative overflow-hidden">
      <OptimizedNeuralBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-20 w-full max-w-md px-4"
      >
        <div className="relative">
          <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/10 via-teal-500/5 to-purple-500/10 rounded-2xl blur-xl" />

          <div className="relative bg-[#080C14]/70 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 rounded-lg border border-cyan-400/30 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-cyan-300" strokeWidth={1.5} />
                </div>
              </div>
              <h1 className="text-2xl font-light tracking-tight">
                <span className="text-white">Neural</span>
                <span className="font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Map
                </span>
              </h1>
              <p className="text-xs text-cyan-400/60 tracking-widest uppercase">
                Collaborative Intelligence Platform
              </p>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as LoginTab)} className="w-full">
              <TabsListUnderline>
                <TabsTriggerUnderline value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTriggerUnderline>
                <TabsTriggerUnderline
                  value="demo"
                  disabled={!ENABLE_PROFILE_LOGIN}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Demo
                </TabsTriggerUnderline>
              </TabsListUnderline>

              <TabsContent value="email" className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs text-slate-300">Email</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSendLink}
                    disabled={isLoading}
                    className="flex-1 h-10 text-xs font-semibold bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 border-0 shadow-lg shadow-cyan-500/30"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <span>Enviar link</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </Button>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="text-xs text-slate-300">Codigo (opcional)</label>
                  <Input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Se o email enviar um codigo, cole aqui"
                    autoComplete="one-time-code"
                  />
                  <Button
                    onClick={handleVerifyOtp}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full h-10 text-xs border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10"
                  >
                    Verificar codigo
                  </Button>
                </div>

                <p className="text-[11px] text-slate-400">
                  Dica: se voce clicou no link do email e caiu em outra pagina, volte aqui e recarregue. O login e
                  persistido pelo Supabase.
                </p>
              </TabsContent>

              <TabsContent value="demo" className="space-y-3">
                {!ENABLE_PROFILE_LOGIN ? (
                  <div className="text-sm text-slate-300">Login demo desativado neste ambiente.</div>
                ) : (
                  <>
                    <motion.div className="flex flex-col items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedProfile || 'empty'}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.15 }}
                          className="flex flex-col items-center justify-center space-y-3 py-2"
                        >
                          {selectedProfileData ? (
                            <>
                              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/15 bg-slate-900/50">
                                <img
                                  src={selectedProfileData.avatarUrl}
                                  alt={selectedProfileData.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="text-center space-y-1">
                                <h2 className="text-xl font-semibold text-white">{selectedProfileData.name}</h2>
                                <p className="text-xs text-slate-400">{selectedProfileData.description}</p>
                              </div>
                            </>
                          ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center">
                              <Sparkles className="w-6 h-6 text-cyan-400/40" strokeWidth={1} />
                            </div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-2">
                      {profilesWithAvatars.map((profile) => {
                        const isSelected = selectedProfile === profile.id;
                        const Icon = profile.icon;
                        return (
                          <button
                            key={profile.id}
                            onClick={() => handleSelectProfile(profile.id)}
                            className={[
                              'relative group overflow-hidden rounded-lg p-3',
                              'border transition-all duration-200 flex flex-col items-center gap-1',
                              isSelected
                                ? 'border-cyan-400/60 bg-gradient-to-b from-cyan-500/25 to-cyan-500/10'
                                : 'border-slate-700/50 bg-slate-800/20 hover:bg-slate-700/30 hover:border-cyan-400/40',
                            ].join(' ')}
                          >
                            <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-white/20 bg-slate-700">
                              <img
                                src={profile.avatarUrl}
                                alt={profile.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs font-semibold text-white text-center">{profile.name}</p>
                            <Icon
                              className="w-3 h-3"
                              style={{ color: profile.color, opacity: isSelected ? 1 : 0.6 }}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      onClick={handleDemoLogin}
                      disabled={!selectedProfile || isLoading}
                      className="w-full h-10 text-xs font-semibold bg-gradient-to-r from-cyan-500 via-teal-500 to-cyan-500 border-0 shadow-lg shadow-cyan-500/30 disabled:opacity-40"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <span>Entrar (demo)</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>

            {status && (
              <div className="text-xs text-slate-200 bg-slate-900/40 border border-slate-700/40 rounded-md p-3">
                {status}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
