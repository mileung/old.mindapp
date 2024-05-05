import { RequestHandler } from 'express';
import { Persona } from '../types/Personas';
import { WorkingDirectory } from '../types/WorkingDirectory';
import { writeObjectFile } from '../utils/files';
import { debouncedSnapshot } from '../utils/git';

const savePees: RequestHandler = async (req, res) => {
	// return res.send({});
	const { personas } = req.body as {
		personas: Persona[];
	};

	writeObjectFile(WorkingDirectory.current.personasPath, personas);

	res.send({});
	debouncedSnapshot();
};

export default savePees;
