import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import root from './routes/_root';
import addTag from './routes/add-tag';
import getLocalThoughts from './routes/get-local-thoughts';
import getTags from './routes/get-tags';
import removeTag from './routes/remove-tag';
import whoami from './routes/whoami';
import writeThought from './routes/write-thought';
import { Settings } from './types/Settings';
import {
	getSettings,
	indicesPath,
	mindappRootPath,
	mkdirIfDne,
	parseFile,
	settingsPath,
	timelinePath,
	touchIfDne,
} from './utils/files';
import renameTag from './routes/rename-tag';
import getThought from './routes/get-thought';
import { Thought } from './types/Thought';

const app = express();
const port = 3000;

// QUESTION: Why does get-local-thoughts need cors but not whoami?
app.use(cors());
app.use(express.json());

app.get('/', root);
app.get('/whoami', whoami);
app.post('/write-thought', writeThought);
app.post('/get-thought', getThought);
app.get('/get-tags', getTags);
app.post('/add-tag', addTag);
app.post('/remove-tag', removeTag);
app.post('/rename-tag', renameTag);
app.get('/get-local-thoughts', getLocalThoughts);

app.use(((err, req, res, next) => {
	console.log('err:', err);
	res.status(err.status || 500);
	res.send({ error: { message: err.message } });
}) as ErrorRequestHandler);

app.listen(port, () => {
	mkdirIfDne(timelinePath);
	touchIfDne(settingsPath, JSON.stringify(new Settings()));
	touchIfDne(indicesPath, JSON.stringify({}));
	global.startDate = getSettings().startDate;
	console.log(`Server is running on http://localhost:${port}`);
});
