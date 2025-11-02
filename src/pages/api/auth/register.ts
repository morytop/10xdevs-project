import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client.ts";

// Disable prerendering for SSR
export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), { status: 400 });
    }

    if (typeof password !== "string" || password.length < 8) {
      return new Response(JSON.stringify({ error: "Hasło musi mieć minimum 8 znaków" }), { status: 400 });
    }

    // Prefer supabase client from middleware locals when available
    const supabase = locals?.supabase ?? createSupabaseServerInstance({ headers: request.headers, cookies });

    const { data, error } = await supabase.auth.signUp({
      email: String(email).trim(),
      password: String(password),
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // When email confirmation is required Supabase typically won't return an active session
    const requiresConfirmation = !data.session;

    return new Response(
      JSON.stringify({
        user: data.user ?? null,
        session: data.session ?? null,
        requiresConfirmation,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(JSON.stringify({ error: "Niepoprawne dane wejściowe" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
};
