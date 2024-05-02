import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const updateLocalSpaces: RequestHandler = (req, res) => {
	let { personaId, host, remove } = req.body as {
		personaId: string;
		host: string;
		remove?: boolean;
	};

	const personas = Personas.get();

	remove //
		? personas.removeSpace(personaId, host)
		: personas.addSpace(personaId, host);

	res.send(personas.clientArr);
};

export default updateLocalSpaces;
