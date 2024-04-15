import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import ManagePersonas from './pages/ManagePersonas';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Tags from './pages/Tags';
import ThoughtId from './pages/ThoughtId';
import { buildUrl, ping } from './utils/api';
import { Personas, RootSettings, WorkingDirectory } from './utils/settings';
import {
	useDefaultNames,
	useLocalState,
	usePersonas,
	useRootSettings,
	useTagTree,
	useWorkingDirectory,
} from './utils/state';
import { TagTree } from './utils/tags';
import { setTheme } from './utils/theme';
import UnlockPersona from './pages/UnlockPersona';

// const isCenterOnLeft = () => window.screenX + window.innerWidth / 2 <= window.screen.width / 2;

function App() {
	const [localState, localStateSet] = useLocalState();
	const [, tagTreeSet] = useTagTree();
	const [personas, personasSet] = usePersonas();
	const [defaultNames, defaultNamesSet] = useDefaultNames();
	const [rootSettings, rootSettingsSet] = useRootSettings();
	const [, workingDirectorySet] = useWorkingDirectory();
	const themeRef = useRef(localState.theme);

	useEffect(() => {
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
		ping<{ rootSettings: RootSettings; workingDirectory: WorkingDirectory }>(
			buildUrl('get-root-settings'),
		)
			.then(({ rootSettings, workingDirectory }) => {
				rootSettingsSet(rootSettings);
				workingDirectorySet(workingDirectory);
			})
			.catch((err) => alert(JSON.stringify(err)));
		ping<WorkingDirectory>(buildUrl('get-working-directory'))
			.then((data) => workingDirectorySet(data))
			.catch((err) => alert(JSON.stringify(err)));
		ping<TagTree>(buildUrl('get-tag-tree'))
			.then((data) => tagTreeSet(data))
			.catch((err) => alert(JSON.stringify(err)));
		ping<Personas>(buildUrl('get-personas'))
			.then((data) => {
				const activePersona = data.find((p) => p.id === localState.activePersonaId);
				if (!activePersona || activePersona.locked)
					localStateSet({ ...localState, activePersonaId: '' });
				personasSet(data);
			})
			.catch((err) => alert(JSON.stringify(err)));
	}, [rootSettings?.usingDefaultWorkingDirectoryPath]);

	useEffect(() => {
		if (personas) {
			const newDefaultNames = { ...defaultNames };
			personas.forEach((p) => (newDefaultNames[p.id] = p.defaultName));
			defaultNamesSet(defaultNames);
		}
	}, [personas, defaultNames]);

	return (
		<main>
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" Component={Home} />
					<Route path="/search" Component={Search} />
					<Route path="/manage-personas/:personaId?" Component={ManagePersonas} />
					<Route path="/manage-spaces/:spaceId?" Component={null} />
					<Route path="/add-space" Component={null} />
					<Route path="/tags/:tag?" Component={Tags} />
					<Route path="/Settings" Component={Settings} />
					<Route path="/unlock/:personaId" Component={UnlockPersona} />
					<Route path="/thought/:thoughtId" Component={ThoughtId} />
					<Route path="/*" element={<Navigate replace to="/" />} />
				</Routes>
			</BrowserRouter>
		</main>
	);
}

export default App;
