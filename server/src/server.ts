import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import root from './routes/_root';
import addTag from './routes/add-tag';
import getLocalThoughts from './routes/get-local-thoughts';
import getTags from './routes/get-tags';
import getThought from './routes/get-thought';
import removeTag from './routes/remove-tag';
import renameTag from './routes/rename-tag';
import searchLocalThoughts from './routes/search-local-thoughts';
import whoami from './routes/whoami';
import writeThought from './routes/write-thought';
import { Settings } from './types/Settings';
import {
	indicesPath,
	mkdirIfDne,
	parseFile,
	settingsPath,
	timelinePath,
	touchIfDne,
} from './utils/files';
import { getFile } from './routes/get-file';
import { Thought } from './types/Thought';
import { day } from './utils/time';

const app = express();
const port = 2000;

app.use((req, res, next) => {
	// logger
	// console.log(`${req.url} ${req.body}`);
	next();
});

// QUESTION: Why does get-local-thoughts need cors but not whoami?
app.use(cors());
app.use(express.json());

app.get('/', root);
app.get('/whoami', whoami);
app.post('/write-thought', writeThought);
app.get('/get-thought', getThought);
app.get('/get-tags', getTags);
app.post('/add-tag', addTag);
app.post('/remove-tag', removeTag);
app.post('/rename-tag', renameTag);
app.post('/get-local-thoughts', getLocalThoughts);
app.post('/search-local-thoughts', searchLocalThoughts);
app.get('/file/:fileName', getFile);

app.use(((err, req, res, next) => {
	console.log('err:', err);
	res.status(err.status || 500);
	res.send({ error: { message: err.message } });
}) as ErrorRequestHandler);

app.listen(port, () => {
	mkdirIfDne(timelinePath);
	touchIfDne(settingsPath, JSON.stringify(new Settings()));
	touchIfDne(indicesPath, JSON.stringify({}));
	global.startDate = parseFile<Settings>(settingsPath).startDate;
	console.log(`Server is running on http://localhost:${port}`);

	// test data
	const makeTestData = false;
	// const makeTestData = true;
	if (makeTestData) {
		const now = Date.now();
		// for (let i = 0; i < 10000; i++) {
		for (let i = 0; i < 200; i++) {
			// const element = array[i];
			const thought = new Thought(
				{
					// parentId,
					createDate: now - i * day,
					authorId: null,
					spaceId: null,
					content: `${i}`,
					// tagLabels,
					// mentionIds,
				},
				true,
			);
		}
	}
});
