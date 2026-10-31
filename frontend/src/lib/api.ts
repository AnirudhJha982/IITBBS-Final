/**
 * CampusOS AI - API Client & Service Binding Resolver
 *
 * Resolves API base URLs dynamically for:
 * 1. Server-side runtimes (Next.js Server Components, Server Actions, Route Handlers)
 *    using Vercel service binding: process.env.BACKEND_URL
 * 2. Client-side runtime (browser)
 *    using relative '/api/v1' (routed via Vercel rewrites) or NEXT_PUBLIC_API_URL
 */

export function getBackendBaseUrl(): string {
  // 1. Server-side execution in Vercel / Node.js
  if (typeof window === "undefined") {
    // Vercel Service Binding injects BACKEND_URL into calling service
    if (process.env.BACKEND_URL) {
      return process.env.BACKEND_URL.replace(/\/$/, "");
    }
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
    }
    return "http://127.0.0.1:8000";
  }

  // 2. Client-side execution in browser
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }

  // Default in production same-domain Vercel deployment:
  // Browser requests directly use the same-origin relative path /api/v1
  return "";
}

/**
 * Builds fully resolved API URL for both client and server runtimes
 */
export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = getBackendBaseUrl();

  if (!baseUrl) {
    return cleanPath.startsWith("/api") ? cleanPath : `/api/v1${cleanPath}`;
  }

  // If baseUrl already includes /api/v1 and path starts with /api/v1
  if (baseUrl.endsWith("/api/v1") && cleanPath.startsWith("/api/v1")) {
    return `${baseUrl.slice(0, -7)}${cleanPath}`;
  }

  // If baseUrl doesn't include /api and path doesn't start with /api
  if (!baseUrl.includes("/api") && !cleanPath.startsWith("/api")) {
    return `${baseUrl}/api/v1${cleanPath}`;
  }

  return `${baseUrl}${cleanPath}`;
}

/**
 * Fetch helper for backend endpoints respecting Vercel service bindings
 */
export async function fetchBackend(endpoint: string, init?: RequestInit): Promise<Response> {
  const url = buildApiUrl(endpoint);
  return fetch(url, init);
}
