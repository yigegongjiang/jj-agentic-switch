```When Editing
本文档作用: 面向使用者的发版记录; 只写用户感受得到的变化, MUST NOT 写技术细节 (→ CHANGELOG.dev.md)
遵循 AGENTS.md 文档编写规范
- 写: 新功能 / 行为修复 / 体验 / 安全 / 命令迁移
- MUST NOT 写: 文件路径 / 函数名 / 组件名 / 依赖包名 / 重构细节
- 单条 ≤ 2 行, 单版本 ≤ 5 条; 段落: Added / Changed / Fixed / Removed / Security
- 无用户可感知变化 → 占位: `跟随版本同步发布`
```

# Changelog

[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) + [SemVer](https://semver.org/).

## [0.4.1] - 2026-07-25

### Fixed

- Claude Code 当前凭据无法识别邮箱时不再阻断切换; 先独立保全原凭据, 再切换目标账号.

## [0.4.0] - 2026-07-21

### Changed

- CLI 命令重命名: `jjllmuse` → `jj-llm-switch` (与项目名一致); 二进制资产 / 安装路径同步更名.
- 备份目录: `~/.config/jjllmuse` → `~/.config/jj-llm-switch`.

### Removed

- 旧命令 `jjllmuse` / 旧目录 `~/.config/jjllmuse` 不再兼容; 升级后如有旧备份需 `mv ~/.config/jjllmuse ~/.config/jj-llm-switch`, 旧 binary `rm ~/.local/bin/jjllmuse`.

## [0.3.0] - 2026-07-10

### Added

- 自动备份: 查看状态 / 切换账号时自动把当前活跃账号收录进备份库, 无需再手动跑 `backup`.

### Changed

- `backup` 命令改为可选 (兜底 / 手动刷新用); 新账号 /login 后不再强制先跑一次.

### Fixed

- 切换到目标账号时, 即使当前账号从未备份过也不再报错中断 (自动识别并收录).

## [0.2.0] - 2026-06-22

### Added

- 支持 macOS Intel (x64): 安装 / 自更新自动按 CPU 架构取对应 binary.
- 下载后校验 sha256, 损坏即中止, 不写入损坏文件.

### Changed

- `jjllmuse update` 下载时显示实时进度条 (百分比 + 已下载/总大小).

## [0.1.9] - 2026-06-22

### Fixed

- 修复切回某账号后 Claude Code 无法认证的问题: 切换前备份现合并保留当前有效凭据, 不再用残缺旧备份覆盖.

## [0.1.8] - 2026-06-22

### Fixed

- 新版 Claude Code 凭据下 `cc <email>` 无法识别当前账号 — 现回退官方途径取邮箱.
- 切换前备份不再被残缺凭据降级覆盖.

## [0.1.7] - 2026-05-16

### Fixed

- 修复 `cc <email>` 切换后 Claude Code 报 `Not logged in · Please run /login`.

## [0.1.6] - 2026-05-16

### Changed

- `jjllmuse update` 输出版本号变化 `<旧> -> <新>`, 版本未变追加 `(no change)`.

## [0.1.5] - 2026-05-16

### Fixed

- 修复 `cc` 在特定 Keychain 内容下崩溃; 状态查询全程兜底, 绝不崩溃.

## [0.1.4] - 2026-05-16

### Fixed

- 切换账号后 `/usage` 不再显示前账号的过期状态.

## [0.1.3] - 2026-05-16

### Added

- `jjllmuse update`: 拉 GitHub Releases latest binary 原子替换自身.

## [0.1.2] - 2026-05-16

### Changed

- 当前账号显示精简为仅邮箱.

### Removed

- 移除 cc/cx 的过期时间 / org / plan 展示 (误导, 与实际可用性无关).

## [0.1.1] - 2026-05-16

### Added

- 首版: `cc` / `cx` 切 Claude Code / Codex 账号, 邮箱前缀模糊匹配.
- 切换前自动备份当前账号; 备份存 `~/.config/jjllmuse` (0600).
- macOS arm64 单文件 binary, 一行 `curl` 安装.

[0.2.0]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.2.0
[0.1.9]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.1.9
[0.1.8]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.1.8
[0.1.7]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.1.7
[0.1.6]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.1.6
[0.1.5]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.1.5
[0.1.4]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.1.4
[0.1.3]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.1.3
[0.1.2]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.1.2
[0.1.1]: https://github.com/yigegongjiang/jj-llm-switch/releases/tag/v0.1.1
