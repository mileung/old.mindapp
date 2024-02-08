import { useCallback, useEffect } from 'react';
import NoteBlock, { Note } from '../components/NoteBlock';
import { NoteWriter } from '../components/NoteWriter';
import { buildUrl, pinger } from '../utils/api';
import { useNotes } from '../components/GlobalState';

export default function Home() {
	const [notes, notesSet] = useNotes();

	const loadMoreNotes = useCallback(() => {
		const lastNote = notes[notes.length - 1];
		if (lastNote === null) return;
		const notesAfter = notes.length ? lastNote.createDate : Date.now();
		pinger<Note[]>(buildUrl('get-local-notes', { notesAfter, oldToNew: false }))
			.then((additionalNotes) => {
				const notesPerLoad = 8;
				const newNotes = [...notes, ...additionalNotes];
				additionalNotes.length < notesPerLoad && newNotes.push(null);
				notesSet(newNotes);
			})
			.catch((err) => alert('Error: ' + err));
	}, [notes]);

	useEffect(() => loadMoreNotes(), []);

	// QUESTION: Why does get-local-notes need cors but not whoami?
	// useEffect(() => {
	// 	(async () => {
	// 		const thing = await (await fetch('http://localhost:3000/whoami')).json();
	// 		console.log('thing:', thing);
	// 	})();
	// }, []);

	return (
		<div className="p-3 flex-1">
			<NoteWriter />
			<div className="mt-3 space-y-1.5">
				{notes.map((note, i) => note && <NoteBlock key={i} note={note} />)}
				{notes[notes.length - 1] !== null && (
					<button className="rounded self-center px-3 bg-mg1 hover:bg-mg2" onClick={loadMoreNotes}>
						Load more
					</button>
				)}
			</div>
		</div>
	);
}
