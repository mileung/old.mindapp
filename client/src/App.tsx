import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import ManagePersonas from './pages/ManagePersonas';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Tags from './pages/Tags';
import ThoughtId from './pages/ThoughtId';
import { buildUrl, hostedLocally, localApiHostname, makeUrl, ping } from './utils/api';
import { Personas, RootSettings, Space, WorkingDirectory } from './utils/settings';
import {
	useNames,
	useLocalState,
	usePersonas,
	useRootSettings,
	useTagTree,
	useWorkingDirectory,
	updateLocalState,
	useSendMessage,
	useSpaces,
} from './utils/state';
import { TagTree } from './utils/tags';
import { setTheme } from './utils/theme';
import UnlockPersona from './pages/UnlockPersona';
import ManageSpaces from './pages/ManageSpaces';

// const isCenterOnLeft = () => window.screenX + window.innerWidth / 2 <= window.screen.width / 2;

function App() {
	const [localState, localStateSet] = useLocalState();
	const [, tagTreeSet] = useTagTree();
	const [personas, personasSet] = usePersonas();
	const [spaces, spacesSet] = useSpaces();
	const sendMessage = useSendMessage();
	const [names, namesSet] = useNames();
	const [rootSettings, rootSettingsSet] = useRootSettings();
	const [, workingDirectorySet] = useWorkingDirectory();
	const themeRef = useRef(localState.theme);
	const pinging = useRef<Record<string, boolean>>({});

	useEffect(() => {
		// does not exist on older browsers
		if (window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener) {
			window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener('change', () => {
				setTheme(themeRef.current);
			});
		}
	}, []);

	useEffect(() => {
		themeRef.current = localState.theme;
		setTheme(localState.theme);
	}, [localState?.theme]);

	useEffect(() => {
		if (hostedLocally) {
			ping<{ rootSettings: RootSettings; workingDirectory: WorkingDirectory }>(
				makeUrl('get-root-settings'),
			)
				.then(({ rootSettings, workingDirectory }) => {
					rootSettingsSet(rootSettings);
					workingDirectorySet(workingDirectory);
				})
				.catch((err) => alert(err));
			ping<WorkingDirectory>(makeUrl('get-working-directory'))
				.then((data) => workingDirectorySet(data))
				.catch((err) => alert(err));
			ping<TagTree>(makeUrl('get-tag-tree'))
				.then((data) => tagTreeSet(data))
				.catch((err) => alert(err));
			ping<Personas>(makeUrl('get-personas'))
				.then((p) => personasSet(p))
				.catch((err) => alert(err));
		} else {
			// TODO: generating personas client side
		}
	}, [rootSettings?.testWorkingDirectory]);

	useEffect(() => {
		if (personas) {
			namesSet((oldDefaultNames) => {
				const newDefaultNames = { ...oldDefaultNames };
				personas.forEach((p) => p.id && p.name && (newDefaultNames[p.id] = p.name));
				return { ...oldDefaultNames, ...newDefaultNames };
			});
			localStateSet((old) => ({
				...old,
				personas,
			}));
		}
	}, [personas]);

	useEffect(() => {
		spacesSet({});
		// namesSet({});
	}, [personas[0].id]);

	useEffect(() => {
		updateLocalState(localState);
	}, [localState]);

	useEffect(() => {
		personas[0].spaceHostnames.forEach(async (hostname) => {
			if (
				hostname &&
				hostname !== localApiHostname &&
				!spaces[hostname] &&
				!pinging.current[hostname]
			) {
				pinging.current[hostname] = true;
				try {
					const { id, name, frozen, walletAddress, writeDate, signature } = personas[0];
					const { space } = await sendMessage<{ space: Omit<Space, 'hostname'> }>({
						from: id,
						to: buildUrl({ hostname, path: 'update-space-persona' }),
						joinIfNotInSpace: !!id,
						getSpaceInfo: true,
						signedSelf: {
							id,
							name,
							frozen,
							walletAddress,
							writeDate,
							signature,
						},
					});
					// console.log('space:', space);
					spacesSet((old) => ({ ...old, [hostname]: { hostname, ...space } }));
				} catch (error) {
					console.log('error:', error);
					spacesSet((old) => ({
						...old,
						[hostname]: { hostname, self: null },
					}));
				} finally {
					pinging.current[hostname] = false;
				}
			}
		});
	}, [personas, spaces, spacesSet, sendMessage]);

	return (
		<main>
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" Component={Home} />
					<Route path="/search" Component={Search} />
					<Route path="/manage-personas/:personaId?" Component={ManagePersonas} />
					<Route path="/manage-spaces/:spaceHostname?" Component={ManageSpaces} />
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
