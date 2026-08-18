import { Button } from '../components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <p className="text-6xl font-bold text-[hsl(var(--muted-foreground))]/20">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="text-[hsl(var(--muted-foreground))]">A página que você procura não existe ou foi movida.</p>
      <Button asChild>
        <a href="/">Voltar ao início</a>
      </Button>
    </div>
  )
}
