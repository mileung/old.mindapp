import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const lockAllPersonas: RequestHandler = (req, res) => {
	Personas.lockAllPersonas();
	Personas.get().prioritizePersona('');
	res.send(Personas.get().clientArr);
};

export default lockAllPersonas;
