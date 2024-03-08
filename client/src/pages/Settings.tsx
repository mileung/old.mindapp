import { useCallback, useRef } from 'react';
import { useSettings } from '../components/GlobalState';
import InputAutoWidth from '../components/InputAutoWidth';
import { buildUrl, ping, post } from '../utils/api';

export type Settings = {
	theme: 'System' | 'Light' | 'Dark';
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
			<p className="leading-4 font-semibold">{title}</p>
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
	const autoWidthIpt = useRef<HTMLInputElement>(null);
	const keyDown = useRef(false);

	const updateSetting = useCallback(() => {
		const value = autoWidthIpt.current!.value.trim();
		onSubmit(value);
	}, [onSubmit]);

	return (
		<div>
			<p className="leading-4 text font-semibold">{title}</p>
			<InputAutoWidth
				ref={autoWidthIpt}
				defaultValue={defaultValue}
				placeholder={placeholder}
				className="leading-3 min-w-[15rem] border-b-2 text-2xl font-medium transition border-mg2 hover:border-fg2 focus:border-fg2"
				onKeyDown={(e) => {
					keyDown.current = true;
					e.key === 'Enter' && (updateSetting(), autoWidthIpt.current?.blur());
					e.key === 'Escape' && autoWidthIpt.current?.blur();
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
					title="Theme"
					options={['System', 'Light', 'Dark']}
					value={settings.theme}
					// @ts-ignore // QUESTION how do I change the type of onSubmit for Settings['theme']
					onSubmit={(theme: Settings['theme']) => {
						updateSettings({ theme });
						settingsSet({ ...settings, theme });
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
