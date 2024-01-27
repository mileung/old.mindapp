import { XMarkIcon } from '@heroicons/react/16/solid';
import { useRef, useState } from 'react';
import Cell from './Cell';

export default function Home() {
	const [thought, thoughtSet] = useState('');
	const tagInput = useRef<null | HTMLInputElement>(null);
	const [tags, tagsSet] = useState<string[]>([]);
	const [notes, notesSet] = useState<string[]>([
		// 'test',
		// 'test',
		// 'test',
		// 'test',
		// 'test',
		'test',
		'test',
	]);

	return (
		<div className="p-4 flex-1">
			<div className="w-full max-w-2xl ">
				<textarea
					value={thought}
					onChange={(e) => thoughtSet(e.target.value)}
					placeholder="New thought"
					className="rounded text-xl p-3 bg-mg1 w-full max-w-full resize-y"
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							notesSet([thought, ...notes]);
							setTimeout(() => thoughtSet(''), 0);
						}
					}}
				/>
				<div
					className="mt-0.5 fx flex-wrap p-3 gap-1.5 rounded-t bg-mg1 text-xl"
					onClick={() => tagInput.current!.focus()}
				>
					{tags.length ? (
						tags.map((name, i) => {
							return (
								<div
									key={i}
									className="tag bg-mg2 text-fg1 flex rounded-full overflow-hidden hover:bg-mg3 pl-0.5"
								>
									<div className="tag-label pl-2.5 pr-1">{name}</div>
									<button
										className="xy group h-8 w-8 rounded-full -outline-offset-4"
										onClick={() => {
											const newCats = [...tags];
											newCats.splice(i, 1);
											tagsSet(newCats);
										}}
									>
										<div className="w-5 h-5 xy rounded-full border-[1px] border-fg2 group-hover:border-fg1">
											<XMarkIcon className="w-4 h-4 text-fg2 group-hover:text-fg1" />
										</div>
									</button>
								</div>
							);
						})
					) : (
						<p className="text-xl text-fg2">Tags</p>
					)}
				</div>
				<div className="h-0.5 bg-bg1"></div>
				<input
					className="px-3 py-1 text-xl bg-mg1 w-full rounded-b overflow-hidden"
					placeholder="Separate tags with Enter"
					ref={tagInput}
					onKeyDown={(e) => {
						const cat = tagInput.current?.value.trim();
						if (e.key === 'Enter' && !e.metaKey && cat) {
							tagsSet([...tags, cat]);
							tagInput.current!.value = '';
						}
					}}
				/>
				<div className="mt-2 fx gap-2">
					<button
						// title="Control + Tab"
						// title="Enter"
						className="px-3 py-0.5 rounded font-medium transition bg-mg1 hover:bg-mg2"
					>
						Save
					</button>
					{/* <input type="checkbox" /> */}
				</div>
			</div>
			<div className="mt-3 space-y-3">
				{notes.map((note, i) => {
					return <Cell key={i} date={Date.now()} note={note} />;
				})}
			</div>
		</div>
	);
}
