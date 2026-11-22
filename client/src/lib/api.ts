
const API_BASE_URL = "/api";

// Represents an HTTP error and preserves its response status code.
export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  // Read the response body once, then parse it if it contains JSON.
  const responseText = await response.text();

  let data: { message?: string } | undefined;

  if (responseText) {
    try {
      data = JSON.parse(responseText) as { message?: string };
    } catch {
      throw new ApiError(
        "The server returned an invalid response.",
        response.status,
      );
    }
  }

  if (!response.ok) {
    throw new ApiError(
      data?.message || "Something went wrong.",
      response.status,
    );
  }

  return data as T;
}

export const api = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint);
  },

  post<T>(endpoint: string, body: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  patch<T>(endpoint: string, body: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, {
      method: "DELETE",
    });
  },
};
