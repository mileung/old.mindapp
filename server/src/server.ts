import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import root from './routes/_root';
import addTag from './routes/add-tag';
import deleteThought from './routes/delete-thought';
import { getFile } from './routes/get-file';
import getRootSettings from './routes/get-root-settings';
import getLocalThoughts from './routes/get-roots';
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
import setFirstPersonaOrSpace from './routes/set-first-persona-or-space';
import unlockPersona from './routes/unlock-persona';
import getPersonaMnemonic from './routes/get-persona-mnemonic';
import updatePersonaDefaultName from './routes/update-persona-default-name';
import deletePersona from './routes/delete-persona';
import updatePersonaPassword from './routes/update-persona-password';
import lockAllPersonas from './routes/lock-all-personas';
import { Personas } from './types/Personas';

const app = express();
const port = 2000;

app.use((req, res, next) => {
	// logger
	// console.log(`${req.url} ${req.body}`);
	next();
});

// QUESTION: Why does get-roots need cors but not whoami?
app.use(cors());
app.use(express.json());

app.get('/', root);
app.get('/whoami', whoami);
app.get('/get-working-directory', getWorkingDirectory);
app.post('/update-working-directory', updateWorkingDirectory);
app.get('/get-root-settings', getRootSettings);
app.post('/update-root-settings', updateRootSettings);
app.post('/write-thought', writeThought);
app.get('/get-tag-tree', getTagTree);
app.post('/add-tag', addTag);
app.post('/remove-tag', removeTag);
app.post('/rename-tag', renameTag);
app.post('/delete-thought', deleteThought);
app.get('/get-personas', getPersonas);
app.post('/set-first-persona-or-space', setFirstPersonaOrSpace);
app.post('/add-persona', addPersona);
app.post('/unlock-persona', unlockPersona);
app.post('/get-persona-mnemonics', getPersonaMnemonic);
app.post('/update-persona-default-name', updatePersonaDefaultName);
app.post('/update-persona-password', updatePersonaPassword);
app.post('/delete-persona', deletePersona);
app.get('/lock-all-personas', lockAllPersonas);
// app.post('/invite-to-space', inviteToSpace);
// app.post('/accept-space-invitation', acceptSpaceInvitation);
// app.post('/request-to-join-space', requestToJoinSpace);
// app.post('/approve-request-to-join-space', approveRequestToJoinSpace);
// app.post('/leave-space', leaveSpace);
// app.post('/remove-persona-from-space', removePersonaFromSpace);
// app.post('/archive-persona', archivePersona);
app.post('/get-roots', getLocalThoughts);
app.get('/file/:fileName', getFile);
app.get('/show-working-directory', showWorkingDirectory);

app.use(((err, req, res, next) => {
	console.log('err:', err);
	res.status(err.status || 500);
	res.send({ error: { message: err.message } });
}) as ErrorRequestHandler);

app.listen(port, () => {
	touchIfDne(rootSettingsPath, JSON.stringify(new RootSettings({})));
	WorkingDirectory.current.setUp();
	const personas = Personas.get();
	personas.list.forEach((p) => personas.unlockPersona(p.id, ''));
	console.log(`Server is running on http://localhost:${port}`);
});
