import { useState } from 'react';
import { Link } from 'react-router-dom';

type DataBlock = {
	title: string;
	youtubeVideoId: string;
};

export default function Tables() {
	const [tables, tablesSet] = useState([
		{ label: 'Music', values: '' },
		{ label: 'Japanese', values: '' },
	]);

	return (
		<div className="p-3 space-y-3">
			Tables
			<div className="mt-2 w-full px gap grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
				{tables.map((table, i) => {
					return (
						<Link key={table.id} to={`/table/${'table.id'}`}>
							<div className="b absolute bottom-0 w-full h-8 pointer-events-none bg-gradient-to-b from-clear to-cell2 rounded-b"></div>
						</Link>
					);
				})}
			</div>
		</div>
	);
}
