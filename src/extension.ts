import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.hideFiles', hide),
		vscode.commands.registerCommand('extension.showFiles', show),
		vscode.commands.registerCommand('extension.toggleFiles', toggle)
	);
}

export function deactivate() { }

function hide() {
	updateConfiguration(true);
}

function show() {
	updateConfiguration(false);
}

function toggle() {
	updateConfiguration();
}

const configKey = 'files.exclude';
const keepVisibleSection = 'dotfileToggle';
const keepVisibleKey = 'keepVisible';

type Excludes = { [key: string]: unknown };

type ExcludeSetting = {
	uri?: vscode.Uri;
	excludes: Excludes;
	keepVisible: string[];
	target: vscode.ConfigurationTarget;
};

function updateConfiguration(value?: boolean) {
	const settings: ExcludeSetting[] = [
		...getGeneralSettings(),
		...getFoldersSettings()
	];

	if (value === undefined) {
		value = !getCurrentState(settings);
	}

	for (const setting of settings) {
		vscode.workspace.getConfiguration(undefined, setting.uri)
			.update(
				configKey,
				setState(setting.excludes, value, setting.keepVisible),
				setting.target
			);
	}
}

function getGeneralSettings(): ExcludeSetting[] {
	const config = vscode.workspace.getConfiguration().inspect<Excludes>(configKey);
	const keepVisible = inspectKeepVisible();
	const settings: ExcludeSetting[] = [];

	if (config && config.globalValue) {
		settings.push({
			excludes: config.globalValue,
			keepVisible: keepVisible.global,
			target: vscode.ConfigurationTarget.Global
		});
	}

	if (config && config.workspaceValue) {
		settings.push({
			excludes: config.workspaceValue,
			keepVisible: keepVisible.workspace,
			target: vscode.ConfigurationTarget.Workspace
		});
	}

	return settings;
}

function getFoldersSettings(): ExcludeSetting[] {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders) {
		return [];
	}

	const settings: ExcludeSetting[] = [];
	for (const folder of folders) {
		const config = vscode.workspace.getConfiguration(undefined, folder.uri)
			.inspect<Excludes>(configKey);

		if (!config || !config.workspaceFolderValue) {
			continue;
		}

		const keepVisible = inspectKeepVisible(folder.uri);
		settings.push({
			uri: folder.uri,
			excludes: config.workspaceFolderValue,
			keepVisible: keepVisible.workspaceFolder,
			target: vscode.ConfigurationTarget.WorkspaceFolder
		});
	}

	return settings;
}

function inspectKeepVisible(uri?: vscode.Uri) {
	const inspected = vscode.workspace.getConfiguration(keepVisibleSection, uri)
		.inspect<string[]>(keepVisibleKey);

	const global = inspected && inspected.globalValue || [];
	const workspace = inspected && inspected.workspaceValue !== undefined
		? inspected.workspaceValue
		: global;
	const workspaceFolder = inspected && inspected.workspaceFolderValue !== undefined
		? inspected.workspaceFolderValue
		: workspace;

	return {
		global: global || [],
		workspace: workspace || [],
		workspaceFolder: workspaceFolder || []
	};
}

function getCurrentState(settings: ExcludeSetting[]) {
	return settings.some(setting => {
		const keepVisible = new Set(setting.keepVisible);
		return Object.keys(setting.excludes).some(key =>
			!keepVisible.has(key) && setting.excludes[key] === true
		);
	});
}

function setState(excludes: Excludes, value: boolean, keepVisiblePatterns: string[]) {
	const updatedExcludes = { ...excludes };
	const keepVisible = new Set(keepVisiblePatterns);

	for (const key of Object.keys(updatedExcludes)) {
		if (typeof updatedExcludes[key] !== 'boolean') {
			continue;
		}

		updatedExcludes[key] = keepVisible.has(key) ? false : value;
	}

	return updatedExcludes;
}
