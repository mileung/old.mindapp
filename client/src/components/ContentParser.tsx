import { ReactNode } from 'react';

interface ContentParserProps {
	text: string;
}

export default function ContentParser({ text }: ContentParserProps): ReactNode[] {
	const htmlNodes: ReactNode[] = [];
	text = text.trim();
	let content = '';
	let tagBeingParsed: undefined | 'p' | 'a' | 'img' | 'video';
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		if (!tagBeingParsed) {
			switch (char) {
				// case '!':
				// 	tagBeingParsed = 'img';
				// 	break;
				// case '[':
				// 	tagBeingParsed = 'a';
				// 	break;
				default:
					tagBeingParsed = 'p';
			}
		}
		if (char === '\n' || i === text.length - 1) {
			let reactNode: ReactNode;
			switch (tagBeingParsed) {
				case 'p':
					content += char;
					reactNode = (
						<p key={i} className="whitespace-pre-wrap break-all font-medium">
							{content}
						</p>
					);
					break;

				default:
					break;
			}
			htmlNodes.push(reactNode);
			content = '';
		} else {
			content += char;
		}
	}

	return htmlNodes;
}
