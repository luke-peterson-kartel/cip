import { apiClient } from '../client'
import type { User, UserInvite, UserUpdate, PaginatedResponse } from '@/types'

export async function getCurrentUser(): Promise<User> {
  return apiClient('/users/me')
}

export async function getUser(userId: string): Promise<User> {
  return apiClient(`/users/${userId}`)
}

export async function updateUser(userId: string, data: UserUpdate): Promise<User> {
  return apiClient(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteUser(userId: string): Promise<void> {
  return apiClient(`/users/${userId}`, {
    method: 'DELETE',
  })
}

export async function getOrganizationUsers(organizationId: string): Promise<PaginatedResponse<User>> {
  return apiClient(`/organizations/${organizationId}/users`)
}

export async function inviteUser(organizationId: string, data: UserInvite): Promise<User> {
  return apiClient(`/organizations/${organizationId}/users`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
  return apiClient(`/organizations/${organizationId}/users/${userId}`, {
    method: 'DELETE',
  })
}
