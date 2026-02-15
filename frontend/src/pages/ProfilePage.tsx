import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { AvatarEditor } from '@/components/profile/AvatarEditor';
import { AvatarDisplay } from '@/components/profile/AvatarDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useAuthStore } from '@/stores/authStore';

export function ProfilePage() {
  const { user, workspaces, updateProfile } = useAuthStore();

  const primaryWorkspace = workspaces[0];

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDisplayName(user?.display_name || '');
    setAvatarUrl(user?.avatar_url || null);
  }, [user?.id]);

  const hasChanges = useMemo(() => {
    const currentName = (user?.display_name || '').trim();
    const draftName = displayName.trim();
    const currentAvatar = user?.avatar_url || null;
    return currentName !== draftName || currentAvatar !== avatarUrl;
  }, [avatarUrl, displayName, user?.avatar_url, user?.display_name]);

  async function handleSave() {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim() || user.display_name,
        avatar_url: avatarUrl,
      });

      toast.success('Perfil atualizado!', { duration: 2500 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Falha ao atualizar perfil', { duration: 3500 });
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-full bg-[#060910] flex items-center justify-center">
        <div className="text-sm text-slate-400">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#060910]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6"
        >
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-28 -left-28 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full bg-amber-500/8 blur-3xl" />
          </div>

          <div className="relative flex flex-col md:flex-row md:items-center gap-5">
            <AvatarDisplay
              src={avatarUrl}
              name={displayName || user.display_name}
              color={user.color}
              size="xl"
              className="border-white/[0.12]"
            />

            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-white tracking-tight truncate">
                {displayName || user.display_name}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400 min-w-0">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {primaryWorkspace?.name && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-200 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
                    {primaryWorkspace.name} ({primaryWorkspace.role})
                  </span>
                )}

                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-200 bg-cyan-500/10 border border-cyan-400/20 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Contas fixas
                </span>
              </div>
            </div>

            <div className="md:ml-auto flex gap-2">
              <Button
                onClick={handleSave}
                loading={isSaving}
                disabled={!hasChanges}
                className="h-10 bg-gradient-to-r from-cyan-500 via-emerald-500 to-cyan-500 border-0 shadow-lg shadow-cyan-500/15 disabled:opacity-40"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Identity */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6"
          >
            <h2 className="text-sm font-semibold text-white">Identidade</h2>
            <p className="mt-1 text-xs text-slate-500">
              Ajuste apenas nome e avatar. Email e senha ficam fixos por enquanto.
            </p>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-300">Nome exibido</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300">Email (fixo)</label>
                <Input value={user.email} disabled />
              </div>
            </div>
          </motion.div>

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-6"
          >
            <h2 className="text-sm font-semibold text-white">Avatar</h2>
            <p className="mt-1 text-xs text-slate-500">
              Envie uma imagem, recorte e salve. Ou escolha um preset.
            </p>

            <div className="mt-5">
              <AvatarEditor
                value={avatarUrl}
                displayName={displayName || user.display_name}
                onChange={(next) => setAvatarUrl(next)}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
