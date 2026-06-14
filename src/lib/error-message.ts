export const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== "object" || error === null) return fallback;
  const response = "response" in error ? error.response : null;
  if (typeof response !== "object" || response === null) return fallback;
  const data = "data" in response ? response.data : null;
  if (typeof data !== "object" || data === null) return fallback;
  const message = "message" in data ? data.message : null;
  return typeof message === "string" ? message : fallback;
};
