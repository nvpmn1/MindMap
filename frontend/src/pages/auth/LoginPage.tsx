// ============================================================================
// MindMap Hub - Login Page
// ============================================================================
// Página de autenticação com suporte a login social (Google, GitHub)
// e formulário tradicional de email/senha
// ============================================================================

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Sparkles, 
  Users, 
  Zap, 
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Github
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

// ============================================================================
// Feature Cards
// ============================================================================

const features = [
  {
    icon: Brain,
    title: 'Mapas Mentais Intuitivos',
    description: 'Organize suas ideias de forma visual e conecte conceitos facilmente'
  },
  {
    icon: Users,
    title: 'Colaboração em Tempo Real',
    description: 'Trabalhe junto com sua equipe, veja alterações instantaneamente'
  },
  {
    icon: Sparkles,
    title: 'IA Integrada (Claude)',
    description: 'Expanda ideias, gere sugestões e organize automaticamente'
  },
  {
    icon: Zap,
    title: 'Múltiplas Visualizações',
    description: 'Alterne entre Mapa, Kanban e Lista conforme sua necessidade'
  }
]

// ============================================================================
// Auth Mode Types
// ============================================================================

type AuthMode = 'login' | 'register' | 'forgot-password'

// ============================================================================
// Login Page Component
// ============================================================================

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const { 
    user, 
    isLoading, 
    error: authError,
    login, 
    register, 
    loginWithGoogle, 
    loginWithGithub,
    clearError 
  } = useAuthStore()

  // Form state
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  // UI state
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const returnTo = searchParams.get('returnTo') || '/dashboard'
      navigate(returnTo, { replace: true })
    }
  }, [user, navigate, searchParams])

  // Clear errors on mode change
  useEffect(() => {
    clearError()
    setLocalError(null)
    setSuccessMessage(null)
  }, [mode, clearError])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setSuccessMessage(null)
    
    // Validation
    if (!email || !password) {
      setLocalError('Preencha todos os campos obrigatórios')
      return
    }

    if (mode === 'register') {
      if (!name) {
        setLocalError('Nome é obrigatório')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('As senhas não coincidem')
        return
      }
      if (password.length < 8) {
        setLocalError('A senha deve ter pelo menos 8 caracteres')
        return
      }
      if (!acceptTerms) {
        setLocalError('Você deve aceitar os termos de uso')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else if (mode === 'register') {
        await register(email, password, name)
        setSuccessMessage('Conta criada! Verifique seu email para confirmar.')
        setMode('login')
      } else if (mode === 'forgot-password') {
        // TODO: Implement forgot password
        setSuccessMessage('Email de recuperação enviado!')
      }
    } catch (err) {
      // Error is handled by the store
    } finally {
      setIsSubmitting(false)
    }
  }

  // Social login handlers
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
    } catch (err) {
      // Error handled by store
    }
  }

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub()
    } catch (err) {
      // Error handled by store
    }
  }

  const displayError = localError || authError

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating Nodes Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                rotate: 0,
                scale: 0.8 + Math.random() * 0.4
              }}
              animate={{ 
                y: [null, '-20%', '120%'],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 20 + i * 5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Brain className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">MindMap Hub</h1>
              <p className="text-sm text-white/70">Colaborativo</p>
            </div>
          </Link>
        </div>

        {/* Features List */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Transforme suas ideias em ação
            </h2>
            <p className="text-white/80 text-lg">
              Crie, colabore e organize com o poder da inteligência artificial
            </p>
          </div>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-white/70">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/60 text-sm">
          <p>© 2024 MindMap Hub. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">MindMap Hub</h1>
          </div>

          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">
              {mode === 'login' && 'Bem-vindo de volta!'}
              {mode === 'register' && 'Crie sua conta'}
              {mode === 'forgot-password' && 'Recuperar senha'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {mode === 'login' && 'Entre para continuar colaborando'}
              {mode === 'register' && 'Comece a organizar suas ideias'}
              {mode === 'forgot-password' && 'Enviaremos um link para seu email'}
            </p>
          </div>

          {/* Social Login Buttons */}
          {mode !== 'forgot-password' && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="h-11"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGithubLogin}
                  disabled={isLoading}
                  className="h-11"
                >
                  <Github className="w-5 h-5 mr-2" />
                  GitHub
                </Button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    ou continue com email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Messages */}
          <AnimatePresence mode="wait">
            {displayError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-lg bg-error/10 border border-error/20 flex items-center gap-2 text-error text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{displayError}</span>
              </motion.div>
            )}
            
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2 text-success text-sm"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Register only) */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="name"
                />
              </motion.div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            {mode !== 'forgot-password' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot-password')}
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10 pr-10"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm Password (Register only) */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-10"
                    autoComplete="new-password"
                  />
                </div>
              </motion.div>
            )}

            {/* Remember Me / Terms */}
            {mode === 'login' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Lembrar de mim
                </Label>
              </div>
            )}

            {mode === 'register' && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm font-normal cursor-pointer">
                  Concordo com os{' '}
                  <a href="/terms" className="text-primary hover:underline">
                    Termos de Uso
                  </a>{' '}
                  e{' '}
                  <a href="/privacy" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                </Label>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting || isLoading}
            >
              {(isSubmitting || isLoading) ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {mode === 'login' && 'Entrar'}
              {mode === 'register' && 'Criar conta'}
              {mode === 'forgot-password' && 'Enviar link'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          {/* Mode Switch */}
          <div className="mt-6 text-center text-sm">
            {mode === 'login' && (
              <p className="text-muted-foreground">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-primary font-medium hover:underline"
                >
                  Criar conta
                </button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-muted-foreground">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary font-medium hover:underline"
                >
                  Fazer login
                </button>
              </p>
            )}
            {mode === 'forgot-password' && (
              <p className="text-muted-foreground">
                Lembrou a senha?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-primary font-medium hover:underline"
                >
                  Voltar ao login
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginPage
