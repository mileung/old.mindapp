import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const updatePersonaDefaultName: RequestHandler = (req, res) => {
	const { personaId, defaultName } = req.body as {
		personaId: string;
		defaultName: string;
	};
	const personas = Personas.get();
	personas.updatePersonaDefaultName(personaId, defaultName);
	res.send(personas.arr);
};

export default updatePersonaDefaultName;
