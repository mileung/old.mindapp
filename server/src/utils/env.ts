const env = {
	TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL,
	TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN,
	GLOBAL_HOST: process.env.GLOBAL_HOST,

	// below are sent to client
	SPACE_NAME: process.env.SPACE_NAME,
	OWNER_ID: process.env.OWNER_ID,
	DOWNVOTE_ADDRESS: process.env.DOWNVOTE_ADDRESS,
	TOKEN_ID: process.env.TOKEN_ID,
	CONTENT_LIMIT: Number(process.env.CONTENT_LIMIT) || undefined,
	TAG_LIMIT: Number(process.env.TAG_LIMIT) || undefined,
	ANYONE_CAN_JOIN: process.env.ANYONE_CAN_JOIN === 'true' || undefined,
	ANYONE_CAN_ADD: process.env.ANYONE_CAN_ADD === 'true' || undefined,
	DELETABLE_VOTES: process.env.DELETABLE_VOTES === 'true' || undefined,
};

export default env;
