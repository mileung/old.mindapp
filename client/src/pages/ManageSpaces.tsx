import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import DeterministicVisualId from '../components/DeterministicVisualId';
import TextInput, { useTextInputRef } from '../components/TextInput';
import { buildUrl, hostedLocally, localApiHost, makeUrl, ping, post } from '../utils/api';
import { useSendMessage, usePersonas, useFetchedSpaces } from '../utils/state';
import { formatTimestamp } from '../utils/time';
import { Personas } from '../utils/settings';

export default function ManageSpaces() {
	const { spaceHost } = useParams();
	const [fetchedSpaces, fetchedSpacesSet] = useFetchedSpaces();
	const navigate = useNavigate();
	const sendMessage = useSendMessage();
	const [personas, personasSet] = usePersonas();
	const hostIpt = useTextInputRef();
	const fetchedSpace = useMemo(
		() => (spaceHost ? fetchedSpaces[spaceHost] : undefined),
		[fetchedSpaces, spaceHost],
	);

	useEffect(() => {
		if (spaceHost && !personas[0].spaceHosts.includes(spaceHost)) {
			navigate('/manage-spaces');
		}
	}, [personas[0].spaceHosts, spaceHost]);

	return (
		<div className="flex">
			<div className="flex-1 relative min-w-40 max-w-56">
				<div className="sticky top-12 h-full p-3 flex flex-col max-h-[calc(100vh-3rem)] overflow-scroll">
					<div className="overflow-scroll border-b border-mg1 mb-1">
						{personas[0].spaceHosts
							.filter((h) => !!h)
							.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
							.map((host) => {
								return (
									<Link
										key={host}
										to={`/manage-spaces/${host}`}
										className={`rounded h-14 fx transition hover:bg-mg1 pl-2 py-1 ${host === spaceHost ? 'bg-mg1' : 'bg-bg1'}`}
									>
										<DeterministicVisualId
											input={host}
											className="h-6 w-6 overflow-hidden rounded"
										/>
										<div className="flex-1 mx-2 truncate">
											<p
												className={`text-lg font-semibold leading-5 truncate ${!fetchedSpaces[host]?.name && 'text-fg2'}`}
											>
												{fetchedSpaces[host] ? fetchedSpaces[host].name || 'No name' : '...'}
											</p>
											<p className="font-mono text-fg2 leading-5 truncate">{host}</p>
										</div>
									</Link>
								);
							})}
					</div>
					<Link
						to={'/manage-spaces'}
						className={`rounded h-10 fx transition hover:bg-mg1 px-2 py-1 ${!spaceHost && 'bg-mg1'}`}
					>
						<div className="h-6 w-6 xy">
							{/* <div className="h-4 w-4 rounded-sm bg-fg1" /> */}
							<GlobeAltIcon className="h-6 w-6" />
						</div>
						<p className="ml-1.5 text-lg font-semibold">Join space</p>
					</Link>
				</div>
			</div>
			<div className="flex-1 space-y-3 p-3">
				{fetchedSpace ? (
					fetchedSpace.self === null ? (
						<div className="space-y-2">
							<p className="text-2xl font-semibold">Unable to join {fetchedSpace.host}</p>
							<Button
								label="Try again"
								onClick={() => {
									const newSpace = { ...fetchedSpaces };
									delete newSpace[spaceHost!];
									fetchedSpacesSet(newSpace);
								}}
							/>
							<Button
								label="Remove space"
								onClick={() => {
									navigate(`/manage-spaces/${spaceHost}`);
									if (hostedLocally) {
										ping<Personas>(
											makeUrl('update-local-space'),
											post({ personaId: personas[0].id, host: spaceHost, remove: true }),
										)
											.then((p) => personasSet(p))
											.catch((err) => alert(JSON.stringify(err)));
									} else {
										personasSet((old) => {
											old[0].spaceHosts.splice(
												old[0].spaceHosts.findIndex((h) => h === spaceHost),
												1,
											);
											return [...old];
										});
									}
								}}
							/>
						</div>
					) : (
						<>
							<div className="flex gap-3">
								<DeterministicVisualId
									input={fetchedSpace.host}
									className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg"
								/>
								<div>
									<p
										className={`leading-7 font-bold text-2xl ${!fetchedSpace.name && 'text-fg2'} `}
									>
										{fetchedSpace.name || 'No name'}
									</p>
									<p className="text-lg text-fg2 font-semibold break-all">{spaceHost}</p>
								</div>
							</div>
							<p className="text-2xl font-semibold">Space info</p>
							<LabelValue label="Hub address" value={fetchedSpace.hubAddress} />
							<LabelValue label="Faucet address" value={fetchedSpace.faucetAddress} />
							<div className="">
								<p className="text-xl font-semibold text-fg2">Owner</p>
								<NameTag id={fetchedSpace.owner?.id} name={fetchedSpace.owner?.name} />
							</div>
							<div className="">
								<p className="text-2xl font-semibold">Self info</p>
								<NameTag id={fetchedSpace.self?.id} name={fetchedSpace.self?.name} />
							</div>
							{fetchedSpace.self && (
								<>
									<LabelValue label="Add date" value={formatTimestamp(fetchedSpace.self.addDate)} />
									{fetchedSpace.self.addedBy?.id && (
										<div className="">
											<p className="text-xl font-semibold text-fg2">Added by</p>
											<NameTag
												id={fetchedSpace.self.addedBy?.id}
												name={fetchedSpace.self.addedBy?.name}
											/>
										</div>
									)}
									<LabelValue label="Frozen" value={fetchedSpace.self.frozen ? 'True' : 'False'} />
									<LabelValue label="Wallet address" value={fetchedSpace.self.walletAddress} />
									<p className="text-2xl font-semibold mb-1">Danger zone</p>
									<Button
										label="Leave space"
										onClick={async () => {
											await sendMessage({
												from: personas[0].id,
												to: buildUrl({ host: spaceHost, path: 'leave-space' }),
											});
											if (hostedLocally) {
												await ping(
													buildUrl({
														host: localApiHost,
														path: 'update-local-space',
													}),
													post({
														personaId: personas[0].id,
														host: spaceHost,
														remove: true,
													}),
												);
											}

											personasSet((old) => {
												old[0].spaceHosts.splice(
													old[0].spaceHosts.findIndex((h) => h === spaceHost),
													1,
												);
												return [...old];
											});
											fetchedSpacesSet((old) => {
												delete old[spaceHost!];
												return { ...old };
											});
											navigate('/manage-spaces');
										}}
									/>
								</>
							)}
						</>
					)
				) : (
					!spaceHost && (
						<>
							<div className="">
								<p className="font-bold text-2xl">Join a global space</p>
								<p className="font-semibold text-xl text-fg2">
									A global space is an online thought repository that users can contribute to
								</p>
							</div>
							<TextInput
								required
								autoFocus
								defaultValue="localhost:8080"
								_ref={hostIpt}
								label="Host"
							/>
							<Button
								label="Join space"
								onClick={() => {
									const newSpaceHost = hostIpt.value.trim().toLowerCase();
									if (
										newSpaceHost === localApiHost ||
										personas[0].spaceHosts.find((h) => h == newSpaceHost)
									) {
										return alert('Host already added');
									}

									if (hostedLocally) {
										ping<Personas>(
											makeUrl('update-local-space'),
											post({ personaId: personas[0].id, host: newSpaceHost }),
										)
											.then((p) => {
												personasSet(p);
												navigate(`/manage-spaces/${newSpaceHost}`);
											})
											.catch((err) => alert(JSON.stringify(err)));
									} else {
										personasSet((old) => {
											old[0]?.spaceHosts.unshift(newSpaceHost);
											return [...old];
										});
										setTimeout(() => navigate(`/manage-spaces/${newSpaceHost}`), 0);
									}
								}}
							/>
							<Link
								target="_blank"
								className="inline-block font-semibold leading-4 text-fg2 transition hover:text-fg1"
								to="TODO"
							>
								Create a new space
							</Link>
						</>
					)
				)}
			</div>
		</div>
	);
}

function LabelValue({ label, value }: { label: string; value?: string }) {
	return (
		<div>
			<p className="text-xl font-semibold text-fg2 leading-5">{label}</p>
			<p className="text-xl font-medium">{value}</p>
		</div>
	);
}

function NameTag({ id, name }: { id?: string; name?: string }) {
	return !id ? (
		<p className="text-xl text-fg2 font-semibold leading-5">Anon</p>
	) : (
		<div className="flex gap-3 mt-1">
			<DeterministicVisualId
				input={id}
				className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full"
			/>
			<div>
				<p className={`leading-5 font-bold text-xl ${!name && 'text-fg2'} `}>{name || 'No name'}</p>
				<p className="text-lg text-fg2 font-semibold break-all">{id}</p>
			</div>
		</div>
	);
}
