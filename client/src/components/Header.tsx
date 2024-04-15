import logo from '/mindapp-logo.svg';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
	MagnifyingGlassIcon,
	UserGroupIcon,
	TagIcon,
	Square2StackIcon,
	LockClosedIcon,
	CheckIcon,
	EllipsisHorizontalIcon,
} from '@heroicons/react/16/solid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CogIcon } from '@heroicons/react/24/outline';
import {
	useActivePersona,
	useActiveSpace,
	useLastUsedTags,
	useLocalState,
	usePersonas,
	useRootSettings,
	useTagTree,
} from '../utils/state';
import { matchSorter } from 'match-sorter';
import { useKeyPress } from '../utils/keyboard';
import { bracketRegex, getNodes, getNodesArr, getTags } from '../utils/tags';
import DeterministicVisualId from './DeterministicVisualId';
import { buildUrl, ping, post } from '../utils/api';
import { shortenString } from '../utils/js';
import { Personas } from '../utils/settings';

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
		// setGlobalCssVariable('header-opacity', '0.0000000001');
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

export default function Header() {
	const location = useLocation();
	const [localState, localStateSet] = useLocalState();
	const [personas, personasSet] = usePersonas();
	const activeSpace = useActiveSpace();
	const activePersona = useActivePersona();
	const [rootSettings] = useRootSettings();
	const navigate = useNavigate();
	const [tagTree] = useTagTree();
	const [searchParams] = useSearchParams();
	const [lastUsedTags, lastUsedTagsSet] = useLastUsedTags();
	const searchedKeywords = searchParams.get('q') || '';
	const searchIpt = useRef<HTMLInputElement>(null);
	const searchBtn = useRef<HTMLButtonElement>(null);
	const gearLnk = useRef<HTMLAnchorElement>(null);
	const spaceBtn = useRef<HTMLButtonElement>(null);
	const personaBtn = useRef<HTMLButtonElement>(null);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const [suggestTags, suggestTagsSet] = useState(false);
	const [switchingSpaces, switchingSpacesSet] = useState(false);
	const [switchingPersonas, switchingPersonasSet] = useState(false);
	const [searchText, searchTextSet] = useState('');
	const [tagIndex, tagIndexSet] = useState<number>(0);
	const tags = useMemo(() => getTags(searchText), [searchText]);
	const tagFilter = useMemo(
		() => searchText.trim().replace(bracketRegex, '').replace(/\s\s+/g, ' ').trim(),
		[searchText],
	);
	const nodesArr = useMemo(() => tagTree && getNodesArr(getNodes(tagTree)), [tagTree]);
	const suggestedTags = useMemo(() => {
		if (!nodesArr || !suggestTags) return [];
		let arr = matchSorter(nodesArr, tagFilter);
		!tagFilter.trim() && arr.unshift(...lastUsedTags);
		arr = [...new Set(arr)].filter((tag) => !tags.includes(tag));
		return arr;
	}, [nodesArr, suggestTags, tagFilter, lastUsedTags, tags]);

	useEffect(() => {
		searchTextSet((searchedKeywords + ' ').trimStart());
		window.scrollTo(0, 0);
	}, [searchedKeywords]);

	useKeyPress(
		'/',
		() => {
			const activeElement = document.activeElement!;
			if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
				setTimeout(() => searchIpt.current?.focus(), 0); // setTimeout prevents inputting '/' on focus
			}
		},
		[],
	);

	const searchInput = useCallback(
		(newTab = false) => {
			const q = searchText.trim();
			if (q) {
				const queryString = new URLSearchParams({ q }).toString();
				searchIpt.current!.blur();
				setTimeout(() => {
					if (newTab) {
						window.open(`/search?${queryString}`, '_blank');
					} else {
						navigate(`/search?${queryString}`);
					}
				}, 0);
				// setTimeout prevents search from adding new line to contentTextarea on enter
			}
		},
		[searchText, navigate],
	);

	const addTagToSearchInput = useCallback(
		(tag: string) => {
			tagIndexSet(-1);
			lastUsedTagsSet([tag, ...lastUsedTags]);
			searchTextSet(
				`${searchText
					.replace(/\s\s+/g, ' ')
					.trim()
					.replace(new RegExp(tagFilter + '$'), '')
					.trim()} [${tag}] `.trimStart(),
			);
			setTimeout(() => searchIpt.current?.scrollTo({ left: Number.MAX_SAFE_INTEGER }), 0);
		},
		[searchText, tagFilter],
	);

	const onSwitchingBlur = useCallback(() => {
		setTimeout(() => {
			if (
				document.activeElement !== spaceBtn.current &&
				document.activeElement !== personaBtn.current
			) {
				switchingPersonasSet(false);
				switchingSpacesSet(false);
			}
		}, 0);
	}, []);

	return (
		<>
			<div className="h-12" />
			{personas && (
				<header
					className="z-50 fixed top-0 w-full px-3 flex justify-between py-1 h-12 transition-opacity bg-bg1"
					style={{ opacity: 'var(--header-opacity)' }}
					onMouseMove={() => setGlobalCssVariable('header-opacity', '1')}
				>
					<Link to="/" className="fx shrink-0">
						<img
							src={logo}
							alt="logo"
							className={`h-7 ${!rootSettings?.usingDefaultWorkingDirectoryPath && 'grayscale'}`}
						/>
						<p className="ml-2 text-2xl font-black">Mindapp</p>
					</Link>
					<div className="relative mx-2 w-full max-w-3xl">
						<div className="flex h-full">
							<input
								ref={searchIpt}
								value={searchText}
								className="w-full pr-12 h-full text-lg px-2 rounded border-2 transition border-mg1 hover:border-mg2 focus:border-mg2"
								placeholder="Search"
								onFocus={() => {
									suggestTagsSet(true);
									tagIndexSet(0);
								}}
								onBlur={() => {
									document.activeElement !== searchBtn.current && suggestTagsSet(false);
								}}
								onChange={(e) => {
									suggestTagsSet(true);
									tagIndexSet(0);
									searchTextSet(e.target.value);
								}}
								onKeyDown={(e) => {
									e.key === 'Escape' &&
										(suggestTags ? suggestTagsSet(false) : searchIpt.current?.blur());
									e.key === 'Tab' && !e.shiftKey && suggestTagsSet(false);
									if (e.key === 'Enter') {
										if (suggestedTags[tagIndex]) {
											addTagToSearchInput(suggestedTags[tagIndex]);
										} else {
											searchInput(e.metaKey);
										}
									}
									if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && suggestedTags) {
										e.preventDefault();
										const index = Math.min(
											Math.max(tagIndex + (e.key === 'ArrowUp' ? -1 : 1), -1),
											suggestedTags.length - 1,
										);
										tagSuggestionsRefs.current[index]?.focus();
										searchIpt.current?.focus();
										tagIndexSet(index);
									}
								}}
							/>
							<button
								ref={searchBtn}
								className="xy -ml-12 w-12 px-2 rounded transition text-fg2 hover:text-fg1"
								onClick={(e) => searchInput(e.metaKey)}
							>
								<MagnifyingGlassIcon className="h-7 w-7" />
							</button>
						</div>
						{suggestTags && (
							<div className="z-20 flex flex-col overflow-scroll rounded mt-0.5 absolute w-full max-h-56 shadow">
								{suggestedTags.map((tag, i) => {
									return (
										<button
											key={i}
											className={`fx px-3 text-xl hover:bg-mg2 ${tagIndex === i ? 'bg-mg2' : 'bg-mg1'}`}
											ref={(r) => (tagSuggestionsRefs.current[i] = r)}
											onMouseDown={(e) => e.preventDefault()}
											onClick={() => addTagToSearchInput(tag)}
										>
											<p className="truncate">{tag}</p>
										</button>
									);
								})}
							</div>
						)}
					</div>
					<div className="fx">
						<Link to="/tags" className="xy w-10 text-fg2 transition hover:text-fg1">
							<TagIcon className="h-7 w-7" />
						</Link>
						<Link
							ref={gearLnk}
							to="/settings"
							className="xy w-10 text-fg2 transition hover:text-fg1"
						>
							<CogIcon className="h-7 w-7" />
						</Link>
						<div className="mr-2 border-l-2 border-mg2 h-8"></div>
						<button
							ref={spaceBtn}
							className="h-8 w-8 xy"
							onBlur={onSwitchingBlur}
							onClick={() => {
								switchingPersonasSet(false);
								switchingSpacesSet(!switchingSpaces);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Escape') {
									switchingPersonasSet(false);
									switchingSpacesSet(false);
								}
							}}
						>
							<div className="rounded overflow-hidden h-7 w-7">
								<DeterministicVisualId input={activeSpace?.id} />
							</div>
						</button>
						<button
							ref={personaBtn}
							className="ml-2 h-8 w-8 xy"
							onBlur={onSwitchingBlur}
							onClick={() => {
								switchingSpacesSet(false);
								switchingPersonasSet(!switchingPersonas);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Escape') {
									switchingPersonasSet(false);
									switchingSpacesSet(false);
								}
							}}
						>
							<div className="rounded-full overflow-hidden h-7 w-7">
								<DeterministicVisualId input={activePersona?.id} />
							</div>
						</button>
					</div>
					{(switchingSpaces || switchingPersonas) && (
						<div
							className={`absolute shadow rounded h-fit overflow-hidden top-12 bg-mg1 ${switchingSpaces ? 'right-12' : 'right-2'} mr-1`}
						>
							<div className="max-h-48 overflow-scroll">
								{[null, ...((switchingSpaces ? activePersona?.spaces || [] : personas) || [])].map(
									(thing, i) => {
										return (
											// activePersona?.id !== thing?.id && (
											<div className="flex transition hover:bg-mg2" key={i}>
												<button
													onMouseDown={(e) => e.preventDefault()}
													className="w-44 pl-2 pr-1.5 h-11 fx"
													onClick={() => {
														switchingSpacesSet(false);
														switchingPersonasSet(false);
														// @ts-ignore
														if (thing?.locked) {
															return navigate(`/unlock/${thing.id}`);
														}
														switchingSpaces
															? localStateSet({ ...localState, activeSpaceId: thing?.id || '' })
															: localStateSet({
																	...localState,
																	activePersonaId: thing?.id || '',
																});
														thing?.id &&
															ping<Personas>(
																buildUrl('set-first-persona-or-space'),
																post(
																	switchingSpaces
																		? { personaId: activePersona?.id, spaceId: thing!.id }
																		: { personaId: thing?.id },
																),
															)
																.then((data) => personasSet(data))
																.catch((err) => alert(JSON.stringify(err)));
													}}
												>
													<div
														className={`h-6 w-6 overflow-hidden ${switchingSpaces ? 'rounded' : 'rounded-full'}`}
													>
														<DeterministicVisualId input={thing?.id} />
													</div>
													<div className="flex-1 ml-1.5 mr-2 truncate">
														<p
															className={`max-w-full text-left text-lg font-semibold leading-5  ${!thing?.defaultName && 'text-fg2'} truncate`}
														>
															{thing === null
																? switchingSpaces
																	? 'Local'
																	: 'Anon'
																: thing?.defaultName || 'No name'}
														</p>
														{thing?.id && (
															<p className="text-left font-mono text-fg2 leading-5">
																{shortenString(thing.id)}
															</p>
														)}
													</div>
												</button>

												{thing?.id && (
													<Link
														className="xy w-8 group relative"
														to={`/manage-personas/${thing.id}`}
														onMouseDown={(e) => e.preventDefault()}
														onClick={() => {
															switchingSpacesSet(false);
															switchingPersonasSet(false);
														}}
													>
														{thing?.id === (switchingSpaces ? activeSpace : activePersona)?.id ? (
															<CheckIcon className="h-5 w-5" />
														) : (
															// @ts-ignore
															thing?.locked && <LockClosedIcon className="h-4 w-4 text-fg2" />
														)}
														<div className="bg-mg2 opacity-0 transition hover:opacity-100 absolute xy inset-0">
															<EllipsisHorizontalIcon className="h-5 w-5" />
														</div>
													</Link>
												)}
											</div>
										);
									},
								)}
							</div>
							<Link
								to={switchingSpaces ? '/manage-spaces' : '/manage-personas'}
								className="border-t border-mg2 h-10 fx transition hover:bg-mg2 px-2 py-1"
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => {
									switchingSpacesSet(false);
									switchingPersonasSet(false);
								}}
							>
								<div className="h-6 w-6 xy">
									{switchingSpaces ? (
										<Square2StackIcon className="h-6 w-6" />
									) : (
										<UserGroupIcon className="h-6 w-6" />
									)}
								</div>
								<p className="ml-1.5 text-lg font-medium">
									Manage {switchingSpaces ? 'spaces' : 'personas'}
								</p>
							</Link>
							{!switchingSpaces && (
								<button
									className="w-full border-t border-mg2 h-10 fx transition hover:bg-mg2 px-2 py-1"
									onMouseDown={(e) => e.preventDefault()}
									onClick={() => {
										switchingSpacesSet(false);
										switchingPersonasSet(false);
										navigate('/');
										ping<Personas>(buildUrl('lock-all-personas'))
											.then((data) => personasSet(data))
											.catch((err) => alert(JSON.stringify(err)));
									}}
								>
									<div className="h-6 w-6 xy">
										<LockClosedIcon className="h-6 w-6" />
									</div>
									<p className="ml-1.5 text-lg font-medium">Lock all personas</p>
								</button>
							)}
						</div>
					)}
				</header>
			)}
		</>
	);
}
