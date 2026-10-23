export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (typeof navigator !== "undefined" && !navigator.onLine) return "You're offline. Nothing was sent.";
  return "Something went wrong. Please try again.";
}
