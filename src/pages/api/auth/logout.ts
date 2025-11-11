import type { APIRoute } from "astro";

/**
 * POST /api/auth/logout
 *
 * Wylogowuje użytkownika poprzez zakończenie sesji Supabase Auth.
 * Zgodnie z auth-spec.md sekcja 2.1 i US-003.
 *
 * @returns 204 No Content - sukces wylogowania
 * @returns 500 Internal Server Error - błąd podczas wylogowania
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    const { supabase } = locals;

    // Attempt to sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      // Return structured error response
      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: "Nie udało się wylogować. Spróbuj ponownie.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Optional: Log analytics event (if user was logged in)
    // TODO: Add analytics logging after analytics service is implemented
    // if (user?.id) {
    //   await logAnalyticsEvent(supabase, user.id, 'user_logged_out', {
    //     timestamp: new Date().toISOString(),
    //   });
    // }

    // Success - return 204 No Content
    return new Response(null, { status: 204 });
  } catch {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};

// Disable prerendering for API routes (SSR only)
export const prerender = false;
