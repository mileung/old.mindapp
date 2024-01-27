import { HashRouter, Link, Route, Routes } from 'react-router-dom';
import IpcListener from './components/IpcListener';
import Preferences from './components/Preferences';
import Home from './components/Home';
import SetUp from './components/SetUp';

const setGlobalCssVariable = (variableName: string, value: string) => {
	document.documentElement.style.setProperty(`--${variableName}`, value);
};

let lastScroll = 0;
let initialScrollUpPosition = 0;
let scrollingDown = true;
window.addEventListener('scroll', () => {
	const currentScroll = window.scrollY;
	if (currentScroll > lastScroll) {
		setGlobalCssVariable('header-opacity', '0.25');
		scrollingDown = true;
	} else {
		if (currentScroll <= 10 || initialScrollUpPosition - currentScroll > 88) {
			setGlobalCssVariable('header-opacity', '1');
		}
		if (scrollingDown) {
			initialScrollUpPosition = currentScroll;
		}
		scrollingDown = false;
	}
	lastScroll = currentScroll <= 0 ? 0 : currentScroll;
});

function App() {
	return (
		<main className="mt-12 min-h-[calc(100vh-3rem)] flex flex-col">
			<HashRouter basename="/">
				<header
					className="z-50 fixed top-0 w-screen xy h-12 transition-opacity"
					style={{ opacity: 'var(--header-opacity)' }}
				>
					<Link to="/" className="fx h-10 overflow-hidden">
						<img src="mindapp-logo.svg" alt="logo" className="h-8" />
						<p className="ml-2 text-3xl font-medium">Mindapp</p>
					</Link>
				</header>
				<IpcListener />
				<Routes>
					<Route path="/" Component={Home} />
					<Route path="/set-up" Component={SetUp} />
					<Route path="/preferences" Component={Preferences} />
				</Routes>
			</HashRouter>
		</main>
	);
}

export default App;
