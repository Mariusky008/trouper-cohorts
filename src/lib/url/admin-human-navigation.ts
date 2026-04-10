type QueryBag = Record<string, string | undefined>;

export function pickParam(params: QueryBag, keys: string[], fallback: string) {
  for (const key of keys) {
    const value = params[key];
    if (value && value.trim()) return value.trim();
  }
  return fallback;
}

export function buildAdminHumanHref(path: string, params: QueryBag, overrides: QueryBag = {}) {
  const query = new URLSearchParams();
  const merged: QueryBag = { ...params, ...overrides };
  Object.entries(merged).forEach(([key, value]) => {
    if (!value || !value.trim()) return;
    query.set(key, value.trim());
  });
  const search = query.toString();
  return search ? `${path}?${search}` : path;
}
