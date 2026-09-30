export function safeDestination(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    /[\\\s%]/.test(value) ||
    value.startsWith("//")
  )
    return "/learn";
  const url = new URL(value, "https://errby.invalid");
  if (!/^\/learn(\/|$)/.test(url.pathname)) return "/learn";
  url.searchParams.delete("_rsc");
  return url.pathname + url.search;
}
