// $ cd server && npx drizzle-kit push:sqlite && cd ..
import type { Config } from 'drizzle-kit';

// Drizzle with Turso
// https://orm.drizzle.team/learn/tutorials/drizzle-with-turso

export default {
	schema: './src/db/schema.ts',
	out: './src/db/migrations',
	driver: 'turso',
	dbCredentials: {
		// // @ts-ignore
		// url: process.env.TURSO_DATABASE_URL,
		// // @ts-ignore
		// authToken: process.env.TURSO_AUTH_TOKEN,

		// url: ':memory:',
		// url: 'file:./src/db/global-test.db',
		url: 'file:./src/db/local.db',
	},
} satisfies Config;
