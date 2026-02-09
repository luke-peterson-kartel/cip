import { create } from 'zustand'
import { type ClientId, DEFAULT_CLIENT, isValidClientId } from '@/mock/data'

function getClientFromURL(): ClientId {
  const params = new URLSearchParams(window.location.search)
  const client = params.get('client')
  if (client && isValidClientId(client)) return client
  return DEFAULT_CLIENT
}

interface MockClientState {
  clientId: ClientId
  setClientId: (id: ClientId) => void
}

export const useMockClientStore = create<MockClientState>((set) => ({
  clientId: getClientFromURL(),
  setClientId: (id) => {
    const url = new URL(window.location.href)
    url.searchParams.set('client', id)
    window.history.replaceState({}, '', url.toString())
    window.location.reload()
  },
}))
