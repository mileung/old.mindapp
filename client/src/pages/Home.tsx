import Results from '../components/Results';

export default function Home() {
	// QUESTION: Why does get-local-thoughts need cors but not whoami?
	// useEffect(() => {
	// 	(async () => {
	// 		const thing = await (await fetch('http://localhost:54321/whoami')).json();
	// 		console.log('thing:', thing);
	// 	})();
	// }, []);

	return (
		<div className="p-3">
			<Results />
		</div>
	);
}
