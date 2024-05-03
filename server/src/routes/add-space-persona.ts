import { RequestHandler } from 'express';
import { inGroup, verifyItem } from '../utils/security';
import { drizzleClient } from '../db';
import { personasTable } from '../db/schema';
import env from '../utils/env';

const addSpacePersona: RequestHandler = async (req, res) => {
	const { message } = req.body as {
		message: {
			from: string;
			personaId: string;
		};
	};

	if (!env.ANYONE_CAN_ADD && message.from !== env.OWNER_ID) throw new Error('Access denied');
	const fromExistingMember = await inGroup(message.from);
	if (env.IS_GLOBAL_SPACE && !env.ANYONE_CAN_ADD && !fromExistingMember) {
		throw new Error('Access denied');
	}
	if (fromExistingMember?.frozen) throw new Error('Frozen persona');

	await drizzleClient.insert(personasTable).values({
		id: message.personaId,
		addedById: message.from,
		addDate: Date.now(),
	});

	return res.send({});
};

export default addSpacePersona;
