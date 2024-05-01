import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const updateLocalPersona: RequestHandler = (req, res) => {
	const { personaId, updates } = req.body as {
		personaId: string;
		updates: {
			name?: string;
			// walletAddress: string;
			frozen?: true;
		};
	};
	const personas = Personas.get();
	personas.updateLocalPersona(personaId, updates);
	res.send(personas.clientArr);
};

export default updateLocalPersona;
