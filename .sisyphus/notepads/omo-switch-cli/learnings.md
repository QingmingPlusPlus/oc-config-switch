# Learnings — omo-switch-cli

## [2026-04-11] Session start

### Project conventions
- ESM project with `"type": "module"` — ALL inter-module imports MUST use `.js` suffix (e.g., `./cli.js` not `./cli`)
- `tsc` build with `"module": "NodeNext"` — no path rewriting happens at build time
- Error handling pattern: `process.exitCode = 1` (NOT `process.exit(1)`) — preserves async cleanup
- shebang `#!/usr/bin/env node` on line 1 of index.ts is REQUIRED for `npm link` to work

### Architecture decisions
- 3 source files max: `switcher.ts` (core), `cli.ts` (parsing), `index.ts` (entry)
- DI = parameter injection (configDir? optional param), NOT a framework
- SUPPORTED_MODES hardcoded as `["on", "off"] as const` — no dynamic discovery
- No external runtime dependencies — pure Node.js stdlib (`node:fs`, `node:path`, `node:os`)
- `node:` prefix required on all stdlib imports

### Config file conventions
- Source: `~/.config/opencode/omo-switch.{mode}.opencode.json`
- Target: `~/.config/opencode/opencode.json`
- Action: fs.copyFileSync (copy, NOT rename/move)
- Path resolution: `os.homedir()` not `process.env.HOME`

## [2026-04-11] package.json update
- Renamed CLI bin command from  to  while keeping the same dist entrypoint.
- Updated package description to reflect the opencode config switching purpose.

## [2026-04-11] package.json update
- Renamed CLI bin command from `omo-switch` to `omos` while keeping the same dist entrypoint.
- Updated package description to reflect the opencode config switching purpose.

## [2026-04-11] Task 2 — 3-file modular implementation

### Implementation completed
- `src/switcher.ts`: core logic with `SUPPORTED_MODES`, `resolveConfigDir`, `buildSourcePath`, `buildTargetPath`, `switchMode`
- `src/cli.ts`: CLI parsing with `Command` discriminated union type, `parseCommand`, `printHelp`, `printVersion`
- `src/index.ts`: entry point with shebang, imports using `.js` suffix, `main()`, top-level try/catch

### Key patterns confirmed working
- `(SUPPORTED_MODES as readonly string[]).includes(mode)` for type-safe mode validation
- `process.exitCode = 1` in catch block (NOT `process.exit(1)`) — confirmed works correctly
- All 11 QA scenarios pass (happy paths, error paths, help/version flags)
- `npm run typecheck` and `npm run build` both exit 0

### Error messages format
- Unknown mode: `Unknown mode: "${mode}". Supported modes: on, off`
- Config dir not found: `Config directory not found: ${dir}`
- Source file not found: `Config file not found: ${sourcePath}`
- Unknown flag: `Unknown option: ${arg}`

## [2026-04-11] F3 — Real manual QA
- Verified global `omos` binary resolves via `which omos` and `omos --version` returns `1.0.0`.
- Re-ran all 12 manual scenarios from scratch; all passed, including happy paths, help/version behavior, unknown input handling, silent overwrite, missing source, and missing config directory.
- Confirmed mode switches use copy semantics: source fixture files remain present after `omos on`, while `opencode.json` is overwritten in place.
- Saved full command/output evidence to `.sisyphus/evidence/final-qa/f3-results.txt`.

## [2026-04-11] F2 review cleanup
- `switcher.ts` now keeps `resolveConfigDir` as the only exported helper; source/target path helpers are inlined in `switchMode`.
- Mode validation now uses a private type guard (`isSupportedMode`) instead of double casts, keeping the public API unchanged.
- Smoke test confirmed behavior is unchanged: valid mode switches copy the fixture, and invalid modes still report the same error text.
