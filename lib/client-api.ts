type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type LegacyErrorPayload = {
  error?: string;
  message?: string;
};

export async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiEnvelope<T>
    | LegacyErrorPayload
    | T
    | null;

  if (payload && typeof payload === "object" && "success" in payload) {
    if (!response.ok || payload.success === false) {
      throw new Error(payload.error || `Request failed with status ${response.status}`);
    }

    return payload.data as T;
  }

  if (!response.ok) {
    const errorPayload = payload as LegacyErrorPayload | null;
    throw new Error(
      errorPayload?.error || errorPayload?.message || `Request failed with status ${response.status}`
    );
  }

  return payload as T;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
