import { useRef, InputHTMLAttributes, forwardRef } from 'react';

const resize = (node: HTMLInputElement) => {
	node.style.width = 'auto';
	node.style.width = node.scrollWidth + 'px';
};

const InputAutoWidth = forwardRef((props: InputHTMLAttributes<HTMLInputElement>, parentRef) => {
	const internalRef = useRef<null | HTMLInputElement>(null);

	return (
		<input
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
			onChange={() => {
				if (internalRef.current) {
					resize(internalRef.current);
				}
			}}
		/>
	);
});

export default InputAutoWidth;
