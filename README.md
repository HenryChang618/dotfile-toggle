# Peek Hidden Files

English | [简体中文](README.zh-CN.md)

Toggle the visibility of entries excluded by VS Code's `files.exclude` setting. In Simplified Chinese, the extension is displayed as **点文件显示开关**.

## Features

The following commands are available from the Command Palette under the **Peek Hidden Files** category:

- `Hide Excluded Files`
- `Show Excluded Files`
- `Toggle Excluded Files`

`Toggle Excluded Files` is also available from the Explorer context menu.

In a Simplified Chinese VS Code window, the Command Palette can show the localized title together with its English alias, for example:

```text
点文件显示开关: 显示点文件
Peek Hidden Files: Show Excluded Files
```

Both Chinese and English text can therefore be used to search for the commands.

## Scope

Despite the extension name and the Chinese product term “点文件”, the extension operates on boolean entries in VS Code's `files.exclude` setting. It can affect any matching excluded file or folder, not only names beginning with a dot.

The extension checks these configuration scopes:

- User settings;
- Workspace settings;
- Workspace-folder settings in multi-root workspaces.

## Known limitations

Only exclusion entries whose values are booleans are toggled. Conditional exclusion objects are left unchanged.

For example, the following entries are supported:

```json
{
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true
  }
}
```

## Always-visible rules

Use `toggleHidden.keepVisible` for boolean `files.exclude` rules that must remain visible when the other excluded entries are hidden:

```json
{
  "files.exclude": {
    "**/.git": true,
    "**/.env": true,
    "**/.vscode": true
  },
  "toggleHidden.keepVisible": [
    "**/.env",
    "**/.vscode"
  ]
}
```

Each item must exactly match a key in `files.exclude`. When a hide or toggle command enters the hidden state, matching boolean rules are set to `false`; all other boolean rules are set to `true`. The setting can be configured at user, workspace, or workspace-folder scope.

A specific entry cannot override a broader enabled rule that also matches the same file. For example, keeping `**/.env` visible does not cancel an enabled `**/.*` rule. Define separate `files.exclude` keys when individual exceptions are required.

## Installation and migration

The independent Marketplace extension identifier is planned as:

```text
henrychang.toggle-hidden
```

After the extension has been published, install that identifier from the Extensions view or with:

```bash
code --install-extension henrychang.toggle-hidden
```

The earlier private VSIX used the upstream identifier `adrianwilczynski.toggle-hidden`. Because changing the publisher changes the extension identifier, Settings Sync cannot be expected to migrate the private build automatically. Install and verify the Marketplace version first, then remove the private/upstream-identifier build if it is still installed.

## Settings Sync

Once the extension is available from Visual Studio Marketplace, VS Code Settings Sync can restore it on another machine by its Marketplace identifier. User-level `files.exclude` values are handled by VS Code's settings synchronization; workspace-level values should remain in the workspace configuration or project repository.

The extension itself has no custom settings or synchronized extension state.

## Local build

```bash
npm install
npm run compile
npx @vscode/vsce package --out temp/toggle-hidden-1.2.0-marketplace.vsix
```

The project intentionally does not add automated test, packaging, or publishing scripts. Release packages are built and inspected manually.

## Presentation

![Example](img/example.gif)

## Project history

This project is independently maintained from [Adrian Wilczyński's Peek Hidden Files](https://github.com/AdrianWilczynski/PeekHiddenFiles). It retains the original command identifiers and core behavior while adding manifest localization, Simplified Chinese documentation, and build maintenance.

## License

MIT. See [LICENSE](LICENSE). The original copyright notice is retained.
