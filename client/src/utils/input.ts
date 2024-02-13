export const onFocus = (e: React.FocusEvent<HTMLTextAreaElement, Element>) => {
	// focuses on the end of the input value
	const tempValue = e.target.value;
	e.target.value = '';
	e.target.value = tempValue;
};
