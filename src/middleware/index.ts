import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client.ts";

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, redirect } = context;

  // Assign supabase client to context
  context.locals.supabase = supabaseClient;

  // Check user session for landing page redirect
  try {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    // Redirect authenticated users from landing page to dashboard
    if (url.pathname === "/" && session) {
      return redirect("/dashboard");
    }
  } catch (error) {
    // Silent fail - allow rendering landing page if session check fails
    console.error("Session check failed:", error);
  }

  return next();
});
