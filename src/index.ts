#!/usr/bin/env node

import { parseCommand, printHelp, printVersion } from './cli.js';
import { clearMode, createMode, currentMode, listModes, removeMode, switchMode } from './switcher.js';

function main(args: string[]): void {
  const command = parseCommand(args);
  switch (command.type) {
    case 'help':
      printHelp();
      break;
    case 'version':
      printVersion();
      break;
    case 'on': {
      const result = switchMode(command.mode);
      console.log(`Switched to mode: ${result.mode}`);
      console.log(`OPENCODE_CONFIG_DIR=${result.configDir}`);
      console.log(`Updated target: ${result.updateTarget}`);
      console.log(result.applyHint);
      break;
    }
    case 'off': {
      const result = clearMode();
      console.log('Cleared OPENCODE_CONFIG_DIR written by oc-config-switch.');
      console.log(`Updated target: ${result.updateTarget}`);
      console.log(result.applyHint);
      break;
    }
    case 'current': {
      const result = currentMode();
      if (result.configDir === null) {
        console.log('No current environment set.');
        console.log(`Checked target: ${result.updateTarget}`);
        break;
      }
      if (result.mode === null) {
        console.log('Current OPENCODE_CONFIG_DIR is not managed by oc-config-switch.');
        console.log(`OPENCODE_CONFIG_DIR=${result.configDir}`);
        console.log(`Checked target: ${result.updateTarget}`);
        break;
      }
      console.log(`Current mode: ${result.mode}`);
      console.log(`OPENCODE_CONFIG_DIR=${result.configDir}`);
      console.log(`Checked target: ${result.updateTarget}`);
      break;
    }
    case 'list': {
      const modes = listModes();
      if (modes.length === 0) {
        console.log('No environments found.');
        break;
      }
      const current = currentMode();
      for (const mode of modes) {
        const marker = current.mode === mode ? '(*)' : '( )';
        console.log(`${marker} ${mode}`);
      }
      break;
    }
    case 'new': {
      const result = createMode(command.mode);
      console.log(`Created mode: ${result.mode}`);
      console.log(`Directory: ${result.configDir}`);
      break;
    }
    case 'remove': {
      const result = removeMode(command.mode);
      console.log(`Removed mode: ${result.mode}`);
      console.log(`Directory: ${result.configDir}`);
      break;
    }
  }
}

try {
  main(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  console.error('Run "ocs help" for usage.');
  process.exitCode = 1;
}
