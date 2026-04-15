# omo-switch

`omo-switch` is a small CLI for switching opencode config directories.

It updates `OPENCODE_CONFIG_DIR` for your OS:
- macOS/Linux: writes an export block to `~/.zshrc`
- Windows: sets a user environment variable with `setx`

## Configuration

Edit `config.json` next to the package root:

```json
{
  "baseDir": "~/opencode-config",
  "aliases": {
    "on": "omo.copilot",
    "off": "pure"
  }
}
```

`baseDir` supports absolute paths and `~/...` paths. A mode can be either a
direct child folder under `baseDir` or an alias key from `config.json`.

Each target folder must already contain an `opencode.json` file.

## Usage

```sh
omos pure
omos omo.copilot
omos on
omos off
```

On macOS/Linux, you can run `source ~/.zshrc` to apply immediately.
On every platform, opening a new terminal session will apply the change.

## Development

```sh
npm install
npm run typecheck
npm run build
npm run dev -- pure
```
