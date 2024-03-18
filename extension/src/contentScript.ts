addEventListener('keydown', (e) => {
	if (
		['µ', 'π'].includes(e.key) && // alt m or alt p
		!['INPUT', 'TEXTAREA'].includes(document.activeElement!.tagName)
	) {
		const popupWidth = 700;
		const popupHeight = 500;
		const selector =
			urlSelectors[location.host + location.pathname]?.() || urlSelectors[location.host]?.();
		const thoughtHeadline = (
			selector?.headline ||
			window.getSelection()!.toString() ||
			findLargestText()
		).trim();
		const searchParams = new URLSearchParams({
			json: JSON.stringify({
				// https://news.ycombinator.com/item?id=31871577
				// 431 Request Header Fields Too Large
				// https://vitejs.dev/guide/troubleshooting.html#_431-request-header-fields-too-large
				// TODO: thoughtHeadline.slice(0, 99999) or something to avoid 431
				initialContent: `${thoughtHeadline}\n${selector?.url || location.href}\n\n`,
				initialTags: selector?.tags,
			}),
		}).toString();

		window.open(
			`http://localhost:1000/?${searchParams}`,
			'newWindow',
			`width=${popupWidth},height=${popupHeight},top=0,left=${99999999}`,
		);
	}
});

const urlSelectors: Record<
	string,
	undefined | (() => { headline: string; url?: string; tags?: string[] })
> = {
	'www.youtube.com/watch': () => {
		// @ts-ignore
		const title: string = document.querySelector('h1.style-scope.ytd-watch-metadata')?.innerText;
		const aTag = document.querySelector(
			'#upload-info .yt-simple-endpoint.style-scope.yt-formatted-string',
		)!;
		const href = aTag.getAttribute('href');
		const author: string = href?.startsWith('/channel/')
			? // @ts-ignore
				aTag.innerText
			: `YouTube${href?.slice(1)!}`;

		const unwantedI = location.href.indexOf('&list=WL');

		return {
			headline: title,
			tags: [author],
			url: unwantedI === -1 ? location.href : location.href.substring(0, unwantedI),
		};
	},
	'www.youtube.com/playlist': () => {
		const author: string = document
			.querySelector('#owner-text > a')!
			.getAttribute('href')
			?.slice(1)!;

		return { headline: findLargestText(), tags: [`YouTube${author}`] };
	},
	'twitter.com': () => {
		// @ts-ignore
		const tweetText = document.querySelector('[data-testid="tweetText"]').innerText;
		let author = location.pathname.slice(1);
		const i = author.indexOf('/');
		if (i !== -1) {
			author = author.slice(0, i);
		}
		return { headline: tweetText, tags: [`Twitter@${author}`] };
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

export {};
