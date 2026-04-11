# omo-switch CLI — opencode 配置切换工具

## TL;DR

> **Quick Summary**: 将现有 TS CLI 脚手架重构为 `omos` 命令行工具，通过 `omos on` / `omos off` 在 `~/.config/opencode/` 下复制对应的预设配置文件为 `opencode.json`。
> 
> **Deliverables**:
> - 模块化 CLI 源码（3 个源文件：`index.ts`, `cli.ts`, `switcher.ts`）
> - 更新的 `package.json`（bin 字段改为 `omos`）
> - 可通过 `npm link` 全局安装，命令行调用 `omos`
> 
> **Estimated Effort**: Quick
> **Parallel Execution**: YES — 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 → F1-F4

---

## Context

### Original Request
将当前 TypeScript CLI 脚手架项目改造为 opencode 配置文件快速切换工具。应用名 `omo-switch`，命令行名 `omos`。V1 只做 `omos on` 和 `omos off`，读取 `~/.config/opencode/` 下的 `omo-switch.{mode}.opencode.json` 文件并复制为 `opencode.json`。不发布 npm，通过 `npm link` 本地安装。

### Interview Summary
**Key Discussions**:
- CLI 消息语言: 英文
- 文件已存在策略: 静默覆盖，不备份不询问
- 成功反馈: 简单确认消息（如 "Switched to mode: on"）
- 测试策略: 不做单元测试
- 代码风格: 高内聚低耦合，模块按功能拆分，DI 以参数传递形式体现（不引入 DI 框架）

**Research Findings**:
- 现有项目: 单文件 `src/index.ts`（83行），手写参数解析 + greeting 功能
- 构建工具: `tsc` 编译，`tsx` 开发运行
- 模块系统: ESM（`"type": "module"`）
- 零外部运行时依赖
- `tsconfig.json` 配置良好，无需改动

### Metis Review
**Identified Gaps** (addressed):
- 源配置文件不存在的错误处理 → 明确报错，提示文件路径
- `~/.config/opencode/` 目录不存在的处理 → 明确报错，不自动创建
- 无参数调用 `omos` 的行为 → 显示 help
- `--help` / `--version` 是否保留 → 保留
- 配置目录路径使用 `os.homedir()` 而非 `process.env.HOME`
- 文件数上限 → 最多 3-4 个源文件，防止过度工程化

---

## Work Objectives

### Core Objective
将脚手架替换为模块化的配置切换 CLI，支持 `omos on` / `omos off` 将预设配置复制为 `opencode.json`。

### Concrete Deliverables
- `src/index.ts` — 入口点，顶层错误处理，串联各模块
- `src/cli.ts` — CLI 参数解析，命令路由
- `src/switcher.ts` — 配置文件解析、查找、复制核心逻辑
- `package.json` — bin 字段更新为 `omos`，描述更新

### Definition of Done
- [ ] `npm run build` 编译成功，无错误
- [ ] `npm run typecheck` 类型检查通过
- [ ] `npm link` 后全局可用 `omos` 命令
- [ ] `omos on` 正确复制文件并输出确认信息
- [ ] `omos off` 正确复制文件并输出确认信息
- [ ] `omos foo` 输出错误信息到 stderr 并退出码为 1
- [ ] `omos`（无参数）显示帮助信息
- [ ] 源文件在复制后仍然存在（复制而非移动）

### Must Have
- 子命令: `on`, `off`
- 配置目录: `~/.config/opencode/`
- 源文件格式: `omo-switch.{mode}.opencode.json`
- 目标文件: `opencode.json`（同目录）
- 复制（非移动）
- 英文消息
- 成功确认输出
- 错误信息到 stderr
- `--help` 和 `--version` 支持
- 零运行时外部依赖
- `node:` 前缀导入内置模块

### Must NOT Have (Guardrails)
- ❌ 不引入任何运行时依赖（no chalk, commander, yargs 等）
- ❌ 不做动态模式发现（不扫描目录匹配 omo-switch.*.opencode.json）
- ❌ 不验证 JSON 文件内容
- ❌ 不添加彩色输出、进度指示器或交互式提示
- ❌ 不添加备份/回滚功能
- ❌ 不创建接口/抽象类 — 这是小工具，用具体实现
- ❌ 不引入 DI 容器或框架 — "DI" 仅指参数传递
- ❌ 源文件不超过 4 个
- ❌ 不创建 `status`、`list` 等额外命令
- ❌ 不自动创建 `~/.config/opencode/` 目录

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: None
- **Framework**: none

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **CLI**: Use Bash — Run commands, assert stdout/stderr, check exit codes, verify files

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: Update package.json (bin → omos, description) [quick]
├── Task 2: Implement modular CLI source (cli.ts, switcher.ts, index.ts) [unspecified-high]

Wave 2 (After Wave 1 — verification):
├── Task 3: Build, link, and full QA verification [quick]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 2 → Task 3 → F1-F4 → user okay
Parallel Speedup: Tasks 1 & 2 are parallel within Wave 1
Max Concurrent: 2 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| 1 | — | 3 |
| 2 | — | 3 |
| 3 | 1, 2 | F1-F4 |
| F1-F4 | 3 | user okay |

### Agent Dispatch Summary

- **Wave 1**: **2** — T1 → `quick`, T2 → `unspecified-high`
- **Wave 2**: **1** — T3 → `quick`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Update package.json for omos CLI

  **What to do**:
  - Change `bin` field from `"omo-switch": "./dist/index.js"` to `"omos": "./dist/index.js"`
  - Update `description` to `"CLI tool to quickly switch opencode configuration files"`
  - Update `name` to remain `"omo-switch"` (package name stays, bin name changes)
  - Keep everything else unchanged (scripts, deps, engines, files, type)

  **Must NOT do**:
  - Add any runtime dependencies
  - Change build scripts or tsconfig
  - Change version number

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-file, 2-line change in package.json
  - **Skills**: []
    - No special skills needed for JSON editing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `package.json:6-8` — Current bin field that needs updating: `"omo-switch": "./dist/index.js"`
  - `package.json:4` — Current description to replace

  **WHY Each Reference Matters**:
  - `package.json:6-8`: This is the exact line to change. The bin name `omo-switch` becomes `omos`, the path `./dist/index.js` stays the same.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: package.json bin field updated correctly
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log(JSON.stringify(p.bin))"
      2. Assert output is exactly: {"omos":"./dist/index.js"}
      3. Run: node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log(p.description)"
      4. Assert output contains "opencode" or "switch" or "config"
    Expected Result: bin field maps "omos" to "./dist/index.js", description is updated
    Failure Indicators: bin still says "omo-switch", or description unchanged
    Evidence: .sisyphus/evidence/task-1-package-json-bin.txt

  Scenario: No unintended package.json changes
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: node -e "const p=JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log(p.type, p.name, Object.keys(p.devDependencies).length)"
      2. Assert output is: "module omo-switch 3"
    Expected Result: type, name, and devDependencies count unchanged
    Failure Indicators: type changed, name changed, new dependencies added
    Evidence: .sisyphus/evidence/task-1-package-json-integrity.txt
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(cli): implement omos config switcher with modular architecture`
  - Files: `package.json`

- [x] 2. Implement modular CLI source code (cli.ts, switcher.ts, index.ts)

  **What to do**:

  **File 1: `src/switcher.ts` — 配置切换核心逻辑（高内聚单一职责）**:
  - 定义支持的模式常量: `const SUPPORTED_MODES = ["on", "off"] as const`
  - 定义类型: `type Mode = typeof SUPPORTED_MODES[number]`
  - 导出函数 `resolveConfigDir(): string` — 返回 `path.join(os.homedir(), '.config', 'opencode')`，这是 DI 入口点（测试时可替换）
  - 导出函数 `buildSourcePath(configDir: string, mode: Mode): string` — 返回 `path.join(configDir, \`omo-switch.${mode}.opencode.json\`)`
  - 导出函数 `buildTargetPath(configDir: string): string` — 返回 `path.join(configDir, 'opencode.json')`
  - 导出函数 `switchMode(mode: string, configDir?: string): void` — 核心逻辑:
    1. 如果 `configDir` 未传入，调用 `resolveConfigDir()` 获取（DI: 参数注入默认值）
    2. 验证 mode 是否在 `SUPPORTED_MODES` 中，不在则抛 Error: `Unknown mode: "${mode}". Supported modes: ${SUPPORTED_MODES.join(", ")}`
    3. 用 `fs.existsSync` 检查 configDir 是否存在，不存在则抛 Error: `Config directory not found: ${configDir}`
    4. 构建 sourcePath，用 `fs.existsSync` 检查是否存在，不存在则抛 Error: `Config file not found: ${sourcePath}`
    5. 构建 targetPath，用 `fs.copyFileSync(sourcePath, targetPath)` 复制文件
    6. 返回 void（不做输出，输出交给调用方 — 关注点分离）
  - 所有 import 使用 `node:` 前缀: `import { existsSync, copyFileSync } from 'node:fs'`, `import { join } from 'node:path'`, `import { homedir } from 'node:os'`

  **File 2: `src/cli.ts` — CLI 参数解析与命令路由（关注点: 只负责解析参数、分发命令）**:
  - 定义类型 `type Command = { type: 'switch'; mode: string } | { type: 'help' } | { type: 'version' }`
  - 导出 `const VERSION = "1.0.0"`
  - 导出函数 `parseCommand(args: string[]): Command` — 解析 CLI 参数:
    - 无参数 → 返回 `{ type: 'help' }`
    - `--help` / `-h` → 返回 `{ type: 'help' }`
    - `--version` / `-v` → 返回 `{ type: 'version' }`
    - 第一个非-开头参数视为 mode → 返回 `{ type: 'switch', mode: args[0] }`
    - 其他未知 flag → 抛 Error: `Unknown option: ${arg}`
  - 导出函数 `printHelp(): void`:
    ```
    omos — opencode config switcher

    Usage:
      omos <mode>

    Modes:
      on     Switch to "on" configuration
      off    Switch to "off" configuration

    Options:
      -v, --version   Print version
      -h, --help      Show this help message

    Config directory: ~/.config/opencode/
    Source files:     omo-switch.<mode>.opencode.json
    Target file:      opencode.json
    ```
  - 导出函数 `printVersion(): void` — `console.log(VERSION)`

  **File 3: `src/index.ts` — 入口点（关注点: 串联模块 + 顶层错误处理）**:
  - 保留 shebang: `#!/usr/bin/env node`
  - 导入: `parseCommand`, `printHelp`, `printVersion` from `./cli.js`，`switchMode` from `./switcher.js`
  - 注意 ESM 导入路径必须用 `.js` 后缀（TypeScript ESM 约定，tsc 不会转换扩展名）
  - 函数 `main(args: string[]): void`:
    1. `const command = parseCommand(args)`
    2. switch on `command.type`:
       - `'help'` → `printHelp(); return`
       - `'version'` → `printVersion(); return`
       - `'switch'` → `switchMode(command.mode); console.log(\`Switched to mode: ${command.mode}\`)`
  - 顶层 try/catch（沿用现有模式 `src/index.ts:76-83`）:
    ```typescript
    try {
      main(process.argv.slice(2));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      console.error('Run "omos --help" for usage.');
      process.exitCode = 1;
    }
    ```

  **Must NOT do**:
  - 不引入任何外部依赖
  - 不创建接口/抽象类
  - 不超过 3 个源文件（index.ts, cli.ts, switcher.ts）
  - 不验证 JSON 内容
  - 不添加彩色输出
  - 不扫描目录动态发现模式
  - 不创建 types.ts 或其他辅助文件 — 类型定义放在使用它的文件内

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 核心实现任务，需要理解模块化设计和 ESM 约定，涉及 3 个文件的协调
  - **Skills**: []
    - 纯 Node.js 标准库操作，无需特殊技能

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: Task 3
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/index.ts:1` — Shebang 行 `#!/usr/bin/env node`，新 index.ts 必须保留
  - `src/index.ts:76-83` — 顶层 try/catch + `process.exitCode = 1` 错误处理模式，新 index.ts 必须沿用此模式
  - `src/index.ts:11-45` — 现有参数解析逻辑参考（将被替换为 cli.ts 中更简洁的实现）
  - `tsconfig.json:3-4` — `"target": "ES2022"`, `"module": "NodeNext"` — 确认 ESM 导入需用 `.js` 后缀

  **API/Type References**:
  - Node.js `node:fs` — `existsSync`, `copyFileSync` — 用于文件检查和复制
  - Node.js `node:path` — `join` — 构建路径
  - Node.js `node:os` — `homedir` — 获取用户主目录

  **WHY Each Reference Matters**:
  - `src/index.ts:76-83`: 这是项目已建立的错误处理约定，新代码必须保持一致（`process.exitCode` 而非 `process.exit`）
  - `src/index.ts:1`: shebang 是 `npm link` 全局安装后 CLI 可执行的前提
  - `tsconfig.json:3-4`: ESM 模块系统下，TypeScript 导入其他 .ts 文件时路径必须写 `.js` 后缀，否则运行时报错

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Happy path — omos on
    Tool: Bash
    Preconditions:
      - mkdir -p ~/.config/opencode
      - echo '{"model":"gpt-4","enabled":true}' > ~/.config/opencode/omo-switch.on.opencode.json
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0
      3. Run: node dist/index.js on
      4. Assert stdout contains: "Switched to mode: on"
      5. Run: cat ~/.config/opencode/opencode.json
      6. Assert output is: {"model":"gpt-4","enabled":true}
      7. Run: ls ~/.config/opencode/omo-switch.on.opencode.json
      8. Assert: file still exists (copy not move)
    Expected Result: Config copied, success message shown, source file preserved
    Failure Indicators: No output, wrong file content, source file missing, non-zero exit
    Evidence: .sisyphus/evidence/task-2-happy-path-on.txt

  Scenario: Happy path — omos off
    Tool: Bash
    Preconditions:
      - echo '{"model":"none","enabled":false}' > ~/.config/opencode/omo-switch.off.opencode.json
    Steps:
      1. Run: node dist/index.js off
      2. Assert stdout contains: "Switched to mode: off"
      3. Run: cat ~/.config/opencode/opencode.json
      4. Assert output is: {"model":"none","enabled":false}
    Expected Result: Config copied to opencode.json with off-mode content
    Failure Indicators: Wrong content, no success message
    Evidence: .sisyphus/evidence/task-2-happy-path-off.txt

  Scenario: Overwrite existing opencode.json silently
    Tool: Bash
    Preconditions:
      - echo '{"old":"data"}' > ~/.config/opencode/opencode.json
    Steps:
      1. Run: node dist/index.js on
      2. Assert stdout contains: "Switched to mode: on"
      3. Run: cat ~/.config/opencode/opencode.json
      4. Assert output is: {"model":"gpt-4","enabled":true} (NOT {"old":"data"})
    Expected Result: Old file silently overwritten
    Failure Indicators: Old content remains, error about existing file
    Evidence: .sisyphus/evidence/task-2-overwrite-silent.txt

  Scenario: Unknown mode — error
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: node dist/index.js foo 2>&1; echo "EXIT:$?"
      2. Assert output contains: "Unknown mode"
      3. Assert output contains: "on, off"
      4. Assert output contains: "EXIT:1"
    Expected Result: Error to stderr with supported modes listed, exit code 1
    Failure Indicators: No error, wrong exit code, unhandled exception stack trace
    Evidence: .sisyphus/evidence/task-2-unknown-mode-error.txt

  Scenario: No arguments — show help
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: node dist/index.js
      2. Assert stdout contains: "omos"
      3. Assert stdout contains: "Usage"
      4. Assert stdout contains: "on"
      5. Assert stdout contains: "off"
    Expected Result: Help text displayed with usage info
    Failure Indicators: Error, crash, no output
    Evidence: .sisyphus/evidence/task-2-no-args-help.txt

  Scenario: --help flag
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: node dist/index.js --help
      2. Assert stdout contains: "Usage"
      3. Assert stdout contains: "omos <mode>"
    Expected Result: Help text with usage info
    Failure Indicators: Error or no output
    Evidence: .sisyphus/evidence/task-2-help-flag.txt

  Scenario: --version flag
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: node dist/index.js --version
      2. Assert stdout matches: 1.0.0
    Expected Result: Version string printed
    Failure Indicators: Error or wrong version
    Evidence: .sisyphus/evidence/task-2-version-flag.txt

  Scenario: Missing source config file — clear error
    Tool: Bash
    Preconditions:
      - rm -f ~/.config/opencode/omo-switch.on.opencode.json
    Steps:
      1. Run: node dist/index.js on 2>&1; echo "EXIT:$?"
      2. Assert output contains: "Config file not found"
      3. Assert output contains: "omo-switch.on.opencode.json"
      4. Assert output contains: "EXIT:1"
    Expected Result: Clear error with file path, not raw stack trace
    Failure Indicators: Stack trace, unhandled error, or unhelpful message
    Evidence: .sisyphus/evidence/task-2-missing-source-error.txt

  Scenario: Missing config directory — clear error
    Tool: Bash
    Preconditions:
      - Temporarily rename ~/.config/opencode to ~/.config/opencode.bak (restore after test)
    Steps:
      1. Run: mv ~/.config/opencode ~/.config/opencode.bak
      2. Run: node dist/index.js on 2>&1; echo "EXIT:$?"
      3. Assert output contains: "Config directory not found"
      4. Assert output contains: "EXIT:1"
      5. Run: mv ~/.config/opencode.bak ~/.config/opencode
    Expected Result: Clear error about missing directory
    Failure Indicators: Stack trace or directory auto-created
    Evidence: .sisyphus/evidence/task-2-missing-dir-error.txt

  Scenario: Unknown flag — error
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: node dist/index.js --foo 2>&1; echo "EXIT:$?"
      2. Assert output contains: "Unknown option"
      3. Assert output contains: "EXIT:1"
    Expected Result: Clear error about unknown option
    Failure Indicators: Help shown without error, or unhandled crash
    Evidence: .sisyphus/evidence/task-2-unknown-flag-error.txt

  Scenario: Typecheck passes
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: npm run typecheck
      2. Assert: exit code 0
    Expected Result: No type errors
    Failure Indicators: Non-zero exit code, error output
    Evidence: .sisyphus/evidence/task-2-typecheck.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `feat(cli): implement omos config switcher with modular architecture`
  - Files: `src/index.ts`, `src/cli.ts`, `src/switcher.ts`
  - Pre-commit: `npm run typecheck`

- [x] 3. Build, npm link, and end-to-end verification

  **What to do**:
  - 运行 `npm run build` 确认编译成功
  - 运行 `npm link` 全局安装
  - 运行 `which omos` 确认全局可用
  - 创建测试 fixture 文件并逐一验证所有命令
  - 验证完成后清理测试 fixture

  **Must NOT do**:
  - 不修改任何源代码
  - 不修改 package.json
  - 此任务纯验证，不做实现

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 纯命令行验证任务，无代码编写
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential after Wave 1)
  - **Blocks**: F1-F4
  - **Blocked By**: Task 1, Task 2

  **References**:

  **Pattern References**:
  - `package.json:11-12` — build 和 typecheck 脚本命令
  - `package.json:6-8` — bin 字段（此时应已改为 `omos`）

  **WHY Each Reference Matters**:
  - `package.json` scripts: 验证时需要知道确切的 npm script 名称
  - bin 字段: `npm link` 后，全局命令名取决于此字段

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full build and link
    Tool: Bash
    Preconditions: Tasks 1 & 2 completed
    Steps:
      1. Run: npm run build
      2. Assert: exit code 0, dist/ directory has index.js, cli.js, switcher.js
      3. Run: npm link
      4. Assert: exit code 0
      5. Run: which omos
      6. Assert: outputs a path (not empty)
    Expected Result: Build succeeds, omos globally available
    Failure Indicators: Build error, link error, which returns nothing
    Evidence: .sisyphus/evidence/task-3-build-link.txt

  Scenario: End-to-end omos on via global command
    Tool: Bash
    Preconditions:
      - mkdir -p ~/.config/opencode
      - echo '{"test":"on-mode"}' > ~/.config/opencode/omo-switch.on.opencode.json
      - echo '{"test":"off-mode"}' > ~/.config/opencode/omo-switch.off.opencode.json
    Steps:
      1. Run: omos on
      2. Assert stdout: "Switched to mode: on"
      3. Run: cat ~/.config/opencode/opencode.json
      4. Assert: {"test":"on-mode"}
      5. Run: omos off
      6. Assert stdout: "Switched to mode: off"
      7. Run: cat ~/.config/opencode/opencode.json
      8. Assert: {"test":"off-mode"}
    Expected Result: Both modes work via global omos command
    Failure Indicators: Command not found, wrong output
    Evidence: .sisyphus/evidence/task-3-e2e-global.txt

  Scenario: Error cases via global command
    Tool: Bash
    Preconditions: None
    Steps:
      1. Run: omos foo 2>&1; echo "EXIT:$?"
      2. Assert: contains "Unknown mode" and "EXIT:1"
      3. Run: omos 2>&1
      4. Assert: contains "Usage"
      5. Run: omos --help
      6. Assert: contains "omos <mode>"
      7. Run: omos --version
      8. Assert: contains "1.0.0"
    Expected Result: All error/info cases work correctly
    Failure Indicators: Unexpected errors, missing output
    Evidence: .sisyphus/evidence/task-3-e2e-errors.txt

  Scenario: Cleanup test fixtures
    Tool: Bash
    Preconditions: Previous scenarios completed
    Steps:
      1. Run: rm -f ~/.config/opencode/omo-switch.on.opencode.json
      2. Run: rm -f ~/.config/opencode/omo-switch.off.opencode.json
      3. Run: rm -f ~/.config/opencode/opencode.json
    Expected Result: Test fixtures removed
    Failure Indicators: Files still present
    Evidence: .sisyphus/evidence/task-3-cleanup.txt
  ```

  **Commit**: NO (verification only, no code changes)

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod (only `console.log` for intended output, `console.error` for errors), commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify max 4 source files.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | Source count [N/4 max] | VERDICT`

- [x] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration. Test edge cases: missing dir, missing file, permission error simulation. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| After Task | Commit Message | Files |
|-----------|---------------|-------|
| 1 + 2 | `feat(cli): implement omos config switcher with modular architecture` | `src/index.ts`, `src/cli.ts`, `src/switcher.ts`, `package.json` |

---

## Success Criteria

### Verification Commands
```bash
npm run typecheck     # Expected: exit 0, no errors
npm run build         # Expected: exit 0, dist/ populated
omos --help           # Expected: usage text to stdout
omos --version        # Expected: version number
omos on              # Expected: "Switched to mode: on" (with test fixture present)
omos off             # Expected: "Switched to mode: off" (with test fixture present)
omos foo             # Expected: error to stderr, exit code 1
omos                 # Expected: help/usage text
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Build + typecheck pass
- [ ] `npm link` succeeds and `omos` globally available
