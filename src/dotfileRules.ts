export type Excludes = { [key: string]: unknown };

export interface ExcludeStateResult {
	excludes: Excludes;
	managedPattern?: string;
}

export const dotfileCatchAllPattern = '**/.*';

const simpleDotfileName = /^\.[A-Za-z0-9._@+\-]+$/;

/**
 * Accept simple dotfile basenames. The previous glob-prefixed form remains accepted
 * so existing 1.2.0 configurations continue to work.
 */
export function normalizeKeepVisibleNames(entries: string[]): string[] {
	const names = new Set<string>();

	for (const entry of entries) {
		const candidate = entry.indexOf('**/') === 0 ? entry.slice(3) : entry;
		if (simpleDotfileName.test(candidate)) {
			names.add(candidate);
		}
	}

	return Array.from(names).sort();
}

export function getExcludeState(excludes: Excludes, keepVisibleEntries: string[]): boolean {
	const keepVisibleRules = new Set(keepVisibleEntries);
	const keepVisibleNames = new Set(normalizeKeepVisibleNames(keepVisibleEntries));

	return Object.keys(excludes).some(key =>
		excludes[key] === true && !isDirectKeepVisibleRule(key, keepVisibleRules, keepVisibleNames)
	);
}

export function setExcludeState(
	excludes: Excludes,
	hidden: boolean,
	keepVisibleEntries: string[],
	previousManagedPattern?: string
): ExcludeStateResult {
	const updatedExcludes = { ...excludes };
	const keepVisibleRules = new Set(keepVisibleEntries);
	const keepVisibleNames = new Set(normalizeKeepVisibleNames(keepVisibleEntries));
	const currentManagedPattern = keepVisibleNames.size > 0
		? buildDotfileComplementPattern(Array.from(keepVisibleNames))
		: undefined;

	// Delete both the recorded key and the deterministic key for the current
	// setting. The latter also cleans up after Settings Sync on a new machine.
	if (previousManagedPattern) {
		delete updatedExcludes[previousManagedPattern];
	}
	if (currentManagedPattern) {
		delete updatedExcludes[currentManagedPattern];
	}

	for (const key of Object.keys(updatedExcludes)) {
		if (typeof updatedExcludes[key] !== 'boolean') {
			continue;
		}

		updatedExcludes[key] = isDirectKeepVisibleRule(key, keepVisibleRules, keepVisibleNames)
			? false
			: hidden;
	}

	if (!hidden || keepVisibleNames.size === 0 || updatedExcludes[dotfileCatchAllPattern] !== true) {
		return { excludes: updatedExcludes };
	}

	// A false specific rule cannot override **/.* in files.exclude. Replace that
	// catch-all with an equivalent generated glob that omits the requested names.
	updatedExcludes[dotfileCatchAllPattern] = false;
	const managedPattern = currentManagedPattern as string;
	updatedExcludes[managedPattern] = true;

	return { excludes: updatedExcludes, managedPattern };
}

export function buildDotfileComplementPattern(keepVisibleNames: string[]): string {
	const suffixes = normalizeKeepVisibleNames(keepVisibleNames).map(name => name.slice(1));
	if (suffixes.length === 0) {
		return dotfileCatchAllPattern;
	}

	const root = createTrie(suffixes);
	const suffixPatterns: string[] = [];
	appendComplementPatterns(root, '', suffixPatterns);
	const patterns = suffixPatterns.map(pattern => `**/.${pattern}`);

	return patterns.length === 1 ? patterns[0] : `{${patterns.join(',')}}`;
}

type TrieNode = {
	terminal: boolean;
	children: { [character: string]: TrieNode };
};

function createTrie(values: string[]): TrieNode {
	const root: TrieNode = { terminal: false, children: Object.create(null) };

	for (const value of values) {
		let node = root;
		for (const character of value) {
			if (!node.children[character]) {
				node.children[character] = { terminal: false, children: Object.create(null) };
			}
			node = node.children[character];
		}
		node.terminal = true;
	}

	return root;
}

function appendComplementPatterns(node: TrieNode, prefix: string, patterns: string[]) {
	const childCharacters = Object.keys(node.children).sort();

	if (prefix && !node.terminal) {
		patterns.push(prefix);
	}

	if (childCharacters.length === 0) {
		if (node.terminal) {
			patterns.push(`${prefix}?*`);
		}
		return;
	}

	patterns.push(`${prefix}${negatedCharacterClass(childCharacters)}*`);
	for (const character of childCharacters) {
		appendComplementPatterns(node.children[character], `${prefix}${character}`, patterns);
	}
}

function negatedCharacterClass(characters: string[]): string {
	// A hyphen is literal at the end of a character class.
	const withoutHyphen = characters.filter(character => character !== '-');
	if (characters.indexOf('-') >= 0) {
		withoutHyphen.push('-');
	}
	return `[!${withoutHyphen.join('')}]`;
}

function isDirectKeepVisibleRule(
	rule: string,
	keepVisibleRules: Set<string>,
	keepVisibleNames: Set<string>
): boolean {
	if (keepVisibleRules.has(rule)) {
		return true;
	}

	const name = rule.indexOf('**/') === 0 ? rule.slice(3) : rule;
	return simpleDotfileName.test(name) && keepVisibleNames.has(name);
}
