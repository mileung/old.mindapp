import {
	CheckIcon,
	DocumentDuplicateIcon,
	LockClosedIcon,
	UserIcon,
} from '@heroicons/react/16/solid';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import DeterministicVisualId from '../components/DeterministicVisualId';
import TextInput, { useTextInputRef } from '../components/TextInput';
import { hostedLocally, makeUrl, ping, post } from '../utils/api';
import { copyToClipboardAsync, shortenString } from '../utils/js';
import { wallet } from '@vite/vitejs/es5';
import {
	defaultSpaceHost,
	useFetchedSpaces,
	useGetSignature,
	usePersonas,
	useSendMessage,
} from '../utils/state';
import UnlockPersona from './UnlockPersona';
import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { createKeyPair, decrypt, encrypt, signItem } from '../utils/security';
import { SignedSelf, UnsignedSelf } from '../types/PersonasPolyfill';
import { LabelVal } from '../components/LabelVal';

export default function ManagePersonas() {
	const { personaId } = useParams();
	const [personas, personasSet] = usePersonas();
	const sendMessage = useSendMessage();
	const getSignature = useGetSignature();
	const [, fetchedSpacesSet] = useFetchedSpaces();
	const navigate = useNavigate();
	const [secrets, secretsSet] = useState('');
	const [changingPw, changingPwSet] = useState(false);
	const selectedPersona = useMemo(
		() => personas.find((p) => p.id === personaId),
		[personaId, personas],
	);
	const locked = useMemo(() => !selectedPersona?.mnemonic, [selectedPersona]);
	const frozen = useMemo(() => selectedPersona?.frozen, [selectedPersona]);
	const nameIpt = useTextInputRef();
	const mnemonicIpt = useTextInputRef();
	const passwordIpt = useTextInputRef();
	const oldPasswordIpt = useTextInputRef();

	useEffect(() => {
		secretsSet('');
		if (selectedPersona) {
			nameIpt.value = selectedPersona.name || '';
			passwordIpt.value = '';
		}
	}, [selectedPersona]);

	// const updateSelectedPersona = useCallback(
	// 	async (updates: { name?: string; frozen?: true }) => {
	// 		if (!selectedPersona) return;
	// 		if (hostedLocally) {
	// 			// TODO: rn App only informs the spaces about a name change of personas[0] - not the selectedPersona
	// 			// so... let me just make selectedPersona
	// 			ping<Personas>(makeUrl('update-local-persona'), post({ personaId, updates }))
	// 				.then((p) => personasSet(p))
	// 				.catch((err) => alert(err))
	// 				.finally(() => fetchedSpacesSet({}));
	// 		} else {
	// 			// TODO: get new personas (with signedSelf)
	// 			// const newUnsignedSelf: UnsignedSelf = {
	// 			// 	writeDate: Date.now(),
	// 			// 	id: selectedPersona.id,
	// 			// 	...updates,
	// 			// };
	// 		}
	// 	},
	// 	[selectedPersona],
	// );

	return (
		personas && (
			<div className="flex">
				<div className="flex-1 relative min-w-40 max-w-56">
					<div className="sticky top-12 h-full p-3 flex flex-col max-h-[calc(100vh-3rem)] overflow-scroll">
						<div className="overflow-scroll border-b border-mg1 mb-1">
							{personas
								.filter((p) => !!p.id)
								.sort((a, b) =>
									a.name && b.name
										? a.name.toLowerCase().localeCompare(b.name.toLowerCase())
										: a.name
											? -1
											: b.name
												? 1
												: a.id!.toLowerCase().localeCompare(b.id!.toLowerCase()),
								)
								.map((persona) => {
									return (
										<Link
											key={persona.id}
											to={`/manage-personas/${persona.id}`}
											className={`rounded h-14 fx transition hover:bg-mg1 pl-2 py-1 ${persona.id === personaId ? 'bg-mg1' : 'bg-bg1'}`}
										>
											<DeterministicVisualId
												input={persona.id}
												className="h-6 w-6 overflow-hidden rounded-full"
											/>
											<div className="flex-1 mx-2 truncate">
												<p
													className={`text-lg font-semibold leading-5 ${!persona.name && 'text-fg2'} truncate`}
												>
													{!persona.id ? 'Anon' : persona.name || 'No name'}
												</p>
												<p className="font-mono text-fg2 leading-5">{shortenString(persona.id!)}</p>
											</div>
											<div className="ml-auto mr-1 xy w-5">
												{persona.id === personas[0].id ? (
													<CheckIcon className="h-5 w-5" />
												) : (
													persona.id &&
													!persona.mnemonic && <LockClosedIcon className="h-4 w-4 text-fg2" />
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
									<div className="flex gap-3">
										<DeterministicVisualId
											input={selectedPersona.id}
											className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full"
										/>
										<div>
											<p
												className={`leading-7 font-bold text-2xl ${!selectedPersona.name && 'text-fg2'} `}
											>
												{selectedPersona.name || 'No name'}
											</p>
											<p className="text-lg text-fg2 font-semibold break-all">{personaId}</p>
										</div>
									</div>
									<p className="text-2xl font-semibold mb-1">Public info</p>
									{frozen ? (
										<LabelVal label="Name" value={selectedPersona.name} />
									) : (
										<TextInput
											_ref={nameIpt}
											defaultValue={selectedPersona.name}
											label="Name"
											placeholder="No name"
											maxLength={100}
											onSubmit={(v) => {
												personasSet((old) => {
													const personaIndex = old.findIndex((p) => p.id === personaId);
													if (personaIndex === -1) return [...old];
													old[personaIndex].name = v;
													return [...old];
												});
											}}
										/>
									)}
									<LabelVal label="Frozen" value={selectedPersona.frozen ? 'True' : 'False'} />
									<LabelVal label="Wallet address" value={selectedPersona.walletAddress} />
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
												onSubmit={(newPassword) => {
													personasSet((old) => {
														const personaIndex = old.findIndex((p) => p.id === personaId);
														if (personaIndex === -1) return [...old];
														const persona = old[personaIndex];
														const decryptedMnemonic = decrypt(
															persona.encryptedMnemonic!,
															oldPasswordIpt.value,
														);
														if (!validateMnemonic(decryptedMnemonic, wordlist)) {
															oldPasswordIpt.error = 'Incorrect password';
															return [...old];
														}
														persona.encryptedMnemonic = encrypt(decryptedMnemonic, newPassword);
														changingPwSet(false);
														return [...old];
													});
												}}
											/>
										</>
									)}
									<Button
										label={secrets ? 'Hide secret mnemonic' : 'Show secret mnemonic'}
										onClick={async () => {
											if (secrets) return secretsSet('');
											const pw = prompt(
												`Enter password to show mnemonic for ${selectedPersona.name || 'No name'}`,
											);
											if (pw === null) return false;
											const personaIndex = personas.findIndex((p) => p.id === personaId);
											if (personaIndex === -1) return personas;
											const persona = personas[personaIndex];
											const mnemonic = decrypt(persona.encryptedMnemonic!, pw);
											if (!validateMnemonic(mnemonic, wordlist)) {
												return alert('Incorrect password');
											}
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
											personasSet((old) => {
												const personaIndex = old.findIndex((p) => p.id === personaId);
												if (personaIndex === -1) return [...old];
												const mnemonic = prompt(
													`Enter mnemonic to remove ${selectedPersona.name || 'No name'}\n\nThe only way to restore this persona is to re-enter its mnemonic`,
												);
												if (mnemonic === null) return old;
												if (
													!validateMnemonic(mnemonic, wordlist) ||
													mnemonic !== old[personaIndex].mnemonic
												) {
													alert('Invalid mnemonic');
													return old;
												}
												old.splice(personaIndex, 1);
												return [...old];
											});
										}}
									/>
									{!frozen && (
										<Button
											label="Mark as frozen"
											onClick={async () => {
												personasSet((old) => {
													const personaIndex = old.findIndex((p) => p.id === personaId);
													if (personaIndex === -1) return [...old];

													const hosts = selectedPersona.spaceHosts.filter((h) => !!h).join(', ');
													const mnemonic = prompt(
														`Enter mnemonic to inform the following hosts that this persona (${selectedPersona.name || 'No name'}) has been frozen: ${hosts}\n\nThis will block all read and write activity from this persona\n\nYou may want to do this for archival or security reasons`,
													);
													if (mnemonic === null) return old;
													if (
														!validateMnemonic(mnemonic, wordlist) ||
														mnemonic !== old[personaIndex].mnemonic
													) {
														alert('Invalid mnemonic');
														return old;
													}
													old[personaIndex].frozen = true;
													return [...old];
												});
											}}
										/>
									)}
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
							<TextInput autoFocus _ref={nameIpt} label="Name" placeholder="No name" />
							<TextInput password _ref={mnemonicIpt} label="Mnemonic" />
							<TextInput password _ref={passwordIpt} label="Password" />
							<Button
								label="Add persona"
								onClick={() => {
									personasSet((old) => {
										const mnemonic = mnemonicIpt.value || generateMnemonic(wordlist, 256);
										if (!validateMnemonic(mnemonic, wordlist)) {
											mnemonicIpt.error = 'Invalid mnemonic';
											return [...old];
										}
										const kp = createKeyPair(mnemonic);
										const unsignedSelf: UnsignedSelf = {
											writeDate: Date.now(),
											id: kp.publicKey,
											name: nameIpt.value.trim(),
											walletAddress: wallet.deriveAddress({ mnemonics: mnemonic, index: 0 })
												.address,
										};
										const signedSelf: SignedSelf = {
											...unsignedSelf,
											signature: signItem(unsignedSelf, kp.privateKey),
										};
										old.unshift({
											...signedSelf,
											mnemonic,
											encryptedMnemonic: encrypt(mnemonic, passwordIpt.value),
											spaceHosts: [defaultSpaceHost],
										});
										console.log('old:', old);
										navigate(`/manage-personas/${old[0].id}`);
										return [...old];
									});
								}}
							/>
						</>
					)}
				</div>
			</div>
		)
	);
}
