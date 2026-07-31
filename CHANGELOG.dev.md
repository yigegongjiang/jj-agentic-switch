```When Editing
本文档作用: 面向开发者的发版记录; CHANGELOG.md 的超集, 1:1 镜像 + 技术变更子项
遵循 AGENTS.md 文档编写规范
- 每条主项 = CHANGELOG.md 对应条目 (原文), 下方缩进子项承载技术变更
- 子项 MAY 写路径 / 函数 / 机制; ≤ 1 行
```

# Changelog (developer, follow [CHANGELOG.md](./CHANGELOG.md))

## [0.5.0] - 2026-07-31

### Changed

- 项目 / 命令 / 仓库更名: `jj-llm-switch` → `jj-agentic-switch`; 安装路径 `~/.local/bin/jj-agentic-switch`.
  - `package.json` `name`+`bin`; `install.sh` `REPO`/`BIN`/`asset`; `update.ts` `BASE`/`assetName()`/`basename` 前缀校验; `release.yml` 双 binary + `checksums.txt`; `cli.ts` HELP / unknown-cmd; `README.md`. `build.ts` 经 `pkg.name` 自动跟随. GitHub repo rename (旧 URL 由 GitHub 302 重定向), remote 保持 `p.github.com` SSH 别名.
- 备份目录 `~/.config/jj-llm-switch` → `~/.config/jj-agentic-switch`; 首次运行自动迁移旧目录, 无需手动搬.
  - `shared.ts` 模块加载时 `renameSync(LEGACY_HOME, HOME)` (同父目录 = 原子); 新目录已存在则跳过, 异常吞掉保留旧目录. `migrate.test.ts` 用 fake HOME + `cli.ts -v` 子进程覆盖迁移 / 不覆盖 / 空目录三态.

### Removed

- 旧命令 `jj-llm-switch` 不再随发布更新; 用新安装命令装一次, 再 `rm ~/.local/bin/jj-llm-switch`.
  - 旧 binary 的 `update` 会拉到新 release 但 asset 名已变 → 404, 只能重装.

## [0.4.1] - 2026-07-25

### Fixed

- Claude Code 当前凭据无法识别邮箱时不再阻断切换; 先独立保全原凭据, 再切换目标账号.
  - `ccCurrent` / `ccBackup` / `ccSwitch` 统一按凭据 SHA-256 指纹去重写 `auth-recovery-*.json` (0600); fake Keychain/profile 测试覆盖恢复、切换、权限、去重.

## [0.4.0] - 2026-07-21

### Changed

- CLI 命令重命名: `jjllmuse` → `jj-llm-switch` (与项目名一致); 二进制资产 / 安装路径同步更名.
  - `package.json` `name` + `bin`; `install.sh` `BIN` + `asset`; `update.ts` `assetName()` + `basename` 前缀校验; `.github/workflows/release.yml` 双 binary + `checksums.txt` 文件名; `src/cli.ts` HELP / unknown-cmd 提示; `src/cc.ts` error hint. `build.ts` 通过 `pkg.name` 自动跟随.
- 备份目录: `~/.config/jjllmuse` → `~/.config/jj-llm-switch`.
  - `src/shared.ts` `HOME` 常量.

### Removed

- 旧命令 `jjllmuse` / 旧目录 `~/.config/jjllmuse` 不再兼容; 升级后如有旧备份需 `mv ~/.config/jjllmuse ~/.config/jj-llm-switch`, 旧 binary `rm ~/.local/bin/jjllmuse`.
  - 不做自动迁移 (代码复杂度 vs 手动 mv 的取舍).

## [0.3.0] - 2026-07-10

### Added

- 自动备份: 查看状态 / 切换账号时自动把当前活跃账号收录进备份库, 无需再手动跑 `backup`.
  - `cc.ts` 抽 `ccActive()` (读 Keychain + 一次 identify, 无副作用) 供 `ccCurrent` 复用; 新增 `captureCc`/`captureCx`: 备份已存在且 accessToken/access_token 未变则跳过 (免 mtime 抖动), 否则 merge-safe 写入, 仅全新 email 打印一行 gray 提示. 失败静默, 绝不阻断状态查看.

### Changed

- `backup` 命令改为可选 (兜底 / 手动刷新用); 新账号 /login 后不再强制先跑一次.
  - `writeCcBackup` 去掉 `verb` 参数与内部 `info`, 改返回 `wasNew` 布尔由调用方决定输出; HELP 文案 `run once after /login` → `usually automatic`.

### Fixed

- 切换到目标账号时, 即使当前账号从未备份过也不再报错中断 (自动识别并收录).
  - `cxSwitch` re-backup 分支: 原 `findEmailByRefresh` 匹配不到即 `fail("Run: jjllmuse cx backup")`, 改为 fallback 到 `emailOf(cur)` 本地 JWT 解码兜底备份 (email 为空才跳过).

## [0.2.0] - 2026-06-22

### Added

- 支持 macOS Intel (x64): 安装 / 自更新自动按 CPU 架构取对应 binary.
  - `build.ts` 循环 `bun-darwin-arm64` + `bun-darwin-x64` 双 target 编译 (minify, 清 `.bun-build` 中间产物); asset 命名 `jjllmuse-macos-<arch>`. `update.ts` `assetName()` 按 `process.arch` 拼 URL; install.sh `uname -m` 映射 arm64/x64. CI 上传双 binary + tag↔version 校验 + typecheck.
- 下载后校验 sha256, 损坏即中止, 不写入损坏文件.
  - CI `sha256sum` 生成 `checksums.txt` 一并发布; install.sh (`shasum -a 256`) / `update.ts` (`createHash`) best-effort 校验, 仅真实 mismatch 时 fail, 缺失/网络异常静默跳过.

### Changed

- `jjllmuse update` 下载时显示实时进度条 (百分比 + 已下载/总大小).
  - `update.ts` 改 `res.body` 流式读取累计字节, 按整数百分比节流刷新进度条至 stderr (非 TTY / `NO_COLOR` 时静默), 取代原 `res.arrayBuffer()` 静默下载.

## [0.1.9] - 2026-06-22

### Fixed

- 修复切回某账号后 Claude Code 无法认证的问题: 切换前备份现合并保留当前有效凭据, 不再用残缺旧备份覆盖.
  - live 凭据缺 `refreshToken` 时, re-backup 改为合并: 用 live 新 `accessToken` 更新备份并保留已有 `refreshToken`, 不再整体保留含过期 accessToken + 已撤销 refreshToken 的旧备份.

## [0.1.8] - 2026-06-22

### Fixed

- 新版 Claude Code 凭据下 `cc <email>` 无法识别当前账号 — 现回退官方途径取邮箱.
  - live Keychain 缺 `refreshToken` 且 `/api/oauth/profile` 返回 `401 authentication_error` 时, 回退 `claude auth status --json` 取 email.
- 切换前备份不再被残缺凭据降级覆盖.
  - `cc backup` / switch 前 re-backup 遇 live 缺 `refreshToken` 时, 不覆盖已有完整备份.

## [0.1.7] - 2026-05-16

### Fixed

- 修复 `cc <email>` 切换后 Claude Code 报 `Not logged in · Please run /login`.
  - 根因: payload 末尾残留 `\n` → `security add-generic-password -w` 以 binary blob 存入 (读出变 hex), Claude Code 不做 hex 解码 → `JSON.parse` 失败. 修复: `readKeychain` hex 解码后 strip trailing whitespace, `writeKeychain` 写入前防御性 strip.

## [0.1.6] - 2026-05-16

### Changed

- `jjllmuse update` 输出版本号变化 `<旧> -> <新>`, 版本未变追加 `(no change)`.
  - 新版本号经 spawn 替换后 binary `-v` 取得, 旧版本号取编译期 `VERSION`.

## [0.1.5] - 2026-05-16

### Fixed

- 修复 `cc` 在特定 Keychain 内容下崩溃; 状态查询全程兜底, 绝不崩溃.
  - `security -w` 在数据非纯 ASCII 时输出连续 hex dump; `readKeychain` 检测 `/^[0-9a-fA-F]+$/` 且偶数长度时 hex 解码回 JSON. `ccCurrent` / `cxCurrent` 全程 try/catch 只 warn 不退出.

## [0.1.4] - 2026-05-16

### Fixed

- 切换账号后 `/usage` 不再显示前账号的过期状态.
  - `cc switch` 额外清理 `~/.claude.json` 的 `cachedExtraUsageDisabledReason` (镜像 `/api/oauth/usage` 的 `disabled_reason`, 与上一账号 org 绑定).

## [0.1.3] - 2026-05-16

### Added

- `jjllmuse update`: 拉 GitHub Releases latest binary 原子替换自身.

## [0.1.2] - 2026-05-16

### Changed

- 当前账号显示精简为仅邮箱.

### Removed

- 移除 cc/cx 的过期时间 / org / plan 展示 (误导, 与实际可用性无关).
  - cx 过期读自 id_token `exp` (TTL 1h), 实际由 refresh_token 续期, 过期与可用性无关. 内部删 `expiry()` / `IdPayload` / `fields()` 等无引用代码.

## [0.1.1] - 2026-05-16

### Added

- 首版: `cc` / `cx` 切 Claude Code / Codex 账号, 邮箱前缀模糊匹配.
  - 邮箱前缀/子串模糊匹配 (`cc ali` ≡ `cc alice@example.com`).
- 切换前自动备份当前账号; 备份存 `~/.config/jjllmuse` (0600).
  - cc 切换同时清 `~/.claude.json` 身份缓存.
- macOS arm64 单文件 binary, 一行 `curl` 安装.

[0.2.0]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.2.0
[0.1.9]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.1.9
[0.1.8]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.1.8
[0.1.7]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.1.7
[0.1.6]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.1.6
[0.1.5]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.1.5
[0.1.4]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.1.4
[0.1.3]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.1.3
[0.1.2]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.1.2
[0.1.1]: https://github.com/yigegongjiang/jj-agentic-switch/releases/tag/v0.1.1
