import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Service-role client: bypasses RLS. Only for contexts with no user
// session to authenticate as — currently just the /api/cron/* routes
// (see lib/cron-auth.ts for how those are authenticated instead).
// Never use this where a user-scoped client would work.
export function createServiceRoleClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
