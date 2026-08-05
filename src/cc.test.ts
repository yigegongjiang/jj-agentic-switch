import { afterAll, expect, test } from "bun:test";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const originalHome = process.env.HOME;
const originalPath = process.env.PATH;
const originalFetch = globalThis.fetch;
const home = mkdtempSync(join(tmpdir(), "jj-agentic-switch-cc-"));
const bin = join(home, "bin");
const ccDir = join(home, ".config", "jj-agentic-switch", "cc");
const keychain = join(home, "keychain.json");

mkdirSync(bin);
mkdirSync(ccDir, { recursive: true });
process.env.HOME = home;
process.env.PATH = `${bin}:${originalPath ?? ""}`;
globalThis.fetch = (async () => new Response("unauthorized", { status: 401 })) as unknown as typeof fetch;

const security = `#!/bin/sh
if [ "$1" = "find-generic-password" ]; then
  cat "$HOME/keychain.json"
  exit 0
fi
while [ "$#" -gt 0 ]; do
  if [ "$1" = "-w" ]; then
    shift
    printf '%s' "$1" > "$HOME/keychain.json"
    exit 0
  fi
  shift
done
exit 1
`;
const claude = `#!/bin/sh
printf '%s\\n' '{"loggedIn":true,"email":null}'
`;

writeFileSync(join(bin, "security"), security, { mode: 0o700 });
writeFileSync(join(bin, "claude"), claude, { mode: 0o700 });
chmodSync(join(bin, "security"), 0o700);
chmodSync(join(bin, "claude"), 0o700);

const current = JSON.stringify({ claudeAiOauth: { accessToken: "current-access", refreshToken: "current-refresh" } });
const expired = JSON.stringify({ claudeAiOauth: { accessToken: "", refreshToken: "" } });
const yang = JSON.stringify({ claudeAiOauth: { accessToken: "yang-access", refreshToken: "yang-refresh" } });
const chen = JSON.stringify({ claudeAiOauth: { accessToken: "chen-access", refreshToken: "chen-refresh" } });

writeFileSync(keychain, current);
writeFileSync(join(ccDir, "auth-backup-fan.yang@example.com.json"), yang);
writeFileSync(join(ccDir, "auth-backup-jian.chen@example.com.json"), chen);

const { ccBackup, ccSwitch } = await import("./cc.ts");

afterAll(() => {
  globalThis.fetch = originalFetch;
  if (originalHome === undefined) delete process.env.HOME;
  else process.env.HOME = originalHome;
  if (originalPath === undefined) delete process.env.PATH;
  else process.env.PATH = originalPath;
  rmSync(home, { recursive: true, force: true });
});

test("preserves unidentified and tokenless current credentials before switching", async () => {
  await ccBackup();
  expect(readFileSync(keychain, "utf8")).toBe(current);
  expect(readFileSync(join(ccDir, "auth-backup-fan.yang@example.com.json"), "utf8")).toBe(yang);
  expect(readFileSync(join(ccDir, "auth-backup-jian.chen@example.com.json"), "utf8")).toBe(chen);
  let recoveries = readdirSync(ccDir).filter(name => name.startsWith("auth-recovery-"));
  expect(recoveries).toHaveLength(1);
  expect(readFileSync(join(ccDir, recoveries[0]!), "utf8")).toBe(current);
  expect(statSync(join(ccDir, recoveries[0]!)).mode & 0o777).toBe(0o600);

  await ccSwitch("yang");
  expect(readFileSync(keychain, "utf8")).toBe(yang);
  recoveries = readdirSync(ccDir).filter(name => name.startsWith("auth-recovery-"));
  expect(recoveries).toHaveLength(1);

  writeFileSync(keychain, expired);
  await ccSwitch("chen");
  expect(readFileSync(keychain, "utf8")).toBe(chen);
  recoveries = readdirSync(ccDir).filter(name => name.startsWith("auth-recovery-"));
  expect(recoveries).toHaveLength(2);
  expect(recoveries.some(name => readFileSync(join(ccDir, name), "utf8") === expired)).toBe(true);
});
