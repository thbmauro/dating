import { fetch } from "expo/fetch";

// Response envelope type - all app routes return { data: T }
interface ApiResponse<T> {
  data: T;
}

const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;

interface ApiError {
  error: { message: string; code: string };
}

const request = async <T>(
  url: string,
  options: { method?: string; body?: string } = {}
): Promise<T> => {
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
  });

  // 1. Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // 2. JSON responses: parse and unwrap { data }
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    const json = await response.json();

    // Check for error response
    if (!response.ok || json.error) {
      const errorMsg = (json as ApiError).error?.message || "Request failed";
      throw new Error(errorMsg);
    }

    return (json as ApiResponse<T>).data;
  }

  // 3. Non-JSON error
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  // 4. Non-JSON success: return undefined
  return undefined as T;
};

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: any) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(url: string, body: any) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  patch: <T>(url: string, body: any) =>
    request<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
};
