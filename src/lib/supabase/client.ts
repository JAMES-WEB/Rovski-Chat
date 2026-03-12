"use client";

import { createBrowserClient } from "@supabase/ssr";

function getCookieValue(name: string) {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

function setCookieValue(
  name: string,
  value: string,
  options: { maxAge?: number; expires?: Date; path?: string; sameSite?: string; secure?: boolean } = {}
) {
  if (typeof document === "undefined") return;
  const parts = [`${name}=${encodeURIComponent(value)}`];
  const path = options.path ?? "/";
  parts.push(`Path=${path}`);
  if (options.expires) {
    parts.push(`Expires=${options.expires.toUTCString()}`);
  }
  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }
  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }
  if (options.secure) {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");
}

function removeCookieValue(name: string, options: { path?: string } = {}) {
  setCookieValue(name, "", { ...options, maxAge: 0 });
}

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createBrowserClient(url, key, {
    cookies: {
      get(name) {
        return getCookieValue(name);
      },
      set(name, value, options) {
        setCookieValue(name, value, {
          maxAge: options?.maxAge,
          expires: options?.expires,
          path: options?.path,
          sameSite: options?.sameSite,
          secure: options?.secure,
        });
      },
      remove(name, options) {
        removeCookieValue(name, { path: options?.path });
      },
    },
  });
}
