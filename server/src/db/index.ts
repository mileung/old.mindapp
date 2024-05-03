import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import fs from 'fs';
import path from 'path';
import { Thought } from '../types/Thought';
import { WorkingDirectory } from '../types/WorkingDirectory';
import { isDirectory, isFile } from '../utils/files';
import * as schema from './schema';
import env from '../utils/env';

// const globalTursoClient = createClient({
// 	url: env.tursoDatabaseUrl!,
// 	authToken: env.tursoAuthToken!,
// 	// encryptionKey: env.encryptionKey,
// });

const useTursoEnvVars = !env.LOCALLY_TESTING && env.IS_GLOBAL_SPACE;
const tursoClient = createClient({
	...(useTursoEnvVars
		? {
				url: env.TURSO_DATABASE_URL!,
				authToken: env.TURSO_AUTH_TOKEN!,
			}
		: {
				url: env.IS_GLOBAL_SPACE //
					? 'file:./src/db/global-test.db'
					: 'file:./src/db/local.db',
			}),
});

export const drizzleClient = drizzle(tursoClient, { schema });

// const createTableQuery = `
//   CREATE TABLE IF NOT EXISTS Users (
//     id INTEGER PRIMARY KEY,
//     name TEXT NOT NULL,
//     email TEXT UNIQUE
//   )
// `;

// localTursoClient
// 	.execute(createTableQuery)
// 	.then(() => console.log('Table created successfully!'))
// 	.catch((err) => console.error('Error creating table:', err));

export async function setUpLocalDb() {
	if (env.IS_GLOBAL_SPACE || useTursoEnvVars) throw new Error('Global space cannot setUpLocalDb');

	// deleteAllRows
	const result = await drizzleClient.delete(schema.thoughtsTable).run();

	const l0DirPath = WorkingDirectory.current.timelinePath;
	const l1Dirs = fs.readdirSync(l0DirPath).sort((a, b) => +a - +b);
	for (let i = 0; i < l1Dirs.length; i++) {
		const l1Dir = l1Dirs[i];
		const l1DirPath = path.join(l0DirPath, l1Dir);
		if (!isDirectory(l1DirPath)) continue;
		const l2Dirs = fs.readdirSync(l1DirPath).sort((a, b) => +a - +b);
		for (let i = 0; i < l2Dirs.length; i++) {
			const l2Dir = l2Dirs[i];
			const l2DirPath = path.join(l1DirPath, l2Dir);
			if (!isDirectory(l2DirPath)) continue;
			const l3Dirs = fs.readdirSync(l2DirPath).sort((a, b) => +a - +b);
			for (let i = 0; i < l3Dirs.length; i++) {
				const l3Dir = l3Dirs[i];
				const l3DirPath = path.join(l2DirPath, l3Dir);
				if (!isDirectory(l3DirPath)) continue;
				const l4Dirs = fs.readdirSync(l3DirPath).sort((a, b) => +a - +b);
				for (let i = 0; i < l4Dirs.length; i++) {
					const l4Dir = l4Dirs[i];
					const l4DirPath = path.join(l3DirPath, l4Dir);
					if (!isDirectory(l4DirPath)) continue;
					const l5Dirs = fs.readdirSync(l4DirPath).sort((a, b) => +a - +b);
					for (let i = 0; i < l5Dirs.length; i++) {
						const l5Dir = l5Dirs[i];
						const l5DirPath = path.join(l4DirPath, l5Dir);
						if (!isDirectory(l5DirPath)) continue;
						const jsonFiles = fs.readdirSync(l5DirPath).sort((a, b) => {
							a = a.split('_', 1)[0];
							b = b.split('_', 1)[0];
							return +a - +b;
						});
						for (let i = 0; i < jsonFiles.length; i++) {
							const fileName = jsonFiles[i];
							const createDate = Number(fileName.split('_', 1)[0]);
							if (isNaN(createDate)) continue;
							const filePath = path.join(l5DirPath, fileName);
							if (isFile(filePath) && fileName.endsWith('.json')) {
								// console.log('filePath:', filePath);
								const thought = Thought.read(filePath);
								const thoughtInDb = await Thought.query(thought.id);
								if (!thoughtInDb) {
									// console.log('thought:', thought);
									thought.addToDb();

									// console.log('await test.returning():', await test.returning());
									// console.log('test:', test);
								}
								// console.count('thought:');
								// console.log('thought:', thought.dbColumns);
								// console.count('thought');
							}
						}
					}
				}
			}
		}
	}
}
