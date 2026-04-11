import { existsSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SUPPORTED_MODES = ['on', 'off'] as const;
type Mode = typeof SUPPORTED_MODES[number];

export function resolveConfigDir(): string {
  return join(homedir(), '.config', 'opencode');
}

export function buildSourcePath(configDir: string, mode: Mode): string {
  return join(configDir, `omo-switch.${mode}.opencode.json`);
}

export function buildTargetPath(configDir: string): string {
  return join(configDir, 'opencode.json');
}

export function switchMode(mode: string, configDir?: string): void {
  const dir = configDir ?? resolveConfigDir();
  if (!(SUPPORTED_MODES as readonly string[]).includes(mode)) {
    throw new Error(`Unknown mode: "${mode}". Supported modes: ${SUPPORTED_MODES.join(', ')}`);
  }
  if (!existsSync(dir)) {
    throw new Error(`Config directory not found: ${dir}`);
  }
  const validMode = mode as Mode;
  const sourcePath = buildSourcePath(dir, validMode);
  if (!existsSync(sourcePath)) {
    throw new Error(`Config file not found: ${sourcePath}`);
  }
  const targetPath = buildTargetPath(dir);
  copyFileSync(sourcePath, targetPath);
}
