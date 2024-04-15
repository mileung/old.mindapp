import { useCallback, useEffect, useMemo } from 'react';
import TextInput, { useTextInputRef } from '../components/TextInput';
import { buildUrl, ping, post } from '../utils/api';
import { Button } from '../components/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocalState, usePersonas } from '../utils/state';
import { Personas } from '../utils/settings';
import DeterministicVisualId from '../components/DeterministicVisualId';
import { LockClosedIcon } from '@heroicons/react/16/solid';

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
		ping<{ arr: null | Personas }>(
			buildUrl('unlock-persona'),
			post({
				personaId,
				password: passwordIpt.value,
			}),
		)
			.then(({ arr }) => {
				if (arr) {
					personasSet(arr);
					if (!manage) {
						navigate('/');
						localStateSet({ ...localState, activePersonaId: personaId! });
						ping<Personas>(buildUrl('set-first-persona-or-space'), post({ personaId }))
							.then((p) => personasSet(p))
							.catch((err) => alert(JSON.stringify(err)));
					}
				} else {
					passwordIpt.tag?.focus();
					passwordIpt.error = 'Incorrect password';
				}
			})
			.catch((err) => alert(JSON.stringify(err)));
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
						<div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full">
							<DeterministicVisualId input={personaId} />
						</div>
						<div>
							<div className="fx gap-1">
								<p className="font-bold text-2xl">{personaToUnlock?.defaultName || 'No name'}</p>
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
