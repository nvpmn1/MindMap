import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { resetApi } from '@/lib/api';
import { FactoryResetModal } from '@/components/FactoryResetModal';
import { User, LogOut, Save, Download, Camera, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { AvatarPicker } from '@/components/profile/AvatarPicker';
import { downloadDataUrl } from '@/components/profile/avatarUtils';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut, updateProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Nome de exibição é obrigatório', { duration: 3500 });
      return;
    }

    // Accept avatar as-is, minimal validation
    if (avatarUrl && typeof avatarUrl !== 'string') {
      toast.error('Avatar inválido.', { duration: 3500 });
      return;
    }

    setIsSaving(true);
    setSyncStatus('syncing');
    try {
      console.log('📤 Saving profile...');
      await updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl || null,
      });

      setSyncStatus('synced');
      toast.success('Perfil atualizado com sucesso!', { duration: 3500 });

      // Reset synced status after 2 seconds
      setTimeout(() => setSyncStatus('idle'), 2000);

      console.log('✅ Profile saved and synced');
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSyncStatus('error');
      toast.error('Erro ao salvar. Tente novamente.', { duration: 3500 });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
    toast.success('Até logo!', { duration: 2500 });
  };

  const handleFactoryReset = async () => {
    console.log('🔥 Starting factory reset...');

    try {
      // Call backend API to delete all data
      const response = await resetApi.factoryReset();

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to reset');
      }

      console.log('🔥 Factory reset completed, clearing local state...');

      // Clear ALL localStorage
      localStorage.clear();

      // Sign out and redirect
      signOut();

      // Navigate to login
      navigate('/login');

      toast.success('Plataforma resetada! Redirecionando...', { duration: 4000 });
    } catch (error) {
      console.error('❌ Factory reset error:', error);
      toast.error('Erro ao resetar plataforma', { duration: 3500 });
      setIsResetModalOpen(false);
    }
  };

  const handleExportAvatar = () => {
    if (!avatarUrl) {
      toast.error('Nenhum avatar para exportar', { duration: 3500 });
      return;
    }
    const safeName = (displayName || 'usuario').replace(/\s+/g, '-').toLowerCase();
    downloadDataUrl(avatarUrl, `avatar-${safeName}.png`);
  };

  const hasChanges =
    displayName !== (user?.display_name || '') || avatarUrl !== (user?.avatar_url || '');

  return (
    <div className="min-h-full bg-[#060910] overflow-hidden">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full mx-auto py-6 md:py-8 space-y-6 px-4 md:px-6 max-w-7xl"
      >
        {/* Header Section - Compact */}
        <motion.div variants={fadeUp} className="text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            Configurações
          </h1>
          <p className="text-sm text-slate-400 mt-2">Personalize seu perfil e avatar</p>
        </motion.div>

        {/* Main Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Avatar Picker (2 cols on lg) */}
          <motion.div
            variants={fadeUp}
            className="lg:col-span-2 rounded-2xl border border-white/[0.04] bg-gradient-to-b from-white/[0.03] to-transparent px-4 md:px-6 py-5 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/15 flex items-center justify-center border border-cyan-500/30 flex-shrink-0">
                <Camera className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Avatar</h2>
                <p className="text-xs text-slate-400">Selecione e personalize</p>
              </div>
            </div>

            {/* Avatar Picker Component */}
            <AvatarPicker
              selectedAvatarId={user?.avatar_id}
              onSelect={(avatar) => {
                setAvatarUrl(avatar.url);
                toast.success(`Avatar selecionado: ${avatar.name}`, { duration: 2000 });
              }}
            />
          </motion.div>

          {/* Right Column: Profile Info + Quick Actions (1 col on lg) */}
          <div className="flex flex-col gap-6">
            {/* Profile Information Section - Compact */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-transparent p-5 backdrop-blur-sm h-fit"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Perfil</h2>
                  <p className="text-xs text-slate-400">Nome exibição</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Display Name Input */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-semibold uppercase tracking-wide">
                    Nome
                  </label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full h-10 px-4 rounded-lg bg-white/[0.04] border border-white/[0.10] text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-cyan-500/30 transition-all"
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !hasChanges}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-semibold hover:from-cyan-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 transition-all shadow-lg shadow-cyan-500/25 disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </button>

                {/* Status Indicator */}
                {syncStatus === 'synced' && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 text-xs text-emerald-400 font-semibold"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Sincronizado
                  </motion.span>
                )}
                {syncStatus === 'error' && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 text-xs text-red-400 font-semibold"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Erro
                  </motion.span>
                )}
                {hasChanges && syncStatus === 'idle' && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 text-xs text-amber-400 font-semibold"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Não salvo
                  </motion.span>
                )}
              </div>
            </motion.div>

            {/* Quick Actions - Stack Vertically */}
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-cyan-500/15 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Download className="w-4 h-4 text-cyan-400" />
                <p className="text-sm font-semibold text-white">Exportar</p>
              </div>
              <button
                onClick={handleExportAvatar}
                disabled={!avatarUrl}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/30 hover:border-cyan-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Download className="w-4 h-4" />
                Avatar
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-orange-500/15 bg-gradient-to-br from-orange-500/10 to-orange-500/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-orange-400" />
                <p className="text-sm font-semibold text-white">Reset</p>
              </div>
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-300 text-sm font-semibold hover:bg-orange-500/30 hover:border-orange-500/50 transition-all"
              >
                <Zap className="w-4 h-4" />
                Dados
              </button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-red-500/15 bg-gradient-to-br from-red-500/10 to-red-500/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <LogOut className="w-4 h-4 text-red-400" />
                <p className="text-sm font-semibold text-white">Sair</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 hover:border-red-500/50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sessão
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Factory Reset Modal */}
      <FactoryResetModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleFactoryReset}
      />
    </div>
  );
}
