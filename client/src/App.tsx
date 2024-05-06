import { useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import ManagePersonas from './pages/ManagePersonas';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Tags from './pages/Tags';
import ThoughtId from './pages/ThoughtId';
import { buildUrl, hostedLocally, localApiHost, makeUrl, ping, post } from './utils/api';
import { RootSettings, Space, WorkingDirectory } from './utils/settings';
import {
	useNames,
	useLocalState,
	usePersonas,
	useRootSettings,
	useTagTree,
	useWorkingDirectory,
	updateLocalState,
	useSendMessage,
	useFetchedSpaces,
	getLocalState,
} from './utils/state';
import { TagTree } from './utils/tags';
import { setTheme } from './utils/theme';
import UnlockPersona from './pages/UnlockPersona';
import ManageSpaces from './pages/ManageSpaces';
import { Persona } from './types/PersonasPolyfill';
import { decrypt } from './utils/security';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

function App() {
	const [localState, localStateSet] = useLocalState();
	const [, tagTreeSet] = useTagTree();
	const [personas, personasSet] = usePersonas();
	const [fetchedSpaces, fetchedSpacesSet] = useFetchedSpaces();
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
		if (!hostedLocally) return;
		ping<{ rootSettings: RootSettings; workingDirectory: WorkingDirectory }>(
			makeUrl('get-root-settings'),
		)
			.then(({ rootSettings, workingDirectory }) => {
				rootSettingsSet(rootSettings);
				workingDirectorySet(workingDirectory);
			})
			.catch((err) => console.error(err));
		ping<WorkingDirectory>(makeUrl('get-working-directory'))
			.then((data) => workingDirectorySet(data))
			.catch((err) => console.error(err));
		ping<TagTree>(makeUrl('get-tag-tree'))
			.then((data) => tagTreeSet(data))
			.catch((err) => console.error(err));
		ping<Persona[]>(
			makeUrl('get-personas'),
			post({
				order: getLocalState().personas.map(({ id }) => id),
			}),
		)
			.then((p) => {
				// console.log('p:', p);
				personasSet(p);
			})
			.catch((err) => console.error(err));
	}, [!!rootSettings?.testWorkingDirectory]);

	useEffect(() => {
		if (personas) {
			if (hostedLocally) {
				ping(makeUrl('update-personas'), post({ personas })) //
					.catch((err) => console.error(err));
			}
			namesSet((oldDefaultNames) => {
				const newDefaultNames = { ...oldDefaultNames };
				personas.forEach((p) => p.id && p.name && (newDefaultNames[p.id] = p.name));
				return { ...oldDefaultNames, ...newDefaultNames };
			});
			localStateSet((old) => ({ ...old, personas }));
		}
	}, [JSON.stringify(personas)]);

	useEffect(() => {
		fetchedSpacesSet((old) => {
			Object.entries(old).forEach(([key, val]) => {
				old[key] = { ...val, fetchedSelf: undefined };
			});
			return { ...old };
		});
	}, [personas[0].id]);

	useEffect(() => {
		updateLocalState(localState);
	}, [localState]);

	useEffect(() => {
		personas[0].spaceHosts.forEach(async (host) => {
			if (
				//
				host &&
				fetchedSpaces[host]?.fetchedSelf === undefined &&
				!pinging.current[host]
			) {
				pinging.current[host] = true;
				try {
					const { id, name, frozen, walletAddress, writeDate, signature } = personas[0];
					console.log('host:', host);
					const { space } = await sendMessage<{ space: Omit<Space, 'host'> }>({
						from: id,
						to: buildUrl({ host, path: 'update-space-persona' }),
						joinIfNotInSpace: !!id,
						getSpaceInfo: true,
						signedSelf: !id
							? undefined
							: {
									id,
									name,
									frozen,
									walletAddress,
									writeDate,
									signature,
								},
					});
					console.log('space:', space);
					if (!id) {
						space.fetchedSelf = { id: '', writeDate: 0, addDate: 0, signature: `` };
					}
					fetchedSpacesSet((old) => ({ ...old, [host]: { host, ...space } }));
				} catch (error) {
					console.log('error:', error);
					fetchedSpacesSet((old) => ({ ...old, [host]: { host, fetchedSelf: null } }));
				} finally {
					setTimeout(() => (pinging.current[host] = false), 0);
				}
			}
		});
	}, [personas, fetchedSpaces, sendMessage]);

	return (
		<main>
			<BrowserRouter>
				<Header />
				<Routes>
					<Route path="/" Component={Home} />
					<Route path="/search" Component={Search} />
					<Route path="/manage-personas/:personaId?" Component={ManagePersonas} />
					<Route path="/manage-spaces/:spaceHost?" Component={ManageSpaces} />
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
