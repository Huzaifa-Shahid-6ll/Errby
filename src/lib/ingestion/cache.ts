import "server-only";
import type { Extraction } from "./contracts";

type Entry = {
  owner: string;
  expires: number;
  result: Promise<Extraction>;
  timer: ReturnType<typeof setTimeout>;
};
const entries = new Map<string, Entry>();
function remove(key: string) {
  const entry = entries.get(key);
  if (entry) clearTimeout(entry.timer);
  entries.delete(key);
}

export function clearExtractionCache(owner: string) {
  for (const [key, entry] of entries) if (entry.owner === owner) remove(key);
}

// ponytail: 60-second, 16-entry process cache (two per owner); cold/serverless
// instances reparse. Add shared private storage only if measured reuse warrants it.
// Call only AFTER current authentication and request validation. Never cache bytes.
export async function cachedExtraction(
  owner: string,
  fingerprint: string,
  extract: () => Promise<Extraction>,
): Promise<Extraction> {
  const key = JSON.stringify([owner, fingerprint]);
  for (const [id, entry] of entries)
    if (entry.expires <= Date.now()) remove(id);
  let entry = entries.get(key);
  if (!entry) {
    const owned = [...entries].filter(([, item]) => item.owner === owner);
    if (owned.length >= 2) remove(owned[0][0]);
    if (entries.size >= 16) remove(entries.keys().next().value!);
    const result = Promise.resolve().then(extract);
    const timer = setTimeout(() => remove(key), 60_000);
    timer.unref();
    entry = { owner, expires: Date.now() + 60_000, result, timer };
    entries.set(key, entry);
  }
  try {
    // Each caller receives its own copy; clarification cannot mutate the cache.
    return structuredClone(await entry.result);
  } catch (error) {
    if (entries.get(key) === entry) remove(key);
    throw error;
  }
}
