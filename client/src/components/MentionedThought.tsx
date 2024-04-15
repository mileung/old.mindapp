import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Thought } from '../utils/thought';
import ContentParser from './ContentParser';
import ThoughtBlockHeader from './ThoughtBlockHeader';

export default function MentionedThought({ thought }: { thought?: Thought }) {
	if (!thought) return null;
	const [markdown, markdownSet] = useState(true);

	return (
		<div className={`py-1 px-1.5 border border-mg2 rounded`}>
			<ThoughtBlockHeader thought={thought} markdownSet={markdownSet} markdown={markdown} />
			{thought.content ? (
				markdown ? (
					<ContentParser disableMentions thought={thought} />
				) : (
					<p className="whitespace-pre-wrap break-all font-thin font-mono">
						{typeof thought.content === 'object'
							? Array.isArray(thought.content)
								? thought.content.join('')
								: JSON.stringify(thought.content)
							: thought.content}
					</p>
				)
			) : (
				<p className="font-semibold text-fg2 italic">No content</p>
			)}
			{!!thought.tags.length && (
				<div className="flex flex-wrap gap-x-2">
					{thought.tags.map((tag) => (
						<Link
							key={tag}
							to={`/search?${new URLSearchParams({ q: `[${tag}]` }).toString()}`}
							className="font-bold leading-5 transition text-fg2 hover:text-fg1"
						>
							{tag}
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
