#!/usr/bin/env bun
import { VERSION, fail } from "./shared.ts";
import { ccCurrent, ccBackup, ccList, ccSwitch } from "./cc.ts";
import { cxCurrent, cxBackup, cxList, cxSwitch } from "./cx.ts";
import { update } from "./update.ts";

const HELP = `jj-llm-switch v${VERSION} — Claude Code / Codex account switcher

USAGE
  jj-llm-switch                       status of both + backup lists
  jj-llm-switch <cc|cx>               status + backups of one tool
  jj-llm-switch <cc|cx> <email>       switch (fuzzy match on email)
  jj-llm-switch <cc|cx> backup        manually back up current account (usually automatic)
  jj-llm-switch update                self-update from latest GitHub release
  jj-llm-switch -h | -v
`;

type Tool = "cc" | "cx";
const current = { cc: ccCurrent, cx: cxCurrent };
const backup  = { cc: ccBackup,  cx: cxBackup  };
const list    = { cc: ccList,    cx: cxList    };
const swit    = { cc: ccSwitch,  cx: cxSwitch  };

async function run(tool: Tool, arg?: string) {
  if (!arg) { await current[tool](); console.log(); list[tool](); return; }
  if (arg === "backup") return backup[tool]();
  return swit[tool](arg);
}

const [first, second] = process.argv.slice(2);

if (!first) {
  await ccCurrent(); cxCurrent();
  console.log("\ncc backups:"); ccList();
  console.log("\ncx backups:"); cxList();
} else if (first === "-h" || first === "--help") {
  console.log(HELP);
} else if (first === "-v" || first === "--version") {
  console.log(VERSION);
} else if (first === "cc" || first === "cx") {
  await run(first, second);
} else if (first === "update") {
  await update();
} else {
  fail(`unknown command '${first}'. Run 'jj-llm-switch -h'`);
}
