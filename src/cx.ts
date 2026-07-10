// Codex: file ~/.codex/auth.json, identity via id_token JWT.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CX_DIR, cyan, gray, info, warn, fail, decodeJwt, listEmails, resolveEmail, writeSecret, backupPath, readBackup } from "./shared.ts";

const AUTH = process.env.CODEX_AUTH_FILE || join(process.env.HOME ?? "", ".codex/auth.json");

interface Auth { tokens: { id_token: string; access_token: string; refresh_token?: string; account_id?: string } }

function parse(s: string): Auth {
  const d = JSON.parse(s) as Auth;
  if (!d?.tokens?.id_token || !d?.tokens?.access_token) fail("invalid cx credential");
  return d;
}

function emailOf(a: Auth): string {
  return decodeJwt<{ email?: string }>(a.tokens.id_token).email ?? "";
}

function findEmailByRefresh(refresh: string, exclude?: string): string | null {
  for (const { email } of listEmails(CX_DIR)) {
    if (email === exclude) continue;
    try {
      if (parse(readFileSync(backupPath(CX_DIR, email), "utf8")).tokens.refresh_token === refresh) return email;
    } catch {}
  }
  return null;
}

export function cxCurrent() {
  if (!existsSync(AUTH)) { warn(`no cx auth at ${AUTH} (run 'codex login' first)`); return; }
  // Status query must never crash: any unexpected payload → warn and return.
  try {
    const raw = readFileSync(AUTH, "utf8");
    const d = JSON.parse(raw) as Partial<Auth>;
    const idToken = d?.tokens?.id_token;
    if (!idToken) { warn("cx auth format unexpected (missing tokens.id_token)"); return; }
    const email = decodeJwt<{ email?: string }>(idToken).email ?? "";
    console.log(`cx  ${cyan(email || "?")}`);
    // Auto-capture the live account so users never have to run `backup` by hand.
    if (email) captureCx(email, raw);
  } catch (e) {
    warn(`cx status unavailable: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// Silently capture the live account into the backup library. Backup already
// holds the same access_token → skip (no mtime churn). Announce only genuinely
// new emails. Never throws.
function captureCx(email: string, raw: string) {
  try {
    const path = backupPath(CX_DIR, email);
    if (existsSync(path)) {
      // Use plain JSON.parse, NOT parse() — parse() calls fail()→process.exit,
      // which escapes try/catch and would crash status view on a tokenless backup.
      const bak = JSON.parse(readFileSync(path, "utf8")) as Partial<Auth>;
      const cur = JSON.parse(raw) as Partial<Auth>;
      if (bak?.tokens?.access_token === cur?.tokens?.access_token) return;
      writeSecret(path, raw);
      return;
    }
    writeSecret(path, raw);
    console.log(gray(`  captured cx → ${email}`));
  } catch {}
}

export function cxBackup() {
  if (!existsSync(AUTH)) fail(`no cx auth at ${AUTH}`);
  const raw = readFileSync(AUTH, "utf8");
  const e = emailOf(parse(raw));
  if (!e) fail("id_token has no email field");
  writeSecret(backupPath(CX_DIR, e), raw);
  info(`backed up cx → ${cyan(e)}`);
}

export function cxList() {
  const all = listEmails(CX_DIR);
  if (all.length === 0) { console.log(gray("  (no cx backups)")); return; }
  for (const { email, mtime } of all) {
    console.log(`  ${cyan(email)}  ${gray(mtime.toISOString().slice(0, 16).replace("T", " "))}`);
  }
}

export function cxSwitch(query: string, rebackup = true) {
  const email = resolveEmail(query, listEmails(CX_DIR).map(b => b.email));
  const targetRaw = readBackup(CX_DIR, email);
  const target = parse(targetRaw);

  if (existsSync(AUTH)) {
    const currentRaw = readFileSync(AUTH, "utf8");
    const cur = parse(currentRaw);
    if (cur.tokens.refresh_token && cur.tokens.refresh_token === target.tokens.refresh_token) {
      warn(`cx already on ${email}`); return;
    }
    if (rebackup) {
      // Prefer an existing backup matched by refresh_token; fall back to the
      // local JWT email. Never hard-fail on an un-backed-up account — cx can
      // always identify itself offline, so capture it and move on.
      const rt = cur.tokens.refresh_token;
      const curEmail = (rt ? findEmailByRefresh(rt, email) : null) ?? emailOf(cur);
      if (curEmail) {
        writeSecret(backupPath(CX_DIR, curEmail), currentRaw);
        info(`re-backed up cx → ${cyan(curEmail)}`);
      }
    }
  }

  writeSecret(AUTH, targetRaw);
  const verify = readFileSync(AUTH, "utf8");
  if (verify !== targetRaw) fail(`verification mismatch: ${AUTH} read-back ≠ written`);
  info(`switched cx → ${cyan(email)}`);
  console.log(gray("  restart any running 'codex' process"));
}
