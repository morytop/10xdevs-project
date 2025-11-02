/// <reference types="astro/client" />

import type { SupabaseClient } from "./db/supabase.client.ts";

declare global {
  namespace App {
    interface Locals {
      /**
       * Server-side Supabase client with SSR cookie management
       * Created in middleware for each request
       */
      supabase: SupabaseClient;

      /**
       * Current authenticated user (if logged in)
       * Set by middleware after successful session verification
       */
      user: {
        id: string;
        email: string;
      } | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
