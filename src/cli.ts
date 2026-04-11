export type Command =
  | { type: 'switch'; mode: string }
  | { type: 'help' }
  | { type: 'version' };

export const VERSION = '1.0.0';

export function parseCommand(args: string[]): Command {
  if (args.length === 0) {
    return { type: 'help' };
  }
  const arg = args[0];
  if (arg === '--help' || arg === '-h') {
    return { type: 'help' };
  }
  if (arg === '--version' || arg === '-v') {
    return { type: 'version' };
  }
  if (arg.startsWith('-')) {
    throw new Error(`Unknown option: ${arg}`);
  }
  return { type: 'switch', mode: arg };
}

export function printHelp(): void {
  console.log(`omos — opencode config switcher

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
Target file:      opencode.json`);
}

export function printVersion(): void {
  console.log(VERSION);
}
