import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const prioritizePersonaOrSpace: RequestHandler = (req, res) => {
	const personas = Personas.get();
	const { personaId = '', spaceHostname } = req.body as {
		personaId: string;
		spaceHostname?: string;
	};

	spaceHostname !== undefined
		? personas.prioritizeSpace(personaId, spaceHostname)
		: personas.prioritizePersona(personaId);
	res.send(personas.clientArr);
};

export default prioritizePersonaOrSpace;
