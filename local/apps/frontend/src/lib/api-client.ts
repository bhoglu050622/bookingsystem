import { API_BASE_URL } from "@/lib/utils";

// In Vercel we default to mocks unless the flag is explicitly set to "false".
// This keeps the marketing site functional without requiring the backend.
const rawMockFlag = process.env.NEXT_PUBLIC_USE_MOCK_API;
const USE_MOCK_API =
  rawMockFlag === undefined ||
  rawMockFlag === "" ||
  rawMockFlag === "true" ||
  rawMockFlag === "1";

type FetchOptions = RequestInit & {
  tags?: string[];
};

export async function apiFetch<T>(
  path: string,
  { tags, ...init }: FetchOptions = {},
): Promise<T> {
  // Use mock API if enabled
  if (USE_MOCK_API) {
    console.log(`[API Client] Using Mock API for: ${path}`);
    const { mockApiFetch } = await import("./api-client.mock");
    return mockApiFetch<T>(path, {
      method: init.method,
      body: init.body as string,
      headers: init.headers as Record<string, string>,
    });
  }
  
  console.log(`[API Client] Using Real API for: ${path} (USE_MOCK_API=${USE_MOCK_API}, BASE_URL=${API_BASE_URL})`);

  try {
  // Real API call
  // Remove 'next' option for client-side requests (it's only for server-side Next.js)
  const { next, ...fetchInit } = init;
  
  console.log(`[API Client] Making request to: ${API_BASE_URL}${path}`);
  
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchInit,
    headers: {
      "Content-Type": "application/json",
      ...(fetchInit?.headers ?? {}),
    },
    mode: 'cors', // Explicitly set CORS mode
    credentials: 'include', // Include credentials for CORS
  });
  
  console.log(`[API Client] Response status: ${response.status}, type: ${response.type}, ok: ${response.ok}`);

  // Handle status 0 (usually means request was blocked or opaque redirect)
  if (response.status === 0) {
    console.error(`[API Client] Request blocked or failed. Response type: ${response.type}, URL: ${API_BASE_URL}${path}`);
    
    // If it's an opaque redirect, the backend might have returned a redirect
    // Try to get the redirect URL from the response URL if available
    if (response.type === 'opaqueredirect' && response.url) {
      console.log(`[API Client] Opaque redirect detected, redirect URL: ${response.url}`);
      return { redirectUrl: response.url } as T;
    }
    
    throw new Error(
      `Request was blocked. This might be a CORS issue or the backend is not accessible. ` +
      `Please check: 1) Backend is running on ${API_BASE_URL}, 2) CORS is configured correctly`
    );
  }

  // Handle redirect responses (3xx) - don't follow them automatically
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('Location');
    if (location) {
      // If backend returns a redirect, return it as JSON for frontend to handle
      console.log(`[API Client] Redirect response detected, Location: ${location}`);
      return { redirectUrl: location } as T;
    }
  }

  if (!response.ok) {
    const message = await safeParseError(response);
      // Handle specific error statuses
      if (response.status === 401) {
        throw new Error("Unauthorized. Please login to continue.");
      }
      if (response.status === 500) {
        throw new Error(
          `Backend server error: ${message}. ` +
          `This might be a database configuration issue. ` +
          `Please check backend logs for details.`
        );
      }
    throw new Error(`Request failed with status ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
  } catch (error) {
    // Enhanced error logging
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      console.error(`[API Client] Network error fetching ${API_BASE_URL}${path}:`, error);
      throw new Error(
        `Unable to connect to backend API at ${API_BASE_URL}. ` +
        `Please ensure the backend server is running. ` +
        `If you want to use mock data, set NEXT_PUBLIC_USE_MOCK_API=true`
      );
    }
    throw error;
  }
}

async function safeParseError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

