import { config } from "dotenv";
import path from "node:path";

// .env.local supplies the real local Supabase connection details (per
// HANDOVER.md's setup steps); .env.test layers fake-but-functional
// values on top (FROM_EMAIL, CRON_SECRET, test landlord credentials —
// see .env.test.example) so tests never depend on unrelated real
// secrets being filled in.
config({ path: path.resolve(__dirname, "../../.env.local"), quiet: true });
config({ path: path.resolve(__dirname, "../../.env.test"), override: true, quiet: true });
