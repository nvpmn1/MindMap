import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import {
  User,
  LogOut,
  Save,
  Download,
  Camera,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AvatarEditor } from '@/components/profile/AvatarEditor';
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

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Nome de exibição é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        avatar_url: avatarUrl || null,
      });
      
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao salvar. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
    toast.success('Até logo!');
  };

  const handleFactoryReset = () => {
    // Confirm before resetting
    if (!window.confirm('Tem certeza? Isso vai deletar TUDO: todos os mapas, nós e dados. Esta ação não pode ser desfeita!')) {
      return;
    }

    if (!window.confirm('Esta é a última chance! Ao confirmar, perderá todos os dados. Continuar?')) {
      return;
    }

    try {
      // Clear all localStorage keys related to maps and nodes
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('mindmap_') || key.includes('nodes')
      );
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Sign out and reset auth state
      signOut();

      // Clear persisted auth state
      localStorage.removeItem('authStore');

      toast.success('Plataforma resetada completamente! Redirecionando para login...');
      
      // Redirect to login after brief delay
      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch {
      toast.error('Erro ao resetar plataforma');
    }
  };

  const handleExportAvatar = () => {
    if (!avatarUrl) {
      toast.error('Nenhum avatar para exportar');
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
          {/* Avatar Section */}
          <motion.div
            variants={fadeUp}
            className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Camera className="w-4 h-4 text-cyan-400" />
              <h2 className="text-[15px] font-semibold text-white">Avatar</h2>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 flex items-center justify-center overflow-hidden border-2 border-white/[0.06]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-600" />
                  )}
                </div>
                {avatarUrl && (
                  <button
                    onClick={handleExportAvatar}
                    className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Exportar PNG
                  </button>
                )}
              </div>

              <div className="flex-1 w-full">
                <AvatarEditor
                  value={avatarUrl}
                  displayName={displayName}
                  onChange={setAvatarUrl}
                />
              </div>
            </div>
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

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-[13px] font-medium hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/15 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              {hasChanges && (
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
                onClick={handleFactoryReset}
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
    </div>
  );
}
