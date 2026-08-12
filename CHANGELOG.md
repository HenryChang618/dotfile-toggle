# Change Log

## 1.2.0 - 2026-08-12

- Added the `toggleHidden.keepVisible` setting for boolean `files.exclude` rules that must always remain visible.
- Added user, workspace, and workspace-folder support for always-visible rule lists.
- Updated English and Simplified Chinese documentation with configuration examples and broad-glob limitations.
- Kept all existing command identifiers and the original exclusion-toggle behavior when no exceptions are configured.

## 1.1.0 - 2026-08-08

- Added English and Simplified Chinese manifest localization.
- Added the localized command category “点文件显示开关”.
- Added the commands “隐藏点文件”, “显示点文件”, and “切换点文件显示状态”.
- Added English and Simplified Chinese documentation for behavior, limitations, migration, and Settings Sync.
- Prepared the extension for independent publication under `HenryChang618.toggle-hidden`.
- Updated repository, homepage, and issue-reporting metadata for the independently maintained project.
- Replaced the deprecated `vscode` development package with `@types/vscode`.
- Removed obsolete test, post-install, and TSLint configuration.
- Updated the TypeScript build configuration for reproducible manual VSIX builds.

## 1.0.0

- Initial upstream release.
