import { useCallback, useRef } from 'react';
import { useSettings } from '../components/GlobalState';
import InputAutoWidth from '../components/InputAutoWidth';
import { buildUrl, ping, post } from '../utils/api';

export type Settings = {
	themeMode: string;
	gitSnapshotsEnabled: boolean;
	gitRemoteUrl: null | string;
	preferredName: string;
	developerMode: boolean;
};

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
			<p className="leading-4 text font-semibold">{title}</p>
			<div className="mt-1.5 fx gap-2">
				{options.map((option) => (
					<button
						key={option}
						className={`text-lg font-semibold rounded px-2 border-2 transition hover:text-fg1 ${value === option ? 'text-fg1 border-fg1' : 'text-fg2 border-fg2'}`}
						onClick={() => onSubmit(option)}
					>
						{option}
					</button>
				))}
			</div>
		</div>
	);
}

function InputSetter({
	title,
	placeholder,
	defaultValue,
	onSubmit,
}: {
	title: string;
	placeholder: string;
	defaultValue: string;
	onSubmit: (value: string) => void;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const keyDown = useRef(false);

	const updateSetting = useCallback(() => {
		const value = inputRef.current!.value.trim();
		onSubmit(value);
	}, [onSubmit]);

	return (
		<div>
			<p className="leading-4 text font-semibold">{title}</p>
			<InputAutoWidth
				ref={inputRef}
				defaultValue={defaultValue}
				size={1}
				placeholder={placeholder}
				className="leading-3 min-w-[15rem] border-b-2 text-2xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
				onKeyDown={(e) => {
					keyDown.current = true;
					e.key === 'Enter' && (updateSetting(), inputRef.current?.blur());
					e.key === 'Escape' && inputRef.current?.blur();
				}}
				onKeyUp={() => (keyDown.current = true)}
				onBlur={() => !keyDown.current && updateSetting()}
			/>
		</div>
	);
}

export default function Settings() {
	const [settings, settingsSet] = useSettings();

	const updateSettings = useCallback(
		(update: Partial<Settings>) => {
			ping<Settings>(buildUrl('update-settings'), post(update)).catch((err) =>
				alert(JSON.stringify(err)),
			);
		},
		[settings],
	);

	return (
		settings && (
			<div className="p-3 space-y-3">
				<InputPicker
					title="Theme mode"
					options={['System', 'Light', 'Dark']}
					value={settings.themeMode}
					onSubmit={(v) => {
						updateSettings({ themeMode: v });
						settingsSet({ ...settings, themeMode: v });
					}}
				/>
				<InputPicker
					title="Git snapshots"
					options={['Off', 'On']}
					value={settings.gitSnapshotsEnabled ? 'On' : 'Off'}
					onSubmit={(v) => {
						updateSettings({ gitSnapshotsEnabled: v === 'On' });
						settingsSet({ ...settings, gitSnapshotsEnabled: v === 'On' });
					}}
				/>
				<InputSetter
					title="Keybase git url"
					placeholder="Keybase git url"
					defaultValue={settings.gitRemoteUrl || ''}
					onSubmit={(v) => updateSettings({ gitRemoteUrl: v })}
				/>
				{/* <InputPicker
					title="Developer mode"
					options={['Off', 'On']}
					value={settings.developerMode ? 'On' : 'Off'}
					onSubmit={(v) => {
						updateSettings({ developerMode: v === 'On' });
						settingsSet({ ...settings, developerMode: v === 'On' });
					}}
				/> */}
				{/* <p className="mt-3 leading-4 text font-semibold">{'Preferred name'}</p>
			<InputSetter
				placeholder="No name"
				defaultValue={settings.preferredName}
				onSubmit={(v) => updateSettings({ preferredName: v })}
			/> */}
			</div>
		)
	);
}
