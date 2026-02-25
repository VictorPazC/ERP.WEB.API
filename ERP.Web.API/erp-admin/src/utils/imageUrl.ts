const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:5147';

export function imageUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
