import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GlobalState } from './components/GlobalState';
import Header from './components/Header';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Search from './pages/Search';
import Tags from './pages/Tags';
import ThoughtId from './pages/ThoughtId';

// const isCenterOnLeft = () => window.screenX + window.innerWidth / 2 <= window.screen.width / 2;

function App() {
	return (
		<main>
			<GlobalState />
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" Component={Home} />
					<Route path="/tags" Component={Tags} />
					<Route path="/search" Component={Search} />
					<Route path="/Settings" Component={Settings} />
					<Route path="/:thoughtId" Component={ThoughtId} />
				</Routes>
			</BrowserRouter>
		</main>
	);
}

export default App;
