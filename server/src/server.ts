import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import root from './routes/_root';
import addTag from './routes/add-tag';
import getLocalNotes from './routes/get-local-notes';
import getTags from './routes/get-tags';
import removeTag from './routes/remove-tag';
import whoami from './routes/whoami';
import writeNote from './routes/write-note';
import { Settings } from './types/Settings';
import { getSettings, mindappRootPath, mkdirIfDne, touchIfDne } from './utils/files';

const app = express();
const port = 3000;

// QUESTION: Why does get-local-notes need cors but not whoami?
app.use(cors());
app.use(express.json());

app.get('/', root);
app.get('/whoami', whoami);
app.post('/write-note', writeNote);
app.get('/get-tags', getTags);
app.post('/add-tag', addTag);
app.post('/remove-tag', removeTag);
app.get('/get-local-notes', getLocalNotes);

app.use(((err, req, res, next) => {
	console.log('err:', err);
	res.status(err.status || 500);
	res.send({
		error: {
			message: err.message,
		},
	});
}) as ErrorRequestHandler);

app.listen(port, () => {
	touchIfDne(path.join(mindappRootPath, 'settings.json'), JSON.stringify(new Settings()));
	mkdirIfDne(path.join(mindappRootPath, 'spaces'));
	global.startDate = getSettings().startDate;
	console.log(`Server is running on http://localhost:${port}`);
});
