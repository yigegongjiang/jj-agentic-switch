// Legacy store migration runs at shared.ts import time, so drive it through a
// real CLI subprocess (`-v` touches no Keychain / network) with a fake HOME.
import { afterEach, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = join(import.meta.dir, "cli.ts");
const homes: string[] = [];

function newHome(): string {
  const h = mkdtempSync(join(tmpdir(), "jj-agentic-switch-migrate-"));
  homes.push(h);
  return h;
}

function runCli(home: string) {
  const p = Bun.spawnSync([process.execPath, "run", cli, "-v"], { env: { ...process.env, HOME: home } });
  expect(p.exitCode).toBe(0);
}

function seed(home: string, name: string, payload = "{}"): string {
  const dir = join(home, ".config", name, "cc");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "auth-backup-a@example.com.json"), payload, { mode: 0o600 });
  return join(home, ".config", name);
}

afterEach(() => {
  for (const h of homes.splice(0)) rmSync(h, { recursive: true, force: true });
});

test("legacy jj-llm-switch store is renamed to jj-agentic-switch", () => {
  const home = newHome();
  const legacy = seed(home, "jj-llm-switch", '{"legacy":true}');
  runCli(home);
  expect(existsSync(legacy)).toBe(false);
  const moved = join(home, ".config", "jj-agentic-switch", "cc", "auth-backup-a@example.com.json");
  expect(readFileSync(moved, "utf8")).toBe('{"legacy":true}');
});

test("existing store wins; legacy is left untouched", () => {
  const home = newHome();
  const legacy = seed(home, "jj-llm-switch", '{"legacy":true}');
  seed(home, "jj-agentic-switch", '{"current":true}');
  runCli(home);
  expect(existsSync(join(legacy, "cc", "auth-backup-a@example.com.json"))).toBe(true);
  const kept = join(home, ".config", "jj-agentic-switch", "cc", "auth-backup-a@example.com.json");
  expect(readFileSync(kept, "utf8")).toBe('{"current":true}');
});

test("no legacy store → nothing created", () => {
  const home = newHome();
  runCli(home);
  expect(existsSync(join(home, ".config", "jj-agentic-switch"))).toBe(false);
});
