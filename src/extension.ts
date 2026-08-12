import * as vscode from 'vscode';
import {
	Excludes,
	getExcludeState,
	setExcludeState
} from './dotfileRules';

const configKey = 'files.exclude';
const keepVisibleSection = 'dotfileToggle';
const keepVisibleKey = 'keepVisible';
const globalManagedStateKey = 'managedGlobalExcludePattern';
const workspaceManagedStateKey = 'managedWorkspaceExcludePattern';
const folderManagedStatePrefix = 'managedFolderExcludePattern:';

let extensionContext: vscode.ExtensionContext;

export function activate(context: vscode.ExtensionContext) {
	extensionContext = context;
	const syncableGlobalState = context.globalState as vscode.Memento & {
		setKeysForSync?: (keys: readonly string[]) => void;
	};
	if (syncableGlobalState.setKeysForSync) {
		syncableGlobalState.setKeysForSync([globalManagedStateKey]);
	}
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.hideFiles', hide),
		vscode.commands.registerCommand('extension.showFiles', show),
		vscode.commands.registerCommand('extension.toggleFiles', toggle)
	);
}

export function deactivate() { }

function hide() {
	return updateConfiguration(true);
}

function show() {
	return updateConfiguration(false);
}

function toggle() {
	return updateConfiguration();
}

type ExcludeSetting = {
	uri?: vscode.Uri;
	excludes: Excludes;
	keepVisible: string[];
	target: vscode.ConfigurationTarget;
	state: vscode.Memento;
	stateKey: string;
};

async function updateConfiguration(value?: boolean) {
	const settings: ExcludeSetting[] = [
		...getGeneralSettings(),
		...getFoldersSettings()
	];

	if (value === undefined) {
		value = !getCurrentState(settings);
	}

	await Promise.all(settings.map(setting => updateSetting(setting, value as boolean)));
}

async function updateSetting(setting: ExcludeSetting, hidden: boolean) {
	const previousManagedPattern = setting.state.get<string>(setting.stateKey);
	const result = setExcludeState(
		setting.excludes,
		hidden,
		setting.keepVisible,
		previousManagedPattern
	);

	await vscode.workspace.getConfiguration(undefined, setting.uri)
		.update(configKey, result.excludes, setting.target);
	await setting.state.update(setting.stateKey, result.managedPattern);
}

function getGeneralSettings(): ExcludeSetting[] {
	const config = vscode.workspace.getConfiguration().inspect<Excludes>(configKey);
	const keepVisible = inspectKeepVisible();
	const settings: ExcludeSetting[] = [];

	if (config && config.globalValue) {
		settings.push({
			excludes: config.globalValue,
			keepVisible: keepVisible.global,
			target: vscode.ConfigurationTarget.Global,
			state: extensionContext.globalState,
			stateKey: globalManagedStateKey
		});
	}

	if (config && config.workspaceValue) {
		settings.push({
			excludes: config.workspaceValue,
			keepVisible: keepVisible.workspace,
			target: vscode.ConfigurationTarget.Workspace,
			state: extensionContext.workspaceState,
			stateKey: workspaceManagedStateKey
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
			target: vscode.ConfigurationTarget.WorkspaceFolder,
			state: extensionContext.workspaceState,
			stateKey: `${folderManagedStatePrefix}${folder.uri.toString()}`
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
	return settings.some(setting => getExcludeState(setting.excludes, setting.keepVisible));
}
