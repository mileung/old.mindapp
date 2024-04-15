import { ArrowTopRightOnSquareIcon } from '@heroicons/react/16/solid';
import { useCallback } from 'react';
import { buildUrl, ping, post } from '../utils/api';
import { RootSettings, WorkingDirectory } from '../utils/settings';
import { useRootSettings, useWorkingDirectory } from '../utils/state';
import { InputPicker } from '../components/InputPicker';
import TextInput, { useTextInputRef } from '../components/TextInput';

export default function Settings() {
	const [rootSettings, rootSettingsSet] = useRootSettings();
	const [workingDirectory, workingDirectorySet] = useWorkingDirectory();
	const keybaseGitUrlIpt = useTextInputRef();

	const updateRootSettings = useCallback((update: Partial<RootSettings>) => {
		ping<{ rootSettings: RootSettings; workingDirectory: WorkingDirectory }>(
			buildUrl('update-root-settings'),
			post(update),
		)
			.then(({ rootSettings, workingDirectory }) => {
				rootSettingsSet(rootSettings);
				workingDirectorySet(workingDirectory);
			})
			.catch((err) => alert(JSON.stringify(err)));
	}, []);

	const updateWorkingDirectory = useCallback(
		(update: Partial<WorkingDirectory>) => {
			ping<WorkingDirectory>(buildUrl('update-working-directory'), post(update))
				.then((u) => workingDirectorySet(u))
				.catch((err) => alert(JSON.stringify(err)));
		},
		[rootSettings?.usingDefaultWorkingDirectoryPath],
	);

	return (
		rootSettings !== undefined &&
		workingDirectory !== undefined && (
			<div className="p-3 space-y-3">
				<p className="text-2xl font-semibold">Root settings</p>
				{rootSettings && (
					<>
						<InputPicker
							title="Theme"
							options={['System', 'Light', 'Dark']}
							value={rootSettings.theme}
							// @ts-ignore // QUESTION how do I change the type of onSubmit for Settings['theme']
							onSubmit={(theme: Settings['theme']) => updateRootSettings({ theme })}
						/>
						<div className="">
							<InputPicker
								title="Working directory path"
								options={['Default', 'Test']}
								value={rootSettings.usingDefaultWorkingDirectoryPath ? 'Default' : 'Test'}
								// @ts-ignore
								onSubmit={(mode: 'Default' | 'Test') => {
									const usingDefault = mode === 'Default';
									updateRootSettings({ usingDefaultWorkingDirectoryPath: usingDefault });
								}}
							/>
							{workingDirectory?.dirPath && (
								<button
									// disabled={rootSettings.usingDefaultWorkingDirectoryPath}
									className="mt-1 fx gap-1 transition text-fg2 hover:text-fg1"
									onClick={() => {
										ping(buildUrl('show-working-directory'));
									}}
								>
									<p className="leading-7 text-2xl font-medium">{workingDirectory.dirPath}</p>
									<ArrowTopRightOnSquareIcon className="h-6 w-6" />
								</button>
							)}
						</div>
					</>
				)}
				<p className="text-2xl font-semibold">Working directory settings</p>
				{workingDirectory === null ? (
					<p className="text-2xl font-semibold text-fg2">No working directory found</p>
				) : (
					<>
						<InputPicker
							title="Git snapshots for thoughts and tags"
							options={['On', 'Off']}
							value={workingDirectory.gitSnapshotsEnabled ? 'On' : 'Off'}
							onSubmit={(v) => updateWorkingDirectory({ gitSnapshotsEnabled: v === 'On' })}
						/>
						<TextInput
							label="Keybase git url"
							_ref={keybaseGitUrlIpt}
							defaultValue={workingDirectory.gitRemoteUrl || ''}
							onSubmit={(v) => updateWorkingDirectory({ gitRemoteUrl: v })}
						/>
					</>
				)}
			</div>
		)
	);
}
