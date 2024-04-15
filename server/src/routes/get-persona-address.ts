import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const getPersonaAddress: RequestHandler = (req, res) => {
	const { personaId } = req.body as {
		personaId: string;
	};
	const personas = Personas.get();
	console.log('personas.getViteAddress(personaId):', personas.getViteAddress(personaId));
	res.send({});
};

export default getPersonaAddress;
