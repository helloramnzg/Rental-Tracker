import "./load-env";
import { beforeAll } from "vitest";
import { assertLocalSupabaseEnvironment } from "./env-guard";
import { ensureTestLandlordExists } from "./ensure-test-user";

beforeAll(async () => {
  assertLocalSupabaseEnvironment();
  await ensureTestLandlordExists();
}, 30_000);
