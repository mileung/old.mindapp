export type Thought = {
	createDate: number;
	authorId?: string;
	signature?: string;
	spaceHostname?: string;
	content?: string;
	tags?: string[];
	parentId?: string;
	children?: Thought[];
	filedSaved?: true;
};

export function getThoughtId(thought: Thought) {
	return `${thought.createDate}_${thought.authorId || ''}_${thought.spaceHostname || ''}`;
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
