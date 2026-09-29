export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, { ...options, credentials: 'include', headers: options.body instanceof FormData ? options.headers : { 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/') && typeof window !== 'undefined') window.location.href = '/login';
    const detail = data.detail;
    throw new Error(typeof detail === 'string' ? detail : detail?.message || (Array.isArray(detail) ? detail.map((x: any) => x.msg).join('; ') : 'Unable to complete this request.'));
  }
  return data as T;
}
export const post = <T = any>(path: string, data: unknown = {}) => api<T>(path, { method: 'POST', body: JSON.stringify(data) });
export const put = <T = any>(path: string, data: unknown) => api<T>(path, { method: 'PUT', body: JSON.stringify(data) });
export const del = <T = any>(path: string) => api<T>(path, { method: 'DELETE' });

