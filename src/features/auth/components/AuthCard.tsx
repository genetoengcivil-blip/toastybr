import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2,
  UtensilsCrossed, BarChart3, Package, ShoppingCart,
} from 'lucide-react'
import { loginSchema, type LoginFormData, signUpSchema, type SignUpFormData } from '../types'
import { signInWithPassword, signUp } from '../services/auth'

type Mode = 'signin' | 'signup'

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)'
const MAIN_MS = 620
const FORM_MS = 380

interface AuthCardProps {
  initialMode: Mode
}

export default function AuthCard({ initialMode }: AuthCardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [animating, setAnimating] = useState(false)
  const [incoming, setIncoming] = useState<Mode | null>(null)
  const [outgoing, setOutgoing] = useState<Mode | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const switchMode = useCallback((target: Mode) => {
    if (target === mode || animating) return
    setAnimating(true)
    setOutgoing(mode)
    setIncoming(target)

    const targetPath = target === 'signup' ? '/signup' : '/login'
    if (location.pathname !== targetPath) {
      navigate(targetPath, { replace: true })
    }

    timerRef.current = window.setTimeout(() => {
      setMode(target)
      setAnimating(false)
      setIncoming(null)
      setOutgoing(null)
    }, MAIN_MS + 40)
  }, [mode, animating, navigate, location.pathname])

  const goToSignup = useCallback(() => switchMode('signup'), [switchMode])
  const goToLogin = useCallback(() => switchMode('signin'), [switchMode])

  const cardClass = `auth-card ${mode === 'signin' ? 'signin' : 'signup'}`

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[hsl(var(--background))]"
      style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.03) 0%, transparent 50%)' }}
    >
      {/* Desktop + mobile card container */}
      <div className="flex flex-col items-center w-full max-w-[980px]">
        <div className={cardClass} style={{ transition: 'none' }}>

          {/* ─── card-bg-1: visible during signin, slides left during signup ─── */}
          <div
            className="auth-card-bg auth-card-bg-1 bg-gradient-to-br from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))]"
            style={{ borderRadius: '32px' }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="auth-shape w-32 h-32 top-[12%] left-[15%] auth-float" />
              <div className="auth-shape w-20 h-20 bottom-[18%] right-[20%] auth-float-delay" />
              <div className="auth-shape w-14 h-14 top-[55%] left-[60%] auth-float-slow" />
              <div className="auth-shape-line h-16 top-[30%] right-[10%] rotate-45 auth-float-delay" />
              <div className="auth-shape-line h-12 bottom-[30%] left-[35%] -rotate-30 auth-float" />
              <div className="auth-shape w-24 h-24 top-[70%] right-[40%] border-white/5 auth-float-slow" />
            </div>

            <div className="relative z-10 flex flex-col justify-center h-full px-10 py-12">
              <div className="auth-logo auth-logo-1 text-white mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <UtensilsCrossed size={22} />
                  </div>
                  <span className="text-2xl font-bold tracking-tight">TOASTY OS</span>
                </div>
              </div>

              <h2 className="text-[26px] font-bold leading-tight mb-3 text-white">
                Gestão inteligente<br />para restaurantes.
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-10">
                Venda, operação, estoque e gestão em um só lugar.
              </p>

              <div className="space-y-3">
                {[
                  { icon: BarChart3, text: 'Dashboard em tempo real' },
                  { icon: Package, text: 'Controle de estoque completo' },
                  { icon: ShoppingCart, text: 'Pedidos e POS integrados' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={15} className="text-white" />
                      </div>
                      <span className="text-sm text-white/80">{item.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ─── card-bg-2: visible during signup, slides in from left ─── */}
          <div
            className="auth-card-bg auth-card-bg-2 bg-gradient-to-bl from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))]"
            style={{ borderRadius: '32px' }}
          >
            <div className="absolute inset-0 overflow-hidden">
              <div className="auth-shape w-28 h-28 top-[15%] right-[18%] auth-float" />
              <div className="auth-shape w-16 h-16 bottom-[22%] left-[15%] auth-float-delay" />
              <div className="auth-shape w-10 h-10 top-[50%] left-[25%] auth-float-slow" />
              <div className="auth-shape-line h-14 top-[25%] left-[12%] -rotate-45 auth-float" />
              <div className="auth-shape-line h-10 bottom-[25%] right-[30%] rotate-30 auth-float-delay" />
            </div>

            <div className="relative z-10 flex flex-col justify-center h-full px-10 py-12">
              <div className="auth-logo auth-logo-2 text-white mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                    <UtensilsCrossed size={22} />
                  </div>
                  <span className="text-2xl font-bold tracking-tight">TOASTY OS</span>
                </div>
              </div>

              <h2 className="text-[26px] font-bold leading-tight mb-3 text-white">
                Comece a organizar<br />sua operação.
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-10">
                Crie sua conta e tenha acesso a todas as ferramentas do Toasty OS.
              </p>

              <div className="space-y-3">
                {[
                  { icon: BarChart3, text: 'Relatórios e insights' },
                  { icon: Package, text: 'Gestão de estoque' },
                  { icon: ShoppingCart, text: 'Pedidos e entregas' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.text} className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={15} className="text-white" />
                      </div>
                      <span className="text-sm text-white/80">{item.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ─── mobile brand strip (hidden on desktop) ─── */}
          <div className="md:hidden flex-shrink-0 bg-gradient-to-br from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))] text-white flex flex-col items-center justify-center px-6 py-8 relative z-10">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
                <UtensilsCrossed size={18} />
              </div>
              <span className="text-xl font-bold tracking-tight">TOASTY OS</span>
            </div>
            <p className="text-white/70 text-xs text-center">Gestão inteligente para restaurantes.</p>
          </div>

          {/* ─── login form: left side ─── */}
          <div className="auth-form-panel auth-form-panel-left">
            <div
              className={`auth-form-inner ${
                mode === 'signin' && !outgoing
                  ? 'active'
                  : outgoing === 'signin'
                    ? 'exit-left'
                    : incoming === 'signin'
                      ? 'enter-left'
                      : ''
              }`}
              style={{ transition: `opacity ${FORM_MS}ms ${EASE}, transform ${FORM_MS}ms ${EASE}` }}
            >
              <LoginForm onSubmitSuccess={() => navigate('/')} />
            </div>
          </div>

          {/* ─── signup form: right side ─── */}
          <div className="auth-form-panel auth-form-panel-right">
            <div
              className={`auth-form-inner ${
                mode === 'signup' && !outgoing
                  ? 'active'
                  : outgoing === 'signup'
                    ? 'exit-right'
                    : incoming === 'signup'
                      ? 'enter-right'
                      : ''
              }`}
              style={{
                transition: `opacity ${FORM_MS}ms ${EASE}, transform ${FORM_MS}ms ${EASE}`,
                transformOrigin: 'right center',
              }}
            >
              <SignUpForm onSubmitSuccess={() => navigate('/')} />
            </div>
          </div>
        </div>

        {/* ─── switch link ─── */}
        <div className="auth-switch-link mt-4">
          {mode === 'signin' ? (
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Ainda não tem conta?{' '}
              <button onClick={goToSignup} className="text-[hsl(var(--primary))] hover:underline font-semibold">
                Criar conta
              </button>
            </span>
          ) : (
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Já possui conta?{' '}
              <button onClick={goToLogin} className="text-[hsl(var(--primary))] hover:underline font-semibold">
                Entrar
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── LoginForm ─── */

function LoginForm({ onSubmitSuccess }: { onSubmitSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    try {
      setError(null)
      setSubmitting(true)
      await signInWithPassword(data)
      onSubmitSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Bem-vindo de volta</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">Entre na sua conta para continuar.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3" role="alert">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              aria-invalid={!!errors.email}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="seu@email.com"
            />
          </div>
          {errors.email && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-sm font-medium text-[hsl(var(--foreground))]">Senha</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              {...register('password')}
              aria-invalid={!!errors.password}
              className="w-full h-11 pl-10 pr-11 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="Sua senha"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.password.message}</p>}
        </div>
        <div className="flex items-center justify-end">
          <button type="button" className="text-xs text-[hsl(var(--primary))] hover:underline font-medium">
            Esqueceu sua senha?
          </button>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
        >
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" />Entrando...</>
          ) : (
            <>Entrar<ArrowRight size={16} /></>
          )}
        </button>
      </form>
    </div>
  )
}

/* ─── SignUpForm ─── */

function SignUpForm({ onSubmitSuccess }: { onSubmitSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [showCf, setShowCf] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  async function onSubmit(data: SignUpFormData) {
    try {
      setError(null)
      setSubmitting(true)
      await signUp(data)
      onSubmitSuccess()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Crie sua conta</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">Comece a organizar sua operação com o Toasty OS.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3" role="alert">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="text-sm font-medium text-[hsl(var(--foreground))]">Nome completo</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              {...register('full_name')}
              aria-invalid={!!errors.full_name}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="Seu nome"
            />
          </div>
          {errors.full_name && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              aria-invalid={!!errors.email}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="seu@email.com"
            />
          </div>
          {errors.email && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="text-sm font-medium text-[hsl(var(--foreground))]">Senha</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              id="signup-password"
              type={showPw ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              aria-invalid={!!errors.password}
              className="w-full h-11 pl-10 pr-11 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="signup-confirm" className="text-sm font-medium text-[hsl(var(--foreground))]">Confirmar senha</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input
              id="signup-confirm"
              type={showCf ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('confirm_password')}
              aria-invalid={!!errors.confirm_password}
              className="w-full h-11 pl-10 pr-11 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="Repita a senha"
            />
            <button
              type="button"
              onClick={() => setShowCf(!showCf)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label={showCf ? 'Ocultar confirmação' : 'Mostrar confirmação'}
            >
              {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm_password && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.confirm_password.message}</p>}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 mt-1"
        >
          {submitting ? (
            <><Loader2 size={16} className="animate-spin" />Criando conta...</>
          ) : (
            <>Criar conta<ArrowRight size={16} /></>
          )}
        </button>
      </form>
    </div>
  )
}
