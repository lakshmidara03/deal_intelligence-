import type { Activity, Deal, DealInsight } from './types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  deals: () => request<Deal[]>('/deals'),
  deal: (id: string) => request<Deal>(`/deals/${id}`),
  activities: (id: string) => request<Activity[]>(`/deals/${id}/activities`),
  insights: (id: string) => request<DealInsight[]>(`/deals/${id}/insights`),
  analyze: (id: string) =>
    request<Deal>(`/deals/${id}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ refresh: true })
    })
};
