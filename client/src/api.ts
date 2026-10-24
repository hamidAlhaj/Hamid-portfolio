const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "Please wait a moment before trying again."
        : "Unable to complete the request. Please try again or contact me by email.",
    );
  return response.json();
}
export const apiGet = <T>(path: string) => request<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  request<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
