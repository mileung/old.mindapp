import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const prioritizePersonaOrSpace: RequestHandler = (req, res) => {
	const personas = Personas.get();
	const { personaId = '', spaceHost } = req.body as {
		personaId: string;
		spaceHost?: string;
	};

	// spaceHost !== undefined
	// 	? personas.prioritizeSpace(personaId, spaceHost)
	// 	: personas.prioritizePersona(personaId);
	res.send(personas.clientArr);
};

export default prioritizePersonaOrSpace;
