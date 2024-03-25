import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import root from './routes/_root';
import addTag from './routes/add-tag';
import deleteThought from './routes/delete-thought';
import { getFile } from './routes/get-file';
import getRootSettings from './routes/get-root-settings';
import getLocalThoughts from './routes/get-roots';
import getTagTree from './routes/get-tag-tree';
import getWorkspace from './routes/get-workspace';
import removeTag from './routes/remove-tag';
import renameTag from './routes/rename-tag';
import showCurrentWorkspace from './routes/show-current-workspace';
import updateRootSettings from './routes/update-root-settings';
import updateWorkspace from './routes/update-workspace';
import whoami from './routes/whoami';
import writeThought from './routes/write-thought';
import { RootSettings } from './types/RootSettings';
import { Workspace } from './types/Workspace';
import { rootSettingsPath, touchIfDne } from './utils/files';

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
app.get('/get-workspace', getWorkspace);
app.post('/update-workspace', updateWorkspace);
app.get('/get-root-settings', getRootSettings);
app.post('/update-root-settings', updateRootSettings);
app.post('/write-thought', writeThought);
app.get('/get-tag-tree', getTagTree);
app.post('/add-tag', addTag);
app.post('/remove-tag', removeTag);
app.post('/rename-tag', renameTag);
app.post('/delete-thought', deleteThought);
app.post('/get-roots', getLocalThoughts);
app.get('/file/:fileName', getFile);
app.get('/show-current-workspace', showCurrentWorkspace);

app.use(((err, req, res, next) => {
	console.log('err:', err);
	res.status(err.status || 500);
	res.send({ error: { message: err.message } });
}) as ErrorRequestHandler);

app.listen(port, () => {
	touchIfDne(rootSettingsPath, JSON.stringify(new RootSettings({})));
	Workspace.current.setUp();
	console.log(`Server is running on http://localhost:${port}`);
});
