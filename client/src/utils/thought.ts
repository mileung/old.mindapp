export type Thought = {
	createDate: number;
	authorId: string;
	spaceId: string;
	content: string | string[] | Record<string, string>;
	tags: string[];
	parentId?: string;
	childrenIds?: string[];
};

export type RecThought = {
	createDate: number;
	authorId: string;
	spaceId: string;
	content: string | string[] | Record<string, string>;
	tags: string[];
	parent?: RecThought[];
	children?: RecThought[];
};

export function getThoughtId(thought: Thought) {
	return `${thought.createDate}_${thought.authorId}_${thought.spaceId}`;
}

export const copyToClipboardAsync = (str = '') => {
	if (navigator && navigator.clipboard && navigator.clipboard.writeText)
		return navigator.clipboard.writeText(str);
	return window.alert('The Clipboard API is not available.');
};

const thoughtIdRegex = /^\d{3,}_(|[A-HJ-NP-Za-km-z1-9]{3,})_(|[A-HJ-NP-Za-km-z1-9]{3,})$/;
export function isThoughtId(str: string) {
	return thoughtIdRegex.test(str);
}

const thoughtIdsRegex = /\d{3,}_(|[A-HJ-NP-Za-km-z1-9]{3,})_(|[A-HJ-NP-Za-km-z1-9]{3,})/g;
export function separateMentions(text: string) {
	const matches = text.matchAll(thoughtIdsRegex);
	const result: string[] = [];
	let start = 0;
	for (const match of matches) {
		result.push(text.substring(start, match.index), match[0]);
		start = match.index! + match[0].length;
	}
	if (start < text.length) {
		result.push(text.substring(start));
	}
	return result.length > 1 ? result : text;
}
