import { ReactNode, useMemo } from 'react';
import { Thought } from './ThoughtBlock';
import MentionedThought from './MentionedThought';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils/time';

export default function ContentParser({
	disableMentions,
	mentionedThoughts,
	content,
}: {
	disableMentions: boolean;
	mentionedThoughts?: Record<string, Thought>;
	content: string | string[];
}): ReactNode[] {
	const htmlNodes = useMemo(() => {
		const arr = Array.isArray(content) ? content : [content];
		return arr.map((str, i) => {
			if (i % 2) {
				return disableMentions ? (
					<Link
						key={i}
						target="_blank"
						to={`/${str}`}
						className="px-1 border border-mg2 rounded text-sm font-bold transition text-fg2 hover:border-fg1 hover:text-fg1"
					>
						{formatTimestamp(+str.substring(0, str.indexOf('.')))}
					</Link>
				) : (
					<MentionedThought key={i} thought={mentionedThoughts![str]} />
				);
			}
			return parseMd(str);
		});
	}, [content]);

	return htmlNodes;
}

function parseMd(str: string) {
	const htmlNodes: ReactNode[] = [];
	let content = '';
	let tagBeingParsed: undefined | 'p' | 'a' | 'img' | 'video';
	for (let i = 0; i < str.length; i++) {
		const char = str[i];
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
		if (char === '\n' || i === str.length - 1) {
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
