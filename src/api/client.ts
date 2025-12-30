import { ApiError } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_BASE = import.meta.env.VITE_API_BASE || 'https://cip-api-dev.kartel.ai/v1'

class ApiClientError extends Error {
  constructor(public status: number, public error: ApiError) {
    super(error.message)
    this.name = 'ApiClientError'
  }
}

async function mockDelay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms + Math.random() * 200))
}

// Import mock handlers
import { mockHandler } from '@/mock/handlers'

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (USE_MOCK) {
    await mockDelay()
    return mockHandler<T>(endpoint, options)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new ApiClientError(response.status, error)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export { ApiClientError }
