"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  // Use the built-in browser cookie handling so Supabase can chunk auth cookies.
  return createBrowserClient(url, key);
}
