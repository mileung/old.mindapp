import { RequestHandler } from 'express';
import { Persona, Personas } from '../types/Personas';
import { parseFile } from '../utils/files';
import { WorkingDirectory } from '../types/WorkingDirectory';

const getPersonas: RequestHandler = (req, res) => {
	// res.send(Personas.get().clientArr);
	const arr = parseFile<Persona[]>(WorkingDirectory.current.personasPath);
	// console.log('arr:', arr);
	res.send(arr);
};

export default getPersonas;
