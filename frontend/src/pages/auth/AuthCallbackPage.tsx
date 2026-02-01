// ============================================================================
// MindMap Hub - Auth Callback Page
// ============================================================================
// Página de callback para autenticação OAuth (Google, GitHub)
// Processa o token e redireciona o usuário
// ============================================================================

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'

// ============================================================================
// Auth Callback Page Component
// ============================================================================

type CallbackStatus = 'processing' | 'success' | 'error'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { handleOAuthCallback } = useAuthStore()
  
  const [status, setStatus] = useState<CallbackStatus>('processing')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Supabase handles the token exchange automatically
        // We just need to verify the session
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          setStatus('error')
          setErrorMessage(errorDescription || 'Erro na autenticação')
          return
        }

        // Handle OAuth callback
        await handleOAuthCallback()
        
        setStatus('success')
        
        // Redirect to dashboard after success
        setTimeout(() => {
          const returnTo = localStorage.getItem('auth_return_to') || '/dashboard'
          localStorage.removeItem('auth_return_to')
          navigate(returnTo, { replace: true })
        }, 1500)
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Erro ao processar autenticação')
      }
    }

    processCallback()
  }, [searchParams, handleOAuthCallback, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-card rounded-2xl shadow-xl border p-8 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Processing State */}
          {status === 'processing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
              <h2 className="text-xl font-semibold">Processando...</h2>
              <p className="text-muted-foreground">
                Estamos verificando sua autenticação. Por favor, aguarde.
              </p>

              {/* Progress Dots */}
              <div className="flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </motion.div>
              </div>
              <h2 className="text-xl font-semibold text-success">
                Autenticação bem-sucedida!
              </h2>
              <p className="text-muted-foreground">
                Você será redirecionado em instantes...
              </p>

              {/* Redirect Progress */}
              <div className="relative h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-success"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5 }}
                />
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center"
                >
                  <AlertCircle className="w-8 h-8 text-error" />
                </motion.div>
              </div>
              <h2 className="text-xl font-semibold text-error">
                Erro na autenticação
              </h2>
              <p className="text-muted-foreground">
                {errorMessage || 'Ocorreu um erro ao processar sua autenticação.'}
              </p>

              <div className="flex flex-col gap-2 pt-4">
                <Button
                  onClick={() => navigate('/login', { replace: true })}
                  className="w-full"
                >
                  Tentar novamente
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate('/', { replace: true })}
                  className="w-full"
                >
                  Voltar ao início
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Problemas para acessar?{' '}
          <a href="mailto:suporte@mindmaphub.com" className="text-primary hover:underline">
            Entre em contato
          </a>
        </p>
      </motion.div>
    </div>
  )
}

export default AuthCallbackPage
