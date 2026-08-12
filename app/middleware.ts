import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // api/cron/* is excluded: those routes authenticate via CRON_SECRET
    // (see lib/cron-auth.ts), not a Supabase user session — a cron
    // trigger has no session cookie and would otherwise always be
    // redirected to /login before reaching the route handler.
    "/((?!_next/static|_next/image|favicon.ico|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
