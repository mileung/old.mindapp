export type Thought = {
	createDate: number;
	authorId: null | number;
	spaceId: null | number;
	content: string | string[];
	tags?: string[];
	parentId?: string;
	childrenIds?: string[];
};

export type RecThought = {
	createDate: number;
	authorId: null | number;
	spaceId: null | number;
	content: string | string[];
	tags?: string[];
	parent?: RecThought[];
	children?: RecThought[];
};

export function getThoughtId(thought: Thought) {
	return `${thought.createDate}.${thought.authorId}.${thought.spaceId}`;
}

export const copyToClipboardAsync = (str = '') => {
	if (navigator && navigator.clipboard && navigator.clipboard.writeText)
		return navigator.clipboard.writeText(str);
	return window.alert('The Clipboard API is not available.');
};
