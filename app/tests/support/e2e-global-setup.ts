import "./load-env";
import { assertLocalSupabaseEnvironment } from "./env-guard";
import { ensureTestLandlordExists } from "./ensure-test-user";

export default async function globalSetup(): Promise<void> {
  assertLocalSupabaseEnvironment();
  await ensureTestLandlordExists();
}
