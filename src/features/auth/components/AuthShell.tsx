import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Mail, Lock, Eye, EyeOff, User, ArrowRight, Loader2,
  UtensilsCrossed, BarChart3, Package, ShoppingCart,
} from 'lucide-react'
import { loginSchema, type LoginFormData, signUpSchema, type SignUpFormData } from '../types'
import { signInWithPassword, signUp } from '../services/auth'

type Mode = 'login' | 'signup'

interface AuthShellProps {
  initialMode: Mode
}

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const MAIN_MS = 550
const FORM_MS = 350

export default function AuthShell({ initialMode }: AuthShellProps) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'to-signup' | 'to-login'>('to-signup')
  const [incoming, setIncoming] = useState<Mode | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const switchMode = useCallback((target: Mode) => {
    if (target === mode || animating) return
    setDirection(target === 'signup' ? 'to-signup' : 'to-login')
    setAnimating(true)
    setIncoming(target)
    navigate(target === 'signup' ? '/signup' : '/login', { replace: true })

    timerRef.current = window.setTimeout(() => {
      setMode(target)
      setAnimating(false)
      setIncoming(null)
    }, MAIN_MS + 40)
  }, [mode, animating, navigate])

  const goToSignup = useCallback(() => switchMode('signup'), [switchMode])
  const goToLogin = useCallback(() => switchMode('login'), [switchMode])

  const showLogin = mode === 'login' || (animating && incoming === 'login')
  const showSignup = mode === 'signup' || (animating && incoming === 'signup')

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[hsl(var(--background))]"
      style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.03) 0%, transparent 50%)' }}
    >
      <div className="w-full max-w-[980px] min-h-[560px] rounded-2xl overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/30 flex flex-col md:flex-row relative">

        {/* Branding panel — desktop: full-width absolute strip; mobile: static header */}
        <div
          className="auth-panel absolute md:absolute inset-y-0 w-full md:w-[55%] h-full bg-gradient-to-br from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))] text-white z-10 auth-card-diagonal"
          style={{
            transition: `transform ${MAIN_MS}ms ${EASE}`,
            transform: direction === 'to-signup'
              ? 'translateX(-100%)'
              : 'translateX(0%)',
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div
              className="absolute top-[12%] left-[15%] w-32 h-32 rounded-full border border-white/10 auth-float"
              style={{
                transition: `transform ${MAIN_MS + 100}ms ${EASE}`,
                transform: direction === 'to-signup' ? 'translateX(-20px)' : 'translateX(0)',
              }}
            />
            <div
              className="absolute bottom-[18%] right-[20%] w-20 h-20 rounded-full border border-white/10 auth-float-delay"
              style={{
                transition: `transform ${MAIN_MS + 150}ms ${EASE}`,
                transform: direction === 'to-signup' ? 'translateX(15px)' : 'translateX(0)',
              }}
            />
            <div
              className="absolute top-[55%] left-[60%] w-14 h-14 rounded-full border border-white/10 auth-float-slow"
              style={{
                transition: `transform ${MAIN_MS + 200}ms ${EASE}`,
                transform: direction === 'to-signup' ? 'translateX(-10px) translateY(-8px)' : 'translateX(0) translateY(0)',
              }}
            />
            <div className="absolute top-[30%] right-[10%] w-1 h-16 bg-white/10 rotate-45 auth-float-delay" />
            <div className="absolute bottom-[30%] left-[35%] w-1 h-12 bg-white/10 -rotate-30 auth-float" />
            <div
              className="absolute top-[70%] right-[40%] w-24 h-24 rounded-full border border-white/5 auth-float-slow"
              style={{
                transition: `transform ${MAIN_MS + 250}ms ${EASE}`,
                transform: direction === 'to-signup' ? 'translateX(10px) translateY(6px)' : 'translateX(0) translateY(0)',
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col justify-center h-full px-10 py-12">
            <div
              className="flex items-center gap-3 mb-8"
              style={{
                transition: `transform ${MAIN_MS - 50}ms ${EASE}`,
                transform: direction === 'to-signup' ? 'translateX(-15px)' : 'translateX(0)',
              }}
            >
              <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <UtensilsCrossed size={22} />
              </div>
              <span className="text-2xl font-bold tracking-tight">TOASTY OS</span>
            </div>

            <h2
              className="text-[26px] font-bold leading-tight mb-3"
              style={{
                transition: `transform ${MAIN_MS - 80}ms ${EASE}`,
                transform: direction === 'to-signup' ? 'translateX(-20px)' : 'translateX(0)',
              }}
            >
              {mode === 'login' ? (
                <>Gestão inteligente<br />para restaurantes.</>
              ) : (
                <>Comece a organizar<br />sua operação.</>
              )}
            </h2>
            <p
              className="text-white/70 text-sm leading-relaxed mb-10"
              style={{
                transition: `transform ${MAIN_MS - 60}ms ${EASE}`,
                transform: direction === 'to-signup' ? 'translateX(-25px)' : 'translateX(0)',
              }}
            >
              {mode === 'login'
                ? 'Venda, operação, estoque e gestão em um só lugar.'
                : 'Crie sua conta e tenha acesso a todas as ferramentas do Toasty OS.'}
            </p>

            <div className="space-y-3">
              {(mode === 'login'
                ? [
                    { icon: BarChart3, text: 'Dashboard em tempo real' },
                    { icon: Package, text: 'Controle de estoque completo' },
                    { icon: ShoppingCart, text: 'Pedidos e POS integrados' },
                  ]
                : [
                    { icon: BarChart3, text: 'Relatórios e insights' },
                    { icon: Package, text: 'Gestão de estoque' },
                    { icon: ShoppingCart, text: 'Pedidos e entregas' },
                  ]
              ).map((item, i) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.text}
                    className="flex items-center gap-3"
                    style={{
                      transition: `transform ${MAIN_MS - 100 + i * 40}ms ${EASE}, opacity ${MAIN_MS - 100 + i * 40}ms ${EASE}`,
                      transform: direction === 'to-signup' ? 'translateX(-30px)' : 'translateX(0)',
                      opacity: animating ? 0.3 : 1,
                    }}
                  >
                    <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={15} />
                    </div>
                    <span className="text-sm text-white/80">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mobile brand strip */}
        <div className="md:hidden flex-shrink-0 bg-gradient-to-br from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))] text-white flex flex-col items-center justify-center px-6 py-8 relative z-10">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
              <UtensilsCrossed size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight">TOASTY OS</span>
          </div>
          <p className="text-white/70 text-xs text-center">Gestão inteligente para restaurantes.</p>
        </div>

        {/* Form panels */}
        <div className="w-full md:w-[55%] relative z-20 bg-[hsl(var(--card))] min-h-[480px] md:min-h-0">
          {showLogin && (
            <div
              className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 py-10 md:py-10"
              style={{
                transition: `opacity ${FORM_MS}ms ${EASE}, transform ${FORM_MS}ms ${EASE}`,
                opacity: animating && mode === 'login' ? 0 : 1,
                transform: animating && mode === 'login'
                  ? 'translateX(-30px)'
                  : animating && incoming === 'login'
                    ? 'translateX(30px)'
                    : 'translateX(0)',
                pointerEvents: animating && mode === 'login' ? 'none' : 'auto',
              }}
            >
              <LoginForm onSubmitSuccess={() => navigate('/')} />
            </div>
          )}

          {showSignup && (
            <div
              className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 py-10 md:py-10"
              style={{
                transition: `opacity ${FORM_MS}ms ${EASE}, transform ${FORM_MS}ms ${EASE}`,
                opacity: animating && mode === 'signup' ? 0 : 1,
                transform: animating && mode === 'signup'
                  ? 'translateX(30px)'
                  : animating && incoming === 'signup'
                    ? 'translateX(-30px)'
                    : 'translateX(0)',
                pointerEvents: animating && mode === 'signup' ? 'none' : 'auto',
              }}
            >
              <SignUpForm onSubmitSuccess={() => navigate('/')} />
            </div>
          )}
        </div>
      </div>

      {/* Switch links (below card) */}
      <div className="absolute bottom-6 left-0 right-0 text-center text-sm text-[hsl(var(--muted-foreground))]">
        {mode === 'login' ? (
          <span>Ainda não tem conta?{' '}
            <button onClick={goToSignup} className="text-[hsl(var(--primary))] hover:underline font-semibold">Criar conta</button>
          </span>
        ) : (
          <span>Já possui conta?{' '}
            <button onClick={goToLogin} className="text-[hsl(var(--primary))] hover:underline font-semibold">Entrar</button>
          </span>
        )}
      </div>

      <style>{`
        @media (max-width: 767px) {
          .auth-panel {
            clip-path: none !important;
            width: 100% !important;
            transform: none !important;
            position: relative !important;
            height: auto !important;
            min-height: auto !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .auth-panel,
          .auth-panel * {
            transition-duration: 120ms !important;
          }
        }
      `}</style>
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
    <div className="w-full max-w-[380px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Bem-vindo de volta</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">Entre na sua conta para continuar.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3" role="alert">{error}</div>}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input id="login-email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="seu@email.com" />
          </div>
          {errors.email && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-sm font-medium text-[hsl(var(--foreground))]">Senha</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input id="login-password" type={showPw ? 'text' : 'password'} autoComplete="current-password" {...register('password')} aria-invalid={!!errors.password}
              className="w-full h-11 pl-10 pr-11 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="Sua senha" />
            <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.password.message}</p>}
        </div>
        <div className="flex items-center justify-end">
          <button type="button" className="text-xs text-[hsl(var(--primary))] hover:underline font-medium">Esqueceu sua senha?</button>
        </div>
        <button type="submit" disabled={submitting}
          className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2">
          {submitting ? (<><Loader2 size={16} className="animate-spin" />Entrando...</>) : (<>Entrar<ArrowRight size={16} /></>)}
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
    <div className="w-full max-w-[380px] mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Crie sua conta</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">Comece a organizar sua operação com o Toasty OS.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {error && <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3" role="alert">{error}</div>}
        <div className="space-y-1.5">
          <label htmlFor="signup-name" className="text-sm font-medium text-[hsl(var(--foreground))]">Nome completo</label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input id="signup-name" type="text" autoComplete="name" {...register('full_name')} aria-invalid={!!errors.full_name}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="Seu nome" />
          </div>
          {errors.full_name && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.full_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="signup-email" className="text-sm font-medium text-[hsl(var(--foreground))]">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input id="signup-email" type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="seu@email.com" />
          </div>
          {errors.email && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="signup-password" className="text-sm font-medium text-[hsl(var(--foreground))]">Senha</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input id="signup-password" type={showPw ? 'text' : 'password'} autoComplete="new-password" {...register('password')} aria-invalid={!!errors.password}
              className="w-full h-11 pl-10 pr-11 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="Mínimo 6 caracteres" />
            <button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="signup-confirm" className="text-sm font-medium text-[hsl(var(--foreground))]">Confirmar senha</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input id="signup-confirm" type={showCf ? 'text' : 'password'} autoComplete="new-password" {...register('confirm_password')} aria-invalid={!!errors.confirm_password}
              className="w-full h-11 pl-10 pr-11 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
              placeholder="Repita a senha" />
            <button type="button" onClick={() => setShowCf(!showCf)} tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
              aria-label={showCf ? 'Ocultar confirmação' : 'Mostrar confirmação'}>
              {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm_password && <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.confirm_password.message}</p>}
        </div>
        <button type="submit" disabled={submitting}
          className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 mt-1">
          {submitting ? (<><Loader2 size={16} className="animate-spin" />Criando conta...</>) : (<>Criar conta<ArrowRight size={16} /></>)}
        </button>
      </form>
    </div>
  )
}
