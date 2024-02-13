import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GlobalState } from './components/GlobalState';
import Header from './components/Header';
import Home from './pages/Home';
import Preferences from './pages/Preferences';
import Search from './pages/Search';
import Tags from './pages/Tags';

function App() {
	return (
		<main className="mt-12 min-h-[calc(100vh-3rem)] flex flex-col">
			<GlobalState />
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" Component={Home} />
					<Route path="/tags" Component={Tags} />
					<Route path="/search" Component={Search} />
					<Route path="/preferences" Component={Preferences} />
				</Routes>
			</BrowserRouter>
		</main>
	);
}

export default App;
