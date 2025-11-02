import { createBrowserClient, createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { AstroCookies } from "astro";

import type { Database } from "../db/database.types.ts";

// Get env vars - these are available both server-side and client-side via vite.define
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Validate env vars are present
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please ensure SUPABASE_URL and SUPABASE_KEY are set in your .env file."
  );
}

// ============================================================================
// CLIENT-SIDE CLIENT (for React components)
// ============================================================================

/**
 * Client-side Supabase client for use in React components.
 * Uses createBrowserClient from @supabase/ssr for automatic cookie sync with SSR.
 * This ensures session is shared between client-side and server-side.
 */
export const supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

// ============================================================================
// SERVER-SIDE CLIENT (for SSR: Astro pages, middleware, API routes)
// ============================================================================

/**
 * Cookie options for server-side Supabase client
 * Following @supabase/ssr best practices
 */
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

/**
 * Parse Cookie header string into array of {name, value} objects
 * @param cookieHeader - Raw Cookie header string
 * @returns Array of parsed cookies
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Create server-side Supabase client with SSR cookie management
 * Use this in: Astro pages, middleware, and API routes
 *
 * @param context - Object containing Headers and AstroCookies
 * @returns Server-configured Supabase client
 *
 * @example
 * ```ts
 * // In middleware or Astro page:
 * const supabase = createSupabaseServerInstance({
 *   headers: request.headers,
 *   cookies: Astro.cookies
 * });
 * ```
 */
export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptionsWithName }[]) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// ============================================================================
// TEMPORARY FALLBACK (to be removed after full auth implementation)
// ============================================================================

/**
 * @deprecated Temporary default user ID for development
 * TODO: Remove after implementing proper session management
 */
export const DEAFULT_USER_ID = "e1852684-fed9-4079-b1c0-03a6a2998501";
