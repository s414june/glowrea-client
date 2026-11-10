import type { StatusContextResponse, StatusDetailResponse } from '#shared/types/status'

export function fetchStatusDetail(id: string, instance?: string): Promise<StatusDetailResponse> {
  return $fetch<StatusDetailResponse>(`/api/timeline/status/${id}`, {
    method: 'GET',
    query: instance ? { instance } : undefined,
  })
}

export function fetchStatusContext(id: string, instance?: string): Promise<StatusContextResponse> {
  return $fetch<StatusContextResponse>(`/api/timeline/status/${id}/context`, {
    method: 'GET',
    query: instance ? { instance } : undefined,
  })
}
