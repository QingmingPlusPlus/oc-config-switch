# omo-switch

`omo-switch` is a small CLI for managing opencode environment directories.

It updates `OPENCODE_CONFIG_DIR` for your OS:
- macOS/Linux: writes an export block to `~/.zshrc`
- Windows: sets a user environment variable

## Installation

```sh
npm install
```

## Configuration

Edit `config.json` next to the package root:

```json
{
  "baseDir": "~/opencode-config"
}
```

`baseDir` supports absolute paths and `~/...` paths. Each environment is a
direct child folder under `baseDir`.

## Usage

```sh
omos new demo
omos list
omos on demo
omos current
omos off
omos remove demo
omos version
omos help
```

`omos new <mode>` creates an empty environment directory. `omos on <mode>`
points `OPENCODE_CONFIG_DIR` at that directory. `omos current` prints the
environment currently written by omo-switch. `omos off` removes the environment
variable written by omo-switch.

On macOS/Linux, you can run `source ~/.zshrc` to apply immediately.
On every platform, opening a new terminal session will apply the change.

## Development

```sh
npm install
npm run typecheck
npm run build
npm run dev -- help
```
