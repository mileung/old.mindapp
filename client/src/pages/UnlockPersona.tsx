import { LockClosedIcon } from '@heroicons/react/16/solid';
import { useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import DeterministicVisualId from '../components/DeterministicVisualId';
import TextInput, { useTextInputRef } from '../components/TextInput';
import { useLocalState, usePersonas } from '../utils/state';
import { decrypt } from '../utils/security';
import { validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

export default function UnlockPersona({ manage }: { manage?: boolean }) {
	const [localState, localStateSet] = useLocalState();
	const [personas, personasSet] = usePersonas();
	const { personaId } = useParams();
	const navigate = useNavigate();
	const passwordIpt = useTextInputRef();

	const personaToUnlock = useMemo(() => {
		return !personas ? null : personas.find((p) => p.id === personaId) || null;
	}, [personas]);

	const unlockPersona = useCallback(() => {
		personasSet((old) => {
			const personaIndex = old.findIndex((p) => p.id === personaId);
			if (personaIndex === -1) return [...old];
			const persona = old[personaIndex];
			const decryptedMnemonic = decrypt(persona.encryptedMnemonic!, passwordIpt.value);
			if (!validateMnemonic(decryptedMnemonic, wordlist)) {
				passwordIpt.tag?.focus();
				passwordIpt.error = 'Incorrect password';
				return [...old];
			}
			old[personaIndex] = { ...persona, mnemonic: decryptedMnemonic };
			return [...old];
		});
	}, [personaId, manage]);

	useEffect(() => passwordIpt.tag?.focus(), [personaId]);

	return (
		<div className={`space-y-3 ${!manage && 'p-3'}`}>
			{personas && !personaToUnlock ? (
				<>
					<p className="font-bold text-2xl">Persona not found</p>
					<Button label="Manage personas" to="/manage-personas" />
				</>
			) : (
				<>
					<div className="fx gap-3">
						<DeterministicVisualId
							input={personaId}
							className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full"
						/>
						<div>
							<div className="fx gap-1">
								<p className="font-bold text-2xl">{personaToUnlock?.name || 'No name'}</p>
								<LockClosedIcon className="h-6 w-6" />
							</div>
							<p className="text-lg text-fg2 font-semibold break-all">{personaId}</p>
						</div>
					</div>
					<TextInput
						password
						// autoFocus={!manage}
						autoFocus
						_ref={passwordIpt}
						label="Password"
						onSubmit={() => unlockPersona()}
					/>
					<Button label="Unlock persona" onClick={() => unlockPersona()} />
				</>
			)}
		</div>
	);
}
