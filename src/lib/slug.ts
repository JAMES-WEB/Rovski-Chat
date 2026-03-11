import { randomUUID } from "crypto";

export function createPublicSlug(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
  const suffix = randomUUID().slice(0, 8);
  return base ? `${base}-${suffix}` : suffix;
}
