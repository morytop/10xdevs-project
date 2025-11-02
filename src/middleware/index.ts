import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

/**
 * Routes that require authentication
 * Unauthenticated users will be redirected to /login?redirectTo=...
 */
const PROTECTED_PATHS = ["/dashboard", "/profile", "/onboarding"];

/**
 * Routes accessible only to unauthenticated users
 * Authenticated users will be redirected to /dashboard
 */
const AUTH_ONLY_PATHS = ["/login", "/register"];

/**
 * Public routes (no auth check needed)
 * These include: reset-password, update-password, API endpoints, static assets
 */
const PUBLIC_PATHS = ["/reset-password", "/update-password"];

// ============================================================================
// MIDDLEWARE
// ============================================================================

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect, request, cookies } = context;
  const pathname = url.pathname;

  // Create SSR-compatible Supabase client with cookie management
  const supabase = createSupabaseServerInstance({
    headers: request.headers,
    cookies,
  });

  // Assign supabase client to context.locals for use in pages/API routes
  context.locals.supabase = supabase;

  // Initialize user as null (will be set if authenticated)
  context.locals.user = null;

  // Skip auth check for API routes (they handle auth internally if needed)
  if (pathname.startsWith("/api/")) {
    return next();
  }

  // Skip auth check for public routes
  if (PUBLIC_PATHS.includes(pathname)) {
    return next();
  }

  // ============================================================================
  // SESSION VERIFICATION
  // ============================================================================

  try {
    // IMPORTANT: Always use getUser() for server-side auth checks
    // getSession() can be spoofed, getUser() verifies JWT with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Auth verification failed:", error.message);
    }

    // Set user in context.locals if authenticated
    if (user) {
      context.locals.user = {
        id: user.id,
        email: user.email ?? "",
      };
    }

    // ============================================================================
    // ROUTE PROTECTION LOGIC
    // ============================================================================

    // 1. Redirect authenticated users from AUTH_ONLY paths to dashboard
    if (AUTH_ONLY_PATHS.includes(pathname) && user) {
      return redirect("/dashboard");
    }

    // 2. Redirect unauthenticated users from PROTECTED paths to login
    if (PROTECTED_PATHS.includes(pathname) && !user) {
      const redirectTo = encodeURIComponent(pathname);
      return redirect(`/login?redirectTo=${redirectTo}`);
    }

    // 3. Redirect authenticated users from landing page to dashboard
    if (pathname === "/" && user) {
      return redirect("/dashboard");
    }
  } catch (error) {
    // Graceful error handling - don't block the entire app
    console.error("Middleware error:", error);

    // For protected routes, redirect to login on error
    if (PROTECTED_PATHS.includes(pathname)) {
      const redirectTo = encodeURIComponent(pathname);
      return redirect(`/login?redirectTo=${redirectTo}`);
    }
  }

  return next();
});
