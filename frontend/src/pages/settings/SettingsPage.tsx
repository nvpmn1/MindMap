// ============================================================================
// MindMap Hub - Settings Page
// ============================================================================
// Página de configurações do usuário e da aplicação
// ============================================================================

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Bell,
  Palette,
  Shield,
  Key,
  Link2,
  CreditCard,
  LogOut,
  Camera,
  Loader2,
  Check,
  Moon,
  Sun,
  Monitor,
  Globe,
  Mail,
  MessageSquare,
  Trash2,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme'
import { AppLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, getInitials } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

type SettingsTab = 'profile' | 'notifications' | 'appearance' | 'security' | 'integrations' | 'billing'

interface UserProfile {
  name: string
  email: string
  avatar_url?: string
  bio?: string
  company?: string
  location?: string
  website?: string
}

interface NotificationSettings {
  email_updates: boolean
  email_mentions: boolean
  email_comments: boolean
  email_collaborations: boolean
  push_enabled: boolean
  push_mentions: boolean
  push_comments: boolean
  digest_frequency: 'daily' | 'weekly' | 'never'
}

// ============================================================================
// Profile Section
// ============================================================================

function ProfileSection() {
  const { user, updateProfile } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.name || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url,
    bio: '',
    company: '',
    location: '',
    website: ''
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile(profile)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating profile:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarChange = () => {
    // TODO: Implement avatar upload
    console.log('Open avatar upload')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Perfil</CardTitle>
          <CardDescription>
            Gerencie suas informações pessoais e como você aparece para outros usuários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarChange}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-medium">{profile.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <Button variant="link" className="p-0 h-auto text-sm" onClick={handleAvatarChange}>
                Alterar foto
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email não pode ser alterado
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                placeholder="Sua empresa"
                value={profile.company}
                onChange={(e) => setProfile(p => ({ ...p, company: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                placeholder="Cidade, País"
                value={profile.location}
                onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://seu-site.com"
                value={profile.website}
                onChange={(e) => setProfile(p => ({ ...p, website: e.target.value }))}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Conte um pouco sobre você..."
                value={profile.bio}
                onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                disabled={!isEditing}
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar alterações
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Editar perfil
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Notifications Section
// ============================================================================

function NotificationsSection() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email_updates: true,
    email_mentions: true,
    email_comments: true,
    email_collaborations: true,
    push_enabled: true,
    push_mentions: true,
    push_comments: false,
    digest_frequency: 'daily'
  })

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Notificações por Email
          </CardTitle>
          <CardDescription>
            Configure quais emails você deseja receber
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Atualizações do produto</p>
              <p className="text-sm text-muted-foreground">
                Novidades e melhorias da plataforma
              </p>
            </div>
            <Switch
              checked={settings.email_updates}
              onCheckedChange={() => handleToggle('email_updates')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Menções</p>
              <p className="text-sm text-muted-foreground">
                Quando alguém menciona você em um mapa
              </p>
            </div>
            <Switch
              checked={settings.email_mentions}
              onCheckedChange={() => handleToggle('email_mentions')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Comentários</p>
              <p className="text-sm text-muted-foreground">
                Novos comentários em seus mapas
              </p>
            </div>
            <Switch
              checked={settings.email_comments}
              onCheckedChange={() => handleToggle('email_comments')}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Colaborações</p>
              <p className="text-sm text-muted-foreground">
                Convites para colaborar em mapas
              </p>
            </div>
            <Switch
              checked={settings.email_collaborations}
              onCheckedChange={() => handleToggle('email_collaborations')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Configure notificações do navegador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Ativar notificações push</p>
              <p className="text-sm text-muted-foreground">
                Receba notificações mesmo quando não estiver na plataforma
              </p>
            </div>
            <Switch
              checked={settings.push_enabled}
              onCheckedChange={() => handleToggle('push_enabled')}
            />
          </div>
          {settings.push_enabled && (
            <>
              <div className="flex items-center justify-between pl-4 border-l-2">
                <div>
                  <p className="font-medium">Menções</p>
                </div>
                <Switch
                  checked={settings.push_mentions}
                  onCheckedChange={() => handleToggle('push_mentions')}
                />
              </div>
              <div className="flex items-center justify-between pl-4 border-l-2">
                <div>
                  <p className="font-medium">Comentários</p>
                </div>
                <Switch
                  checked={settings.push_comments}
                  onCheckedChange={() => handleToggle('push_comments')}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Digest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Resumo de Atividades
          </CardTitle>
          <CardDescription>
            Receba um resumo periódico das atividades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Frequência do resumo</Label>
            <Select
              value={settings.digest_frequency}
              onValueChange={(v) => setSettings(prev => ({ ...prev, digest_frequency: v as any }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="never">Nunca</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Appearance Section
// ============================================================================

function AppearanceSection() {
  const { theme, setTheme } = useTheme()

  const themes = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Escuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor }
  ] as const

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Tema
          </CardTitle>
          <CardDescription>
            Escolha o tema visual da aplicação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all',
                  theme === t.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center',
                  t.value === 'light' ? 'bg-white border' : '',
                  t.value === 'dark' ? 'bg-zinc-900' : '',
                  t.value === 'system' ? 'bg-gradient-to-br from-white to-zinc-900' : ''
                )}>
                  <t.icon className={cn(
                    'w-6 h-6',
                    t.value === 'light' ? 'text-amber-500' : '',
                    t.value === 'dark' ? 'text-blue-400' : '',
                    t.value === 'system' ? 'text-purple-500' : ''
                  )} />
                </div>
                <span className="font-medium text-sm">{t.label}</span>
                {theme === t.value && (
                  <Badge variant="secondary" className="text-xs">
                    <Check className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Idioma e Região
          </CardTitle>
          <CardDescription>
            Configure idioma e formato de data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select defaultValue="pt-BR">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Formato de data</Label>
            <Select defaultValue="dd/mm/yyyy">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/mm/yyyy">DD/MM/AAAA</SelectItem>
                <SelectItem value="mm/dd/yyyy">MM/DD/AAAA</SelectItem>
                <SelectItem value="yyyy-mm-dd">AAAA-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Security Section
// ============================================================================

function SecuritySection() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'EXCLUIR') return
    // TODO: Implement account deletion
    console.log('Delete account')
  }

  return (
    <div className="space-y-6">
      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Senha
          </CardTitle>
          <CardDescription>
            Altere sua senha regularmente para manter sua conta segura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline">
            Alterar senha
          </Button>
        </CardContent>
      </Card>

      {/* Two Factor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Autenticação em Dois Fatores
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status: <span className="text-warning">Desativado</span></p>
              <p className="text-sm text-muted-foreground">
                Recomendamos ativar a autenticação em dois fatores
              </p>
            </div>
            <Button variant="outline">
              Configurar 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões Ativas</CardTitle>
          <CardDescription>
            Gerencie os dispositivos conectados à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Monitor className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Este dispositivo</p>
                <p className="text-sm text-muted-foreground">
                  Windows · Chrome · Último acesso: agora
                </p>
              </div>
            </div>
            <Badge variant="secondary">Atual</Badge>
          </div>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair de todas as sessões
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-error/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-error">
            <AlertTriangle className="w-5 h-5" />
            Zona de Perigo
          </CardTitle>
          <CardDescription>
            Ações irreversíveis que afetam sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Excluir conta</p>
              <p className="text-sm text-muted-foreground">
                Excluir permanentemente sua conta e todos os dados
              </p>
            </div>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-error">Excluir conta</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Todos os seus mapas, dados e configurações serão 
              permanentemente excluídos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm">
              Para confirmar, digite <strong>EXCLUIR</strong> abaixo:
            </p>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Digite EXCLUIR"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmation !== 'EXCLUIR'}
              onClick={handleDeleteAccount}
            >
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// Integrations Section
// ============================================================================

function IntegrationsSection() {
  const integrations = [
    {
      id: 'google',
      name: 'Google Drive',
      description: 'Sincronize seus mapas com o Google Drive',
      icon: '🔵',
      connected: false
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Exporte mapas para páginas do Notion',
      icon: '⬛',
      connected: false
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Receba notificações no Slack',
      icon: '💬',
      connected: true
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Sincronize tarefas com o Jira',
      icon: '🔷',
      connected: false
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5" />
            Integrações
          </CardTitle>
          <CardDescription>
            Conecte com suas ferramentas favoritas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between p-4 rounded-lg border"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                  {integration.icon}
                </div>
                <div>
                  <p className="font-medium">{integration.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                </div>
              </div>
              {integration.connected ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <Check className="w-3 h-3 mr-1" />
                    Conectado
                  </Badge>
                  <Button variant="ghost" size="sm">
                    Desconectar
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm">
                  Conectar
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>
            Use a API para integrar com suas próprias aplicações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="password"
              value="sk_live_xxxxxxxxxxxxxxxxxx"
              readOnly
              className="font-mono"
            />
            <Button variant="outline">
              Copiar
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            <a href="/docs/api" className="text-primary hover:underline inline-flex items-center gap-1">
              Ver documentação da API
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Billing Section
// ============================================================================

function BillingSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Plano Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Plano Gratuito</h3>
                <Badge>Atual</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                5 mapas · 3 colaboradores por mapa · 100 nós por mapa
              </p>
            </div>
            <Button>
              Fazer Upgrade
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border">
              <h4 className="font-semibold">Pro</h4>
              <p className="text-2xl font-bold mt-2">R$ 29<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Mapas ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  10 colaboradores por mapa
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Nós ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  IA com Claude 3.5
                </li>
              </ul>
              <Button variant="outline" className="w-full mt-4">
                Assinar Pro
              </Button>
            </div>

            <div className="p-4 rounded-lg border border-primary">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Business</h4>
                <Badge variant="default">Popular</Badge>
              </div>
              <p className="text-2xl font-bold mt-2">R$ 79<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Tudo do Pro
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Colaboradores ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Admin & permissões
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-success" />
                  Suporte prioritário
                </li>
              </ul>
              <Button className="w-full mt-4">
                Assinar Business
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Nenhum pagamento realizado ainda.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Settings Page Component
// ============================================================================

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'integrations', label: 'Integrações', icon: Link2 },
    { id: 'billing', label: 'Assinatura', icon: CreditCard }
  ] as const

  return (
    <AppLayout>
      <div className="h-full overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">
              Gerencie sua conta e preferências
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SettingsTab)}>
            <TabsList className="mb-6 flex-wrap h-auto gap-2">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2"
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="profile">
              <ProfileSection />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsSection />
            </TabsContent>
            <TabsContent value="appearance">
              <AppearanceSection />
            </TabsContent>
            <TabsContent value="security">
              <SecuritySection />
            </TabsContent>
            <TabsContent value="integrations">
              <IntegrationsSection />
            </TabsContent>
            <TabsContent value="billing">
              <BillingSection />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}

export default SettingsPage
