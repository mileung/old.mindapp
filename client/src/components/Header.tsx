import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CogIcon } from '@heroicons/react/24/outline';
import { useTags } from './GlobalState';
import { matchSorter } from 'match-sorter';
import { bracketRegex, getTagLabels } from '../pages/Search';
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
	const [tags] = useTags();
	const [searchParams] = useSearchParams();
	const searchedKeywords = searchParams.get('q') || '';
	const searchRef = useRef<HTMLInputElement>(null);
	const magnifyingGlassRef = useRef<HTMLButtonElement>(null);
	const tagSuggestionsRefs = useRef<(null | HTMLButtonElement)[]>([]);
	const [suggestTags, suggestTagsSet] = useState(false);
	const [searchText, searchTextSet] = useState(searchedKeywords || '');

	const tagLabels = useMemo(() => getTagLabels(searchText), [searchText]);
	const tagFilter = useMemo(
		() => searchText.trim().replace(bracketRegex, '').replace(/\s\s+/g, ' ').trim(),
		[searchText],
	);
	const suggestedTags = useMemo(() => {
		return matchSorter(tags?.map((a) => a.label) || [], tagFilter).filter(
			(label) => !tagLabels.includes(label),
		);
	}, [searchText, tags, tagLabels]);

	useEffect(() => {
		searchTextSet(searchedKeywords);
		window.scrollTo(0, 0);
	}, [searchedKeywords]);

	useKeyPress('/', () => {
		const activeElement = document.activeElement!;
		if (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
			setTimeout(() => searchRef.current?.focus(), 0); // setTimeout prevents inputting '/' on focus
		}
	});

	const searchInput = useCallback(
		(newTab = false) => {
			const { value } = searchRef.current!;
			// console.log('value:', value);
			if (value.trim()) {
				const queryString = new URLSearchParams({ q: value.trim() }).toString();
				searchRef.current!.blur();
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

	const onAddingTagBlur = useCallback(() => {
		setTimeout(() => {
			const focusedOnTagOptions =
				document.activeElement === magnifyingGlassRef.current ||
				tagSuggestionsRefs.current.includes(
					// @ts-ignore
					document.activeElement,
				);
			if (!focusedOnTagOptions && searchRef.current !== document.activeElement) {
				suggestTagsSet(false);
			}
		}, 0);
	}, []);

	return (
		<header
			className="z-50 fixed top-0 w-full px-3 flex justify-between py-1 h-12 transition-opacity bg-bg1"
			style={{ opacity: 'var(--header-opacity)' }}
			onMouseDown={() => setGlobalCssVariable('header-opacity', '1')}
		>
			<Link to="/" className="fx shrink-0">
				<img src="mindapp-logo.svg" alt="logo" className="h-7" />
				<p className="ml-2 text-2xl font-black">Mindapp</p>
			</Link>
			<div className="relative mx-2 w-full max-w-3xl">
				<div className="flex h-full">
					<input
						ref={searchRef}
						value={searchText}
						className="w-full pr-12 h-full text-lg px-2 rounded border-2 transition border-mg1 hover:border-mg2 focus:border-mg2"
						placeholder="Search"
						onFocus={() => suggestTagsSet(true)}
						onBlur={onAddingTagBlur}
						onChange={(e) => searchTextSet(e.target.value)}
						onKeyDown={(e) => {
							e.key === 'Escape' && searchRef.current?.blur();
							e.key === 'Enter' && searchInput(e.metaKey);

							if (e.key === 'ArrowDown') {
								e.preventDefault();
								tagSuggestionsRefs.current[0]?.focus();
							}
						}}
					/>
					<button
						ref={magnifyingGlassRef}
						className="xy -ml-12 px-2 transition text-fg2 hover:text-fg1"
						onClick={() => searchInput()}
					>
						<MagnifyingGlassIcon className="h-7 w-7" />
					</button>
				</div>
				{suggestTags && (
					<div className="z-20 flex flex-col overflow-scroll rounded mt-0.5 bg-mg1 absolute w-full max-h-56 shadow">
						{suggestedTags.map((label, i) => {
							return (
								<button
									key={i}
									className="fx px-3 text-xl -outline-offset-2 transition hover:bg-mg2"
									ref={(r) => (tagSuggestionsRefs.current[i] = r)}
									onBlur={onAddingTagBlur}
									onMouseDown={(e) => e.preventDefault()}
									onKeyDown={(e) => {
										e.key === 'Escape' && searchRef.current?.focus();
										if (e.key === 'ArrowUp') {
											e.preventDefault();
											!i ? searchRef.current?.focus() : tagSuggestionsRefs.current[i - 1]?.focus();
										}
										if (e.key === 'ArrowDown') {
											e.preventDefault();
											tagSuggestionsRefs.current[i + 1]?.focus();
										}
									}}
									onClick={(e) => {
										e.preventDefault();
										searchTextSet(
											`${searchText.replace(tagFilter, '').trim()} [${label}] `.trimStart(),
										);
										searchRef.current!.focus();
										searchRef.current?.scrollTo({ left: Number.MAX_SAFE_INTEGER });
									}}
								>
									{label}
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
	);
}
