import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const deletePersona: RequestHandler = (req, res) => {
	const { personaId, mnemonic } = req.body as {
		personaId: string;
		mnemonic: string;
	};
	const personas = Personas.get();
	const deleted = personas.deletePersona(personaId, mnemonic);
	res.send({ arr: deleted ? personas.arr : null });
};

export default deletePersona;
