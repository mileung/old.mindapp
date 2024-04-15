const DeterministicVisualId = ({ input }: { input?: string }) => {
	return (
		<div
			className={`aspect-square h-full w-full`}
			style={{
				backgroundColor: input ? stringToColor(input) : '#ccc',
			}}
		>
			{input && (
				<div
					className="h-[50%] w-[50%]"
					style={{
						rotate: stringToAngle(input),
						transformOrigin: 'bottom right',
					}}
				>
					<div
						className="h-[150%] w-[150%]"
						style={{
							backgroundColor: stringToColor(input.slice(3)),
						}}
					>
						<div
							className="h-[60%] w-[60%]"
							style={{
								backgroundColor: stringToColor(input.slice(6)),
							}}
						></div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DeterministicVisualId;

// https://stackoverflow.com/a/21682946
const stringToColor = (string: string) => {
	let hash = 0;
	for (let i = 0; i < string.length; i++) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash);
		hash = hash & hash;
	}
	const hue = hash % 360;
	// const saturation = 80 + (hash % 20);
	const saturation = 100;
	const lightness = 50;
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

const stringToAngle = (string: string) => {
	let hash = 0;
	for (let i = 0; i < string.length; i++) {
		hash = string.charCodeAt(i) + ((hash << 5) - hash);
		hash = hash & hash;
	}
	return `${hash % 360}deg`;
};
