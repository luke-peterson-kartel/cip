import { useMockClientStore } from '@/store/mockClientStore'
import { getClientData, type ClientDataSet } from '@/mock/data'

export function useMockData(): ClientDataSet {
  const clientId = useMockClientStore((s) => s.clientId)
  return getClientData(clientId)
}
