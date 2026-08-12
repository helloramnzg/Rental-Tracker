import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type CurrentUserContext = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  sessionExpiresAt: string | null;
};

export async function getCurrentUserContext(
  supabase: SupabaseClient<Database>,
): Promise<CurrentUserContext | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: (user.user_metadata?.full_name as string | undefined) ?? "",
    phone: (user.user_metadata?.phone as string | undefined) ?? "",
    createdAt: user.created_at ?? null,
    lastSignInAt: user.last_sign_in_at ?? null,
    sessionExpiresAt: session?.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null,
  };
}
