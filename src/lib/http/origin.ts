import "server-only";

export function isSameOrigin(request: Request): boolean {
  const value = request.headers.get("origin") ?? "";
  if (!URL.canParse(value)) return false;
  const origin = new URL(value);
  const target = new URL(request.url);
  // Host reflects the browser destination when Next uses an internal URL host.
  return (
    ["http:", "https:"].includes(origin.protocol) &&
    origin.origin === value &&
    origin.protocol === target.protocol &&
    origin.host === (request.headers.get("host") ?? target.host)
  );
}
