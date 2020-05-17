# Change Log
## [v0.2.2]
- Update versions of some packages.
- Update vscode enine version to 1.40.0.

## [v0.2.1]
### Added
- Add `vscode-advanced-open-file.groupDirectoriesFirst` option to group directories above files([#21](https://github.com/jit-y/vscode-advanced-open-file/pull/21/files)) Thanks Osmose!

### Changed
- Upgrade versions of TypeScript and @types/node.

## [v0.2.0]
### Changed
- Update minimum version of vscode engine to ^1.38.0.

## [v0.1.9]
### Changed
- Change default of `vscode-advanced-open-file.selectPath` option to false.

## [v0.1.8]
### Added
- Add `vscode-advanced-open-file.selectPath` option for enabling or disabling path selection on opening filter box. ([#5](https://github.com/jit-y/vscode-advanced-open-file/pull/12)) Thanks turara!

## [v0.1.7]
### Changed
- Use absolute paths to support opening files outside workspace.([#4](https://github.com/jit-y/vscode-advanced-open-file/pull/4)) Thanks Osmose!

## [v0.1.6]
### Changed
- Use octicons to denote files/directories/symlinks instead of description. ([#3](https://github.com/jit-y/vscode-advanced-open-file/pull/3)) Thanks Osmose!

## [v0.1.5]
### Fixed
- Fix to call resolve in Promise.

## [v0.1.4]
### Fixed
- Fix package name

## [v0.1.3]
### Changed
- Create directories recursively if directories does not exists on creating file.

## [v0.1.2]
### Fixed
- Always call dispose method.
- Skipping readdir when to be picked directory

## [v0.1.1]
### Fixed
- Reduce times of calling readdir method on changing input value.
- Use path.sep instead using POSIX path segment separator directly.

## [v0.1.0]
### Changed
- Set directory of active file to input field as default value.

## [v0.0.2 - v0.0.6]
- Add some changes

## [v0.0.1]
- Initial release
