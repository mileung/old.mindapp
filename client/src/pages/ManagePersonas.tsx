import TextInput, { useTextInputRef } from '../components/TextInput';
import { buildUrl, ping, post } from '../utils/api';
import { Button } from '../components/Button';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useActivePersona, useLocalState, usePersonas } from '../utils/state';
import { Personas } from '../utils/settings';
import DeterministicVisualId from '../components/DeterministicVisualId';
import { shortenString } from '../utils/js';
import {
	CheckIcon,
	DocumentDuplicateIcon,
	LockClosedIcon,
	UserIcon,
} from '@heroicons/react/16/solid';
import { useEffect, useMemo, useState } from 'react';
import UnlockPersona from './UnlockPersona';
import { copyToClipboardAsync } from '../utils/thought';

export default function ManagePersonas() {
	const { personaId } = useParams();
	const navigate = useNavigate();
	const activePersona = useActivePersona();
	const [localState, localStateSet] = useLocalState();
	const [personas, personasSet] = usePersonas();
	const [secrets, secretsSet] = useState('');
	const [changingPw, changingPwSet] = useState(false);
	const selectedPersona = useMemo(
		() => personas?.find((p) => p.id === personaId) || null,
		[personaId, personas],
	);
	const locked = useMemo(() => selectedPersona?.locked, [selectedPersona]);
	const defaultNameIpt = useTextInputRef();
	const mnemonicIpt = useTextInputRef();
	const passwordIpt = useTextInputRef();
	const oldPasswordIpt = useTextInputRef();

	useEffect(() => {
		secretsSet('');
		if (selectedPersona) {
			defaultNameIpt.value = selectedPersona.defaultName;
			passwordIpt.value = '';
		}
	}, [selectedPersona]);

	return (
		personas && (
			<div className="flex">
				<div className="flex-1 relative min-w-40 max-w-56">
					<div className="sticky top-12 h-full p-3 flex flex-col max-h-[calc(100vh-3rem)] overflow-scroll">
						<div className="overflow-scroll border-b border-mg1 mb-1">
							{[...(personas || [])]
								.sort((a, b) =>
									a.defaultName && b.defaultName
										? a.defaultName.toLowerCase().localeCompare(b.defaultName.toLowerCase())
										: a.defaultName
											? -1
											: b.defaultName
												? 1
												: a.id.toLowerCase().localeCompare(b.id.toLowerCase()),
								)
								.map((persona) => {
									return (
										<Link
											key={persona.id}
											to={`/manage-personas/${persona.id}`}
											className={`rounded h-14 fx transition hover:bg-mg1 pl-2 py-1 ${persona.id === personaId ? 'bg-mg1' : 'bg-bg1'}`}
										>
											<div className="h-6 w-6 overflow-hidden rounded-full">
												<DeterministicVisualId input={persona.id} />
											</div>
											<div className="flex-1 mx-2 truncate">
												<p
													className={`text-lg font-semibold leading-5 ${!persona.defaultName && 'text-fg2'} truncate`}
												>
													{persona === null ? 'Anon' : persona.defaultName || 'No name'}
												</p>
												<p className="font-mono text-fg2 leading-5">{shortenString(persona.id)}</p>
											</div>
											<div className="ml-auto mr-1 xy w-5">
												{persona.id === activePersona?.id ? (
													<CheckIcon className="h-5 w-5" />
												) : (
													persona.locked && <LockClosedIcon className="h-4 w-4 text-fg2" />
												)}
											</div>
										</Link>
									);
								})}
						</div>
						<Link
							to={'/manage-personas'}
							className={`rounded h-10 fx transition hover:bg-mg1 px-2 py-1 ${!personaId && 'bg-mg1'}`}
						>
							<div className="h-6 w-6 xy">
								<UserIcon className="h-6 w-6" />
							</div>
							<p className="ml-1.5 text-lg font-semibold">Add persona</p>
						</Link>
					</div>
				</div>
				<div className="flex-1 space-y-3 p-3">
					{selectedPersona ? (
						<>
							{locked ? (
								<>
									<UnlockPersona manage />
								</>
							) : (
								<>
									<div className="fx gap-3">
										<div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full">
											<DeterministicVisualId input={selectedPersona.id} />
										</div>
										<div>
											<p
												className={`font-bold text-2xl ${!selectedPersona.defaultName && 'text-fg2'} `}
											>
												{selectedPersona.defaultName || 'No name'}
											</p>
											<p className="text-lg text-fg2 font-semibold break-all">{personaId}</p>
										</div>
									</div>
									<p className="text-2xl font-semibold mb-1">Public info</p>
									<TextInput
										_ref={defaultNameIpt}
										defaultValue={selectedPersona.defaultName}
										label="Default name"
										placeholder="No name"
										onSubmit={(v) => {
											ping<Personas>(
												buildUrl('update-persona-default-name'),
												post({ personaId, defaultName: v }),
											)
												.then((p) => personasSet(p))
												.catch((err) => alert(JSON.stringify(err)));
										}}
									/>
									<p className="text-2xl font-semibold mb-1">Security</p>
									<Button
										label={changingPw ? 'Keep password' : 'Change password'}
										onClick={() => changingPwSet(!changingPw)}
									/>
									{changingPw && (
										<>
											<TextInput password _ref={oldPasswordIpt} label="Old password" />
											<TextInput
												password
												showCheckX
												label="New password"
												onSubmit={(pw) => {
													ping<{ changed: boolean }>(
														buildUrl('update-persona-password'),
														post({
															personaId,
															oldPassword: oldPasswordIpt.value,
															newPassword: pw,
														}),
													)
														.then(({ changed }) => {
															if (changed) {
																changingPwSet(false);
															} else {
																oldPasswordIpt.error = 'Incorrect password';
															}
														})
														.catch((err) => alert(JSON.stringify(err)));
												}}
											/>
										</>
									)}
									<Button
										label={secrets ? 'Hide secret mnemonic' : 'Show secret mnemonic'}
										onClick={async () => {
											if (secrets) return secretsSet('');
											const pw = prompt(
												`Enter password to show mnemonic for ${selectedPersona.defaultName || 'No name'}`,
											);
											if (pw === null) return false;
											const { mnemonic } = await ping<{ mnemonic: string }>(
												buildUrl('get-persona-mnemonics'),
												post({ personaId, password: pw }),
											);
											secretsSet(mnemonic);
										}}
									/>
									{secrets && (
										<div className="">
											<button
												className="fx text-fg2 transition hover:text-fg1"
												onClick={() => copyToClipboardAsync(secrets)}
											>
												<DocumentDuplicateIcon className="mr-1 w-5" />
												<p className="font-semibold">Copy mnemonic</p>
											</button>
											<div className="grid grid-cols-4 gap-2">
												{secrets.split(' ').map((word, i) => {
													return (
														<p key={i} className="font-medium">
															{i + 1}. {word}
														</p>
													);
												})}
											</div>
										</div>
									)}
									<p className="text-2xl font-semibold mb-1">Danger zone</p>
									<Button
										label="Remove persona"
										onClick={async () => {
											const mnemonic = prompt(
												`Enter mnemonic to remove ${selectedPersona.defaultName || 'No name'}`,
											);
											if (mnemonic === null) return false;
											const { arr } = await ping<{ arr: null | Personas }>(
												buildUrl('delete-persona'),
												post({ personaId, mnemonic }),
											);
											arr ? personasSet(arr) : alert('Invalid mnemonic');
										}}
									/>
								</>
							)}
						</>
					) : (
						<>
							<div className="">
								<p className="font-bold text-2xl">Add a new persona</p>
								<p className="font-semibold text-xl text-fg2">
									A persona is a digital identity other Mindapp users will recognize you by
								</p>
							</div>
							<TextInput
								autoFocus
								_ref={defaultNameIpt}
								label="Default name"
								placeholder="No name"
							/>
							<TextInput password _ref={mnemonicIpt} label="Mnemonic" />
							<TextInput password _ref={passwordIpt} label="Password" />
							<Button
								label="Add persona"
								onClick={() => {
									ping<Personas>(
										buildUrl('add-persona'),
										post({
											password: passwordIpt.value,
											mnemonic: mnemonicIpt.value,
											defaultName: defaultNameIpt.value.trim(),
										}),
									)
										.then((p) => {
											personasSet(p);
											navigate(`/manage-personas/${p[0].id}`);
											localStateSet({ ...localState, activePersonaId: p[0].id });
										})
										.catch((err) => alert(JSON.stringify(err)));
								}}
							/>
						</>
					)}
				</div>
			</div>
		)
	);
}
