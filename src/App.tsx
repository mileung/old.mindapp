import Test from './components/Test';

function App() {
	return (
		<main className="">
			<header className="z-50 absolute top-0 w-screen fx justify-between">
				<a href="/" className="m-5">
					<p className="text-3xl font-medium">Mindapp</p>
				</a>
			</header>
			<div
				className="h-screen xy"
				style={{
					// backgroundImage: `url(samekomon.svg)`,
					// backgroundSize: '10%',
					backgroundSize: 'cover',
					backgroundRepeat: 'no-repeat',
					backgroundPosition: 'center',
				}}
			>
				<Test />
			</div>
		</main>
	);
}

export default App;
