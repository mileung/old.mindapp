import logo from '/mindapp-logo.svg';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CogIcon } from '@heroicons/react/24/outline';
import { useTagTree } from './GlobalState';
import { matchSorter } from 'match-sorter';
import { bracketRegex, getTags } from '../pages/Search';
import { useKeyPress } from '../utils/keyboard';

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

export default function Header() {
	// useSpaceId
	// usePersona
	const navigate = useNavigate();
	const [tagTree] = useTagTree();
	const [searchParams] = useSearchParams();
	const searchedKeywords = searchParams.get('q') || '';
	const searchIpt = useRef<HTMLInputElement>(null);
	const searchBtn = useRef<HTMLButtonElement>(null);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const [suggestTags, suggestTagsSet] = useState(false);
	const [searchText, searchTextSet] = useState(searchedKeywords || '');

	const tags = useMemo(() => getTags(searchText), [searchText]);
	const tagFilter = useMemo(
		() => searchText.trim().replace(bracketRegex, '').replace(/\s\s+/g, ' ').trim(),
		[searchText],
	);
	const suggestedTags = useMemo(
		() =>
			matchSorter(
				Object.keys(tagTree?.branchNodes || [])
					.filter((tag) => !tags.includes(tag))
					.concat((tagTree?.leafNodes || []).filter((tag) => !tags.includes(tag))),
				tagFilter,
			),
		[tagTree, tagFilter, tags],
	);

	useEffect(() => {
		searchTextSet(searchedKeywords);
		window.scrollTo(0, 0);
	}, [searchedKeywords]);

	useKeyPress('/', () => {
		const activeElement = document.activeElement!;
		if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
			setTimeout(() => searchIpt.current?.focus(), 0); // setTimeout prevents inputting '/' on focus
		}
	});

	const searchInput = useCallback(
		(newTab = false) => {
			const { value } = searchIpt.current!;
			// console.log('value:', value);
			if (value.trim()) {
				const queryString = new URLSearchParams({ q: value.trim() }).toString();
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
		[navigate],
	);

	const onSearchingBlur = useCallback(() => {
		setTimeout(() => {
			const focusedOnTagOptions =
				document.activeElement === searchBtn.current ||
				tagSuggestionsRefs.current.includes(
					// @ts-ignore
					document.activeElement,
				);
			if (!focusedOnTagOptions && searchIpt.current !== document.activeElement) {
				suggestTagsSet(false);
			}
		}, 0);
	}, []);

	return (
		<>
			<div className="h-12" />
			<header
				className="z-50 fixed top-0 w-full px-3 flex justify-between py-1 h-12 transition-opacity bg-bg1"
				style={{ opacity: 'var(--header-opacity)' }}
				onMouseDown={() => setGlobalCssVariable('header-opacity', '1')}
			>
				<Link to="/" className="fx shrink-0">
					<img src={logo} alt="logo" className="h-7" />
					<p className="ml-2 text-2xl font-black">Mindapp</p>
				</Link>
				<div className="relative mx-2 w-full max-w-3xl">
					<div className="flex h-full">
						<input
							ref={searchIpt}
							value={searchText}
							className="w-full pr-12 h-full text-lg px-2 rounded border-2 transition border-mg1 hover:border-mg2 focus:border-mg2"
							placeholder="Search"
							onFocus={() => suggestTagsSet(true)}
							onBlur={onSearchingBlur}
							onChange={(e) => searchTextSet(e.target.value)}
							onKeyDown={(e) => {
								e.key === 'Escape' && searchIpt.current?.blur();
								e.key === 'Enter' && searchInput(e.metaKey);
								if (e.key === 'ArrowDown') {
									e.preventDefault();
									tagSuggestionsRefs.current[0]?.focus();
								}
							}}
						/>
						<button
							ref={searchBtn}
							className="xy -ml-12 px-2 transition text-fg2 hover:text-fg1"
							onClick={() => searchInput()}
						>
							<MagnifyingGlassIcon className="h-7 w-7" />
						</button>
					</div>
					{suggestTags && (
						<div className="z-20 flex flex-col overflow-scroll rounded mt-0.5 bg-mg1 absolute w-full max-h-56 shadow">
							{suggestedTags.map((tag, i) => {
								return (
									<button
										key={i}
										className="fx px-3 text-xl -outline-offset-2 transition hover:bg-mg2"
										ref={(r) => (tagSuggestionsRefs.current[i] = r)}
										onBlur={onSearchingBlur}
										onMouseDown={(e) => e.preventDefault()}
										onKeyDown={(e) => {
											if (e.key === 'ArrowUp') {
												e.preventDefault();
												!i
													? searchIpt.current?.focus()
													: tagSuggestionsRefs.current[i - 1]?.focus();
											} else if (e.key === 'ArrowDown') {
												e.preventDefault();
												tagSuggestionsRefs.current[i + 1]?.focus();
											} else if (
												!['Control', 'Alt', 'Tab', 'Shift', 'Meta', 'Enter'].includes(e.key)
											) {
												searchIpt.current?.focus();
											}
										}}
										onClick={(e) => {
											e.preventDefault();
											searchTextSet(
												`${searchText.replace(tagFilter, '').trim()} [${tag}] `.trimStart(),
											);
											searchIpt.current!.focus();
											searchIpt.current?.scrollTo({ left: Number.MAX_SAFE_INTEGER });
										}}
									>
										{tag}
									</button>
								);
							})}
						</div>
					)}
				</div>
				<div className="fx">
					<Link to="/settings" className="xy w-10 rounded-full text-fg2 transition hover:text-fg1">
						<CogIcon className="h-7 w-7" />
					</Link>
					<Link to="/tags" className="xy w-10 rounded-full text-fg2 transition hover:text-fg1">
						<TagIcon className="h-7 w-7" />
					</Link>
				</div>
			</header>
		</>
	);
}
