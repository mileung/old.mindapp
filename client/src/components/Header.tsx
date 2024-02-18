import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useRef } from 'react';

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

function useKeyPress(key: string, callback: () => void) {
	useEffect(() => {
		function handleKeyPress(event: KeyboardEvent) {
			if (event.key === key) {
				callback();
			}
		}

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, [key, callback]);
}

export default function Header() {
	// spaceIdUse
	// personaUse
	const [searchParams] = useSearchParams();
	const searchedKeywords = searchParams.get('q') || '';
	const searchRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

	useEffect(() => {
		searchRef.current!.value = searchedKeywords;
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

	return (
		<header
			className="z-50 px-3 fixed top-0 w-screen flex justify-between py-1 h-12 transition-opacity bg-bg1"
			style={{ opacity: 'var(--header-opacity)' }}
			onMouseDown={() => setGlobalCssVariable('header-opacity', '1')}
		>
			<Link to="/" className="fx shrink-0">
				<img src="mindapp-logo.svg" alt="logo" className="h-7" />
				<p className="ml-2 text-2xl font-black">Mindapp</p>
			</Link>
			<div className="w-full mx-2 max-w-md flex">
				<input
					ref={searchRef}
					className="w-full pr-12 h-full text-lg px-2 rounded border-2 transition border-mg1 focus:border-mg2"
					placeholder="Search"
					defaultValue={searchedKeywords || ''}
					onKeyDown={(e) => {
						e.key === 'Enter' && searchInput(e.metaKey);
						e.key === 'Escape' && searchRef.current?.blur();
					}}
				/>
				<button
					className="xy -ml-12 px-2 transition text-fg2 hover:text-fg1"
					onClick={() => searchInput()}
				>
					<MagnifyingGlassIcon className="h-7 w-7" />
				</button>
			</div>
			<Link to="/tags" className="xy w-10 rounded-full text-fg2 transition hover:text-fg1">
				<TagIcon className="h-7 w-7" />
			</Link>
		</header>
	);
}
