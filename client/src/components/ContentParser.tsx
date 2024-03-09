import React, { ReactNode, useMemo, useState } from 'react';
import { Thought } from '../utils/thought';
import MentionedThought from './MentionedThought';
import { Link } from 'react-router-dom';
import { formatTimestamp } from '../utils/time';
import { PlayIcon, XMarkIcon } from '@heroicons/react/16/solid';

export default function ContentParser({
	disableMentions,
	mentionedThoughts,
	content,
}: {
	disableMentions?: boolean;
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

function parseMd(text: string) {
	// const assetRegex = /!\[([^\]]*)\]\(([^\)]*)\)/g;
	// const linkRegex = /\[([^\]]*)\]\(([^\)]*)\)/g;
	const uriRegex = /([a-zA-Z][a-zA-Z0-9+.-]*):\/\/(\S+)/g;
	// const assetMatches = text.matchAll(assetRegex);
	// const linkMatches = text.matchAll(linkRegex);
	const uriMatches = text.matchAll(uriRegex);

	type A = { text: string; uri: string };
	type Img = { alt: string; imageUri: string };
	type Video = { alt: string; videoUri: string };
	type Audio = { alt: string; audioUri: string };
	const result: (string | A | Img | Video | Audio)[] = [];

	let start = 0;
	for (const match of uriMatches) {
		result.push(text.substring(start, match.index), { text: match[0], uri: match[0] });
		start = match.index! + match[0].length;
	}
	if (start < text.length) {
		result.push(text.substring(start));
	}

	return result.map((tag, i) => {
		// console.log('tag:', tag);
		if (typeof tag === 'string') {
			return tag === '' ? null : (
				<p key={i} className="whitespace-pre-wrap inline font-medium">
					{tag}
				</p>
			);
		} else if ('uri' in tag) {
			return (
				<React.Fragment key={i}>
					<a
						target="_blank"
						href={tag.uri}
						className="font-medium inline break-all transition text-sky-600 text hover:text-sky-500 dark:text-cyan-400 dark:hover:text-cyan-300"
					>
						{tag.text}
					</a>
					<IframePreview uri={tag.uri} />
				</React.Fragment>
			);
		}
	});
}

const ytRegex =
	/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const IframePreview = ({ uri }: { uri: string }) => {
	const [open, openSet] = useState(false);
	const iframe = useMemo(() => {
		const videoId = uri.match(ytRegex)?.[1];
		if (videoId) {
			return (
				<iframe
					allowFullScreen
					className="w-full max-h-[80vh] max-w-[calc(80vh*16/9)] aspect-video"
					src={`https://www.youtube.com/embed/${videoId}`}
				/>
			);
		}
	}, [uri]);

	return (
		iframe && (
			<>
				<button className="h-5 w-5 rounded bg-mg2 xy inline-flex" onClick={() => openSet(!open)}>
					{open ? (
						<XMarkIcon className="absolute h-5 w-5" />
					) : (
						<PlayIcon className="absolute h-4 w-4" />
					)}
				</button>
				{open && iframe}
			</>
		)
	);
};
