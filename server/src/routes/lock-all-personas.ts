import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const lockAllPersonas: RequestHandler = (req, res) => {
	Personas.lockAllPersonas();
	res.send(Personas.get().arr);
};

export default lockAllPersonas;
