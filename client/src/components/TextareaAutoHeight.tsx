import { useRef, TextareaHTMLAttributes, forwardRef } from 'react';

const resize = (node: HTMLTextAreaElement) => {
	setTimeout(() => {
		node.style.height = 'auto';
		node.style.height = node.scrollHeight + 'px';
	}, 0);
};

const TextareaAutoHeight = forwardRef(
	(props: TextareaHTMLAttributes<HTMLTextAreaElement>, parentRef) => {
		const internalRef = useRef<null | HTMLTextAreaElement>(null);

		return (
			<textarea
				{...props}
				ref={(ref) => {
					ref && resize(ref);
					internalRef.current = ref;
					if (typeof parentRef === 'function') {
						parentRef(ref);
					} else {
						parentRef && (parentRef.current = ref);
					}
				}}
				// I'm cool with auto height just on mount
				// onChange={() => {
				// 	if (internalRef.current) {
				// 		resize(internalRef.current);
				// 	}
				// }}
			/>
		);
	},
);

export default TextareaAutoHeight;
