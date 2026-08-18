import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AuthShell from './AuthShell'
import { signInWithPassword } from '../services/auth'

vi.mock('../services/auth', () => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Login component (item 23)', () => {
  it('renders email and password fields', () => {
    render(
      <MemoryRouter>
        <AuthShell initialMode="login" />
      </MemoryRouter>
    )
    expect(screen.getByPlaceholderText('seu@email.com')).toBeDefined()
    expect(screen.getByPlaceholderText('Sua senha')).toBeDefined()
  })

  it('validates required fields before submitting', async () => {
    render(
      <MemoryRouter>
        <AuthShell initialMode="login" />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(await screen.findByText(/email inv/i)).toBeDefined()
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('calls signInWithPassword with valid credentials', async () => {
    ;(signInWithPassword as any).mockResolvedValue({})
    render(
      <MemoryRouter>
        <AuthShell initialMode="login" />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'user@toasty.com' } })
    fireEvent.change(screen.getByPlaceholderText('Sua senha'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(signInWithPassword).toHaveBeenCalledTimes(1))
    expect(signInWithPassword).toHaveBeenCalledWith({ email: 'user@toasty.com', password: 'secret123' })
  })

  it('shows error message when sign-in fails', async () => {
    ;(signInWithPassword as any).mockRejectedValue(new Error('Credenciais inválidas'))
    render(
      <MemoryRouter>
        <AuthShell initialMode="login" />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'user@toasty.com' } })
    fireEvent.change(screen.getByPlaceholderText('Sua senha'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText(/credenciais inv/i)).toBeDefined()
  })
})
