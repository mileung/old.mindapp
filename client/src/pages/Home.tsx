import { ThoughtWriter } from '../components/ThoughtWriter';
import Results from '../components/Results';
import { resultsUse } from '../components/GlobalState';

export default function Home() {
	const [roots, rootsSet] = resultsUse();
	// QUESTION: Why does get-local-thoughts need cors but not whoami?
	// useEffect(() => {
	// 	(async () => {
	// 		const thing = await (await fetch('http://localhost:3000/whoami')).json();
	// 		console.log('thing:', thing);
	// 	})();
	// }, []);

	return (
		<div className="p-3 flex-1">
			<ThoughtWriter onWrite={(thought) => rootsSet([thought, ...roots])} />
			<Results />
		</div>
	);
}
