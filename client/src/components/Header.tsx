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
	const gearLnk = useRef<HTMLAnchorElement>(null);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const [suggestTags, suggestTagsSet] = useState(false);
	const [searchText, searchTextSet] = useState('');
	const [tagIndex, tagIndexSet] = useState<number>(-1);
	const tags = useMemo(() => getTags(searchText), [searchText]);
	const tagFilter = useMemo(() => {
		const filter = searchText.trim().replace(bracketRegex, '').replace(/\s\s+/g, ' ').trim();
		tagIndexSet(-1);
		return filter;
	}, [searchText]);
	const suggestedTags = useMemo(() => {
		let arr = matchSorter(
			Object.keys(tagTree?.branchNodes || {}).concat(tagTree?.leafNodes || []),
			tagFilter,
		);
		arr = [...new Set(arr)].filter((tag) => !tags.includes(tag));
		return arr;
	}, [tagTree, tagFilter, tags]);

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
			const { value } = searchIpt.current!;
			const q = value.trimStart();
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
		[navigate],
	);

	const addTagToSearchInput = useCallback(
		(tag: string) => {
			tagIndexSet(-1);
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
							onFocus={() => {
								suggestTagsSet(true);
								tagIndexSet(-1);
							}}
							onBlur={() => {
								document.activeElement !== searchBtn.current && suggestTagsSet(false);
							}}
							onChange={(e) => {
								suggestTagsSet(true);
								searchTextSet(e.target.value);
							}}
							onKeyDown={(e) => {
								e.key === 'Escape' &&
									(suggestTags ? suggestTagsSet(false) : searchIpt.current?.blur());
								e.key === 'Tab' && !e.shiftKey && suggestTagsSet(false);
								if (e.key === 'Enter') {
									if (!suggestTags || !suggestedTags.length || tagIndex === -1) {
										searchInput(e.metaKey);
									} else {
										addTagToSearchInput(suggestedTags[tagIndex]);
									}
								}
								if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
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
					<Link ref={gearLnk} to="/settings" className="xy w-10 text-fg2 transition hover:text-fg1">
						<CogIcon className="h-7 w-7" />
					</Link>
					<Link to="/tags" className="xy w-10 text-fg2 transition hover:text-fg1">
						<TagIcon className="h-7 w-7" />
					</Link>
				</div>
			</header>
		</>
	);
}
