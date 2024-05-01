// import path from 'path';
// import { migrate } from 'drizzle-orm/libsql/migrator';
// import { drizzleClient } from '.';
import { integer, text, sqliteTable, primaryKey, index } from 'drizzle-orm/sqlite-core';

// SQLite column types
// https://orm.drizzle.team/docs/column-types/sqlite

export const personasTable = sqliteTable('personas', {
	id: text('id').primaryKey(),
	name: text('name'),
	frozen: integer('frozen', { mode: 'boolean' }),
	walletAddress: text('wallet_address').unique(),
	writeDate: integer('write_date'),
	// above are what signature should sign
	signature: text('signature'),
	addDate: integer('add_date').notNull(),
	addedById: text('added_by_id'),
});
export type InsertPersona = typeof personasTable.$inferInsert;
export type SelectPersona = typeof personasTable.$inferSelect;

export const thoughtsTable = sqliteTable(
	'thoughts',
	{
		createDate: integer('create_date').notNull(),
		authorId: text('author_id'),
		spaceHostname: text('space_hostname'),
		content: text('content'),
		tags: text('tags', { mode: 'json' }).$type<string[]>(),
		parentId: text('parent_id'),
		signature: text('signature'),

		// https://orm.drizzle.team/docs/column-types/sqlite#blob
		// tags: blob('tags', { mode: 'json' }).$type<string[]>().notNull(),
	},
	(table) => {
		return {
			// https://orm.drizzle.team/docs/indexes-constraints#composite-primary-key
			pkWithCustomName: primaryKey({
				name: 'id',
				columns: [table.createDate, table.authorId, table.spaceHostname],
			}),
			createDateIdx: index('create_date_idx').on(table.createDate),
			authorIdIdx: index('author_id_idx').on(table.authorId),
			spaceHostnameIdx: index('space_hostname_idx').on(table.spaceHostname),
			contentIdx: index('content_idx').on(table.content),
			tagsIdx: index('tags_idx').on(table.tags),
			parentIdIdx: index('parent_id_idx').on(table.parentId),
		};
	},
);
export type InsertThought = typeof thoughtsTable.$inferInsert;
export type SelectThought = typeof thoughtsTable.$inferSelect;

// export const thoughtsTableRelations = relations(thoughtsTable, ({ many }) => ({
// 	children: many(thoughtsTable),
// }));

// (async () => {
// 	// https://orm.drizzle.team/learn/tutorials/drizzle-with-turso#applying-changes-to-the-database
// 	await migrate(drizzleClient, { migrationsFolder: path.resolve(__dirname, './migrations') });
// })();

// run this to generate new migrations
// cd server && npx drizzle-kit generate:sqlite && cd ..
// or just run this to apply current schema
// cd server && npx drizzle-kit push:sqlite && cd ..
