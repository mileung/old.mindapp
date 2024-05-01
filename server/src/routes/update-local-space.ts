import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const updateLocalSpaces: RequestHandler = (req, res) => {
	let { personaId, hostname, remove } = req.body as {
		personaId: string;
		hostname: string;
		remove?: boolean;
	};

	const personas = Personas.get();

	remove //
		? personas.removeSpace(personaId, hostname)
		: personas.addSpace(personaId, hostname);

	res.send(personas.clientArr);
};

export default updateLocalSpaces;
