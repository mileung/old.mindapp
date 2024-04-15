import { RequestHandler } from 'express';
import { Personas } from '../types/Personas';

const getPersonas: RequestHandler = (req, res) => {
	res.send(Personas.get().arr);
};

export default getPersonas;
