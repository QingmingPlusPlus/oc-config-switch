import { existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SUPPORTED_MODES = ['on', 'off'] as const;
type Mode = typeof SUPPORTED_MODES[number];

export function resolveConfigDir(): string {
  return join(homedir(), '.config', 'opencode');
}

function isSupportedMode(mode: string): mode is Mode {
  return (SUPPORTED_MODES as readonly string[]).includes(mode);
}

export function switchMode(mode: string, configDir?: string): void {
  const dir = configDir ?? resolveConfigDir();
  if (!isSupportedMode(mode)) {
    throw new Error(`Unknown mode: "${mode}". Supported modes: ${SUPPORTED_MODES.join(', ')}`);
  }
  if (!existsSync(dir)) {
    throw new Error(`Config directory not found: ${dir}`);
  }
  const sourcePath = join(dir, `omo-switch.${mode}.opencode.json`);
  if (!existsSync(sourcePath)) {
    throw new Error(`Config file not found: ${sourcePath}`);
  }
  const targetPath = join(dir, 'opencode.json');
  copyFileSync(sourcePath, targetPath);
}
