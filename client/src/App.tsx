import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Preferences from './pages/Preferences';
import Tags from './pages/Tags';
import Results from './pages/Results';

function App() {
	return (
		<main className="mt-12 min-h-[calc(100vh-3rem)] flex flex-col">
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" Component={Home} />
					<Route path="/tags" Component={Tags} />
					<Route path="/results" Component={Results} />
					<Route path="/preferences" Component={Preferences} />
				</Routes>
			</BrowserRouter>
		</main>
	);
}

export default App;
