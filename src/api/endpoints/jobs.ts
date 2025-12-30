import { apiClient } from '../client'
import type { Job, JobUpdate } from '@/types'

export async function getJob(jobId: string): Promise<Job> {
  return apiClient(`/jobs/${jobId}`)
}

export async function updateJob(jobId: string, data: JobUpdate): Promise<Job> {
  return apiClient(`/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteJob(jobId: string): Promise<void> {
  return apiClient(`/jobs/${jobId}`, {
    method: 'DELETE',
  })
}
