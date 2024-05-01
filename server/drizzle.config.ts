import type { Config } from 'drizzle-kit';

// Drizzle with Turso
// https://orm.drizzle.team/learn/tutorials/drizzle-with-turso

const useTursoEnvVars = !process.env.LOCALLY_TESTING && process.env.IS_GLOBAL_SPACE;

export default {
	schema: './src/db/schema.ts',
	out: './src/db/migrations',
	driver: 'turso',
	dbCredentials: {
		// url: ':memory:',
		// url: 'file:./src/db/global-test.db',
		url: 'file:./src/db/local.db',
		// ...(useTursoEnvVars
		// 	? {
		// 			url: process.env.TURSO_DATABASE_URL!,
		// 			authToken: process.env.TURSO_AUTH_TOKEN!,
		// 		}
		// 	: {
		// 			url: !process.env.IS_GLOBAL_SPACE //
		// 				? 'file:./src/db/global-test.db'
		// 				: 'file:./src/db/local.db',
		// 		}),
	},
} satisfies Config;
