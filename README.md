# oc-config-switch

English | [简体中文](README.zh-CN.md)

`oc-config-switch` is a small CLI for switching opencode configuration
environments. It manages `OPENCODE_CONFIG_DIR` so different opencode configs can
live in separate folders and be switched with one command.

## Features

- Switch the active opencode config directory with `ocs on <mode>`
- Create, list, inspect, and remove environment folders
- Store environments under one configurable `baseDir`
- macOS/Linux support through a managed `~/.zshrc` export block
- Windows support through the user `OPENCODE_CONFIG_DIR` environment variable
- Pure Node.js, with no runtime dependencies

## Requirements

- Node.js 20 or newer
- npm

## Installation

Install dependencies and build the CLI:

```sh
npm install
npm run build
```

Install the command globally from this checkout:

```sh
npm run setup
```

After setup, the CLI is available as `ocs`.

## Configuration

Edit `config.json` next to the package root:

```json
{
  "baseDir": "~/opencode-config"
}
```

`baseDir` can be an absolute path or a `~/...` path. Each environment is a
direct child folder under `baseDir`.

Example layout:

```text
~/opencode-config/
├── work/
│   └── opencode.json
└── personal/
    └── opencode.json
```

## Usage

Create an environment:

```sh
ocs new work
```

Switch to it:

```sh
ocs on work
```

Check the current environment:

```sh
ocs current
```

Clear the managed environment variable:

```sh
ocs off
```

List environments:

```sh
ocs list
```

Remove an environment:

```sh
ocs remove work
```

## Commands

| Command | Description |
| --- | --- |
| `ocs on <mode>` | Switch `OPENCODE_CONFIG_DIR` to an environment |
| `ocs off` | Clear the environment variable written by `oc-config-switch` |
| `ocs current` | Print the current environment |
| `ocs list` | List all environments under `baseDir` |
| `ocs new <mode>` | Create an empty environment directory |
| `ocs remove <mode>` | Remove an environment directory |
| `ocs version` | Print the version |
| `ocs help` | Show help |

Mode names must be direct child folder names. They cannot be empty, start with
`-`, or contain path separators.

## Applying Changes

On macOS/Linux, `ocs on` and `ocs off` update a managed block in `~/.zshrc`:

```sh
# oc-config-switch begin
export OPENCODE_CONFIG_DIR='...'
# oc-config-switch end
```

Run this to apply the change in the current terminal:

```sh
source ~/.zshrc
```

Opening a new terminal session also applies the change.

On Windows, `ocs` updates the user `OPENCODE_CONFIG_DIR` environment variable.
Open a new terminal window to apply the change.

## Development

```sh
npm install
npm run typecheck
npm run build
npm run dev -- help
```

Run the built CLI directly:

```sh
node dist/index.js help
```
