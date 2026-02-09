import { create } from 'zustand'
import type { User, Organization } from '@/types'
import { apiClient } from '@/api/client'

interface AuthState {
  user: User | null
  organization: Organization | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
  updateOrganization: (updates: Partial<Organization>) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  organization: null,
  isAuthenticated: false,
  isLoading: true,

  login: async () => {
    set({ isLoading: true })
    try {
      // Fetch current user
      const user = await apiClient<User>('/users/me')

      // Fetch user's organization
      const orgsResponse = await apiClient<{ items: Organization[] }>('/organizations')
      const organization = orgsResponse.items[0] || null

      set({
        user,
        organization,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      console.error('Login failed:', error)
      set({ isLoading: false })
    }
  },

  logout: () => {
    set({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: false,
    })
  },

  updateOrganization: (updates) => {
    set((state) => ({
      organization: state.organization ? { ...state.organization, ...updates } : null,
    }))
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true })
    try {
      const user = await apiClient<User>('/users/me')
      const orgsResponse = await apiClient<{ items: Organization[] }>('/organizations')
      const organization = orgsResponse.items[0] || null

      set({
        user,
        organization,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      console.error('Failed to fetch current user:', error)
      set({
        user: null,
        organization: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
