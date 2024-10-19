import Results from './Results';

export default function Home() {
	return (
		<div className="flex p-1.5 sm:p-3 max-w-[100vw] b">
			<Results />
			<div className="">{/* TODO: tag-tree */}</div>
		</div>
	);
}
