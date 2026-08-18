import { useQuery } from '@tanstack/react-query'
import { useCurrentOrganization } from '../../auth/context'
import { getInventoryBalances } from '../services/balance'

export function useInventoryBalances() {
  const { organization } = useCurrentOrganization()
  const orgId = organization?.id ?? ''

  return useQuery({
    queryKey: ['inventory', orgId, 'balances'],
    queryFn: () => getInventoryBalances(orgId),
    enabled: !!orgId,
  })
}
