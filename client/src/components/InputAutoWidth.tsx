import { useEffect, useRef, InputHTMLAttributes, forwardRef } from 'react';

interface InputAutoWidthProps extends InputHTMLAttributes<HTMLInputElement> {}

const useInputAutoWidth = (ref: React.RefObject<HTMLInputElement>) => {
	useEffect(() => {
		const listener = () => {
			if (ref.current) {
				ref.current.style.width = 'auto';
				ref.current.style.width = ref.current.scrollWidth + 'px';
			}
		};

		if (ref.current) {
			listener();
			ref.current.addEventListener('input', listener);
		}

		return () => {
			if (ref.current) {
				ref.current.removeEventListener('input', listener);
			}
		};
	}, [ref]);
};

const InputAutoWidth = forwardRef((props: InputAutoWidthProps, parentRef) => {
	const ref = parentRef || useRef<HTMLInputElement>(null);
	// @ts-ignore
	useInputAutoWidth(ref);

	// @ts-ignore
	return <input ref={ref} {...props} />;
});

export default InputAutoWidth;
