addEventListener('keydown', (e) => {
	if (
		['µ', 'π'].includes(e.key) && // alt m or alt p
		!['INPUT', 'TEXTAREA'].includes(document.activeElement!.tagName)
	) {
		const popupWidth = 700;
		const popupHeight = 500;
		const thoughtHeadline = (
			window.getSelection()!.toString() ||
			urlSelectors[location.host + location.pathname]?.() ||
			urlSelectors[location.host]?.() ||
			findLargestText()
		).trim();
		const searchParams = new URLSearchParams({
			initialContent: `${thoughtHeadline}\n${location.href}`,
		}).toString();

		window.open(
			`http://localhost:1000/?${searchParams}`,
			'newWindow',
			`width=${popupWidth},height=${popupHeight},top=0,left=${99999999}`,
		);
	}
});

const urlSelectors: Record<string, undefined | (() => string)> = {
	'www.youtube.com/watch': () => {
		// @ts-ignore
		const title = document.querySelector('h1.style-scope.ytd-watch-metadata')?.innerText;
		return title;
	},
	'twitter.com': () => {
		// @ts-ignore
		const tweetText = document.querySelector('[data-testid="tweetText"]').innerText;
		return tweetText;
	},
	// 'www.perplexity.ai/search': () => {
	// 	const copyButton = document.querySelector(
	// 		'div.mt-sm.flex.items-center.justify-between > div.flex.items-center.gap-x-xs > button:nth-child(1)',
	// 	); // @ts-ignore
	// 	copyButton!.click(); // I tried. Doesn't work atm
	// 	return '';
	// },
};

function findLargestText() {
	const elementsWithText = document.querySelectorAll(
		'*:not(script):not(style):not(meta):not(title):not(link):not(br):not(hr):not(area):not(base):not(basefont):not(bgsound):not(col):not(command):not(embed):not(keygen):not(param):not(source):not(track):not(wbr)',
	);
	let largestFontSize = 0;
	let elementWithLargestFontSize: Element | null = null;
	elementsWithText.forEach((element) => {
		const computedStyle = window.getComputedStyle(element);
		const fontSize = parseFloat(computedStyle.fontSize);
		// @ts-ignore
		if (fontSize > largestFontSize && element.innerText?.trim()) {
			largestFontSize = fontSize;
			elementWithLargestFontSize = element;
		}
	});
	// @ts-ignore
	return elementWithLargestFontSize?.innerText;
}
