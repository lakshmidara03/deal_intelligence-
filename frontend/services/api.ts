const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:3001";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store"
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json() as Promise<T>;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(`API request failed for ${path}: ${message}`);
  }
}

export function uploadDataset(file: File) {
  const form = new FormData();
  form.append("file", file);
  return api<{ importedDeals: number }>("/dataset/upload", { method: "POST", body: form });
}

export function loadDatasetFromProject() {
  return api<{ importedDeals: number }>("/dataset/load-local", { method: "POST" });
}
