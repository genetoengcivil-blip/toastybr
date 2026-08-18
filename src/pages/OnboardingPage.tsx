import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2, ArrowRight, Loader2, UtensilsCrossed,
  BarChart3, Package, ShoppingCart,
} from 'lucide-react'
import { onboardingSchema, type OnboardingFormData } from '../features/auth/types'
import { createOrganization } from '../features/auth/services/organization'
import { useCurrentOrganization } from '../features/auth/context'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { refresh } = useCurrentOrganization()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      organization_name: '',
      organization_slug: '',
    },
  })

  const orgName = watch('organization_name')

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const name = e.target.value
    setValue('organization_name', name)
    setValue('organization_slug', slugify(name), { shouldValidate: true })
  }

  async function onSubmit(data: OnboardingFormData) {
    try {
      setError(null)
      setSubmitting(true)
      await createOrganization(data.organization_name, data.organization_slug)
      await refresh()
      navigate('/')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar organização'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[hsl(var(--background))]"
      style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.04) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(var(--primary) / 0.03) 0%, transparent 50%)' }}
    >
      <div className="onboarding-card flex flex-col md:flex-row relative">

        {/* Brand panel — left side */}
        <div className="hidden md:flex md:w-[45%] relative bg-gradient-to-br from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))] text-white flex-shrink-0 overflow-hidden" style={{ borderRadius: '32px 0 0 32px' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="auth-shape w-32 h-32 top-[12%] left-[15%] auth-float" />
            <div className="auth-shape w-20 h-20 bottom-[18%] right-[20%] auth-float-delay" />
            <div className="auth-shape w-14 h-14 top-[55%] left-[60%] auth-float-slow" />
            <div className="auth-shape-line h-16 top-[30%] right-[10%] rotate-45 auth-float-delay" />
            <div className="auth-shape-line h-12 bottom-[30%] left-[35%] -rotate-30 auth-float" />
          </div>

          <div className="relative z-10 flex flex-col justify-center h-full px-10 py-12">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <UtensilsCrossed size={22} />
              </div>
              <span className="text-2xl font-bold tracking-tight">TOASTY OS</span>
            </div>

            <h2 className="text-[26px] font-bold leading-tight mb-3">
              Bem-vindo ao<br />Toasty OS.
            </h2>
            <p className="text-white/70 text-sm leading-relaxed mb-10">
              Vamos configurar seu estabelecimento para começar.
            </p>

            <div className="space-y-3">
              {[
                { icon: BarChart3, text: 'Dashboard personalizado' },
                { icon: Package, text: 'Estoque e compras' },
                { icon: ShoppingCart, text: 'Pedidos e cardápio' },
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

        {/* Mobile brand strip */}
        <div className="md:hidden flex-shrink-0 bg-gradient-to-br from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))] text-white flex flex-col items-center justify-center px-6 py-7">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
              <UtensilsCrossed size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight">TOASTY OS</span>
          </div>
          <p className="text-white/70 text-xs text-center">Vamos configurar seu estabelecimento.</p>
        </div>

        {/* Form panel */}
        <div className="w-full md:w-[55%] bg-[hsl(var(--card))] flex flex-col justify-center px-8 sm:px-12 py-10 md:py-10 relative z-10 auth-animate-in" style={{ borderRadius: '0 32px 32px 0' }}>
          <div className="w-full max-w-[380px] mx-auto">
            <div className="mb-2">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-3 py-1 rounded-full mb-4">
                <span>Passo 1 de 1</span>
              </div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Bem-vindo ao Toasty OS</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1.5">Vamos configurar seu estabelecimento.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-6" noValidate>
              {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3" role="alert">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="organization_name" className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Nome do estabelecimento
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="organization_name"
                    type="text"
                    autoComplete="organization"
                    {...register('organization_name', { onChange: handleNameChange })}
                    aria-invalid={!!errors.organization_name}
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:border-transparent transition-shadow"
                    placeholder="Ex: Minha Lanchonete"
                  />
                </div>
                {errors.organization_name && (
                  <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.organization_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="organization_slug" className="text-sm font-medium text-[hsl(var(--foreground))]">
                  Slug
                </label>
                <input
                  id="organization_slug"
                  type="text"
                  {...register('organization_slug')}
                  readOnly
                  aria-invalid={!!errors.organization_slug}
                  className="w-full h-11 px-4 rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--muted))]/50 text-[hsl(var(--muted-foreground))] text-sm focus:outline-none cursor-not-allowed"
                  placeholder="auto-gerado"
                />
                {errors.organization_slug && (
                  <p className="text-xs text-red-600 dark:text-red-400" role="alert">{errors.organization_slug.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !orgName}
                className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 mt-1"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    Criar organização
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
