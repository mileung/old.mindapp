import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MagnifyingGlassIcon, TagIcon } from '@heroicons/react/16/solid';
import { FormEvent, useRef } from 'react';
// import { TagIcon } from '@heroicons/react/24/outline';

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
	const [searchParams] = useSearchParams();
	const searchedKeywords = searchParams.get('search') || '';
	const searchRef = useRef<HTMLInputElement>(null);
	const navigate = useNavigate();

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
			<div className="w-full mx-2 max-w-md flex rounded border-2 border-mg1">
				<input
					ref={searchRef}
					className="w-full h-full text-lg px-2"
					placeholder="Keywords"
					defaultValue={searchedKeywords || ''}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							const { value } = searchRef.current!;
							// console.log('value:', value);
							if (value.trim()) {
								const queryString = new URLSearchParams({ search: value.trim() }).toString();
								navigate(`/results?${queryString}`);
							}
						}
					}}
				/>
				<button className="xy px-2 transition text-fg2 hover:text-fg1" type="submit">
					<MagnifyingGlassIcon className="h-7 w-7" />
				</button>
			</div>
			{/* <Link to="/tags" className="xy h-10 w-10 rounded-full text-fg1 transition hover:bg-mg1"> */}
			<Link to="/tags" className="xy w-10 rounded-full text-fg2 transition hover:text-fg1">
				<TagIcon className="h-7 w-7" />
			</Link>
		</header>
	);
}
