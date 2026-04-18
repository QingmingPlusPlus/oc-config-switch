import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

type SwitchConfig = {
  baseDir: string;
};

export type EnvironmentResult = {
  mode: string;
  configDir: string;
};

export type EnvironmentUpdateResult = EnvironmentResult & {
  updateTarget: string;
  applyHint: string;
};

export type EnvironmentClearResult = {
  updateTarget: string;
  applyHint: string;
};

export type EnvironmentCurrentResult = {
  mode: string | null;
  configDir: string | null;
  updateTarget: string;
};

type SwitchOptions = {
  configPath?: string;
  homeDir?: string;
  shellConfigPath?: string;
  platform?: NodeJS.Platform;
  moduleUrl?: string;
};

const CONFIG_FILE_NAME = 'config.json';
const SHELL_BLOCK_START = '# oc-config-switch begin';
const SHELL_BLOCK_END = '# oc-config-switch end';

export function switchMode(mode: string, options: SwitchOptions = {}): EnvironmentUpdateResult {
  const context = resolveSwitchContext(options);
  const configDir = resolveModeDir(context.baseDir, mode);
  assertExistingEnvironmentDir(configDir);

  if (context.platform === 'win32') {
    persistWindowsUserEnvironment(configDir);
    return {
      mode,
      configDir,
      updateTarget: 'Windows user environment variable OPENCODE_CONFIG_DIR',
      applyHint: 'Open a new terminal window to apply it.',
    };
  }

  const shellConfigPath = context.shellConfigPath;
  writeShellConfig(shellConfigPath, configDir);
  return {
    mode,
    configDir,
    updateTarget: shellConfigPath,
    applyHint: 'Run "source ~/.zshrc" or open a new terminal to apply it.',
  };
}

export function clearMode(options: SwitchOptions = {}): EnvironmentClearResult {
  const context = resolveRuntimeContext(options);

  if (context.platform === 'win32') {
    clearWindowsUserEnvironment();
    return {
      updateTarget: 'Windows user environment variable OPENCODE_CONFIG_DIR',
      applyHint: 'Open a new terminal window to apply it.',
    };
  }

  const shellConfigPath = context.shellConfigPath;
  clearShellConfig(shellConfigPath);
  return {
    updateTarget: shellConfigPath,
    applyHint: 'Run "source ~/.zshrc" or open a new terminal to apply it.',
  };
}

export function currentMode(options: SwitchOptions = {}): EnvironmentCurrentResult {
  const context = resolveSwitchContext(options);

  if (context.platform === 'win32') {
    const configDir = readWindowsUserEnvironment();
    return {
      mode: configDir === null ? null : resolveManagedMode(context.baseDir, configDir),
      configDir,
      updateTarget: 'Windows user environment variable OPENCODE_CONFIG_DIR',
    };
  }

  const shellConfigPath = context.shellConfigPath;
  const configDir = readShellConfigEnvironment(shellConfigPath);
  return {
    mode: configDir === null ? null : resolveManagedMode(context.baseDir, configDir),
    configDir,
    updateTarget: shellConfigPath,
  };
}

export function listModes(options: SwitchOptions = {}): string[] {
  const context = resolveSwitchContext(options);
  assertExistingBaseDir(context.baseDir);
  return readdirSync(context.baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

export function createMode(mode: string, options: SwitchOptions = {}): EnvironmentResult {
  const context = resolveSwitchContext(options);
  ensureBaseDir(context.baseDir);
  const configDir = resolveModeDir(context.baseDir, mode);
  if (existsSync(configDir)) {
    throw new Error(`Environment already exists: ${configDir}`);
  }
  mkdirSync(configDir);
  return { mode, configDir };
}

export function removeMode(mode: string, options: SwitchOptions = {}): EnvironmentResult {
  const context = resolveSwitchContext(options);
  const configDir = resolveModeDir(context.baseDir, mode);
  assertExistingEnvironmentDir(configDir);
  rmSync(configDir, { recursive: true });
  return { mode, configDir };
}

export function resolveProjectRoot(moduleUrl = import.meta.url): string {
  const moduleDir = dirname(fileURLToPath(moduleUrl));
  const moduleDirName = basename(moduleDir);
  if (moduleDirName === 'src' || moduleDirName === 'dist') {
    return dirname(moduleDir);
  }
  return moduleDir;
}

export function expandHomePath(pathValue: string, homeDir = homedir()): string {
  if (pathValue === '~') {
    return homeDir;
  }
  if (pathValue.startsWith('~/') || pathValue.startsWith('~\\')) {
    return join(homeDir, pathValue.slice(2));
  }
  if (pathValue.startsWith('~')) {
    throw new Error(`Unsupported home path: ${pathValue}`);
  }
  return pathValue;
}

function resolveSwitchContext(options: SwitchOptions): {
  baseDir: string;
  platform: NodeJS.Platform;
  shellConfigPath: string;
} {
  const runtimeContext = resolveRuntimeContext(options);
  const projectRoot = resolveProjectRoot(options.moduleUrl);
  const configPath = options.configPath ?? join(projectRoot, CONFIG_FILE_NAME);
  const config = readSwitchConfig(configPath);
  const baseDir = expandHomePath(config.baseDir, runtimeContext.homeDir);

  if (!isAbsolute(baseDir)) {
    throw new Error(`config.json baseDir must be an absolute path or start with "~": ${config.baseDir}`);
  }

  return {
    baseDir: resolve(baseDir),
    platform: runtimeContext.platform,
    shellConfigPath: runtimeContext.shellConfigPath,
  };
}

function resolveRuntimeContext(options: SwitchOptions): {
  homeDir: string;
  platform: NodeJS.Platform;
  shellConfigPath: string;
} {
  const homeDir = options.homeDir ?? homedir();
  return {
    homeDir,
    platform: options.platform ?? process.platform,
    shellConfigPath: options.shellConfigPath ?? join(homeDir, '.zshrc'),
  };
}

function readSwitchConfig(configPath: string): SwitchConfig {
  if (!existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }

  const rawConfig = readFileSync(configPath, 'utf8');
  let parsedConfig: unknown;
  try {
    parsedConfig = JSON.parse(rawConfig);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid config.json: ${message}`);
  }

  if (!isRecord(parsedConfig)) {
    throw new Error('Invalid config.json: expected an object');
  }

  const baseDir = parsedConfig.baseDir;
  if (typeof baseDir !== 'string' || baseDir.length === 0) {
    throw new Error('Invalid config.json: baseDir must be a non-empty string');
  }

  return { baseDir };
}

function resolveModeDir(baseDir: string, mode: string): string {
  assertModeName(mode);
  const configDir = resolve(baseDir, mode);
  assertInsideBaseDir(configDir, baseDir);
  return configDir;
}

function writeShellConfig(shellConfigPath: string, configDir: string): void {
  const currentContent = existsSync(shellConfigPath) ? readFileSync(shellConfigPath, 'utf8') : '';
  const nextContent = updateShellConfigContent(currentContent, configDir);
  writeFileSync(shellConfigPath, nextContent, 'utf8');
}

function clearShellConfig(shellConfigPath: string): void {
  if (!existsSync(shellConfigPath)) {
    return;
  }
  const currentContent = readFileSync(shellConfigPath, 'utf8');
  const nextContent = clearShellConfigContent(currentContent);
  writeFileSync(shellConfigPath, nextContent, 'utf8');
}

function readShellConfigEnvironment(shellConfigPath: string): string | null {
  if (!existsSync(shellConfigPath)) {
    return null;
  }
  return readShellConfigEnvironmentContent(readFileSync(shellConfigPath, 'utf8'));
}

function persistWindowsUserEnvironment(configDir: string): void {
  try {
    execFileSync('setx', ['OPENCODE_CONFIG_DIR', configDir], { stdio: 'ignore' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update Windows user environment: ${message}`);
  }
}

function readWindowsUserEnvironment(): string | null {
  let output: string;
  try {
    output = execFileSync('reg', ['query', 'HKCU\\Environment', '/v', 'OPENCODE_CONFIG_DIR'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }

  return parseWindowsRegistryValue(output);
}

function clearWindowsUserEnvironment(): void {
  try {
    execFileSync('reg', ['query', 'HKCU\\Environment', '/v', 'OPENCODE_CONFIG_DIR'], { stdio: 'ignore' });
  } catch {
    return;
  }

  try {
    execFileSync('reg', ['delete', 'HKCU\\Environment', '/v', 'OPENCODE_CONFIG_DIR', '/f'], { stdio: 'ignore' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to clear Windows user environment: ${message}`);
  }
}

function updateShellConfigContent(content: string, configDir: string): string {
  const block = [
    SHELL_BLOCK_START,
    `export OPENCODE_CONFIG_DIR=${shellQuote(configDir)}`,
    SHELL_BLOCK_END,
  ].join('\n');
  const contentWithoutBlocks = removeShellBlocks(content);

  if (contentWithoutBlocks.length === 0) {
    return `${block}\n`;
  }
  return `${contentWithoutBlocks}\n\n${block}\n`;
}

function clearShellConfigContent(content: string): string {
  const contentWithoutBlocks = removeShellBlocks(content);
  if (contentWithoutBlocks.length === 0) {
    return '';
  }
  return `${contentWithoutBlocks}\n`;
}

function readShellConfigEnvironmentContent(content: string): string | null {
  const blockPattern = new RegExp(
    `${escapeRegExp(SHELL_BLOCK_START)}\\n([\\s\\S]*?)\\n${escapeRegExp(SHELL_BLOCK_END)}`,
    'g',
  );
  const blocks = [...content.matchAll(blockPattern)];

  if (blocks.length === 0) {
    if (content.includes(SHELL_BLOCK_START) || content.includes(SHELL_BLOCK_END)) {
      throw new Error(`Shell config contains a malformed ${SHELL_BLOCK_START} block`);
    }
    return null;
  }

  const latestBlock = blocks[blocks.length - 1];
  const blockContent = latestBlock[1] ?? '';
  for (const line of blockContent.split(/\r?\n/)) {
    const match = line.match(/^\s*export\s+OPENCODE_CONFIG_DIR=(.+?)\s*$/);
    if (match !== null) {
      return parseShellValue(match[1]);
    }
  }

  throw new Error(`Shell config contains ${SHELL_BLOCK_START} block without OPENCODE_CONFIG_DIR`);
}

function removeShellBlocks(content: string): string {
  const blockPattern = new RegExp(
    `${escapeRegExp(SHELL_BLOCK_START)}[\\s\\S]*?${escapeRegExp(SHELL_BLOCK_END)}\\n?`,
    'g',
  );
  const contentWithoutBlocks = content.replace(blockPattern, '').trimEnd();

  if (contentWithoutBlocks.includes(SHELL_BLOCK_START) || contentWithoutBlocks.includes(SHELL_BLOCK_END)) {
    throw new Error(`Shell config contains a malformed ${SHELL_BLOCK_START} block`);
  }

  return contentWithoutBlocks;
}

function parseShellValue(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) {
    return trimmedValue.slice(1, -1).split("'\\''").join("'");
  }
  if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) {
    return trimmedValue.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  return trimmedValue;
}

function parseWindowsRegistryValue(output: string): string | null {
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^\s*OPENCODE_CONFIG_DIR\s+REG_\w+\s+(.*?)\s*$/);
    if (match !== null && match[1] !== '') {
      return match[1];
    }
  }
  return null;
}

function resolveManagedMode(baseDir: string, configDir: string): string | null {
  const relativePath = relative(baseDir, resolve(configDir));
  if (relativePath === '' || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return null;
  }

  const pathParts = relativePath.split(/[\\/]+/);
  if (pathParts.length !== 1) {
    return null;
  }

  const mode = pathParts[0];
  try {
    assertModeName(mode);
  } catch {
    return null;
  }
  return mode;
}

function assertModeName(mode: string): void {
  if (mode === '' || mode === '.' || mode === '..') {
    throw new Error(`Invalid mode "${mode}": mode must be a direct child folder name`);
  }
  if (mode.startsWith('-')) {
    throw new Error(`Invalid mode "${mode}": mode must not start with "-"`);
  }
  if (mode.includes('/') || mode.includes('\\')) {
    throw new Error(`Invalid mode "${mode}": mode must not contain path separators`);
  }
}

function assertInsideBaseDir(configDir: string, baseDir: string): void {
  const relativePath = relative(baseDir, configDir);
  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(`Resolved config directory is outside baseDir: ${configDir}`);
  }
}

function assertExistingBaseDir(baseDir: string): void {
  if (!existsSync(baseDir)) {
    throw new Error(`baseDir not found: ${baseDir}`);
  }
  if (!statSync(baseDir).isDirectory()) {
    throw new Error(`baseDir is not a directory: ${baseDir}`);
  }
}

function ensureBaseDir(baseDir: string): void {
  if (!existsSync(baseDir)) {
    mkdirSync(baseDir, { recursive: true });
    return;
  }
  if (!statSync(baseDir).isDirectory()) {
    throw new Error(`baseDir is not a directory: ${baseDir}`);
  }
}

function assertExistingEnvironmentDir(configDir: string): void {
  if (!existsSync(configDir)) {
    throw new Error(`Environment directory not found: ${configDir}`);
  }
  if (!statSync(configDir).isDirectory()) {
    throw new Error(`Environment path is not a directory: ${configDir}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
