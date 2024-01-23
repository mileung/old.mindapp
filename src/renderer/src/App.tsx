import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import Test from './components/Test';

function App() {
	return (
		<main className="">
			<HashRouter basename="/">
				<header className="z-50 absolute top-0 w-screen fx justify-between">
					<Link to="/" className="m-5 fx">
						<img src="mindapp-logo.svg" alt="logo" className="h-8" />
						<p className="ml-2 text-3xl font-medium">Mindapp</p>
					</Link>
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
					<Routes>
						<Route path="/" Component={Test} />
					</Routes>
				</div>
			</HashRouter>
		</main>
	);
}

export default App;
