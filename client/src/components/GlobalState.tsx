'use client';

import { systemThemeIsDark, toggleDarkMode } from '@/utils/theme';
import { atom, useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { useEffect } from 'react';

export const atomUserId = atom<string | null>(null);
export const useUserId = () => useAtom(atomUserId);

export const atomCvIndex = atom<number | null>(null);
export const useCvIndex = () => useAtom(atomCvIndex);

export const atomOldCachedCvId = atom<string | null>(null);
export const useOldCachedCvId = () => useAtom(atomOldCachedCvId);

export const atomCvs = atom<
	| {
			id: string;
			md_content: string;
	  }[]
	| null
>(null);
export const useCvs = () => useAtom(atomCvs);

type Props = {
	userId?: string;
};

export default function GlobalState({ userId }: Props) {
	useHydrateAtoms([
		[atomUserId, userId || null],
		// [anotherAtom, anotherValue],
	]);

	useEffect(() => {
		if (!localStorage.theme) {
			localStorage.theme = 'system';
		}

		if (localStorage.theme === 'dark' || (localStorage.theme === 'system' && systemThemeIsDark())) {
			toggleDarkMode(true);
		} else {
			toggleDarkMode(false);
		}

		// does not exist on older browsers
		if (window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener) {
			window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener('change', (e) => {
				if (localStorage.theme === 'system') {
					if (e.matches) {
						toggleDarkMode(true);
					} else {
						toggleDarkMode(false);
					}
				}
			});
		}
	}, []);

	return null;
}
