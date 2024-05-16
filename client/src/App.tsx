import { useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import ManagePersonas from './pages/ManagePersonas';
import ManageSpaces from './pages/ManageSpaces';
import Search from './pages/Search';
import Settings from './pages/Settings';
import Tags from './pages/Tags';
import ThoughtId from './pages/ThoughtId';
import UnlockPersona from './pages/UnlockPersona';
import { Persona } from './types/PersonasPolyfill';
import { buildUrl, hostedLocally, makeUrl, ping, post } from './utils/api';
import { RootSettings, Space, WorkingDirectory } from './utils/settings';
import {
	getLocalState,
	updateLocalState,
	useFetchedSpaces,
	useLocalState,
	useAuthors,
	usePersonas,
	useRootSettings,
	useSendMessage,
	useTagTree,
	useWorkingDirectory,
	useGetMnemonic,
} from './utils/state';
import { TagTree } from './utils/tags';
import { setTheme } from './utils/theme';
import { Author } from './types/Author';
import { tokenNetwork } from './types/TokenNetwork';

function App() {
	const [localState, localStateSet] = useLocalState();
	const getMnemonic = useGetMnemonic();
	const [, tagTreeSet] = useTagTree();
	const [personas, personasSet] = usePersonas();
	const [fetchedSpaces, fetchedSpacesSet] = useFetchedSpaces();
	const sendMessage = useSendMessage();
	const [authors, authorsSet] = useAuthors();
	const [rootSettings, rootSettingsSet] = useRootSettings();
	const [, workingDirectorySet] = useWorkingDirectory();
	const themeRef = useRef(localState.theme);
	const pinging = useRef<Record<string, boolean>>({});

	const updateFetchedSpaces = useCallback(() => {
		personas[0].spaceHosts.forEach(async (host) => {
			// console.log('updateFetchedSpaces');
			if (host && !pinging.current[host]) {
				pinging.current[host] = true;
				try {
					const { id, name, frozen, walletAddress, writeDate, signature } = personas[0];
					const { space } = await sendMessage<{ space: Omit<Space, 'host'> }>({
						from: id,
						to: buildUrl({ host, path: 'update-space-author' }),
						joinIfNotInSpace: !!id,
						getSpaceInfo: true,
						signedAuthor: !id
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
					// console.log('space:', space);
					if (!id) space.fetchedSelf = new Author({});
					fetchedSpacesSet((old) => ({ ...old, [host]: { host, ...space } }));
				} catch (error) {
					console.log('error:', error);
					fetchedSpacesSet((old) => ({ ...old, [host]: { host, fetchedSelf: null } }));
				} finally {
					setTimeout(() => (pinging.current[host] = false), 0);
				}
			}
		});
	}, [JSON.stringify(personas[0]), sendMessage]);

	useEffect(() => {
		if (!personas[0].id) return;
		if (hostedLocally) {
			ping<TagTree>(
				makeUrl('receive-blocks'), //
				post({ personaId: personas[0].id }),
			).catch((err) => console.error(err));
		} else {
			const mnemonic = getMnemonic(personas[0].id);
			const { walletAddress } = personas[0];
			if (walletAddress && mnemonic) {
				tokenNetwork.receiveBlocks(walletAddress, mnemonic);
			}
		}
	}, [personas[0].id]);

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
				localStateSet((old) => ({ ...old, personas: p }));
			})
			.catch((err) => console.error(err));
	}, [!!rootSettings?.testWorkingDirectory]);

	const runs = useRef(0);
	useEffect(() => {
		if (personas) {
			if (runs.current++ < 0) return;
			updateFetchedSpaces();
		}
	}, [JSON.stringify(personas), updateFetchedSpaces]);

	useEffect(() => {
		authorsSet((old) => {
			personas.forEach((p) => {
				if (p.id && p.name) old[p.id] = { ...old[p.id], ...p };
			});
			return { ...old };
		});
		localStateSet((old) => ({ ...old, personas }));
		if (hostedLocally) {
			// TODO: Only update the persona that has its name changed?
			ping(makeUrl('update-personas'), post({ personas: personas.filter((p) => !p.locked) })) //
				.catch((err) => console.error(err));
		}
	}, [personas]);

	useEffect(() => {
		localStateSet((old) => ({ ...old, fetchedSpaces }));
	}, [fetchedSpaces]);

	useEffect(() => {
		updateLocalState(localState);
	}, [localState]);

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
