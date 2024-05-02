import cors from 'cors';
import express, { ErrorRequestHandler, RequestHandler } from 'express';
import root from './routes/_root';
import addTag from './routes/add-tag';
import deleteThought from './routes/delete-thought';
import { getFile } from './routes/get-file';
import getRootSettings from './routes/get-root-settings';
import getRoots from './routes/get-roots';
import getTagTree from './routes/get-tag-tree';
import getWorkingDirectory from './routes/get-working-directory';
import removeTag from './routes/remove-tag';
import renameTag from './routes/rename-tag';
import showWorkingDirectory from './routes/show-working-directory';
import updateRootSettings from './routes/update-root-settings';
import updateWorkingDirectory from './routes/update-working-directory';
import whoami from './routes/whoami';
import writeThought from './routes/write-thought';
import { RootSettings } from './types/RootSettings';
import { WorkingDirectory } from './types/WorkingDirectory';
import { rootSettingsPath, touchIfDne } from './utils/files';
import getPersonas from './routes/get-personas';
import addPersona from './routes/add-persona';
import prioritizePersonaOrSpace from './routes/prioritize-persona-or-space';
import unlockPersona from './routes/unlock-persona';
import getPersonaMnemonic from './routes/get-persona-mnemonic';
import updateLocalPersona from './routes/update-local-persona';
import deletePersona from './routes/delete-persona';
import updatePersonaPassword from './routes/update-persona-password';
import lockAllPersonas from './routes/lock-all-personas';
import { Personas } from './types/Personas';
import updateSpacePersona from './routes/update-space-persona';
import { verifyItem } from './utils/security';
import Ajv from 'ajv';
import getSignature from './routes/get-signature';
import env from './utils/env';
import leaveSpace from './routes/leave-space';
import addPersonaToSpace from './routes/add-persona-to-space';
import updateLocalSpaces from './routes/update-local-space';

const app = express();
const port = env.isGlobalSpace ? 8080 : 2000;
const host = env.host || `localhost${port}`;

app.use((req, res, next) => {
	// logger
	// console.log(`${req.url} ${req.body}`);
	next();
});

// QUESTION: Why does get-roots need cors but not whoami?
app.use(cors());
app.use(express.json());

const tryCatch = (controller: RequestHandler) =>
	(async (req, res, next) => {
		try {
			await controller(req, res, next);
		} catch (error) {
			console.error(error);
			return next(error);
		}
	}) as RequestHandler;

if (!env.isGlobalSpace) {
	// Local-only routes
	app.get('/', tryCatch(root));
	app.get('/whoami', tryCatch(whoami));
	app.get('/get-working-directory', tryCatch(getWorkingDirectory));
	app.post('/update-working-directory', tryCatch(updateWorkingDirectory));
	app.get('/get-root-settings', tryCatch(getRootSettings));
	app.post('/update-root-settings', tryCatch(updateRootSettings));
	app.get('/get-tag-tree', tryCatch(getTagTree));
	app.post('/add-tag', tryCatch(addTag));
	app.post('/remove-tag', tryCatch(removeTag));
	app.post('/rename-tag', tryCatch(renameTag));
	app.get('/get-personas', tryCatch(getPersonas));
	app.post('/prioritize-persona-or-space', tryCatch(prioritizePersonaOrSpace));
	app.post('/update-local-space', tryCatch(updateLocalSpaces));
	app.post('/add-persona', tryCatch(addPersona));
	app.post('/unlock-persona', tryCatch(unlockPersona));
	app.post('/get-persona-mnemonics', tryCatch(getPersonaMnemonic));
	app.post('/update-local-persona', tryCatch(updateLocalPersona));
	app.post('/update-persona-password', tryCatch(updatePersonaPassword));
	app.post('/delete-persona', tryCatch(deletePersona));
	app.get('/lock-all-personas', tryCatch(lockAllPersonas));
	// app.post('/archive-persona', tryCatch(archivePersona));
	app.get('/file/:fileName', tryCatch(getFile));
	app.get('/show-working-directory', tryCatch(showWorkingDirectory));
	app.post('/get-signature', tryCatch(getSignature));
}

const ajv = new Ajv({ verbose: true });

const schema = {
	type: 'object',
	properties: {
		message: {
			type: 'object',
			properties: {
				from: { type: 'string' },
				to: { type: 'string' },
			},
			required: ['to'],
			additionalProperties: true,
		},
		fromSignature: { type: 'string' },
	},
	required: ['message'],
	additionalProperties: false,
};

type Message = {
	[key: string]: any;
	to: string;
	from?: string;
};

app.use((req, res, next) => {
	// console.log('Public route');
	const { message, fromSignature } = req.body as {
		message: Message;
		fromSignature?: string;
	};
	if (!ajv.validate(schema, req.body)) {
		throw new Error('Invalid public route request body: ' + JSON.stringify(req.body));
	}
	const to = new URL(message.to);
	if (env.isGlobalSpace && (to.host !== host || to.pathname !== req.url))
		throw new Error('Wrong recipient');
	if (message.from) {
		if (!fromSignature) throw new Error('Missing fromSignature');
		const valid = verifyItem(message, message.from, fromSignature);
		if (!valid) throw new Error('Invalid fromSignature');
	}

	next();
});

// Public routes
app.post('/write-thought', tryCatch(writeThought));
app.post('/delete-thought', tryCatch(deleteThought));
app.post('/get-roots', tryCatch(getRoots));
app.post('/update-space-persona', tryCatch(updateSpacePersona));
app.post('/add-persona-to-space', tryCatch(addPersonaToSpace));
app.post('/leave-space', tryCatch(leaveSpace));

app.use(((err, req, res, next) => {
	// console.log('err:', err);
	res.status(500).json({ error: err.message });
}) as ErrorRequestHandler);

app.listen(port, () => {
	if (!env.isGlobalSpace) {
		touchIfDne(rootSettingsPath, JSON.stringify(new RootSettings({})));
		WorkingDirectory.current.setUp();
		const personas = Personas.get();
		personas.list.forEach((p) => {
			if (p.id) {
				personas.unlockPersona(p.id, '');
			}
		});
	}
	console.log(`Server is running at ${host}`);
});
