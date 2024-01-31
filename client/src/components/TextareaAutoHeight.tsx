import { useEffect, useRef, TextareaHTMLAttributes } from 'react';

interface TextareaAutoHeightProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const useTextareaAutoHeight = (ref: React.RefObject<HTMLTextAreaElement>) => {
	useEffect(() => {
		const listener = () => {
			if (ref.current) {
				ref.current.style.height = 'auto'; // Set height to auto to get the scrollHeight accurately
				ref.current.style.height = ref.current.scrollHeight + 'px';
				ref.current.style.removeProperty('padding');
			}
		};

		if (ref.current) {
			ref.current.addEventListener('input', listener);
		}

		return () => {
			if (ref.current) {
				ref.current.removeEventListener('input', listener);
			}
		};
	}, [ref]);
};

const TextareaAutoHeight = (props: TextareaAutoHeightProps) => {
	const ref = useRef<HTMLTextAreaElement>(null);
	useTextareaAutoHeight(ref);

	return <textarea ref={ref} {...props} />;
};

export default TextareaAutoHeight;
