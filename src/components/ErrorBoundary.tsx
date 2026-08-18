import { Component, type ReactNode } from 'react'
import { Button } from './ui/button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error.message)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 p-8">
          <p className="text-6xl font-bold text-[hsl(var(--muted-foreground))]/20">!</p>
          <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
          <p className="text-[hsl(var(--muted-foreground))] max-w-md">
            Ocorreu um erro inesperado. Tente novamente ou volte ao início.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => this.setState({ hasError: false })}>
              Tentar novamente
            </Button>
            <Button asChild>
              <a href="/">Voltar ao início</a>
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
