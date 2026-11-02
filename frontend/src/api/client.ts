import type { ApiErrorBody } from '../types/analysis';

// Empty by default: requests go to the same origin ("/api/v1/..."), which the
// Vite dev server proxies to the backend (see vite.config.ts).
// Set VITE_API_BASE_URL (e.g. "https://api.example.com") when the backend
// is served from a different origin.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '');
const API_PREFIX = '/api/v1';

export class ApiError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }

    get isNotFound(): boolean {
        return this.status === 404;
    }
}

function extractMessage(status: number, body: ApiErrorBody | null): string {
    const detail = body?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
        return detail.map((d) => d.msg).join(' / ');
    }
    return `Request failed with status ${status}`;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
            ...init,
            headers: {
                ...(init.body ? { 'Content-Type': 'application/json' } : {}),
                Accept: 'application/json',
                ...init.headers,
            },
        });
    } catch {
        // fetch only rejects on network failure (server down, CORS, offline).
        throw new ApiError(0, 'Cannot reach the server. Please check that the backend is running.');
    }

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
        throw new ApiError(response.status, extractMessage(response.status, body));
    }

    if (response.status === 204) {
        return undefined as T;
    }
    return (await response.json()) as T;
}
