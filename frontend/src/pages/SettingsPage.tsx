import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { resetApi } from '@/lib/api';
import { FactoryResetModal } from '@/components/FactoryResetModal';
import {
  User,
  LogOut,
  Save,
  Download,
  Camera,
  Zap,
} from 'lucide-react';
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
    <div className="min-h-full bg-[#060910]">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-6 py-8 space-y-6"
      >
        {/* Title */}
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Configurações</h1>
          <p className="text-sm text-slate-400 mt-1">Gerencie seu perfil.</p>
        </motion.div>
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
          {/* Avatar Selection Section */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h2 className="text-[15px] font-semibold text-white">Selecione seu Avatar</h2>
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

          {/* Profile Info */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <User className="w-4 h-4 text-cyan-400" />
              <h2 className="text-[15px] font-semibold text-white">Informações do Perfil</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[12px] text-slate-400 font-medium uppercase tracking-wide">
                  Nome de exibição
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[13px] text-white placeholder-slate-500 outline-none focus:border-cyan-500/30 focus:bg-white/[0.05] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[13px] font-medium hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/15 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              {syncStatus === 'synced' && (
                <span className="text-[12px] text-green-400/80">✅ Sincronizado</span>
              )}
              {syncStatus === 'error' && (
                <span className="text-[12px] text-red-400/80">❌ Erro na sincronização</span>
              )}
              {hasChanges && syncStatus === 'idle' && (
                <span className="text-[12px] text-amber-400/70">Alterações não salvas</span>
              )}
            </div>
          </motion.div>

          {/* Factory Reset */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-orange-500/10 bg-orange-500/[0.02] p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-[14px] text-white font-medium">Factory Reset</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Deleta completamente todos os mapas, nós e dados. Esta ação não pode ser desfeita!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[13px] font-medium hover:bg-orange-500/20 hover:border-orange-500/30 transition-all"
              >
                <Zap className="w-4 h-4" />
                Resetar
              </button>
            </div>
          </motion.div>

          {/* Logout */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-red-500/10 bg-red-500/[0.02] p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-[14px] text-white font-medium">Encerrar Sessão</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Sair da sua conta no NeuralMap
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium hover:bg-red-500/20 hover:border-red-500/30 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </motion.div>
        </motion.div>
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
