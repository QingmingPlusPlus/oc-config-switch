# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-11
**Commit:** 0ab0734
**Branch:** main

## OVERVIEW

`oc-config-switch` — CLI tool (invoked as `ocs`) that switches opencode config by copying preset JSON files into `~/.config/opencode/opencode.json`. Pure Node.js, zero runtime deps.

## STRUCTURE

```
oc-config-switch/
├── src/
│   ├── index.ts       # Entry point — shebang, main(), top-level try/catch
│   ├── cli.ts         # Arg parsing — Command discriminated union, help, version
│   └── switcher.ts    # Core logic — mode validation, file copy
├── package.json       # bin: "ocs", type: "module"
└── tsconfig.json      # ES2022 + NodeNext
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add new mode | `src/switcher.ts:5` | Add to `SUPPORTED_MODES` array |
| Add new mode help text | `src/cli.ts:31-32` | Add line under Modes section |
| Change error handling | `src/index.ts:22-29` | Top-level try/catch |
| Change config directory | `src/switcher.ts:9` | `resolveConfigDir()` |
| Add new CLI flag | `src/cli.ts:8-23` | `parseCommand()` function |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `main` | function | `index.ts:6` | Orchestrator — parses args, dispatches command |
| `Command` | type | `cli.ts:1` | Discriminated union: `switch` / `help` / `version` |
| `parseCommand` | function | `cli.ts:8` | `string[] → Command` — no external parser |
| `switchMode` | function | `switcher.ts:16` | Core: validate mode → check files → `copyFileSync` |
| `resolveConfigDir` | function | `switcher.ts:8` | DI seam — default config path via `os.homedir()` |
| `isSupportedMode` | function | `switcher.ts:12` | Type guard: `string → mode is Mode` |
| `SUPPORTED_MODES` | const | `switcher.ts:5` | `['on', 'off'] as const` — single source of truth |

## CONVENTIONS

- **ESM**: `"type": "module"` — ALL cross-module imports MUST use `.js` suffix (`import from './cli.js'`)
- **Node imports**: Always `node:` prefix (`node:fs`, `node:path`, `node:os`)
- **Error exit**: `process.exitCode = 1` — NEVER `process.exit(1)`
- **Home dir**: `os.homedir()` — NEVER `process.env.HOME`
- **DI pattern**: Parameter injection with defaults, no framework
- **Output separation**: `console.log` for success output, `console.error` for errors
- **Type safety**: Type guards over type assertions — no `as any`, `as Type`, `@ts-ignore`

## ANTI-PATTERNS (THIS PROJECT)

- External runtime dependencies — stdlib only
- Dynamic mode discovery (scanning directory for `oc-config-switch.*.opencode.json`)
- JSON content validation — copy as-is
- Colored output, progress indicators, interactive prompts
- Interfaces / abstract classes — concrete implementations only
- DI containers or frameworks
- More than 4 source files
- Auto-creating `~/.config/opencode/` directory
- Backup/rollback of existing `opencode.json`
- Commands beyond `on` and `off` (V1 scope)

## COMMANDS

```bash
npm run build        # tsc → dist/
npm run typecheck    # tsc --noEmit
npm run dev          # tsx src/index.ts (dev mode)
npm link             # Install globally as "ocs"
ocs on               # Copy oc-config-switch.on.opencode.json → opencode.json
ocs off              # Copy oc-config-switch.off.opencode.json → opencode.json
```

## NOTES

- Source config files must pre-exist at `~/.config/opencode/oc-config-switch.{mode}.opencode.json` — tool does not create them
- `ocs` silently overwrites existing `opencode.json` — no confirmation, no backup
- No unit tests by design (V1 decision) — QA via manual CLI smoke tests
- `tsc` does NOT rewrite import extensions — `.js` suffix in TS source is mandatory for ESM
