import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';
import root from './routes/_root';
import addTag from './routes/add-tag';
import { getFile } from './routes/get-file';
import getLocalThoughts from './routes/get-roots';
import getSettings from './routes/get-settings';
import getTagTree from './routes/get-tag-tree';
import removeTag from './routes/remove-tag';
import renameTag from './routes/rename-tag';
import updateSettings from './routes/update-settings';
import whoami from './routes/whoami';
import writeThought from './routes/write-thought';
import { Settings } from './types/Settings';
import { Thought } from './types/Thought';
import { mkdirIfDne, settingsPath, timelinePath, touchIfDne } from './utils/files';
import { setUpGit } from './utils/git';
import { day } from './utils/time';
import deleteThought from './routes/delete-thought';
import { setUpIndex } from './utils';

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
app.get('/get-settings', getSettings);
app.post('/update-settings', updateSettings);
app.post('/write-thought', writeThought);
app.get('/get-tag-tree', getTagTree);
app.post('/add-tag', addTag);
app.post('/remove-tag', removeTag);
app.post('/rename-tag', renameTag);
app.post('/delete-thought', deleteThought);
app.post('/get-roots', getLocalThoughts);
app.get('/file/:fileName', getFile);

app.use(((err, req, res, next) => {
	console.log('err:', err);
	res.status(err.status || 500);
	res.send({ error: { message: err.message } });
}) as ErrorRequestHandler);

app.listen(port, () => {
	mkdirIfDne(timelinePath);
	touchIfDne(settingsPath, JSON.stringify(new Settings({})));
	// global.startDate = parseFile<Settings>(settingsPath).startDate;
	console.log(`Server is running on http://localhost:${port}`);
	setUpGit();
	setUpIndex();

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
					// tags,
					// mentionIds,
				},
				true,
			);
		}
	}
});
