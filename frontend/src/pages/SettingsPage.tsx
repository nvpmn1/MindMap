import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Moon, 
  Sun, 
  LogOut, 
  Bell, 
  Shield, 
  Palette, 
  Keyboard,
  Globe,
  Cpu,
  CreditCard,
  Link2,
  Download,
  Trash2,
  Save,
  Check,
  ChevronRight,
  Sparkles,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SettingsSection({ title, description, icon, children }: SettingsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-slate-900/30 border border-slate-800/50 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-800/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      <div className="p-6 space-y-6">{children}</div>
    </motion.div>
  );
}

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <Label className="text-white font-medium">{label}</Label>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  
  // Settings state
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [email] = useState(user?.email || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    mentions: true,
    updates: false,
  });
  const [aiSettings, setAiSettings] = useState({
    autoSuggest: true,
    expandOnHover: false,
    smartComplete: true,
    model: 'claude-sonnet',
  });
  const [appearance, setAppearance] = useState({
    darkMode: theme === 'dark',
    reducedMotion: false,
    compactMode: false,
    accentColor: 'cyan',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Perfil salvo com sucesso!');
    setIsSaving(false);
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
    toast.success('Você saiu da conta');
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('sk-mindmap-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    toast.success('Chave copiada!');
  };

  const handleExportData = () => {
    toast.success('Exportação iniciada! Você receberá um email.');
  };

  const accentColors = [
    { name: 'cyan', color: '#00D9FF' },
    { name: 'purple', color: '#A78BFA' },
    { name: 'emerald', color: '#10B981' },
    { name: 'amber', color: '#F59E0B' },
    { name: 'pink', color: '#EC4899' },
  ];

  return (
    <div className="min-h-full bg-[#080C14] pb-8">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Configurações</h1>
            <p className="text-slate-500">Gerencie sua conta e preferências</p>
          </div>
          <Button 
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Alterações
          </Button>
        </div>

        {/* Profile Section */}
        <SettingsSection 
          title="Perfil" 
          description="Suas informações pessoais"
          icon={<User className="w-5 h-5" />}
        >
          <div className="flex items-start gap-6">
            <div className="relative">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold"
                style={{ 
                  backgroundColor: `${user?.color || '#00D9FF'}20`,
                  color: user?.color || '#00D9FF',
                }}
              >
                {user?.display_name?.[0] || 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-cyan-600 text-white flex items-center justify-center hover:bg-cyan-500 transition-colors">
                <Palette className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <Label className="text-slate-400 text-sm">Nome de exibição</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 bg-slate-900/50 border-slate-800 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-400 text-sm">Email</Label>
                <Input
                  value={email}
                  disabled
                  className="mt-1 bg-slate-900/30 border-slate-800 text-slate-500"
                />
                <p className="text-xs text-slate-600 mt-1">O email não pode ser alterado</p>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* AI Settings */}
        <SettingsSection 
          title="Inteligência Artificial" 
          description="Configurações do AI Agent"
          icon={<Sparkles className="w-5 h-5" />}
        >
          <SettingRow 
            label="Sugestões automáticas"
            description="Gera sugestões enquanto você trabalha"
          >
            <Switch 
              checked={aiSettings.autoSuggest}
              onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, autoSuggest: checked }))}
            />
          </SettingRow>

          <SettingRow 
            label="Expansão ao passar o mouse"
            description="Mostra ideias relacionadas ao passar sobre um nó"
          >
            <Switch 
              checked={aiSettings.expandOnHover}
              onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, expandOnHover: checked }))}
            />
          </SettingRow>

          <SettingRow 
            label="Auto-completar inteligente"
            description="Completa texto baseado no contexto do mapa"
          >
            <Switch 
              checked={aiSettings.smartComplete}
              onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, smartComplete: checked }))}
            />
          </SettingRow>

          <div>
            <Label className="text-white font-medium mb-2 block">Modelo de IA</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'claude-sonnet', name: 'Claude Sonnet', desc: 'Balanceado' },
                { id: 'claude-opus', name: 'Claude Opus', desc: 'Mais preciso' },
              ].map((model) => (
                <button
                  key={model.id}
                  onClick={() => setAiSettings(prev => ({ ...prev, model: model.id }))}
                  className={cn(
                    'p-3 rounded-lg border text-left transition-all',
                    aiSettings.model === model.id 
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400'
                      : 'bg-slate-900/30 border-slate-800 text-slate-400 hover:border-slate-700'
                  )}
                >
                  <p className="font-medium">{model.name}</p>
                  <p className="text-xs opacity-60">{model.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* AI Usage Stats */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-purple-500/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Uso este mês</span>
              <span className="text-sm font-medium text-cyan-400">2,847 / 10,000 tokens</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[28%] bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" />
            </div>
          </div>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection 
          title="Aparência" 
          description="Personalize a interface"
          icon={<Palette className="w-5 h-5" />}
        >
          <SettingRow 
            label="Modo escuro"
            description="Reduz o cansaço visual em ambientes escuros"
          >
            <Switch 
              checked={appearance.darkMode}
              onCheckedChange={(checked) => {
                setAppearance(prev => ({ ...prev, darkMode: checked }));
                setTheme(checked ? 'dark' : 'light');
              }}
            />
          </SettingRow>

          <SettingRow 
            label="Reduzir animações"
            description="Desativa animações para melhor performance"
          >
            <Switch 
              checked={appearance.reducedMotion}
              onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, reducedMotion: checked }))}
            />
          </SettingRow>

          <SettingRow 
            label="Modo compacto"
            description="Reduz espaçamentos para mais conteúdo"
          >
            <Switch 
              checked={appearance.compactMode}
              onCheckedChange={(checked) => setAppearance(prev => ({ ...prev, compactMode: checked }))}
            />
          </SettingRow>

          <div>
            <Label className="text-white font-medium mb-3 block">Cor de destaque</Label>
            <div className="flex gap-2">
              {accentColors.map((accent) => (
                <button
                  key={accent.name}
                  onClick={() => setAppearance(prev => ({ ...prev, accentColor: accent.name }))}
                  className={cn(
                    'w-10 h-10 rounded-lg transition-all',
                    appearance.accentColor === accent.name 
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-[#080C14]' 
                      : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: accent.color }}
                />
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection 
          title="Notificações" 
          description="Controle como você recebe atualizações"
          icon={<Bell className="w-5 h-5" />}
        >
          <SettingRow 
            label="Notificações por email"
            description="Receba atualizações importantes por email"
          >
            <Switch 
              checked={notifications.email}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
            />
          </SettingRow>

          <SettingRow 
            label="Notificações push"
            description="Notificações no navegador em tempo real"
          >
            <Switch 
              checked={notifications.push}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
            />
          </SettingRow>

          <SettingRow 
            label="Menções"
            description="Avise quando alguém mencionar você"
          >
            <Switch 
              checked={notifications.mentions}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, mentions: checked }))}
            />
          </SettingRow>

          <SettingRow 
            label="Atualizações do produto"
            description="Novidades e melhorias na plataforma"
          >
            <Switch 
              checked={notifications.updates}
              onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, updates: checked }))}
            />
          </SettingRow>
        </SettingsSection>

        {/* API & Integrations */}
        <SettingsSection 
          title="API & Integrações" 
          description="Conecte com outras ferramentas"
          icon={<Link2 className="w-5 h-5" />}
        >
          <div>
            <Label className="text-white font-medium mb-2 block">Chave de API</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value="sk-mindmap-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  readOnly
                  className="bg-slate-900/50 border-slate-800 text-slate-400 font-mono text-sm pr-20"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopyApiKey}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-600 mt-2">Use esta chave para integrar com APIs externas</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Notion', status: 'Conectado', icon: '📝' },
              { name: 'Slack', status: 'Não conectado', icon: '💬' },
              { name: 'GitHub', status: 'Conectado', icon: '🐙' },
              { name: 'Figma', status: 'Não conectado', icon: '🎨' },
            ].map((integration) => (
              <button
                key={integration.name}
                className="p-3 rounded-lg bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-all text-left flex items-center gap-3"
              >
                <span className="text-xl">{integration.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-white">{integration.name}</p>
                  <p className={cn(
                    'text-xs',
                    integration.status === 'Conectado' ? 'text-emerald-400' : 'text-slate-500'
                  )}>
                    {integration.status}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            ))}
          </div>
        </SettingsSection>

        {/* Data & Privacy */}
        <SettingsSection 
          title="Dados & Privacidade" 
          description="Gerencie seus dados"
          icon={<Shield className="w-5 h-5" />}
        >
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar meus dados
              <span className="ml-auto text-xs text-slate-500">JSON, CSV</span>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <HardDrive className="w-4 h-4 mr-2" />
              Uso de armazenamento
              <span className="ml-auto text-xs text-slate-500">2.4 GB / 10 GB</span>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start border-red-900/50 text-red-400 hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir conta
              <span className="ml-auto text-xs text-red-400/60">Irreversível</span>
            </Button>
          </div>
        </SettingsSection>

        {/* Session */}
        <SettingsSection 
          title="Sessão" 
          description="Gerenciar sua sessão atual"
          icon={<LogOut className="w-5 h-5" />}
        >
          <div className="flex items-center justify-between p-4 rounded-lg bg-red-900/10 border border-red-900/30">
            <div>
              <p className="font-medium text-white">Sair da conta</p>
              <p className="text-sm text-slate-500">Você precisará fazer login novamente</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
