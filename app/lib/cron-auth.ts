// Vercel Cron automatically attaches this header when CRON_SECRET is
// set as an environment variable on the project. Without checking it,
// these routes would be public URLs that anyone could hit to trigger
// a real email send.
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
