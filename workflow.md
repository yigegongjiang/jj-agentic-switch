```When Editing
本文档作用: 工程工作流程 (可用工具 / 调试 / 发布); MUST NOT 写工程说明 (→ README.md) / LLM 约束 (→ AGENTS.md)
遵循 AGENTS.md 文档编写规范
- 所有段落均为条件段, 根据工程实际决定保留或删除; 存在即为明确流程, MUST NOT 附加强度标记
- 发布内按顺序编号步骤; 顶部 TL;DR ≤ 5 行; 删除子段后重编号保持连续
- 风险点 / 不可逆操作用 `>` 引用块; 高危操作 MUST 标禁用条件
```

# 可用工具

- `gh`: 已登录
- `bun`: 已安装

# 调试

本机 Keychain 可读, 支持真实 E2E:

```sh
bun run typecheck                 # 类型检查
bun test                          # 单测 (src/*.test.ts)
bun run build                     # 编译 macOS arm64 + x64 双 binary 到 dist/
bun run src/cli.ts                # cc + cx 当前账号 + 备份列表 (读真实 Keychain)
bun run src/cli.ts cc <email>     # 验证切换 (email 模糊匹配)
bun run src/cli.ts cc backup      # 验证备份 (/login 后跑一次)
```

> 切换 / 备份会改写真实 Keychain 与配置; 验证后确认账号状态正确, 必要时切回原账号.

# 发布

代码变更完成后立即执行（= 需求交付的最后环节）。交付 = 预部署 + push。推 `v*` tag → GitHub Actions 编译 macOS arm64 + x64 binary + checksums 附到 Release。

## TL;DR

依序执行：

1. 验证：`bun run typecheck` + `bun test`
2. 写版本：`package.json#version` + `CHANGELOG.md` 同步编辑 (与 tag 一致)
3. 预部署：`./scripts/install-local.sh`
4. 发布：commit + push branch + annotated tag (`-a -m`) + push tag

## 1. 验证

```sh
bun run typecheck
bun test
```

## 2. 写版本

- 版本号: 默认递增 PATCH (第三位); 超大功能更新/调整 → MINOR; 禁止 → MAJOR（除非人类主动要求）.
- `package.json#version` + `CHANGELOG.md` 同步编辑 (与 tag 一致); `src/shared.ts#VERSION` 读 `package.json`, 无需改动.
- 技术细节写进 commit message, MUST NOT 进 `CHANGELOG.md`.

## 3. 预部署

本机完成实际交付: 类型检查 + 编译 + 装 binary 到 `~/.local/bin` (`INSTALL_DIR` 可覆盖)。

```sh
./scripts/install-local.sh
jj-agentic-switch -v              # 确认输出 = 新版本号
```

> 覆盖 `~/.local/bin/jj-agentic-switch`; 脚本先落临时文件再 `mv`, 不会撞正在运行的进程.

## 4. 发布

tag 名 = `v` + `package.json` 的 version。

```sh
git add package.json CHANGELOG.md <其他改动>
git commit -m "X.Y.Z: <一句话>"
git push origin main
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

> NEVER 用 `workflow_dispatch`; 发布唯一触发 = 推 `v*` tag.
> tag 与 `package.json#version` 不一致 → CI 直接 fail.
> push tag 完成 = 交付完成; MUST NOT 等待 / 轮询 / 验证 CI 结果 (`gh run watch` / `gh run list` / ...).
