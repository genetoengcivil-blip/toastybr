import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MovementDialog } from './MovementDialog'

const mutateAsync = vi.fn().mockResolvedValue('movement-id')

vi.mock('../hooks/useInventoryMovements', () => ({
  useInventoryBalances: () => ({ data: [], isLoading: false }),
  useUpdateMinimumQuantity: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useApplyMovement: () => ({ mutateAsync, isPending: false }),
}))

vi.mock('../../ingredients/hooks/useIngredients', () => ({
  useIngredients: () => ({
    data: [{ id: '11111111-1111-1111-1111-111111111111', name: 'Farinha', unit: 'kg', is_active: true }],
  }),
}))

const INGREDIENT_ID = '11111111-1111-1111-1111-111111111111'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MovementDialog (item 26)', () => {
  it('renders ingredient options provided by the ingredients hook', () => {
    render(<MovementDialog open={true} onOpenChange={() => {}} />)
    expect(screen.getByText(/farinha \(kg\)/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /registrar/i })).toBeDefined()
  })

  it('shows validation error when submitting without an ingredient', async () => {
    render(<MovementDialog open={true} onOpenChange={() => {}} />)
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: /registrar/i }))

    expect(await screen.findByText(/selecione um ingrediente/i)).toBeDefined()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('closes the dialog on cancel', () => {
    const onOpenChange = vi.fn()
    render(<MovementDialog open={true} onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
