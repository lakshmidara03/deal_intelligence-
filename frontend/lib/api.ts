import type { Account, Activity, Deal, DealInsight } from './types';

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
  deals: (accountId?: string) => request<Deal[]>(`/deals${accountId ? `?accountId=${accountId}` : ''}`),
  deal: (id: string) => request<Deal>(`/deals/${id}`),
  activities: (id: string) => request<Activity[]>(`/deals/${id}/activities`),
  insights: (id: string) => request<DealInsight[]>(`/deals/${id}/insights`),
  analyze: (id: string) =>
    request<Deal>(`/deals/${id}/analyze`, {
      method: 'POST',
      body: JSON.stringify({ refresh: true })
    }),
  accounts: () => request<Account[]>('/accounts'),
  login: (payload: { email: string; password: string }) =>
    request<Account>('/accounts/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  signup: (payload: { name: string; email: string; password: string; title: string; role: 'ADMIN' | 'EMPLOYEE' }) =>
    request<Account>('/accounts/signup', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
};
