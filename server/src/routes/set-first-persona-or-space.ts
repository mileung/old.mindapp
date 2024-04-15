import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const setFirstPersonaOrSpace: RequestHandler = (req, res) => {
	const personas = Personas.get();
	const { personaId, spaceId } = req.body as { personaId: string; spaceId: string };
	if (personaId) {
		if (spaceId) {
			personas.setFirstSpace(personaId, spaceId);
		}
		personas.setFirstPersona(personaId);
	} else throw new Error('personaId required');

	res.send(personas.arr);
};

export default setFirstPersonaOrSpace;
