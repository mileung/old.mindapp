import { useEffect } from 'react';

export function useKeyPress(
	input:
		| string
		| {
				key: string;
				modifiers: string[];
		  },
	callback: (e: KeyboardEvent) => void,
	dependencies?: any[],
) {
	useEffect(() => {
		const { key, modifiers = [] } = typeof input === 'string' ? { key: input } : input;
		let isAboutToTrigger = !modifiers.length;
		const handleKeyMove = (event: KeyboardEvent) => {
			if (modifiers.includes(event.key)) {
				isAboutToTrigger = event.type === 'keydown';
			} else if (event.key === key && isAboutToTrigger && !event.repeat) {
				callback(event);
			}
		};

		document.addEventListener('keydown', handleKeyMove);
		modifiers.length && document.addEventListener('keyup', handleKeyMove);
		return () => {
			document.removeEventListener('keydown', handleKeyMove);
			document.removeEventListener('keyup', handleKeyMove);
		};
	}, [JSON.stringify(input), callback, ...(dependencies || [])]);
}
