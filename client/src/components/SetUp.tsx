export default function SetUp() {
	return (
		<div className="p-4 flex-1 xy">
			<p className="text-4xl">Base directory not found</p>
			<p className="text-xl text-fg2 font-semibold">Locate or create a new folder for your mind</p>
			<button
				className="mt-3 font-medium rounded text-xl transition bg-mg1 hover:bg-mg2 py-1 px-3"
				onClick={async () => {
					// console.log('window.api.openFileSystem:', window.api.openFileSystem);
					// window.api.openFileSystem();
				}}
			>
				Open file system
			</button>
		</div>
	);
}
