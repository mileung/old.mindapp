import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Search from './pages/Search';
import Settings, { RootSettings, Workspace } from './pages/Settings';
import Tags from './pages/Tags';
import ThoughtId from './pages/ThoughtId';
import { buildUrl, ping } from './utils/api';
import { getLocalState } from './utils/localStorage';
import { usePersona, useRootSettings, useTagTree, useWorkspace } from './utils/state';
import { TagTree } from './utils/tags';
import { setTheme } from './utils/theme';
// import Tables from './pages/Tables';

// const isCenterOnLeft = () => window.screenX + window.innerWidth / 2 <= window.screen.width / 2;

function App() {
	const [, personaSet] = usePersona();
	const [, tagTreeSet] = useTagTree();
	const [rootSettings, rootSettingsSet] = useRootSettings();
	const [, workspaceSet] = useWorkspace();
	const themeRef = useRef(getLocalState().theme);

	useEffect(() => {
		personaSet(null);
		// does not exist on older browsers
		if (window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener) {
			window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener('change', () => {
				setTheme(themeRef.current);
			});
		}
	}, []);

	useEffect(() => {
		if (rootSettings) {
			themeRef.current = rootSettings.theme;
			setTheme(rootSettings.theme);
		}
	}, [rootSettings?.theme]);

	useEffect(() => {
		ping<RootSettings>(buildUrl('get-root-settings'))
			.then((data) => rootSettingsSet(data))
			.catch((err) => alert(JSON.stringify(err)));

		ping<Workspace>(buildUrl('get-workspace'))
			.then((data) => workspaceSet(data))
			.catch((err) => alert(JSON.stringify(err)));

		ping<TagTree>(buildUrl('get-tag-tree'))
			.then((data) => tagTreeSet(data))
			.catch((err) => alert(JSON.stringify(err)));
	}, [rootSettings?.usingDefaultWorkspacePath]);

	return (
		<main>
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" Component={Home} />
					<Route path="/search" Component={Search} />
					{/* <Route path="/Tables" Component={Tables} /> */}
					<Route path="/tags/:tag?" Component={Tags} />
					<Route path="/Settings" Component={Settings} />
					<Route path="/thought/:thoughtId" Component={ThoughtId} />
					<Route path="/*" element={<Navigate replace to="/" />} />
				</Routes>
			</BrowserRouter>
		</main>
	);
}

export default App;
