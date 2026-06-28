import { isAxiosError } from "axios";

export type ApiResult<T> =
  | readonly [data: T, error: null]
  | readonly [data: null, error: Error];

export async function toApiResult<T>(
  request: Promise<T>,
): Promise<ApiResult<T>> {
  try {
    return [await request, null];
  } catch (error) {
    return [null, normalizeApiError(error)];
  }
}

function normalizeApiError(error: unknown) {
  if (isAxiosError(error)) {
    const message =
      typeof error.response?.data?.error === "string"
        ? error.response.data.error
        : error.message;

    return new Error(message);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("Unexpected API error");
}
