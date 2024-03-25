import { useCallback, useEffect, useRef } from 'react';
import { useRootSettings, useWorkspace } from '../utils/state';
import InputAutoWidth from '../components/InputAutoWidth';
import { buildUrl, ping, post } from '../utils/api';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/16/solid';

export type RootSettings = {
	defaultWorkspacePath: string;
	testWorkspacePath: string;
	theme: 'System' | 'Light' | 'Dark';
	usingDefaultWorkspacePath: boolean;
};

export type Workspace = {
	gitSnapshotsEnabled: boolean;
	gitRemoteUrl?: string;
};

export type Persona = {
	preferredName: string;
};

function Button({
	on,
	onClick,
	label,
}: {
	on: boolean;
	onClick: React.MouseEventHandler<HTMLButtonElement>;
	label: string;
}) {
	return (
		<button
			className={`text-lg font-semibold rounded px-2 border-2 transition hover:text-fg1 ${on ? 'text-fg1 border-fg1' : 'text-fg2 border-fg2'}`}
			onClick={onClick}
		>
			{label}
		</button>
	);
}

function InputPicker({
	title,
	options,
	value,
	onSubmit,
}: {
	title: string;
	options: string[];
	value: string;
	onSubmit: (value: string) => void;
}) {
	return (
		<div>
			<p className="leading-4 font-semibold">{title}</p>
			<div className="mt-1.5 fx gap-2">
				{options.map((option) => (
					<Button
						key={option}
						on={value === option}
						onClick={() => onSubmit(option)}
						label={option}
					/>
				))}
			</div>
		</div>
	);
}

function InputSetter({
	title,
	defaultValue,
	onSubmit,
}: {
	title?: string;
	defaultValue: string;
	onSubmit: (value: string) => void;
}) {
	const draft = useRef(defaultValue);
	const autoWidthIpt = useRef<HTMLInputElement>(null);
	const keyDown = useRef(false);

	const updateSetting = useCallback(() => {
		const value = autoWidthIpt.current!.value.trim();
		onSubmit(value);
	}, [onSubmit]);

	useEffect(() => {
		autoWidthIpt.current!.value = defaultValue;
		draft.current = defaultValue;
	}, [defaultValue]);

	return (
		<div>
			{title && <p className="leading-4 text font-semibold">{title}</p>}
			<InputAutoWidth
				ref={autoWidthIpt}
				defaultValue={defaultValue}
				onChange={(e) => (draft.current = e.target.value)}
				placeholder="Enter to submit"
				className="leading-3 min-w-52 border-b-2 text-2xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
				onKeyDown={(e) => {
					keyDown.current = true;
					if (e.key === 'Escape') {
						draft.current = defaultValue;
						autoWidthIpt.current?.blur();
					}
					if (e.key === 'Enter') {
						updateSetting();
						autoWidthIpt.current?.blur();
					}
				}}
				onKeyUp={() => (keyDown.current = true)}
				onBlur={() => (autoWidthIpt.current!.value = draft.current)}
			/>
		</div>
	);
}

export default function Settings() {
	const [rootSettings, rootSettingsSet] = useRootSettings();
	const [workspace, workspaceSet] = useWorkspace();

	const updateRootSettings = useCallback((update: Partial<RootSettings>) => {
		ping<RootSettings>(buildUrl('update-root-settings'), post(update))
			.then((u) => rootSettingsSet(u))
			.catch((err) => alert(JSON.stringify(err)));
	}, []);

	const updateWorkspace = useCallback(
		(update: Partial<Workspace>) => {
			ping<Workspace>(buildUrl('update-workspace'), post(update))
				.then((u) => workspaceSet(u))
				.catch((err) => alert(JSON.stringify(err)));
		},
		[rootSettings?.usingDefaultWorkspacePath],
	);

	// console.log('rootSettings:', rootSettings);
	return (
		rootSettings !== undefined &&
		workspace !== undefined && (
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
								title="Workspace Path"
								options={['Default', 'Test']}
								value={rootSettings.usingDefaultWorkspacePath ? 'Default' : 'Test'}
								// @ts-ignore
								onSubmit={(mode: 'Default' | 'Test') => {
									const usingDefault = mode === 'Default';
									updateRootSettings({ usingDefaultWorkspacePath: usingDefault });
								}}
							/>
							<button
								// disabled={rootSettings.usingDefaultWorkspacePath}
								className="mt-1 fx gap-1 transition text-fg2 hover:text-fg1"
								onClick={() => {
									ping(buildUrl('show-current-workspace'));
								}}
							>
								<p className="leading-7 text-2xl font-medium">
									{rootSettings.usingDefaultWorkspacePath
										? rootSettings.defaultWorkspacePath
										: rootSettings.testWorkspacePath}
								</p>
								<ArrowTopRightOnSquareIcon className="h-6 w-6" />
							</button>
						</div>
					</>
				)}
				<p className="text-2xl font-semibold">Workspace settings</p>
				{!workspace ? (
					<p className="text-2xl font-semibold text-fg2">No workspace found</p>
				) : (
					<>
						<InputPicker
							title="Git snapshots"
							options={['On', 'Off']}
							value={workspace.gitSnapshotsEnabled ? 'On' : 'Off'}
							onSubmit={(v) => updateWorkspace({ gitSnapshotsEnabled: v === 'On' })}
						/>
						<InputSetter
							title="Keybase git url"
							defaultValue={workspace.gitRemoteUrl || ''}
							onSubmit={(v) => updateWorkspace({ gitRemoteUrl: v })}
						/>
					</>
				)}
			</div>
		)
	);
}
